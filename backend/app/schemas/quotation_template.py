from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class QuotationTemplateLineBase(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(1, ge=1)


class QuotationTemplateLineCreate(QuotationTemplateLineBase):
    pass


class QuotationTemplateLineResponse(QuotationTemplateLineBase):
    id: int
    product_name: Optional[str] = None
    product_price: Optional[int] = None
    variant_attribute: Optional[str] = None
    variant_value: Optional[str] = None
    variant_extra_price: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


class QuotationTemplateBase(BaseModel):
    name: str
    validity_days: int = Field(30, ge=1, le=365)
    plan_id: int


class QuotationTemplateCreate(QuotationTemplateBase):
    lines: List[QuotationTemplateLineCreate] = []


class QuotationTemplateUpdate(BaseModel):
    name: Optional[str] = None
    validity_days: Optional[int] = Field(None, ge=1, le=365)
    plan_id: Optional[int] = None
    lines: Optional[List[QuotationTemplateLineCreate]] = None


class QuotationTemplateResponse(QuotationTemplateBase):
    id: int
    plan_name: Optional[str] = None
    plan_price: Optional[int] = None
    plan_billing_period: Optional[str] = None
    lines: List[QuotationTemplateLineResponse] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

