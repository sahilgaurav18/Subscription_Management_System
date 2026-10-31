from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class SubscriptionLineCreate(BaseModel):
    product_id: int
    variant_id: Optional[int] = None
    quantity: int = Field(1, ge=1)
    tax_id: Optional[int] = None
    unit_price: Optional[int] = None


class SubscriptionLineResponse(BaseModel):
    id: int
    subscription_id: int
    product_id: int
    product_name: Optional[str] = None
    variant_id: Optional[int] = None
    variant_attribute: Optional[str] = None
    variant_value: Optional[str] = None
    quantity: int
    unit_price: int
    tax_id: Optional[int] = None
    tax_rate: Optional[str] = None
    amount: int
    model_config = ConfigDict(from_attributes=True)


class CreateQuotationFromTemplateRequest(BaseModel):
    template_id: int
    customer_id: int
    start_date: Optional[datetime] = None
    payment_terms: str = "Immediate"
    custom_lines: Optional[List[SubscriptionLineCreate]] = None


class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    payment_terms: str = "Immediate"
    status: str = Field("draft", pattern="^(draft|quotation)$")
    lines: List[SubscriptionLineCreate] = []


class SubscriptionUpdate(BaseModel):
    plan_id: Optional[int] = None
    start_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    payment_terms: Optional[str] = None
    lines: Optional[List[SubscriptionLineCreate]] = None


class SubscriptionTransitionRequest(BaseModel):
    action: str = Field(..., description="Action: quotation, confirm, activate, pause, resume, close, renew")
    note: Optional[str] = None


class SubscriptionResponse(BaseModel):
    id: int
    number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_company: Optional[str] = None
    customer_billing_address: Optional[str] = None
    customer_tax_id: Optional[str] = None
    plan_id: int
    plan_name: Optional[str] = None
    plan_billing_period: Optional[str] = None
    plan_price: Optional[int] = None
    plan_pausable: Optional[bool] = None
    plan_closable: Optional[bool] = None
    plan_renewable: Optional[bool] = None
    plan_auto_close: Optional[bool] = None
    start_date: datetime
    expiry_date: Optional[datetime] = None
    payment_terms: str
    status: str
    next_invoice_date: Optional[datetime] = None
    total_amount: int
    lines: List[SubscriptionLineResponse] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

