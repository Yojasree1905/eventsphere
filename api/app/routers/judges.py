import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user, require_organizer_or_admin
from app.models.event import Event
from app.models.judge import JudgeAssignment, JudgeInvitation
from app.models.user import User
from app.services.auth_service import create_user, hash_password

router = APIRouter(prefix="/api/judges", tags=["judges_and_juries"])


class JudgeInviteRequest(BaseModel):
    event_id: int
    email: str


class JudgeInviteOut(BaseModel):
    id: int
    event_id: int
    email: str
    invitation_url: str
    expires_at: datetime
    is_used: bool


class JudgeAcceptRequest(BaseModel):
    token: str
    full_name: str
    password: str


class AssignedJudgeOut(BaseModel):
    id: int
    event_id: int
    user_id: int
    full_name: str
    email: str
    assigned_at: datetime


@router.post("/invite", response_model=JudgeInviteOut, status_code=201)
def invite_judge(
    payload: JudgeInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_organizer_or_admin),
):
    """
    Organizer or Admin invites a domain expert/judge to evaluate an event.
    Generates a single-use cryptographically secure invitation token.
    """
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    invitation = JudgeInvitation(
        event_id=payload.event_id,
        email=payload.email.lower().strip(),
        token_hash=token_hash,
        expires_at=expires_at,
        is_used=False,
        created_by=current_user.id,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    return JudgeInviteOut(
        id=invitation.id,
        event_id=invitation.event_id,
        email=invitation.email,
        invitation_url=f"/login?invite_token={raw_token}&email={invitation.email}&event_id={event.id}",
        expires_at=invitation.expires_at,
        is_used=invitation.is_used,
    )


@router.get("/assigned/{event_id}", response_model=List[AssignedJudgeOut])
def list_event_judges(
    event_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Lists all judges explicitly assigned to an event.
    """
    assignments = (
        db.query(JudgeAssignment, User)
        .join(User, JudgeAssignment.judge_user_id == User.id)
        .filter(JudgeAssignment.event_id == event_id)
        .all()
    )

    results = []
    for a, u in assignments:
        results.append(
            AssignedJudgeOut(
                id=a.id,
                event_id=a.event_id,
                user_id=u.id,
                full_name=u.full_name,
                email=u.email,
                assigned_at=a.assigned_at,
            )
        )
    return results


@router.post("/accept-invite")
def accept_judge_invite(payload: JudgeAcceptRequest, db: Session = Depends(get_db)):
    """
    Candidate accepts single-use invitation token, sets their password, and becomes an authorized judge.
    """
    token_hash = hashlib.sha256(payload.token.strip().encode()).hexdigest()
    invitation = (
        db.query(JudgeInvitation)
        .filter(JudgeInvitation.token_hash == token_hash, JudgeInvitation.is_used == False)
        .first()
    )

    if not invitation:
        raise HTTPException(status_code=400, detail="Invalid, expired, or already used invitation token.")

    # Check expiration
    if invitation.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation token has expired.")

    # Find or create user with role 'judge'
    user = db.query(User).filter(User.email == invitation.email).first()
    if not user:
        user = User(
            email=invitation.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            role="judge",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.role = "judge"
        user.hashed_password = hash_password(payload.password)
        db.commit()

    # Create JudgeAssignment if not exists
    existing_assign = (
        db.query(JudgeAssignment)
        .filter(JudgeAssignment.event_id == invitation.event_id, JudgeAssignment.judge_user_id == user.id)
        .first()
    )
    if not existing_assign:
        assign = JudgeAssignment(
            event_id=invitation.event_id,
            judge_user_id=user.id,
        )
        db.add(assign)

    # Mark invitation as used
    invitation.is_used = True
    db.commit()

    return {
        "success": True,
        "message": "Judge account successfully activated and assigned to event.",
        "email": user.email,
        "event_id": invitation.event_id,
    }
