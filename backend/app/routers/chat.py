from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest
from app.services.chat_service import stream_reply

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Disables buffering in reverse proxies (e.g. nginx) so tokens reach the browser as they arrive.
STREAMING_HEADERS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}


@router.post("")
def chat(payload: ChatRequest) -> StreamingResponse:
    """Stream the assistant reply as plain text chunks."""
    return StreamingResponse(
        stream_reply(payload.message, payload.history),
        media_type="text/plain; charset=utf-8",
        headers=STREAMING_HEADERS,
    )
