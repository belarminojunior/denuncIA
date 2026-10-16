from sqlalchemy.orm import Session

from app.models import AuditAction, AuditLog, ReportStatus


def record(
    db: Session,
    *,
    action: AuditAction,
    description: str,
    report_id: str | None = None,
    user_id: str | None = None,
    previous_status: ReportStatus | None = None,
    new_status: ReportStatus | None = None,
    note: str | None = None,
) -> AuditLog:
    """Add an audit entry to the current transaction (the caller commits)."""
    entry = AuditLog(
        action=action,
        description=description,
        report_id=report_id,
        user_id=user_id,
        previous_status=previous_status.value if previous_status else None,
        new_status=new_status.value if new_status else None,
        note=note,
    )
    db.add(entry)
    db.flush()
    return entry
