import hashlib
import os
import uuid
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.models.certificate import Certificate
from app.models.event import Event
from app.models.participant import Participant
from app.models.registration import Registration, RegistrationStatus
from app.models.user import User
from app.schemas.evaluation import CertificateGenerateRequest, CertificateOut, PublicVerifyOut
from app.services.certificate_service import CERT_STORAGE_DIR, build_certificate_pdf

router = APIRouter(prefix="/api/certificates", tags=["certificates_and_verification"])


def _generate_verification_hash(cert_id: str, participant_id: int, event_id: int) -> str:
    raw = f"{cert_id}:{participant_id}:{event_id}:OCCASIO_SALT_2026"
    return hashlib.sha256(raw.encode()).hexdigest()


@router.post("/generate", response_model=List[CertificateOut], status_code=201)
def generate_event_certificates(
    payload: CertificateGenerateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Generates PDF certificates with QR codes for participants.
    Only participants marked ATTENDED (RegistrationStatus.ATTENDED) are issued certificates.
    """
    event = db.query(Event).filter(Event.id == payload.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get attended registrations
    query = (
        db.query(Registration)
        .filter(
            Registration.event_id == payload.event_id,
            Registration.status == RegistrationStatus.ATTENDED,
        )
    )

    if payload.participant_ids:
        query = query.filter(Registration.participant_id.in_(payload.participant_ids))

    registrations = query.all()
    if not registrations:
        raise HTTPException(
            status_code=400,
            detail="No attended participants found for this event to issue certificates.",
        )

    issued_certs = []
    today = date.today()

    for reg in registrations:
        participant = db.query(Participant).filter(Participant.id == reg.participant_id).first()
        if not participant:
            continue

        # Check if already issued
        existing = (
            db.query(Certificate)
            .filter(
                Certificate.event_id == payload.event_id,
                Certificate.participant_id == participant.id,
                Certificate.cert_type == payload.cert_type,
            )
            .first()
        )

        if existing:
            issued_certs.append(existing)
            continue

        cert_id = f"OCC-{today.year}-{uuid.uuid4().hex[:8].upper()}"
        v_hash = _generate_verification_hash(cert_id, participant.id, event.id)
        verification_url = f"http://127.0.0.1:8000/verify/{cert_id}"

        # Render PDF with ReportLab + QR Code
        pdf_path = build_certificate_pdf(
            certificate_id=cert_id,
            recipient_name=participant.full_name,
            recipient_college=participant.college_name or "Partner University",
            event_title=event.title,
            host_college=event.college_name,
            cert_type=payload.cert_type,
            issue_date=today,
            verification_url=verification_url,
        )

        cert_obj = Certificate(
            certificate_id=cert_id,
            event_id=event.id,
            participant_id=participant.id,
            cert_type=payload.cert_type,
            issue_date=today,
            verification_hash=v_hash,
            pdf_filename=os.path.basename(pdf_path),
            is_revoked=False,
        )
        db.add(cert_obj)
        db.commit()
        db.refresh(cert_obj)
        issued_certs.append(cert_obj)

    # Transform into response schema with join details
    result = []
    for c in issued_certs:
        p = db.query(Participant).filter(Participant.id == c.participant_id).first()
        result.append(
            CertificateOut(
                id=c.id,
                certificate_id=c.certificate_id,
                event_id=c.event_id,
                participant_id=c.participant_id,
                participant_name=p.full_name if p else "Student",
                college_name=p.college_name if p else "University",
                event_title=event.title,
                cert_type=c.cert_type,
                issue_date=c.issue_date,
                verification_hash=c.verification_hash,
                pdf_filename=c.pdf_filename,
                is_revoked=c.is_revoked,
                created_at=c.created_at,
            )
        )

    return result


@router.get("/registry", response_model=List[CertificateOut])
def get_public_certificate_registry(
    event_id: Optional[int] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """
    Public registry of authentic issued certificates for verification lookup.
    No login required.
    """
    q = (
        db.query(Certificate, Event, Participant)
        .join(Event, Certificate.event_id == Event.id)
        .join(Participant, Certificate.participant_id == Participant.id)
        .filter(Certificate.is_revoked == False)
    )
    if event_id:
        q = q.filter(Certificate.event_id == event_id)

    records = q.order_by(Certificate.created_at.desc()).limit(limit).all()
    out = []
    for c, e, p in records:
        out.append(
            CertificateOut(
                id=c.id,
                certificate_id=c.certificate_id,
                event_id=c.event_id,
                participant_id=c.participant_id,
                participant_name=p.full_name,
                college_name=p.college_name,
                event_title=e.title,
                cert_type=c.cert_type,
                issue_date=c.issue_date,
                verification_hash=c.verification_hash,
                pdf_filename=c.pdf_filename,
                is_revoked=c.is_revoked,
                created_at=c.created_at,
            )
        )
    return out


@router.get("/verify/{certificate_id}", response_model=PublicVerifyOut)
def verify_certificate_public(
    certificate_id: str,
    db: Session = Depends(get_db),
):
    """
    PUBLIC verification endpoint accessed via certificate QR code scan.
    Zero-login required.
    """
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not cert:
        return PublicVerifyOut(
            is_valid=False,
            certificate_id=certificate_id,
            recipient_name="Unknown",
            recipient_college="Unknown",
            event_title="Unknown",
            host_college="Unknown",
            cert_type="Unknown",
            issue_date="N/A",
            status_message="Certificate record does not exist in the Occasio database. This credential may be fraudulent.",
        )

    if cert.is_revoked:
        return PublicVerifyOut(
            is_valid=False,
            certificate_id=cert.certificate_id,
            recipient_name=cert.participant.full_name,
            recipient_college=cert.participant.college_name or "University",
            event_title=cert.event.title,
            host_college=cert.event.college_name,
            cert_type=cert.cert_type,
            issue_date=str(cert.issue_date),
            status_message="This certificate was officially REVOKED by the hosting institution.",
        )

    return PublicVerifyOut(
        is_valid=True,
        certificate_id=cert.certificate_id,
        recipient_name=cert.participant.full_name,
        recipient_college=cert.participant.college_name or "University",
        event_title=cert.event.title,
        host_college=cert.event.college_name,
        cert_type=cert.cert_type,
        issue_date=str(cert.issue_date),
        status_message="Verified Authentic. Certificate is signed and registered under the Occasio University Event Network.",
    )


@router.get("/download/{certificate_id}")
def download_certificate_pdf(
    certificate_id: str,
    db: Session = Depends(get_db),
):
    """
    Downloads or previews the generated PDF certificate.
    """
    cert = db.query(Certificate).filter(Certificate.certificate_id == certificate_id).first()
    if not cert or not cert.pdf_filename:
        raise HTTPException(status_code=404, detail="Certificate PDF not found")

    filepath = os.path.join(CERT_STORAGE_DIR, cert.pdf_filename)
    if not os.path.exists(filepath):
        # Regenerate on the fly if needed
        build_certificate_pdf(
            certificate_id=cert.certificate_id,
            recipient_name=cert.participant.full_name,
            recipient_college=cert.participant.college_name or "University",
            event_title=cert.event.title,
            host_college=cert.event.college_name,
            cert_type=cert.cert_type,
            issue_date=cert.issue_date,
            verification_url=f"http://localhost:5173/verify/{cert.certificate_id}",
        )

    return FileResponse(
        path=filepath,
        media_type="application/pdf",
        filename=f"{cert.certificate_id}.pdf",
    )


@router.get("/participant/{participant_id}", response_model=List[CertificateOut])
def get_participant_certificates(
    participant_id: int,
    db: Session = Depends(get_db),
):
    """
    Retrieves all certificates and achievements earned by a specific participant.
    """
    certs = (
        db.query(Certificate, Event, Participant)
        .join(Event, Certificate.event_id == Event.id)
        .join(Participant, Certificate.participant_id == Participant.id)
        .filter(Certificate.participant_id == participant_id)
        .order_by(Certificate.issue_date.desc())
        .all()
    )

    out = []
    for c, e, p in certs:
        out.append(
            CertificateOut(
                id=c.id,
                certificate_id=c.certificate_id,
                event_id=c.event_id,
                participant_id=c.participant_id,
                participant_name=p.full_name,
                college_name=p.college_name,
                event_title=e.title,
                cert_type=c.cert_type,
                issue_date=c.issue_date,
                verification_hash=c.verification_hash,
                pdf_filename=c.pdf_filename,
                is_revoked=c.is_revoked,
                created_at=c.created_at,
            )
        )
    return out


@router.get("", response_model=List[CertificateOut])
def list_certificates(
    event_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Admin endpoint to list all issued certificates."""
    q = (
        db.query(Certificate, Event, Participant)
        .join(Event, Certificate.event_id == Event.id)
        .join(Participant, Certificate.participant_id == Participant.id)
    )
    if event_id:
        q = q.filter(Certificate.event_id == event_id)

    records = q.order_by(Certificate.created_at.desc()).offset(skip).limit(limit).all()
    out = []
    for c, e, p in records:
        out.append(
            CertificateOut(
                id=c.id,
                certificate_id=c.certificate_id,
                event_id=c.event_id,
                participant_id=c.participant_id,
                participant_name=p.full_name,
                college_name=p.college_name,
                event_title=e.title,
                cert_type=c.cert_type,
                issue_date=c.issue_date,
                verification_hash=c.verification_hash,
                pdf_filename=c.pdf_filename,
                is_revoked=c.is_revoked,
                created_at=c.created_at,
            )
        )
    return out
