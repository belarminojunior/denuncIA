from collections.abc import Callable
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.dependencies import CurrentUser, DbSession
from app.models import Attachment, Category, Priority, Report, ReportStatus, User
from app.schemas.common import Page
from app.schemas.report import (
    ReportDetail,
    ReportSummary,
    ReviewActionRequest,
    UpdateReviewRequest,
    ValidateReportRequest,
)
from app.services import report_service

router = APIRouter(prefix="/api/admin/reports", tags=["admin-reports"])

ReviewAction = Callable[..., Report]


@router.get("", response_model=Page[ReportSummary])
def list_reports(
    db: DbSession,
    _: CurrentUser,
    search: str | None = None,
    category: Category | None = None,
    status_filter: ReportStatus | None = Query(None, alias="status"),
    priority: Priority | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    query = db.query(Report)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(Report.protocol.ilike(term), Report.location.ilike(term), Report.description.ilike(term))
        )
    # Filters match the effective value: the validated one, or the AI suggestion before validation.
    if category:
        query = query.filter(or_(Report.validated_category == category, Report.ai_category == category))
    if priority:
        query = query.filter(or_(Report.validated_priority == priority, Report.ai_priority == priority))
    if status_filter:
        query = query.filter(Report.status == status_filter)

    total = query.count()
    reports = query.order_by(Report.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return Page[ReportSummary](
        total=total,
        page=page,
        page_size=page_size,
        items=[ReportSummary.model_validate(report) for report in reports],
    )


@router.get("/{report_id}", response_model=ReportDetail)
def get_report(report_id: str, db: DbSession, user: CurrentUser):
    """Return a report; the first time a technician opens it, it moves to UNDER_REVIEW."""
    report = report_service.get_by_id(db, report_id)
    report = report_service.open_for_review(db, report, user)
    return ReportDetail.model_validate(report)


@router.patch("/{report_id}", response_model=ReportDetail)
def update_review(report_id: str, payload: UpdateReviewRequest, db: DbSession, user: CurrentUser):
    report = report_service.get_by_id(db, report_id)
    report = report_service.update_review(db, report, user, payload.category, payload.priority, payload.notes)
    return ReportDetail.model_validate(report)


@router.post("/{report_id}/validate", response_model=ReportDetail)
def validate_report(report_id: str, payload: ValidateReportRequest, db: DbSession, user: CurrentUser):
    report = report_service.get_by_id(db, report_id)
    report = report_service.validate(db, report, user, payload.category, payload.priority, payload.notes)
    return ReportDetail.model_validate(report)


@router.post("/{report_id}/route", response_model=ReportDetail)
def route_report(report_id: str, payload: ReviewActionRequest, db: DbSession, user: CurrentUser):
    return _apply_review_action(report_service.route, report_id, payload, db, user)


@router.post("/{report_id}/investigate", response_model=ReportDetail)
def investigate_report(report_id: str, payload: ReviewActionRequest, db: DbSession, user: CurrentUser):
    return _apply_review_action(report_service.start_investigation, report_id, payload, db, user)


@router.post("/{report_id}/reject", response_model=ReportDetail)
def reject_report(report_id: str, payload: ReviewActionRequest, db: DbSession, user: CurrentUser):
    return _apply_review_action(report_service.reject, report_id, payload, db, user)


@router.post("/{report_id}/archive", response_model=ReportDetail)
def archive_report(report_id: str, payload: ReviewActionRequest, db: DbSession, user: CurrentUser):
    return _apply_review_action(report_service.archive, report_id, payload, db, user)


@router.get("/{report_id}/attachments/{attachment_id}")
def download_attachment(report_id: str, attachment_id: str, db: DbSession, user: CurrentUser):
    attachment = (
        db.query(Attachment).filter(Attachment.id == attachment_id, Attachment.report_id == report_id).first()
    )
    if attachment is None or not Path(attachment.storage_path).is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anexo não encontrado.")

    report_service.record_attachment_access(db, attachment.report, user, attachment.filename)
    return FileResponse(attachment.storage_path, media_type=attachment.mime_type, filename=attachment.filename)


def _apply_review_action(
    action: ReviewAction, report_id: str, payload: ReviewActionRequest, db: Session, user: User
) -> ReportDetail:
    report = report_service.get_by_id(db, report_id)
    return ReportDetail.model_validate(action(db, report, user, payload.notes))
