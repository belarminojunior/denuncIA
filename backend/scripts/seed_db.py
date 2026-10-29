"""Populate the database with the fictitious users, reports and history in demo_data.py.

Each report replays the real workflow (submission, AI classification, review,
validation, routing, investigation, closing), so statuses, timestamps and the
audit trail stay consistent with what the application itself would record.

Usage (from the backend folder):
    python -m scripts.seed_db            # only seeds an empty database
    python -m scripts.seed_db --reset    # deletes every report and audit entry first
"""

import argparse
import struct
import uuid
import zlib
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.labels import CATEGORY_LABELS
from app.models import Attachment, AuditAction, AuditLog, Category, Report, ReportStatus, User
from app.schemas.classification import Classification
from app.services.report_service import classification_description
from app.utils.protocol import PROTOCOL_PREFIX
from app.utils.security import hash_password
from app.utils.time import utc_now
from scripts.demo_data import DEMO_REPORTS, DEMO_USERS, DemoReport
from scripts.init_db import DEMO_PASSWORD

NOW = utc_now()
AI_MODEL = "qwen3:4b-instruct"
LOGIN_HISTORY_DAYS = 60

MAIN_PATH = [
    ReportStatus.RECEIVED,
    ReportStatus.PENDING_REVIEW,
    ReportStatus.UNDER_REVIEW,
    ReportStatus.VALIDATED,
    ReportStatus.ROUTED,
    ReportStatus.UNDER_INVESTIGATION,
]
DEFAULT_CLOSED_FROM = {
    ReportStatus.ARCHIVED: ReportStatus.UNDER_INVESTIGATION,
    ReportStatus.REJECTED: ReportStatus.UNDER_REVIEW,
}

# When each step happens, as a fraction of the report's age. Scaling by age keeps
# every event in the past while older reports show longer, realistic processes.
STEP_TIMING = {
    ReportStatus.UNDER_REVIEW: 0.10,
    ReportStatus.VALIDATED: 0.13,
    ReportStatus.ROUTED: 0.18,
    ReportStatus.UNDER_INVESTIGATION: 0.28,
}
CLOSING_TIMING = {ReportStatus.REJECTED: 0.14, ReportStatus.ARCHIVED: 0.85}
AI_DELAY = timedelta(seconds=75)
ATTACHMENT_REVIEW_DELAY = timedelta(minutes=12)

MIME_TYPES = {".pdf": "application/pdf", ".png": "image/png"}


# --- Reset -------------------------------------------------------------------------------


def reset_reports(db: Session) -> int:
    """Delete every report with its attachments (rows and files) and the whole audit log."""
    for attachment in db.query(Attachment).all():
        Path(attachment.storage_path).unlink(missing_ok=True)
        _remove_if_empty(Path(attachment.storage_path).parent)
    db.query(AuditLog).delete()
    db.query(Attachment).delete()
    deleted = db.query(Report).delete()
    db.commit()
    return deleted


def _remove_if_empty(folder: Path) -> None:
    if folder.is_dir() and not any(folder.iterdir()):
        folder.rmdir()


# --- Users ---------------------------------------------------------------------------------


def seed_users(db: Session) -> dict[str, User]:
    users: dict[str, User] = {}
    for spec in DEMO_USERS:
        user = db.query(User).filter(User.email == spec.email).first()
        if user is None:
            user = User(name=spec.name, email=spec.email, password_hash=hash_password(DEMO_PASSWORD), role=spec.role)
            db.add(user)
        user.is_active = spec.is_active
        user.last_login_at = NOW - spec.last_login_ago
        users[spec.email] = user
    db.flush()
    return users


def seed_logins(db: Session, users: dict[str, User]) -> None:
    """Login entries for the audit log; less active profiles log in less often."""
    for interval_days, spec in enumerate(DEMO_USERS, start=1):
        user = users[spec.email]
        moment = NOW - spec.last_login_ago
        while moment > NOW - timedelta(days=LOGIN_HISTORY_DAYS):
            db.add(AuditLog(user_id=user.id, action=AuditAction.LOGIN, description=f"{user.name} iniciou sessão",
                            created_at=moment))
            moment -= timedelta(days=interval_days, hours=interval_days % 3)


# --- Reports -------------------------------------------------------------------------------


@dataclass(frozen=True)
class Event:
    at: datetime
    action: AuditAction
    description: str
    previous_status: ReportStatus | None
    new_status: ReportStatus | None
    actor: User | None = None
    note: str | None = None


def created_at_for(index: int, spec: DemoReport) -> datetime:
    created = NOW - timedelta(days=spec.days_ago)
    # Spread older reports across the working day instead of all at the same minute.
    return created - timedelta(hours=index % 9, minutes=(index * 17) % 60) if spec.days_ago >= 1 else created


def status_path(spec: DemoReport) -> list[ReportStatus]:
    if spec.status in DEFAULT_CLOSED_FROM:
        closed_from = spec.closed_from or DEFAULT_CLOSED_FROM[spec.status]
        return MAIN_PATH[: MAIN_PATH.index(closed_from) + 1] + [spec.status]
    return MAIN_PATH[: MAIN_PATH.index(spec.status) + 1]


