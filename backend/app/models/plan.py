import enum
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from app.database import Base
from app.models.base import TimestampMixin


class BillingPeriod(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class Plan(Base, TimestampMixin):
    __tablename__ = "plans"

    name = Column(String(255), nullable=False, index=True)
    price = Column(Integer, nullable=False, default=0)  # minor units (cents)
    currency = Column(String(3), nullable=False, default="USD")
    billing_period = Column(String(20), nullable=False, default=BillingPeriod.MONTHLY.value)
    min_quantity = Column(Integer, nullable=False, default=1)
    available_from = Column(DateTime(timezone=True), nullable=True)
    available_to = Column(DateTime(timezone=True), nullable=True)
    auto_close = Column(Boolean, nullable=False, default=False)
    closable = Column(Boolean, nullable=False, default=True)
    pausable = Column(Boolean, nullable=False, default=True)
    renewable = Column(Boolean, nullable=False, default=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")

