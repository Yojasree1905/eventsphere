from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Feedback(Base):
    __tablename__ = "feedbacks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Quantitative 1-5 ratings
    overall_rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 5
    speaker_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    venue_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    content_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Qualitative feedback
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    suggestions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    event: Mapped["Event"] = relationship("Event")  # type: ignore[name-defined]
    participant: Mapped["Participant"] = relationship("Participant")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<Feedback id={self.id} event_id={self.event_id} rating={self.overall_rating}>"
