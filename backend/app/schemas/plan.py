from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class PlanBase(BaseModel):
    name: str
    price: int = Field(..., ge=0, description="Price in minor units (e.g. cents)")
    currency: str = "USD"
    billing_period: str = Field("monthly", pattern="^(daily|weekly|monthly|yearly)$")
    min_quantity: int = Field(1, ge=1)
    available_from: Optional[datetime] = None
    available_to: Optional[datetime] = None
    auto_close: bool = False
    closable: bool = True
    pausable: bool = True
    renewable: bool = True
    is_active: bool = True


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = Field(None, ge=0)
    currency: Optional[str] = None
    billing_period: Optional[str] = Field(None, pattern="^(daily|weekly|monthly|yearly)$")
    min_quantity: Optional[int] = Field(None, ge=1)
    available_from: Optional[datetime] = None
    available_to: Optional[datetime] = None
    auto_close: Optional[bool] = None
    closable: Optional[bool] = None
    pausable: Optional[bool] = None
    renewable: Optional[bool] = None
    is_active: Optional[bool] = None


class PlanResponse(PlanBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PublicPlanResponse(BaseModel):
    id: int
    name: str
    price: int = Field(..., description="Price in minor units (e.g. cents)")
    currency: str = "USD"
    billing_period: str
    min_quantity: int
    model_config = ConfigDict(from_attributes=True)
