from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
import enum


class RegistrationStatus(str, enum.Enum):
    APPLIED = "applied"        # Initial stage upon registration
    CONFIRMED = "confirmed"    # Paid / Verified participation
    ATTENDED = "attended"      # Scanned QR code at venue during event
    ABSENT = "absent"          # Did not attend (cancelled / no refund)
    CANCELLED = "cancelled"    # Withdrawn / Cancelled


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(50), default="applied", nullable=False
    )
    registration_number: Mapped[Optional[str]] = mapped_column(
        String(50), unique=True, nullable=True, index=True
    )
    payment_status: Mapped[str] = mapped_column(String(50), default="unpaid") # unpaid, paid
    payment_ref: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    registered_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="registrations")  # type: ignore[name-defined]
    participant: Mapped["Participant"] = relationship("Participant", back_populates="registrations")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Registration id={self.id} event_id={self.event_id} status={self.status}>"
