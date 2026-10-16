from enum import Enum
from typing import TypeVar

from pydantic import BaseModel, Field, field_validator

from app.models import Category, Priority

MAX_INDICATORS = 10
MAX_INDICATOR_LENGTH = 120

CodeEnum = TypeVar("CodeEnum", bound=Enum)


def _parse_code(value: object, enum_type: type[CodeEnum], fallback: CodeEnum) -> CodeEnum:
    if isinstance(value, enum_type):
        return value
    # str() is not used on enum members: for str-mixin enums it yields "Category.X".
    code = (value if isinstance(value, str) else "").strip().upper().replace(" ", "_")
    return enum_type[code] if code in enum_type.__members__ else fallback


class Classification(BaseModel):
    """Normalised AI classification.

    Model output is never trusted as-is: unknown categories fall back to OTHER and
    unknown priorities to MEDIUM, so a malformed answer can never break the workflow.
    """

    category: Category = Category.OTHER
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    priority: Priority = Priority.MEDIUM
    summary: str = ""
    justification: str = ""
    indicators: list[str] = Field(default_factory=list)
    model: str = ""
    error: str | None = None

    @field_validator("category", mode="before")
    @classmethod
    def coerce_category(cls, value: object) -> Category:
        return _parse_code(value, Category, Category.OTHER)

    @field_validator("priority", mode="before")
    @classmethod
    def coerce_priority(cls, value: object) -> Priority:
        return _parse_code(value, Priority, Priority.MEDIUM)

    @field_validator("confidence", mode="before")
    @classmethod
    def clamp_confidence(cls, value: object) -> float:
        try:
            return min(max(float(value), 0.0), 1.0)
        except (TypeError, ValueError):
            return 0.0

    @field_validator("indicators", mode="before")
    @classmethod
    def limit_indicators(cls, value: object) -> list[str]:
        if not isinstance(value, list):
            return []
        return [str(item)[:MAX_INDICATOR_LENGTH] for item in value][:MAX_INDICATORS]
