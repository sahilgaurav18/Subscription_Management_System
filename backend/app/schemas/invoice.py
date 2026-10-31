from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class InvoiceLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str
    quantity: int
    unit_price: int
    tax_amount: int
    amount: int


class PaymentCreate(BaseModel):
    method: str = Field(..., description="credit_card, bank_transfer, manual, cash, stripe")
    amount: int = Field(..., gt=0, description="Amount in minor units (e.g. cents)")
    paid_on: Optional[datetime] = None
    note: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    invoice_id: int
    method: str
    amount: int
    paid_on: datetime
    note: Optional[str] = None
    created_at: datetime


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    number: str
    subscription_id: int
    subscription_number: Optional[str] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    period_start: datetime
    period_end: datetime
    status: str
    subtotal: int
    discount_total: int
    tax_total: int
    total: int
    due_date: datetime
    amount_paid: int = 0
    balance_due: int = 0
    is_overdue: bool = False
    lines: List[InvoiceLineResponse] = []
    payments: List[PaymentResponse] = []
    created_at: datetime
    updated_at: datetime


class BillingRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    created_count: int
    failures_count: int
    triggered_by: str
    details: Optional[str] = None
    created_at: datetime

