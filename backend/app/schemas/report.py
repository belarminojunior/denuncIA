from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models import AuditAction, Category, Priority, ReportStatus

DESCRIPTION_MIN_LENGTH = 20
DESCRIPTION_MAX_LENGTH = 5000


class ReportCreate(BaseModel):
    """Public submission form, validated before anything is persisted."""

    is_anonymous: bool = False
    reporter_name: str | None = None
    reporter_email: str | None = None
    reporter_phone: str | None = None
    reported_category: Category | None = None
    location: str | None = None
    incident_date: str | None = None
    description: str
    involved_parties: str | None = None
    amount_involved: str | None = None

    @field_validator("reported_category", mode="before")
    @classmethod
    def unknown_category_to_none(cls, value: object) -> object:
        # The form sends an empty string when the citizen picks "Não sei".
        return value or None

    @field_validator("description")
    @classmethod
    def check_description_length(cls, value: str) -> str:
        value = (value or "").strip()
        if len(value) < DESCRIPTION_MIN_LENGTH:
            raise ValueError(f"A descrição deve ter pelo menos {DESCRIPTION_MIN_LENGTH} caracteres.")
        if len(value) > DESCRIPTION_MAX_LENGTH:
            raise ValueError(f"A descrição não pode exceder {DESCRIPTION_MAX_LENGTH} caracteres.")
        return value

    @field_validator(
        "reporter_name",
        "reporter_email",
        "reporter_phone",
        "location",
        "incident_date",
        "involved_parties",
        "amount_involved",
    )
    @classmethod
    def blank_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class ReportSubmitted(BaseModel):
    protocol: str
    status: ReportStatus
    created_at: datetime


class PublicStatusEvent(BaseModel):
    status: ReportStatus
    occurred_at: datetime


class PublicReportStatus(BaseModel):
    """Citizen-facing view: status and timeline only, no internal data."""

    protocol: str
    status: ReportStatus
    created_at: datetime
    updated_at: datetime
    history: list[PublicStatusEvent]


class AttachmentRead(BaseModel):
    id: str
    filename: str
    mime_type: str
    size_bytes: int

    model_config = {"from_attributes": True}


class AuditLogRead(BaseModel):
    id: int
    action: AuditAction
    description: str
    previous_status: ReportStatus | None
    new_status: ReportStatus | None
    note: str | None
    created_at: datetime
    user_name: str | None = None

    model_config = {"from_attributes": True}


class ReportSummary(BaseModel):
    id: str
    protocol: str
    created_at: datetime
    updated_at: datetime
    status: ReportStatus
    location: str | None
    ai_category: Category | None
    ai_confidence: float | None
    ai_priority: Priority | None
    validated_category: Category | None
    validated_priority: Priority | None

    model_config = {"from_attributes": True}


class ReportDetail(ReportSummary):
    reporter_name: str | None
    reporter_email: str | None
    reporter_phone: str | None
    is_anonymous: bool
    reported_category: Category | None
    incident_date: str | None
    description: str
    involved_parties: str | None
    amount_involved: str | None

    ai_summary: str | None
    ai_justification: str | None
    ai_indicators: list[str] | None
    ai_model: str | None
    ai_error: str | None

    reviewer_notes: str | None
    assignee_name: str | None = None
    validated_at: datetime | None
    routed_at: datetime | None

    attachments: list[AttachmentRead]
    audit_logs: list[AuditLogRead]


class ValidateReportRequest(BaseModel):
    category: Category
    priority: Priority
    notes: str | None = Field(default=None, max_length=5000)


class ReviewActionRequest(BaseModel):
    notes: str | None = Field(default=None, max_length=5000)


class UpdateReviewRequest(BaseModel):
    category: Category | None = None
    priority: Priority | None = None
    notes: str | None = Field(default=None, max_length=5000)
