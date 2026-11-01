from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class ParticipantBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    college_name: Optional[str] = None
    department: Optional[str] = None


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    college_name: Optional[str] = None
    department: Optional[str] = None


class ParticipantOut(ParticipantBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
