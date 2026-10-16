import uuid
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Attachment, Report
from app.utils.validators import sanitize_filename, validate_upload

settings = get_settings()

DEFAULT_MIME_TYPE = "application/octet-stream"


@dataclass(frozen=True)
class PendingUpload:
    filename: str
    mime_type: str
    content: bytes


async def read_uploads(uploads: list[UploadFile]) -> list[PendingUpload]:
    """Read and validate every upload before the report is created.

    Validating first means a bad file rejects the whole submission instead of
    leaving a report saved without the evidence the citizen meant to send.
    """
    selected = [upload for upload in uploads if upload.filename]
    if len(selected) > settings.max_files_per_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Máximo de {settings.max_files_per_report} ficheiros por denúncia.",
        )

    pending: list[PendingUpload] = []
    for upload in selected:
        content = await upload.read()
        validate_upload(upload, len(content))
        pending.append(
            PendingUpload(
                filename=sanitize_filename(upload.filename or ""),
                mime_type=upload.content_type or DEFAULT_MIME_TYPE,
                content=content,
            )
        )
    return pending


def store_attachments(db: Session, report: Report, uploads: list[PendingUpload]) -> None:
    if not uploads:
        return

    report_dir = Path(settings.upload_dir) / report.id
    report_dir.mkdir(parents=True, exist_ok=True)
    for upload in uploads:
        # The random prefix prevents collisions between files with the same name.
        storage_path = report_dir / f"{uuid.uuid4()}_{upload.filename}"
        storage_path.write_bytes(upload.content)
        db.add(
            Attachment(
                report_id=report.id,
                filename=upload.filename,
                storage_path=str(storage_path),
                mime_type=upload.mime_type,
                size_bytes=len(upload.content),
            )
        )
