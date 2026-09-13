from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.chatbot_service import get_chatbot_reply

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest):
    reply = get_chatbot_reply(payload.message, [m.model_dump() for m in payload.history])
    return ChatResponse(reply=reply)
