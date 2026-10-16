from app.schemas.report import AuditLogRead


class AuditLogEntry(AuditLogRead):
    """Audit log line in the global view, linked to its report (if any)."""

    report_id: str | None = None
    protocol: str | None = None
