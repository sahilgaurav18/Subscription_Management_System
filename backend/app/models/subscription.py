import enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class SubscriptionStatus(str, enum.Enum):
    DRAFT = "draft"
    QUOTATION = "quotation"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"


class QuotationTemplate(Base, TimestampMixin):
    __tablename__ = "quotation_templates"

    name = Column(String(255), nullable=False)
    validity_days = Column(Integer, nullable=False, default=30)
    plan_id = Column(Integer, ForeignKey("plans.id", ondelete="CASCADE"), nullable=False)

    plan = relationship("Plan")
    lines = relationship("QuotationTemplateLine", back_populates="template", cascade="all, delete-orphan", lazy="selectin")


class QuotationTemplateLine(Base, TimestampMixin):
    __tablename__ = "quotation_template_lines"

    template_id = Column(Integer, ForeignKey("quotation_templates.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)

    template = relationship("QuotationTemplate", back_populates="lines")
    product = relationship("Product")
    variant = relationship("ProductVariant")


class Subscription(Base, TimestampMixin):
    __tablename__ = "subscriptions"

    number = Column(String(50), nullable=False, unique=True, index=True)  # e.g., SUB-000123
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id", ondelete="RESTRICT"), nullable=False, index=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    payment_terms = Column(String(100), nullable=False, default="Immediate")
    status = Column(String(50), nullable=False, default=SubscriptionStatus.DRAFT.value)
    next_invoice_date = Column(DateTime(timezone=True), nullable=True)

    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("Plan")
    lines = relationship("SubscriptionLine", back_populates="subscription", cascade="all, delete-orphan", lazy="selectin")
    invoices = relationship("Invoice", back_populates="subscription", cascade="all")

    __table_args__ = (
        Index("ix_subscriptions_status_next_invoice", status, next_invoice_date),
        Index("ix_subscriptions_status", status),
        Index("ix_subscriptions_start_date", start_date),
    )


class SubscriptionLine(Base, TimestampMixin):
    __tablename__ = "subscription_lines"

    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Integer, nullable=False)  # minor units copied at confirmation
    tax_id = Column(Integer, ForeignKey("taxes.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Integer, nullable=False)      # minor units

    subscription = relationship("Subscription", back_populates="lines")
    product = relationship("Product")
    variant = relationship("ProductVariant")
    tax = relationship("Tax")
