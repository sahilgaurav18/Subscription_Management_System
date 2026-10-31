from sqlalchemy import Column, String, Integer, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_log"

    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, STATUS_CHANGE
    entity = Column(String(50), nullable=False)  # product, plan, tax, discount, subscription, user, customer
    entity_id = Column(String(50), nullable=False)
    before = Column(Text, nullable=True)  # JSON serialized snapshot
    after = Column(Text, nullable=True)   # JSON serialized snapshot

    actor = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_entity_entity_id", entity, entity_id),
        Index("ix_audit_actor_id", actor_id),
    )

