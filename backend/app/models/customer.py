from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    name = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=True)
    billing_address = Column(Text, nullable=True)
    tax_id = Column(String(100), nullable=True)

    users = relationship("User", back_populates="customer", cascade="all")
    subscriptions = relationship("Subscription", back_populates="customer", cascade="all")

