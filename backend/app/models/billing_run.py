from sqlalchemy import Column, String, Integer, DateTime, Text
from app.database import Base
from app.models.base import TimestampMixin


class BillingRun(Base, TimestampMixin):
    __tablename__ = "billing_runs"

    started_at = Column(DateTime(timezone=True), nullable=False)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, default="running")  # running, completed, failed
    created_count = Column(Integer, nullable=False, default=0)
    failures_count = Column(Integer, nullable=False, default=0)
    triggered_by = Column(String(50), nullable=False, default="admin_manual")  # admin_manual, nightly_worker
    details = Column(Text, nullable=True)

