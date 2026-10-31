import enum
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PAID = "paid"
    CANCELLED = "cancelled"


class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"

    number = Column(String(50), nullable=False, unique=True, index=True)  # e.g., INV-000123
    subscription_id = Column(Integer, ForeignKey("subscriptions.id", ondelete="RESTRICT"), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), nullable=False, default=InvoiceStatus.DRAFT.value)
    subtotal = Column(Integer, nullable=False, default=0)        # minor units
    discount_total = Column(Integer, nullable=False, default=0)  # minor units
    tax_total = Column(Integer, nullable=False, default=0)       # minor units
    total = Column(Integer, nullable=False, default=0)           # minor units
    due_date = Column(DateTime(timezone=True), nullable=False)

    subscription = relationship("Subscription", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan", lazy="selectin")
    payments = relationship("Payment", back_populates="invoice", cascade="all", lazy="selectin")

    __table_args__ = (
        UniqueConstraint("subscription_id", "period_start", name="uq_invoice_sub_period_start"),
        Index("ix_invoices_status_due_date", status, due_date),
        Index("ix_invoices_subscription_id", subscription_id),
        Index("ix_invoices_status", status),
        Index("ix_invoices_period_start", period_start),
    )


class InvoiceLine(Base, TimestampMixin):
    __tablename__ = "invoice_lines"

    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Integer, nullable=False)    # minor units
    tax_amount = Column(Integer, nullable=False, default=0)  # minor units
    amount = Column(Integer, nullable=False)        # minor units

    invoice = relationship("Invoice", back_populates="lines")


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="RESTRICT"), nullable=False)
    method = Column(String(50), nullable=False)  # credit_card, bank_transfer, manual, stripe
    amount = Column(Integer, nullable=False)      # minor units
    paid_on = Column(DateTime(timezone=True), nullable=False)
    note = Column(Text, nullable=True)

    invoice = relationship("Invoice", back_populates="payments")

    __table_args__ = (
        Index("ix_payments_invoice_id", invoice_id),
        Index("ix_payments_paid_on", paid_on),
    )
