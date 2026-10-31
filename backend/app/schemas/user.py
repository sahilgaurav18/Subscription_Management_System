from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    role: str
    is_active: bool = True
    customer_id: Optional[int] = None


class StaffCreateRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = Field("staff", pattern="^(admin|staff)$")


class UserUpdateRequest(BaseModel):
    role: Optional[str] = Field(None, pattern="^(admin|staff|customer)$")
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
