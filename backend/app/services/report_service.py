"""Business rules for the report lifecycle.

RECEIVED -> PENDING_REVIEW (AI classification done) -> UNDER_REVIEW (opened by a
technician) -> VALIDATED -> ROUTED (accepted for handling) -> UNDER_INVESTIGATION
-> ARCHIVED. A report can be rejected or archived from any non-final status.

The AI only fills the `ai_*` fields. Validation is always an explicit, audited act
by a technician and is stored separately in the `validated_*` fields.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.labels import CATEGORY_LABELS, PRIORITY_LABELS
from app.models import AuditAction, Category, Priority, Report, ReportStatus, User
from app.schemas.classification import Classification
from app.schemas.report import ReportCreate
from app.services import audit_service
from app.services.llm_service import classify_report
from app.utils.protocol import generate_protocol
from app.utils.time import utc_now
from app.utils.validators import sanitize_user_text

_CLOSABLE = frozenset({ReportStatus.REJECTED, ReportStatus.ARCHIVED})

ALLOWED_TRANSITIONS: dict[ReportStatus, frozenset[ReportStatus]] = {
    ReportStatus.RECEIVED: _CLOSABLE
    | {ReportStatus.PENDING_REVIEW, ReportStatus.UNDER_REVIEW, ReportStatus.VALIDATED},
    ReportStatus.PENDING_REVIEW: _CLOSABLE | {ReportStatus.UNDER_REVIEW, ReportStatus.VALIDATED},
    ReportStatus.UNDER_REVIEW: _CLOSABLE | {ReportStatus.VALIDATED},
    ReportStatus.VALIDATED: _CLOSABLE | {ReportStatus.ROUTED},
    ReportStatus.ROUTED: _CLOSABLE | {ReportStatus.UNDER_INVESTIGATION},
    ReportStatus.UNDER_INVESTIGATION: _CLOSABLE,
    ReportStatus.ARCHIVED: frozenset(),
    ReportStatus.REJECTED: frozenset(),
}


# --- Submission and AI classification -------------------------------------------------


def create_report(db: Session, data: ReportCreate) -> Report:
    report = Report(
        protocol=generate_protocol(db),
        is_anonymous=data.is_anonymous,
        reporter_name=None if data.is_anonymous else data.reporter_name,
        reporter_email=None if data.is_anonymous else data.reporter_email,
        reporter_phone=None if data.is_anonymous else data.reporter_phone,
        reported_category=data.reported_category,
        location=data.location,
        incident_date=data.incident_date,
        description=sanitize_user_text(data.description),
        involved_parties=data.involved_parties,
        amount_involved=data.amount_involved,
        status=ReportStatus.RECEIVED,
    )
    db.add(report)
    db.flush()

    audit_service.record(
        db,
        action=AuditAction.CREATED,
        description="Denúncia submetida de forma anónima" if report.is_anonymous else "Denúncia submetida",
        report_id=report.id,
        new_status=ReportStatus.RECEIVED,
    )
    return report


def apply_ai_classification(report_id: str) -> None:
    """Classify a report after the submission response has been sent.

    Runs as a background task so citizens do not wait for the model. The report is
    read and written in separate short sessions: a session held open during the
    (slow) model call would keep SQLite locked for every other request.
    """
    with SessionLocal() as db:
        report = db.get(Report, report_id)
        if report is None:
            return
        description = report.description

    classification = classify_report(description)

    with SessionLocal() as db:
        report = db.get(Report, report_id)
        if report is None:
            return
        _store_classification(report, classification)

        previous_status = report.status
        # A technician may already have opened or validated the report meanwhile.
        if report.status == ReportStatus.RECEIVED:
            report.status = ReportStatus.PENDING_REVIEW

        audit_service.record(
            db,
            action=AuditAction.AI_CLASSIFICATION,
            description=classification_description(classification),
            report_id=report.id,
            previous_status=previous_status,
            new_status=report.status,
            note=classification.error,
        )
        db.commit()


def _store_classification(report: Report, classification: Classification) -> None:
    report.ai_category = classification.category
    report.ai_confidence = classification.confidence
    report.ai_priority = classification.priority
    report.ai_summary = classification.summary
    report.ai_justification = classification.justification
    report.ai_indicators = classification.indicators
    report.ai_model = classification.model
    report.ai_error = classification.error


def classification_description(classification: Classification) -> str:
    if classification.error:
        return "Classificação automática falhou — requer classificação manual"
    return (
        f"{classification.model} sugeriu «{CATEGORY_LABELS[classification.category]}», "
        f"confiança {classification.confidence:.0%}, prioridade {PRIORITY_LABELS[classification.priority]}"
    )


# --- Lookup -----------------------------------------------------------------------------


def get_by_protocol(db: Session, protocol: str) -> Report:
    report = db.query(Report).filter(Report.protocol == protocol.strip().upper()).first()
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Protocolo não encontrado.")
    return report


def get_by_id(db: Session, report_id: str) -> Report:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Denúncia não encontrada.")
    return report


# --- Technician review ------------------------------------------------------------------


def open_for_review(db: Session, report: Report, user: User) -> Report:
    """Mark a report as under review the first time a technician opens it."""
    if report.status not in (ReportStatus.RECEIVED, ReportStatus.PENDING_REVIEW):
        return report
    return _transition(
        db,
        report,
        user,
        ReportStatus.UNDER_REVIEW,
        action=AuditAction.STATUS_CHANGE,
        description=f"{user.name} abriu o processo para revisão",
    )


def validate(
    db: Session, report: Report, user: User, category: Category, priority: Priority, notes: str | None
) -> Report:
    corrected = report.ai_category is not None and category != report.ai_category
    description = (
        f"{user.name} corrigiu a categoria de «{CATEGORY_LABELS[report.ai_category]}» "
        f"para «{CATEGORY_LABELS[category]}» e validou a denúncia"
        if corrected
        else f"{user.name} validou a denúncia como «{CATEGORY_LABELS[category]}»"
    )
    report.validated_category = category
    report.validated_priority = priority
    report.validated_at = utc_now()
    return _transition(
        db, report, user, ReportStatus.VALIDATED, action=AuditAction.VALIDATION, description=description, notes=notes
    )


def route(db: Session, report: Report, user: User, notes: str | None) -> Report:
    report.routed_at = utc_now()
    return _transition(
        db,
        report,
        user,
        ReportStatus.ROUTED,
        action=AuditAction.ROUTING,
        description=f"{user.name} encaminhou a denúncia para tratamento no GCCC",
        notes=notes,
    )


def start_investigation(db: Session, report: Report, user: User, notes: str | None) -> Report:
    return _transition(
        db,
        report,
        user,
        ReportStatus.UNDER_INVESTIGATION,
        action=AuditAction.STATUS_CHANGE,
        description=f"{user.name} iniciou a investigação",
        notes=notes,
    )


def reject(db: Session, report: Report, user: User, notes: str | None) -> Report:
    return _transition(
        db,
        report,
        user,
        ReportStatus.REJECTED,
        action=AuditAction.STATUS_CHANGE,
        description=f"{user.name} rejeitou a denúncia",
        notes=notes,
    )


def archive(db: Session, report: Report, user: User, notes: str | None) -> Report:
    return _transition(
        db,
        report,
        user,
        ReportStatus.ARCHIVED,
        action=AuditAction.STATUS_CHANGE,
        description=f"{user.name} arquivou a denúncia",
        notes=notes,
    )


def update_review(
    db: Session,
    report: Report,
    user: User,
    category: Category | None,
    priority: Priority | None,
    notes: str | None,
) -> Report:
    """Save review fields without changing the status."""
    if report.is_final:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Este processo já está encerrado.")
    if category is not None:
        report.validated_category = category
    if priority is not None:
        report.validated_priority = priority
    if notes is not None:
        report.reviewer_notes = notes.strip() or None

    audit_service.record(
        db,
        action=AuditAction.VALIDATION,
        description=f"{user.name} atualizou a revisão",
        report_id=report.id,
        user_id=user.id,
        note=report.reviewer_notes,
    )
    db.commit()
    db.refresh(report)
    return report


def record_attachment_access(db: Session, report: Report, user: User, filename: str) -> None:
    audit_service.record(
        db,
        action=AuditAction.ACCESS,
        description=f"{user.name} consultou o anexo «{filename}»",
        report_id=report.id,
        user_id=user.id,
    )
    db.commit()


def _transition(
    db: Session,
    report: Report,
    user: User,
    target: ReportStatus,
    *,
    action: AuditAction,
    description: str,
    notes: str | None = None,
) -> Report:
    if target not in ALLOWED_TRANSITIONS[report.status]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta ação não é permitida no estado atual da denúncia.",
        )

    clean_notes = (notes or "").strip() or None
    previous_status = report.status
    report.status = target
    report.assignee_id = user.id
    if clean_notes:
        report.reviewer_notes = clean_notes

    audit_service.record(
        db,
        action=action,
        description=description,
        report_id=report.id,
        user_id=user.id,
        previous_status=previous_status,
        new_status=target,
        note=clean_notes,
    )
    db.commit()
    db.refresh(report)
    return report
