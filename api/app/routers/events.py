from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import (
    get_current_user,
    get_optional_current_user,
    require_organizer_or_admin,
    require_superadmin,
)
from app.models.event import Event, EventStatus
from app.models.user import User
from app.schemas.event import ApprovalAction, EventCreate, EventOut, EventUpdate

router = APIRouter(prefix="/api/events", tags=["events"])


def _get_event_or_404(event_id: int, db: Session) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("", response_model=List[EventOut])
def list_events(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    college_name: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Lists events according to user role:
    - Public visitors / Students: see APPROVED, PUBLISHED, and COMPLETED events.
    - Organizers: see public events + their own college's drafts/pending events.
    - Global Administrators: see all events across all statuses.
    """
    q = db.query(Event)

    # Role-based visibility filtering
    if not current_user:
        # Public visitor
        q = q.filter(Event.status.in_([EventStatus.APPROVED, EventStatus.PUBLISHED, EventStatus.COMPLETED]))
    elif current_user.is_superadmin or current_user.role == "admin":
        # Admin can filter by any requested status
        if status:
            q = q.filter(Event.status == status)
    elif current_user.role == "organizer":
        if status:
            q = q.filter(Event.status == status)
        else:
            # Organizers can see all public events + drafts/pending of their own college/account
            q = q.filter(
                (Event.status.in_([EventStatus.APPROVED, EventStatus.PUBLISHED, EventStatus.COMPLETED]))
                | (Event.created_by == current_user.id)
                | (Event.college_name == current_user.college_name)
            )
    else:
        # Students / participants / judges
        if status:
            q = q.filter(Event.status == status)
        else:
            q = q.filter(Event.status.in_([EventStatus.APPROVED, EventStatus.PUBLISHED, EventStatus.COMPLETED]))

    if category:
        q = q.filter(Event.category == category)
    if college_name:
        q = q.filter(Event.college_name.ilike(f"%{college_name}%"))
    if search:
        q = q.filter(
            Event.title.ilike(f"%{search}%")
            | Event.description.ilike(f"%{search}%")
            | Event.college_name.ilike(f"%{search}%")
        )

    return q.order_by(Event.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/count")
def count_events(db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_optional_current_user)):
    from app.models.event import EventStatus as ES
    return {
        "total": db.query(Event).count(),
        "pending": db.query(Event).filter(Event.status == ES.PENDING).count(),
        "approved": db.query(Event).filter(Event.status == ES.APPROVED).count(),
        "published": db.query(Event).filter(Event.status == ES.PUBLISHED).count(),
        "changes_requested": db.query(Event).filter(Event.status == ES.CHANGES_REQUESTED).count(),
        "rejected": db.query(Event).filter(Event.status == ES.REJECTED).count(),
    }


@router.post("", response_model=EventOut, status_code=201)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    """
    Organizer or Admin proposes a new event.
    Starts in DRAFT status.
    """
    # If organizer, default to their affiliated college if not explicitly provided
    college = payload.college_name or current_user.college_name or "EventSphere University"
    data = payload.model_dump()
    data["college_name"] = college

    event = Event(**data, created_by=current_user.id, status=EventStatus.DRAFT)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    event = _get_event_or_404(event_id, db)
    # Check private draft visibility
    if event.status in [EventStatus.DRAFT, EventStatus.CHANGES_REQUESTED]:
        if not current_user:
            raise HTTPException(status_code=403, detail="This event draft is not publicly accessible")
        if not (current_user.is_superadmin or current_user.role == "admin" or event.created_by == current_user.id or event.college_name == current_user.college_name):
            raise HTTPException(status_code=403, detail="Permission denied to view this unpublished event")
    return event


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    event = _get_event_or_404(event_id, db)
    # Validate ownership for organizers
    if not (current_user.is_superadmin or current_user.role == "admin"):
        if event.created_by != current_user.id and event.college_name != current_user.college_name:
            raise HTTPException(status_code=403, detail="You can only edit events belonging to your institution")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    event = _get_event_or_404(event_id, db)
    if not (current_user.is_superadmin or current_user.role == "admin"):
        if event.created_by != current_user.id and event.college_name != current_user.college_name:
            raise HTTPException(status_code=403, detail="You can only delete events belonging to your institution")
    db.delete(event)
    db.commit()


@router.patch("/{event_id}/submit", response_model=EventOut)
def submit_for_approval(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    """
    Submits a draft or changed event for Global Admin approval.
    """
    event = _get_event_or_404(event_id, db)
    event.status = EventStatus.PENDING
    db.commit()
    db.refresh(event)
    return event


@router.patch("/{event_id}/approve", response_model=EventOut)
def approve_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """
    Global Administrator approves an event proposal.
    """
    event = _get_event_or_404(event_id, db)
    if event.status != EventStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending events can be approved")
    event.status = EventStatus.APPROVED
    event.approved_by = current_user.id
    event.rejection_reason = None
    db.commit()
    db.refresh(event)
    return event


@router.patch("/{event_id}/publish", response_model=EventOut)
def publish_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    """
    Organizer or Admin officially publishes an approved event for student registrations.
    """
    event = _get_event_or_404(event_id, db)
    if event.status not in [EventStatus.APPROVED, EventStatus.PENDING]:
        raise HTTPException(status_code=400, detail="Only approved events can be published")
    event.status = EventStatus.PUBLISHED
    db.commit()
    db.refresh(event)
    return event


@router.patch("/{event_id}/request-changes", response_model=EventOut)
def request_changes_event(
    event_id: int,
    payload: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """
    Global Administrator requests changes on an event proposal with revision notes.
    """
    event = _get_event_or_404(event_id, db)
    if event.status != EventStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending events can have changes requested")
    event.status = EventStatus.CHANGES_REQUESTED
    event.approved_by = current_user.id
    event.rejection_reason = payload.rejection_reason or "Review notes: please adjust event details."
    db.commit()
    db.refresh(event)
    return event


@router.patch("/{event_id}/reject", response_model=EventOut)
def reject_event(
    event_id: int,
    payload: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    """
    Global Administrator rejects an event proposal with a detailed reason.
    """
    event = _get_event_or_404(event_id, db)
    if event.status != EventStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending events can be rejected")
    event.status = EventStatus.REJECTED
    event.approved_by = current_user.id
    event.rejection_reason = payload.rejection_reason
    db.commit()
    db.refresh(event)
    return event
