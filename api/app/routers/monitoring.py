from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.event import Event, EventStatus, EventCategory
from app.models.participant import Participant
from app.models.registration import Registration, RegistrationStatus
from app.models.user import User

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    total_events = db.query(Event).count()
    total_participants = db.query(Participant).count()
    total_registrations = db.query(Registration).count()
    confirmed_registrations = (
        db.query(Registration)
        .filter(Registration.status == RegistrationStatus.CONFIRMED)
        .count()
    )

    events_by_status = {
        s.value: db.query(Event).filter(Event.status == s).count()
        for s in EventStatus
    }

    events_by_category = {
        c.value: db.query(Event).filter(Event.category == c).count()
        for c in EventCategory
    }

    return {
        "total_events": total_events,
        "total_participants": total_participants,
        "total_registrations": total_registrations,
        "confirmed_registrations": confirmed_registrations,
        "events_by_status": events_by_status,
        "events_by_category": events_by_category,
    }


@router.get("/recent-activity")
def recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    recent_events = (
        db.query(Event)
        .order_by(Event.updated_at.desc())
        .limit(limit)
        .all()
    )
    recent_registrations = (
        db.query(Registration)
        .order_by(Registration.registered_at.desc())
        .limit(limit)
        .all()
    )
    return {
        "recent_events": [
            {
                "id": e.id,
                "title": e.title,
                "status": e.status,
                "updated_at": str(e.updated_at),
            }
            for e in recent_events
        ],
        "recent_registrations": [
            {
                "id": r.id,
                "registration_number": r.registration_number,
                "event_id": r.event_id,
                "participant_id": r.participant_id,
                "status": r.status,
                "registered_at": str(r.registered_at),
            }
            for r in recent_registrations
        ],
    }
