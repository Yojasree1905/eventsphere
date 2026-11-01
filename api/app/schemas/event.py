from datetime import date
from typing import Optional
from pydantic import BaseModel
from app.models.event import EventCategory, EventStatus


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: EventCategory = EventCategory.OTHER
    college_name: str
    venue: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    max_participants: Optional[int] = None
    banner_url: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[EventCategory] = None
    college_name: Optional[str] = None
    venue: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    max_participants: Optional[int] = None
    banner_url: Optional[str] = None
    status: Optional[EventStatus] = None


from datetime import datetime


class EventOut(EventBase):
    id: int
    status: EventStatus
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ApprovalAction(BaseModel):
    rejection_reason: Optional[str] = None