def seed_reports(db: Session, users: dict[str, User]) -> None:
    ordered = sorted(enumerate(DEMO_REPORTS), key=lambda item: created_at_for(*item))
    protocols: dict[str, str] = {}
    sequence_by_year: dict[int, int] = {}

    for index, spec in ordered:
        created_at = created_at_for(index, spec)
        sequence_by_year[created_at.year] = sequence_by_year.get(created_at.year, 0) + 1
        protocol = f"{PROTOCOL_PREFIX}-{created_at.year}-{sequence_by_year[created_at.year]:06d}"
        protocols[spec.key] = protocol
        seed_report(db, spec, protocol, created_at, users[spec.assignee], protocols)


def seed_report(
    db: Session, spec: DemoReport, protocol: str, created_at: datetime, assignee: User, protocols: dict[str, str]
) -> None:
    reporter = spec.reporter
    report = Report(
        protocol=protocol,
        is_anonymous=reporter is None,
        reporter_name=reporter.name if reporter else None,
        reporter_email=reporter.email if reporter else None,
        reporter_phone=reporter.phone if reporter else None,
        reported_category=spec.reported_category,
        location=spec.location,
        incident_date=_incident_date(spec, created_at),
        description=spec.description,
        involved_parties=spec.involved_parties,
        amount_involved=spec.amount_involved,
        status=spec.status,
        created_at=created_at,
    )
    db.add(report)
    db.flush()

    events = build_events(report, spec, created_at, assignee, protocols)
    _apply_outcome(report, spec, assignee, events)
    for filename in spec.attachments:
        _store_attachment(db, report, filename, created_at)
    for event in events:
        db.add(AuditLog(
            report_id=report.id,
            user_id=event.actor.id if event.actor else None,
            action=event.action,
            description=event.description,
            previous_status=event.previous_status.value if event.previous_status else None,
            new_status=event.new_status.value if event.new_status else None,
            note=event.note,
            created_at=event.at,
        ))


def build_events(
    report: Report, spec: DemoReport, created_at: datetime, assignee: User, protocols: dict[str, str]
) -> list[Event]:
    age = NOW - created_at
    name = assignee.name
    events = [Event(created_at, AuditAction.CREATED,
                    "Denúncia submetida de forma anónima" if report.is_anonymous else "Denúncia submetida",
                    None, ReportStatus.RECEIVED)]
    path = status_path(spec)

    for previous, status in zip(path, path[1:]):
        if status == ReportStatus.PENDING_REVIEW:
            classification = _classification(spec)
            events.append(Event(created_at + AI_DELAY, AuditAction.AI_CLASSIFICATION,
                                classification_description(classification), previous, status,
                                note=classification.error))
        elif status == ReportStatus.UNDER_REVIEW:
            opened_at = created_at + max(age * STEP_TIMING[status], timedelta(minutes=20))
            events.append(Event(opened_at, AuditAction.STATUS_CHANGE, f"{name} abriu o processo para revisão",
                                previous, status, assignee))
            events += [Event(opened_at + ATTACHMENT_REVIEW_DELAY, AuditAction.ACCESS,
                             f"{name} consultou o anexo «{filename}»", None, None, assignee)
                       for filename in spec.attachments]
        elif status == ReportStatus.VALIDATED:
            events.append(Event(created_at + age * STEP_TIMING[status], AuditAction.VALIDATION,
                                _validation_description(spec, name), previous, status, assignee,
                                spec.review_notes or "Classificação confirmada após análise do relato."))
        elif status == ReportStatus.ROUTED:
            events.append(Event(created_at + age * STEP_TIMING[status], AuditAction.ROUTING,
                                f"{name} encaminhou a denúncia para tratamento no GCCC", previous, status, assignee))
        elif status == ReportStatus.UNDER_INVESTIGATION:
            events.append(Event(created_at + age * STEP_TIMING[status], AuditAction.STATUS_CHANGE,
                                f"{name} iniciou a investigação", previous, status, assignee))
        else:
            verb = "rejeitou" if status == ReportStatus.REJECTED else "arquivou"
            timing = 0.5 if previous == ReportStatus.VALIDATED else CLOSING_TIMING[status]
            events.append(Event(created_at + age * timing, AuditAction.STATUS_CHANGE, f"{name} {verb} a denúncia",
                                previous, status, assignee, _closing_note(spec, protocols)))
    return events


def _classification(spec: DemoReport) -> Classification:
    if spec.ai is None:
        return Classification(model=AI_MODEL, error=spec.ai_error)
    ai = spec.ai
    return Classification(category=ai.category, confidence=ai.confidence, priority=ai.priority, summary=ai.summary,
                          justification=_justification(ai.category, ai.indicators), indicators=list(ai.indicators),
                          model=AI_MODEL)


