from typing import Literal

from pydantic import BaseModel, Field

MAX_MESSAGE_LENGTH = 2000
MAX_HISTORY_TURNS = 40


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_LENGTH)
    history: list[ChatTurn] = Field(default_factory=list, max_length=MAX_HISTORY_TURNS)
