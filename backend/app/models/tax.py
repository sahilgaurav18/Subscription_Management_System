from sqlalchemy import Column, String, Numeric
from app.database import Base
from app.models.base import TimestampMixin


class Tax(Base, TimestampMixin):
    __tablename__ = "taxes"

    name = Column(String(100), nullable=False, unique=True, index=True)
    rate_percent = Column(Numeric(5, 2), nullable=False)  # e.g., 18.00 for 18%

