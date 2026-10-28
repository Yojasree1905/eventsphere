from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RegistrationBase(BaseModel):
    event_id: int
    participant_id: int
    notes: Optional[str] = None


class RegistrationCreate(RegistrationBase):
    pass


class RegistrationUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class RegistrationOut(RegistrationBase):
    id: int
    status: str
    payment_status: Optional[str] = "unpaid"
    payment_ref: Optional[str] = None
    registration_number: Optional[str] = None
    participant_name: Optional[str] = None
    participant_college: Optional[str] = None
    event_title: Optional[str] = None
    registered_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
