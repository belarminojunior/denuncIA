import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.time import utc_now


class AuditAction(str, enum.Enum):
    CREATED = "CREATED"
    AI_CLASSIFICATION = "AI_CLASSIFICATION"
    ACCESS = "ACCESS"
    STATUS_CHANGE = "STATUS_CHANGE"
    VALIDATION = "VALIDATION"
    ROUTING = "ROUTING"
    LOGIN = "LOGIN"


class AuditLog(Base):
    """Append-only record of every relevant operation (never updated or deleted)."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Null for account-level events such as LOGIN.
    report_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("reports.id"), nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    action: Mapped[AuditAction] = mapped_column(Enum(AuditAction))
    description: Mapped[str] = mapped_column(String(255))
    previous_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    report = relationship("Report", back_populates="audit_logs")
    user = relationship("User")

    @property
    def user_name(self) -> str | None:
        return self.user.name if self.user else None

    @property
    def protocol(self) -> str | None:
        return self.report.protocol if self.report else None

    @property
    def changed_status(self) -> bool:
        return self.new_status is not None and self.new_status != self.previous_status