def _justification(category: Category, indicators: tuple[str, ...]) -> str:
    if category == Category.OTHER:
        return "O relato não descreve um funcionário ou entidade pública a obter uma vantagem indevida."
    return (f"O relato refere {', '.join(f'«{item}»' for item in indicators)}, "
            f"elementos característicos de {CATEGORY_LABELS[category].lower()}.")


def _validation_description(spec: DemoReport, name: str) -> str:
    validated = CATEGORY_LABELS[spec.expected_category]
    if spec.ai and spec.ai.category != spec.expected_category:
        return f"{name} corrigiu a categoria de «{CATEGORY_LABELS[spec.ai.category]}» para «{validated}» e validou a denúncia"
    return f"{name} validou a denúncia como «{validated}»"


def _closing_note(spec: DemoReport, protocols: dict[str, str]) -> str | None:
    if spec.duplicate_of:
        return f"Denúncia duplicada de {protocols[spec.duplicate_of]}: os mesmos factos já estão a ser tratados nesse processo."
    return spec.closing_note


def _apply_outcome(report: Report, spec: DemoReport, assignee: User, events: list[Event]) -> None:
    """Set the report fields the replayed events would have left behind."""
    if any(event.action == AuditAction.AI_CLASSIFICATION for event in events):
        classification = _classification(spec)
        report.ai_category = classification.category
        report.ai_confidence = classification.confidence
        report.ai_priority = classification.priority
        report.ai_summary = classification.summary
        report.ai_justification = classification.justification
        report.ai_indicators = classification.indicators
        report.ai_model = classification.model
        report.ai_error = classification.error

    reached = {event.new_status: event.at for event in events if event.new_status}
    if ReportStatus.UNDER_REVIEW in reached:
        report.assignee_id = assignee.id
    if ReportStatus.VALIDATED in reached:
        report.validated_category = spec.expected_category
        report.validated_priority = spec.expected_priority
        report.validated_at = reached[ReportStatus.VALIDATED]
    if ReportStatus.ROUTED in reached:
        report.routed_at = reached[ReportStatus.ROUTED]

    notes = [event.note for event in events if event.note and event.action != AuditAction.AI_CLASSIFICATION]
    report.reviewer_notes = notes[-1] if notes else None
    report.updated_at = max(event.at for event in events)


def _incident_date(spec: DemoReport, created_at: datetime) -> str | None:
    if spec.incident_days_before is None:
        return None
    return (created_at - timedelta(days=spec.incident_days_before)).strftime("%Y-%m-%d")


# --- Attachments ---------------------------------------------------------------------------


def _store_attachment(db: Session, report: Report, filename: str, created_at: datetime) -> None:
    extension = Path(filename).suffix.lower()
    content = _demo_pdf(filename) if extension == ".pdf" else _demo_png(filename)
    folder = Path(get_settings().upload_dir) / report.id
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{uuid.uuid4()}_{filename}"
    path.write_bytes(content)
    db.add(Attachment(report_id=report.id, filename=filename, storage_path=str(path), mime_type=MIME_TYPES[extension],
                      size_bytes=len(content), created_at=created_at))


def _demo_pdf(title: str) -> bytes:
    """A minimal one-page PDF, so attachment downloads can be tested without real documents."""
    text = f"BT /F1 16 Tf 72 760 Td ({title}) Tj 0 -28 Td /F1 11 Tf (Documento ficticio gerado para testes da plataforma denuncIA.) Tj ET"
    objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R "
        "/Resources << /Font << /F1 5 0 R >> >> >>",
        f"<< /Length {len(text)} >>\nstream\n{text}\nendstream",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    output = b"%PDF-1.4\n"
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(output))
        output += f"{number} 0 obj\n{body}\nendobj\n".encode("latin-1")
    xref_at = len(output)
    output += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    output += "".join(f"{offset:010d} 00000 n \n" for offset in offsets).encode()
    output += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF\n".encode()
    return output


def _demo_png(seed: str, width: int = 320, height: int = 200) -> bytes:
    """A small gradient image standing in for a photograph."""
    base = zlib.crc32(seed.encode())
    red, green, blue = base & 0xFF, (base >> 8) & 0xFF, (base >> 16) & 0xFF
    rows = b"".join(
        b"\x00" + bytes(
            channel
            for x in range(width)
            for channel in ((red + x) % 256, (green + y) % 256, (blue + x + y) % 256)
        )
        for y in range(height)
    )

    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(rows)) + chunk(b"IEND", b"")


# --- Entry point ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Popula a base de dados com dados fictícios.")
    parser.add_argument("--reset", action="store_true", help="apaga todas as denúncias e o registo de auditoria antes")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if args.reset:
            print(f"{reset_reports(db)} denúncias removidas.")
        elif db.query(Report.id).first() is not None:
            print("Já existem denúncias na base de dados — use --reset para as substituir.")
            return

        users = seed_users(db)
        seed_logins(db, users)
        seed_reports(db, users)
        db.commit()

    print(f"{len(DEMO_USERS)} utilizadores e {len(DEMO_REPORTS)} denúncias fictícias criadas com sucesso.")


if __name__ == "__main__":
    main()
