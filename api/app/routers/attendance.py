import hashlib
from datetime import datetime, timezone
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.event import Event
from app.models.participant import Participant
from app.models.registration import Registration, RegistrationStatus
from app.models.attendance import Attendance

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

ATTENDANCE_SECRET_SALT = "EVENTSPHERE_ATTENDANCE_SALT_2026"


class CheckInRequest(BaseModel):
    event_id: int
    participant_id: int
    qr_token: str


class CheckInResponse(BaseModel):
    success: bool
    message: str
    participant_name: str
    event_title: str
    check_in_time: datetime
    attendance_status: str


def _compute_daily_token(event_id: int) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    raw = f"EVENTSPHERE:{event_id}:{date_str}:{ATTENDANCE_SECRET_SALT}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16].upper()


@router.get("/qr-token/{event_id}")
def get_event_attendance_token(event_id: int, db: Session = Depends(get_db)):
    """
    Generates a secure event attendance token based on event ID and day.
    Organizers project this QR code on a screen during the event.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    token = _compute_daily_token(event_id)

    return {
        "event_id": event.id,
        "event_title": event.title,
        "college_name": event.college_name,
        "token": token,
        "valid_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "qr_scan_url": f"/attendance?event_id={event.id}&token={token}"
    }


@router.post("/check-in", response_model=CheckInResponse)
def mark_attendance(payload: CheckInRequest, db: Session = Depends(get_db)):
    """
    Student submits dynamic QR token to record verified venue attendance.
    Enforces server-side token validation, registration status check, and deduplication.
    """
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    participant = db.query(Participant).filter(Participant.id == payload.participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    # 1. Enforce Server-side Token Verification
    expected_token = _compute_daily_token(payload.event_id)
    if payload.qr_token.strip().upper() != expected_token:
        raise HTTPException(status_code=400, detail="Invalid or expired QR token. Please scan the current projector code.")

    # 2. Verify registration exists
    reg = db.query(Registration).filter(
        Registration.event_id == payload.event_id,
        Registration.participant_id == payload.participant_id,
    ).first()

    if not reg:
        raise HTTPException(status_code=400, detail="Participant is not registered for this event.")

    # 3. Check for duplicate check-in
    existing_att = db.query(Attendance).filter(
        Attendance.event_id == payload.event_id,
        Attendance.participant_id == payload.participant_id,
    ).first()

    now = datetime.now(timezone.utc)

    if existing_att:
        return CheckInResponse(
            success=True,
            message="Already checked in. Attendance was recorded earlier.",
            participant_name=participant.full_name,
            event_title=event.title,
            check_in_time=existing_att.check_in_time,
            attendance_status="ATTENDED"
        )

    # 4. Record attendance
    att = Attendance(
        event_id=payload.event_id,
        participant_id=payload.participant_id,
        qr_token_used=payload.qr_token.strip().upper(),
        check_in_time=now,
        verified=True
    )
    db.add(att)

    # 5. Update registration status to ATTENDED
    reg.status = RegistrationStatus.ATTENDED.value
    db.commit()

    return CheckInResponse(
        success=True,
        message="Attendance successfully verified and recorded!",
        participant_name=participant.full_name,
        event_title=event.title,
        check_in_time=now,
        attendance_status="ATTENDED"
    )
