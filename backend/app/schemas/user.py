from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email_frequency: Optional[str] = Field(None, pattern="^(daily|weekly|realtime|none)$")


class UserResponse(UserBase):
    id: str
    email_verified: bool
    company_id: Optional[str] = None
    email_frequency: str
    created_at: datetime
    last_login_at: Optional[datetime] = None

    @field_validator('id', 'company_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    password_hash: str

    class Config:
        from_attributes = True
