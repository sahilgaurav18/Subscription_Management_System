import asyncio
import json
import logging
import uuid
from typing import Dict, Any, Optional

logger = logging.getLogger("brightloop.sse")


class SSEManager:
    def __init__(self):
        self._subscribers: Dict[str, asyncio.Queue] = {}

    def subscribe(self) -> tuple[str, asyncio.Queue]:
        sub_id = str(uuid.uuid4())
        queue = asyncio.Queue()
        self._subscribers[sub_id] = queue
        logger.debug(f"SSE client {sub_id} subscribed. Total active: {len(self._subscribers)}")
        return sub_id, queue

    def unsubscribe(self, sub_id: str):
        if sub_id in self._subscribers:
            del self._subscribers[sub_id]
            logger.debug(f"SSE client {sub_id} disconnected. Remaining active: {len(self._subscribers)}")

    def broadcast_sync(self, event_type: str, data: Optional[Dict[str, Any]] = None):
        """
        Thread-safe / synchronous broadcast to all active SSE queues.
        """
        payload = {
            "event": event_type,
            "data": data or {},
        }
        msg = f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"

        for sub_id, queue in list(self._subscribers.items()):
            try:
                queue.put_nowait(msg)
            except Exception as e:
                logger.warning(f"Failed to deliver SSE to subscriber {sub_id}: {e}")

    async def broadcast(self, event_type: str, data: Optional[Dict[str, Any]] = None):
        self.broadcast_sync(event_type, data)


# Global singleton instance
sse_manager = SSEManager()


def notify_system_event(event_type: str, data: Optional[Dict[str, Any]] = None):
    """Convenience helper to broadcast system state updates."""
    sse_manager.broadcast_sync(event_type, data)

