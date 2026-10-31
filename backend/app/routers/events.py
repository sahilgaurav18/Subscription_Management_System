import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.services.sse_service import sse_manager

router = APIRouter(tags=["Realtime Events"])


@router.get("/api/events")
@router.get("/events")
async def sse_event_stream(request: Request):
    """
    Server-Sent Events endpoint providing real-time streaming of platform mutations:
    - invoice_created
    - invoice_status_changed
    - payment_recorded
    - subscription_status_changed
    - finance_update
    """
    sub_id, queue = sse_manager.subscribe()

    async def event_generator():
        # Initial handshake ping
        yield "event: connected\ndata: {\"status\": \"connected\", \"client_id\": \"" + sub_id + "\"}\n\n"
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield msg
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat comment every 15s
                    yield ": ping keep-alive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            sse_manager.unsubscribe(sub_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

