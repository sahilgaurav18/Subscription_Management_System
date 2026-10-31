import json
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log_audit_event(
    db: Session,
    actor_id: Optional[int],
    action: str,
    entity: str,
    entity_id: Any,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    before_json = json.dumps(before, default=str) if before is not None else None
    after_json = json.dumps(after, default=str) if after is not None else None

    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity=entity,
        entity_id=str(entity_id),
        before=before_json,
        after=after_json,
    )
    db.add(entry)
    db.flush()
    return entry

