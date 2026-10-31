from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_email: Optional[str] = None
    action: str
    entity: str
    entity_id: str
    before: Optional[str] = None
    after: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
