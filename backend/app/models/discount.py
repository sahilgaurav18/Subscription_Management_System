import enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class DiscountType(str, enum.Enum):
    FIXED = "fixed"
    PERCENT = "percent"


class DiscountScope(str, enum.Enum):
    PRODUCT = "product"
    SUBSCRIPTION = "subscription"


class DiscountProduct(Base):
    __tablename__ = "discount_products"

    discount_id = Column(Integer, ForeignKey("discounts.id", ondelete="CASCADE"), primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)

    discount = relationship("Discount", back_populates="product_links")
    product = relationship("Product", back_populates="discounts")


class DiscountSubscription(Base):
    __tablename__ = "discount_subscriptions"

    discount_id = Column(Integer, ForeignKey("discounts.id", ondelete="CASCADE"), primary_key=True)
    subscription_id = Column(Integer, primary_key=True)  # Or foreign key to subscriptions

    discount = relationship("Discount", back_populates="subscription_links")


class Discount(Base, TimestampMixin):
    __tablename__ = "discounts"

    name = Column(String(255), nullable=False)
    code = Column(String(50), nullable=True, index=True)
    type = Column(String(20), nullable=False, default=DiscountType.PERCENT.value)
    value = Column(Integer, nullable=False, default=0)  # minor units for fixed, percent for percent (e.g. 15 for 15%)
    min_purchase = Column(Integer, nullable=False, default=0)  # minor units
    min_quantity = Column(Integer, nullable=False, default=0)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    usage_limit = Column(Integer, nullable=True)  # None = unlimited
    times_used = Column(Integer, nullable=False, default=0)
    scope = Column(String(20), nullable=False, default=DiscountScope.SUBSCRIPTION.value)

    product_links = relationship("DiscountProduct", back_populates="discount", cascade="all, delete-orphan", lazy="selectin")
    subscription_links = relationship("DiscountSubscription", back_populates="discount", cascade="all, delete-orphan", lazy="selectin")

