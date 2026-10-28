from datetime import datetime, timezone
import enum
from typing import Optional
from pydantic import BaseModel, computed_field


class ScheduleStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class ScheduleBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    speaker: Optional[str] = None
    is_conducted: Optional[bool] = None
    is_cancelled: bool = False


class ScheduleCreate(ScheduleBase):
    event_id: int


class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    speaker: Optional[str] = None
    is_conducted: Optional[bool] = None
    is_cancelled: Optional[bool] = None


class ScheduleOut(ScheduleBase):
    id: int
    event_id: int
    created_at: datetime

    @computed_field
    @property
    def status(self) -> ScheduleStatus:
        if self.is_cancelled:
            return ScheduleStatus.CANCELLED

        now = datetime.now(timezone.utc)
        # In SQLite/FastAPI standard storage, datetimes are stored and loaded in UTC.
        # If naive, assign UTC timezone. If aware, convert to UTC.
        start = self.start_time if self.start_time.tzinfo else self.start_time.replace(tzinfo=timezone.utc)
        end = self.end_time if self.end_time.tzinfo else self.end_time.replace(tzinfo=timezone.utc)

        start_utc = start.astimezone(timezone.utc)
        end_utc = end.astimezone(timezone.utc)

        if now < start_utc:
            return ScheduleStatus.UPCOMING
        elif start_utc <= now < end_utc:
            if self.is_conducted is False:
                return ScheduleStatus.EXPIRED
            return ScheduleStatus.ONGOING
        else:
            # Session end time has passed
            if self.is_conducted is False:
                return ScheduleStatus.EXPIRED
            return ScheduleStatus.COMPLETED

    model_config = {"from_attributes": True}

