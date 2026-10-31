from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class DiscountBase(BaseModel):
    name: str
    code: Optional[str] = None
    type: str = Field("percent", pattern="^(fixed|percent)$")
    value: int = Field(..., ge=0, description="Minor units for fixed, percent value for percent (e.g. 15 for 15%)")
    min_purchase: int = Field(0, ge=0, description="Minimum purchase in minor units")
    min_quantity: int = Field(0, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = Field(None, ge=1)
    scope: str = Field("subscription", pattern="^(product|subscription)$")


class DiscountCreate(DiscountBase):
    product_ids: List[int] = []
    subscription_ids: List[int] = []


class DiscountUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(fixed|percent)$")
    value: Optional[int] = Field(None, ge=0)
    min_purchase: Optional[int] = Field(None, ge=0)
    min_quantity: Optional[int] = Field(None, ge=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = Field(None, ge=1)
    scope: Optional[str] = Field(None, pattern="^(product|subscription)$")
    product_ids: Optional[List[int]] = None
    subscription_ids: Optional[List[int]] = None


class DiscountResponse(DiscountBase):
    id: int
    times_used: int
    linked_product_ids: List[int] = []
    linked_subscription_ids: List[int] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
