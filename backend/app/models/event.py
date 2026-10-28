from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
import enum


from sqlalchemy.types import TypeDecorator


class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    PUBLISHED = "published"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            val_lower = value.lower()
            for member in cls:
                if member.value == val_lower or member.name.lower() == val_lower:
                    return member
        return None


class EventCategory(str, enum.Enum):
    ACADEMIC = "academic"
    CULTURAL = "cultural"
    SPORTS = "sports"
    TECHNICAL = "technical"
    WORKSHOP = "workshop"
    SEMINAR = "seminar"
    OTHER = "other"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            val_lower = value.lower()
            for member in cls:
                if member.value == val_lower or member.name.lower() == val_lower:
                    return member
        return None


class SafeCategoryType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        v = value.value if hasattr(value, "value") else str(value)
        return v.lower()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        try:
            return EventCategory(value.lower())
        except Exception:
            return EventCategory.OTHER


class SafeStatusType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        v = value.value if hasattr(value, "value") else str(value)
        return v.lower()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        try:
            return EventStatus(value.lower())
        except Exception:
            return EventStatus.DRAFT


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[EventCategory] = mapped_column(
        SafeCategoryType, default=EventCategory.OTHER, nullable=False
    )
    status: Mapped[EventStatus] = mapped_column(
        SafeStatusType, default=EventStatus.DRAFT, nullable=False, index=True
    )
    college_name: Mapped[str] = mapped_column(String(255), nullable=False)
    venue: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    max_participants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    banner_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    created_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_by: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    schedules: Mapped[list["Schedule"]] = relationship(  # type: ignore[name-defined]
        "Schedule", back_populates="event", cascade="all, delete-orphan"
    )
    registrations: Mapped[list["Registration"]] = relationship(  # type: ignore[name-defined]
        "Registration", back_populates="event", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Event id={self.id} title={self.title!r} status={self.status}>"
