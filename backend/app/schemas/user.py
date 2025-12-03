from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import uuid


class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_frequency: str = "daily"


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_frequency: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: uuid.UUID
    email_verified: bool
    company_id: Optional[uuid.UUID] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class EmailVerify(BaseModel):
    token: str
