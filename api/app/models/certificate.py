from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    certificate_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )  # e.g., OCC-2026-F89A12CD
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    cert_type: Mapped[str] = mapped_column(
        String(50), default="participation", nullable=False
    )  # participation, merit, winner, runner_up
    issue_date: Mapped[date] = mapped_column(Date, default=func.current_date())
    verification_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    pdf_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    event: Mapped["Event"] = relationship("Event")  # type: ignore[name-defined]
    participant: Mapped["Participant"] = relationship("Participant")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Certificate id={self.id} cert_id={self.certificate_id} participant_id={self.participant_id}>"
