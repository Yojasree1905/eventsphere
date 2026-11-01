from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.participant import Participant
from app.models.user import User
from app.schemas.participant import ParticipantCreate, ParticipantOut, ParticipantUpdate

router = APIRouter(prefix="/api/participants", tags=["participants"])


def _get_or_404(participant_id: int, db: Session) -> Participant:
    obj = db.query(Participant).filter(Participant.id == participant_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Participant not found")
    return obj


@router.get("", response_model=List[ParticipantOut])
def list_participants(
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Participant)
    if search:
        q = q.filter(
            Participant.full_name.ilike(f"%{search}%")
            | Participant.email.ilike(f"%{search}%")
        )
    return q.order_by(Participant.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=ParticipantOut, status_code=201)
def create_participant(
    payload: ParticipantCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    existing = db.query(Participant).filter(Participant.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    participant = Participant(**payload.model_dump())
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.get("/{participant_id}", response_model=ParticipantOut)
def get_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return _get_or_404(participant_id, db)


@router.put("/{participant_id}", response_model=ParticipantOut)
def update_participant(
    participant_id: int,
    payload: ParticipantUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    participant = _get_or_404(participant_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(participant, field, value)
    db.commit()
    db.refresh(participant)
    return participant


@router.delete("/{participant_id}", status_code=204)
def delete_participant(
    participant_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    participant = _get_or_404(participant_id, db)
    db.delete(participant)
    db.commit()
