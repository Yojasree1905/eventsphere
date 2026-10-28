from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EventScore(Base):
    __tablename__ = "event_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    participant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Detailed rubric scoring (e.g., {"innovation": 30, "technical": 35, "presentation": 25})
    criteria_scores: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    total_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False, index=True)

    # Computed Standing & Gamification
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    badge: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Winner, 1st Runner Up, Top 5
    judge_remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event")  # type: ignore[name-defined]
    participant: Mapped["Participant"] = relationship("Participant")  # type: ignore[name-defined]

    def __repr__(self) -> str:
        return f"<EventScore id={self.id} event_id={self.event_id} participant_id={self.participant_id} rank={self.rank}>"
