import hashlib
import hmac
import uuid
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.registration import Registration, RegistrationStatus
from app.models.participant import Participant
from app.models.event import Event, EventStatus
from app.models.user import User
from app.schemas.registration import RegistrationCreate, RegistrationOut, RegistrationUpdate

router = APIRouter(prefix="/api/registrations", tags=["registrations"])

PAYMENT_SECRET_KEY = "EVENTSPHERE_SECURE_PAYMENT_SALT_2026"


class PaymentVerifyRequest(BaseModel):
    order_id: str
    signature: str
    amount: float = 0.0


def _to_out(reg: Registration, db: Session) -> RegistrationOut:
    p = db.query(Participant).filter(Participant.id == reg.participant_id).first()
    e = db.query(Event).filter(Event.id == reg.event_id).first()
    return RegistrationOut(
        id=reg.id,
        event_id=reg.event_id,
        participant_id=reg.participant_id,
        status=reg.status,
        payment_status=reg.payment_status or "unpaid",
        payment_ref=reg.payment_ref,
        registration_number=reg.registration_number,
        participant_name=p.full_name if p else "Candidate",
        participant_college=p.college_name if p else "University",
        event_title=e.title if e else "Event",
        notes=reg.notes,
        registered_at=reg.registered_at,
        updated_at=reg.updated_at,
    )


@router.get("", response_model=List[RegistrationOut])
def list_registrations(
    event_id: Optional[int] = Query(None),
    participant_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Registration)
    if event_id:
        q = q.filter(Registration.event_id == event_id)
    if participant_id:
        q = q.filter(Registration.participant_id == participant_id)
    if status:
        q = q.filter(Registration.status == status)
    regs = q.order_by(Registration.registered_at.desc()).offset(skip).limit(limit).all()
    return [_to_out(r, db) for r in regs]


@router.post("", response_model=RegistrationOut, status_code=201)
def create_registration(
    payload: RegistrationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    # 1. Verify Event exists and is open
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status not in [EventStatus.APPROVED, EventStatus.PUBLISHED]:
        raise HTTPException(status_code=400, detail="Event is currently not accepting registrations")

    # 2. Check Capacity limits
    if event.max_participants and event.max_participants > 0:
        active_count = (
            db.query(Registration)
            .filter(
                Registration.event_id == payload.event_id,
                Registration.status.in_([RegistrationStatus.APPLIED.value, RegistrationStatus.CONFIRMED.value, RegistrationStatus.ATTENDED.value]),
            )
            .count()
        )
        if active_count >= event.max_participants:
            raise HTTPException(status_code=400, detail="Event has reached maximum capacity.")

    # 3. Check Duplicate Registration
    existing = (
        db.query(Registration)
        .filter(
            Registration.event_id == payload.event_id,
            Registration.participant_id == payload.participant_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already applied for this event.")

    reg = Registration(
        event_id=payload.event_id,
        participant_id=payload.participant_id,
        status=RegistrationStatus.APPLIED.value,  # Starts as APPLIED
        payment_status="unpaid",
        registration_number=f"REG-{uuid.uuid4().hex[:8].upper()}",
        notes=payload.notes,
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return _to_out(reg, db)


@router.post("/{reg_id}/initiate-payment")
def initiate_payment(
    reg_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Initiates a verified checkout order for registration fee payment.
    Returns cryptographic signature for sandbox verification.
    """
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    order_id = f"ORDER-{uuid.uuid4().hex[:12].upper()}"
    raw = f"{order_id}:{reg.id}:{PAYMENT_SECRET_KEY}"
    signature = hmac.new(PAYMENT_SECRET_KEY.encode(), raw.encode(), hashlib.sha256).hexdigest()

    return {
        "registration_id": reg.id,
        "order_id": order_id,
        "amount": 250.00,
        "currency": "INR",
        "signature": signature,
        "gateway": "EventSphere Sandbox Gateway",
        "status": "ready"
    }


@router.post("/{reg_id}/verify-payment", response_model=RegistrationOut)
def verify_and_confirm_payment(
    reg_id: int,
    payload: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Validates payment signature cryptographically and transitions registration from APPLIED -> CONFIRMED.
    """
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    # Verify signature
    raw = f"{payload.order_id}:{reg.id}:{PAYMENT_SECRET_KEY}"
    expected_sig = hmac.new(PAYMENT_SECRET_KEY.encode(), raw.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(payload.signature, expected_sig):
        raise HTTPException(status_code=400, detail="Invalid payment verification signature.")

    reg.payment_status = "paid"
    reg.payment_ref = f"PAY-{uuid.uuid4().hex[:10].upper()}"
    reg.status = RegistrationStatus.CONFIRMED.value
    db.commit()
    db.refresh(reg)
    return _to_out(reg, db)


@router.post("/{reg_id}/pay", response_model=RegistrationOut)
def quick_pay_and_confirm(
    reg_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Standard quick pay action: marks fees paid and confirms registration.
    """
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    reg.payment_status = "paid"
    reg.payment_ref = f"PAY-{uuid.uuid4().hex[:10].upper()}"
    reg.status = RegistrationStatus.CONFIRMED.value
    db.commit()
    db.refresh(reg)
    return _to_out(reg, db)


@router.patch("/{reg_id}/mark-absent", response_model=RegistrationOut)
def mark_absent_no_refund(
    reg_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Organizer / System marks candidate absent (no refund issued).
    """
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    reg.status = RegistrationStatus.ABSENT.value
    reg.notes = (reg.notes or "") + " [Marked ABSENT - No Refund Issued]"
    db.commit()
    db.refresh(reg)
    return _to_out(reg, db)


@router.put("/{reg_id}", response_model=RegistrationOut)
def update_registration(
    reg_id: int,
    payload: RegistrationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    reg = db.query(Registration).filter(Registration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(reg, field, value)

    db.commit()
    db.refresh(reg)
    return _to_out(reg, db)
