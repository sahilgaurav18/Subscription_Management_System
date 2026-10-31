from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ProductVariantBase(BaseModel):
    attribute: str
    value: str
    extra_price: int = Field(0, description="Extra price in minor units (e.g. cents)")


class ProductVariantCreate(ProductVariantBase):
    pass


class ProductVariantUpdate(BaseModel):
    attribute: Optional[str] = None
    value: Optional[str] = None
    extra_price: Optional[int] = None


class ProductVariantResponse(ProductVariantBase):
    id: int
    product_id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str
    type: str = "software"
    sales_price: int = Field(..., ge=0, description="Base sales price in minor units (e.g. cents)")
    cost_price: int = Field(0, ge=0, description="Cost price in minor units")
    currency: str = "USD"
    notes: Optional[str] = None


class ProductCreate(ProductBase):
    variants: List[ProductVariantCreate] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    sales_price: Optional[int] = Field(None, ge=0)
    cost_price: Optional[int] = Field(None, ge=0)
    currency: Optional[str] = None
    notes: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    variants: List[ProductVariantResponse] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
