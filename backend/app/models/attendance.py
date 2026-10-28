from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    participant_id: Mapped[int] = mapped_column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    check_in_time: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    qr_token_used: Mapped[str] = mapped_column(String(255), nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=True)

    event: Mapped["Event"] = relationship("Event")  # type: ignore[name-defined]
    participant: Mapped["Participant"] = relationship("Participant")  # type: ignore[name-defined]
