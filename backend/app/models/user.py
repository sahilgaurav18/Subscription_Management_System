import enum
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Index, func
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.CUSTOMER.value)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    token_version = Column(Integer, default=1, nullable=False)

    customer = relationship("Customer", back_populates="users", lazy="joined")
    audit_logs = relationship("AuditLog", back_populates="actor", lazy="select")

    __table_args__ = (
        Index("ix_users_email_lower_unique", func.lower(email), unique=True),
        Index("ix_users_role", role),
    )

