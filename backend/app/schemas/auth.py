from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "participant"  # admin, organizer, participant, judge
    college_name: Optional[str] = "Partner University"
    department: Optional[str] = "General"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str = "participant"
    college_name: Optional[str] = None
    department: Optional[str] = None
    is_active: bool
    is_superadmin: bool

    model_config = {"from_attributes": True}
