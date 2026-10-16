from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile, status
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.dependencies import DbSession
from app.schemas.report import PublicReportStatus, PublicStatusEvent, ReportCreate, ReportSubmitted
from app.services import attachment_service, report_service

router = APIRouter(prefix="/api/reports", tags=["public-reports"])

OptionalField = Annotated[str | None, Form()]


def parse_report_form(
    description: Annotated[str, Form()],
    is_anonymous: Annotated[bool, Form()] = False,
    reporter_name: OptionalField = None,
    reporter_email: OptionalField = None,
    reporter_phone: OptionalField = None,
    reported_category: OptionalField = None,
    location: OptionalField = None,
    incident_date: OptionalField = None,
    involved_parties: OptionalField = None,
    amount_involved: OptionalField = None,
) -> ReportCreate:
    """Build the submission from multipart fields (the request also carries files)."""
    try:
        return ReportCreate(
            description=description,
            is_anonymous=is_anonymous,
            reporter_name=reporter_name,
            reporter_email=reporter_email,
            reporter_phone=reporter_phone,
            reported_category=reported_category,
            location=location,
            incident_date=incident_date,
            involved_parties=involved_parties,
            amount_involved=amount_involved,
        )
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc


@router.post("", response_model=ReportSubmitted, status_code=status.HTTP_201_CREATED)
async def submit_report(
    data: Annotated[ReportCreate, Depends(parse_report_form)],
    db: DbSession,
    background_tasks: BackgroundTasks,
    files: Annotated[list[UploadFile], File()] = [],
):
    uploads = await attachment_service.read_uploads(files)

    report = report_service.create_report(db, data)
    attachment_service.store_attachments(db, report, uploads)
    db.commit()

    # Classification can take a minute on CPU; the citizen gets the protocol immediately.
    background_tasks.add_task(report_service.apply_ai_classification, report.id)
    return ReportSubmitted(protocol=report.protocol, status=report.status, created_at=report.created_at)


@router.get("/{protocol}", response_model=PublicReportStatus)
def get_public_status(protocol: str, db: DbSession):
    report = report_service.get_by_protocol(db, protocol)
    # Only status changes are exposed: no technician names, notes or AI output.
    history = [
        PublicStatusEvent(status=log.new_status, occurred_at=log.created_at)
        for log in report.audit_logs
        if log.changed_status
    ]
    return PublicReportStatus(
        protocol=report.protocol,
        status=report.status,
        created_at=report.created_at,
        updated_at=report.updated_at,
        history=history,
    )
