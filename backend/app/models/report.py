import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.time import utc_now


class Category(str, enum.Enum):
    BRIBERY = "BRIBERY"
    NEPOTISM = "NEPOTISM"
    EMBEZZLEMENT = "EMBEZZLEMENT"
    ABUSE_OF_POWER = "ABUSE_OF_POWER"
    INFLUENCE_PEDDLING = "INFLUENCE_PEDDLING"
    CONFLICT_OF_INTEREST = "CONFLICT_OF_INTEREST"
    FRAUD = "FRAUD"
    ELECTORAL_CORRUPTION = "ELECTORAL_CORRUPTION"
    OTHER = "OTHER"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ReportStatus(str, enum.Enum):
    """Lifecycle of a report.

    ROUTED ("encaminhada") means the report was formally accepted into the GCCC
    case-management workflow — it is not a hand-off to an external entity.
    """

    RECEIVED = "RECEIVED"
    PENDING_REVIEW = "PENDING_REVIEW"
    UNDER_REVIEW = "UNDER_REVIEW"
    VALIDATED = "VALIDATED"
    ROUTED = "ROUTED"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    ARCHIVED = "ARCHIVED"
    REJECTED = "REJECTED"


FINAL_STATUSES = frozenset({ReportStatus.ARCHIVED, ReportStatus.REJECTED})


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    protocol: Mapped[str] = mapped_column(String(30), unique=True, index=True)

    # Reporter identity — always empty for anonymous reports.
    reporter_name: Mapped[str | None] = mapped_column(String(150), nullable=True)
    reporter_email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    reporter_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)

    reported_category: Mapped[Category | None] = mapped_column(Enum(Category), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    incident_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    description: Mapped[str] = mapped_column(Text)
    involved_parties: Mapped[str | None] = mapped_column(Text, nullable=True)
    amount_involved: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # AI suggestion: decision support only, never treated as the final decision.
    ai_category: Mapped[Category | None] = mapped_column(Enum(Category), nullable=True)
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_priority: Mapped[Priority | None] = mapped_column(Enum(Priority), nullable=True)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_indicators: Mapped[list | None] = mapped_column(JSON, nullable=True)
    ai_model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ai_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Human review: the binding decision, always made by a GCCC technician.
    validated_category: Mapped[Category | None] = mapped_column(Enum(Category), nullable=True)
    validated_priority: Mapped[Priority | None] = mapped_column(Enum(Priority), nullable=True)
    reviewer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[ReportStatus] = mapped_column(Enum(ReportStatus), default=ReportStatus.RECEIVED)
    assignee_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    routed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    assignee = relationship("User", back_populates="assigned_reports")
    attachments = relationship("Attachment", back_populates="report", cascade="all, delete-orphan")
    audit_logs = relationship(
        "AuditLog", back_populates="report", cascade="all, delete-orphan", order_by="AuditLog.created_at"
    )

    @property
    def is_final(self) -> bool:
        return self.status in FINAL_STATUSES

    @property
    def assignee_name(self) -> str | None:
        return self.assignee.name if self.assignee else None
