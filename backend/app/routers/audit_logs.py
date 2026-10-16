import csv
import io
from datetime import timedelta

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Query as OrmQuery
from sqlalchemy.orm import Session, joinedload

from app.dependencies import CurrentUser, DbSession
from app.models import AuditAction, AuditLog, Report
from app.schemas.audit import AuditLogEntry
from app.schemas.common import Page
from app.utils.time import utc_now

router = APIRouter(prefix="/api/admin/audit-logs", tags=["audit-logs"])

EXPORT_ROW_LIMIT = 5000
CSV_HEADER = ["id", "data_hora", "operacao", "protocolo", "autor", "descricao", "estado_anterior", "estado_novo", "nota"]


@router.get("", response_model=Page[AuditLogEntry])
def list_audit_logs(
    db: DbSession,
    _: CurrentUser,
    search: str | None = None,
    action: AuditAction | None = None,
    user_id: str | None = None,
    days: int = Query(7, ge=0, description="0 = todo o período"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=200),
):
    query = _filtered_query(db, search, action, user_id, days)
    total = query.count()
    logs = query.offset((page - 1) * page_size).limit(page_size).all()
    return Page[AuditLogEntry](
        total=total,
        page=page,
        page_size=page_size,
        items=[AuditLogEntry.model_validate(log) for log in logs],
    )


@router.get("/export")
def export_audit_logs(
    db: DbSession,
    _: CurrentUser,
    search: str | None = None,
    action: AuditAction | None = None,
    user_id: str | None = None,
    days: int = Query(7, ge=0),
):
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(CSV_HEADER)
    for log in _filtered_query(db, search, action, user_id, days).limit(EXPORT_ROW_LIMIT):
        writer.writerow(
            [
                log.id,
                log.created_at.isoformat(),
                log.action.value,
                log.protocol or "",
                log.user_name or "sistema",
                log.description,
                log.previous_status or "",
                log.new_status or "",
                log.note or "",
            ]
        )
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=auditoria_denuncia.csv"},
    )


def _filtered_query(
    db: Session, search: str | None, action: AuditAction | None, user_id: str | None, days: int
) -> OrmQuery[AuditLog]:
    query = db.query(AuditLog).options(joinedload(AuditLog.user), joinedload(AuditLog.report))
    if days > 0:
        query = query.filter(AuditLog.created_at >= utc_now() - timedelta(days=days))
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if search:
        term = f"%{search.strip()}%"
        query = query.outerjoin(Report, AuditLog.report_id == Report.id).filter(
            or_(AuditLog.description.ilike(term), Report.protocol.ilike(term))
        )
    # Seeded history is backdated, so insertion order (id) is not chronological.
    return query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
