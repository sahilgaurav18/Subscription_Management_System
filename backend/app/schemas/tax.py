from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class TaxBase(BaseModel):
    name: str
    rate_percent: Decimal = Field(..., ge=0, le=100, description="Tax rate in percent, e.g. 18.00")


class TaxCreate(TaxBase):
    pass


class TaxUpdate(BaseModel):
    name: Optional[str] = None
    rate_percent: Optional[Decimal] = Field(None, ge=0, le=100)


class TaxResponse(TaxBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
