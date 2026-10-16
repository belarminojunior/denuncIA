"""Populate the database with fictitious users, reports and audit history.

Every report, person and entity here is invented for demonstration purposes only
(dashboard, filters, audit trail and review workflow). None refers to real facts.

Usage:
    python scripts/seed_db.py
"""

import sys
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.labels import CATEGORY_LABELS, PRIORITY_LABELS  # noqa: E402
from app.models import AuditAction, AuditLog, Category, Priority, Report, ReportStatus, User, UserRole  # noqa: E402
from app.utils.protocol import PROTOCOL_PREFIX  # noqa: E402
from app.utils.security import hash_password  # noqa: E402
from app.utils.time import utc_now  # noqa: E402
from scripts.init_db import DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD  # noqa: E402

NOW = utc_now()
AI_MODEL = "qwen3:4b-instruct"


@dataclass(frozen=True)
class DemoUser:
    name: str
    email: str
    role: UserRole
    last_login_ago: timedelta
    is_active: bool = True


@dataclass(frozen=True)
class DemoReport:
    days_ago: int
    category: Category
    confidence: float
    priority: Priority
    status: ReportStatus
    location: str
    description: str
    is_anonymous: bool = False
    indicators: list[str] = field(default_factory=lambda: ["indicador demonstrativo 1", "indicador demonstrativo 2"])


DEMO_USERS = [
    DemoUser(DEMO_NAME, DEMO_EMAIL, UserRole.TECHNICIAN, timedelta(hours=2)),
    DemoUser("Coordenação de análise", "coordenacao@gccc.gov.mz", UserRole.COORDINATOR, timedelta(hours=5)),
    DemoUser("Administração de sistema", "admin@gccc.gov.mz", UserRole.ADMIN, timedelta(days=1)),
    DemoUser("Técnico — Sofala", "sofala@gccc.gov.mz", UserRole.TECHNICIAN, timedelta(days=1, hours=6)),
    DemoUser("Técnico — Nampula", "nampula@gccc.gov.mz", UserRole.TECHNICIAN, timedelta(days=3)),
    DemoUser("Gabinete jurídico", "juridico@gccc.gov.mz", UserRole.VIEWER, timedelta(days=4)),
    DemoUser("Técnico — Tete", "tete@gccc.gov.mz", UserRole.TECHNICIAN, timedelta(days=60), is_active=False),
]

DEMO_REPORTS = [
    DemoReport(
        9, Category.BRIBERY, 0.93, Priority.MEDIUM, ReportStatus.ARCHIVED, "Posto de fronteira, Ressano Garcia",
        "Um funcionário aduaneiro terá exigido um pagamento em numerário, fora do recibo oficial, para "
        "liberar mercadoria já com os documentos em ordem.",
    ),
    DemoReport(
        8, Category.ELECTORAL_CORRUPTION, 0.79, Priority.CRITICAL, ReportStatus.ROUTED, "Assembleia distrital, Nampula",
        "Relato de distribuição de bens em troca de promessas de voto durante um encontro de campanha, com "
        "fotografias que mostram a entrega dos bens.",
    ),
    DemoReport(
        6, Category.OTHER, 0.42, Priority.LOW, ReportStatus.PENDING_REVIEW, "Repartição de finanças, Beira",
        "Descrição vaga de um atendimento considerado injusto, sem indicação clara de vantagem pedida ou "
        "oferecida a um funcionário público.",
    ),
    DemoReport(
        5, Category.INFLUENCE_PEDDLING, 0.81, Priority.HIGH, ReportStatus.UNDER_INVESTIGATION,
        "Direção de obras públicas, Maputo",
        "Alegação de que um intermediário próximo de um diretor se ofereceu para garantir a adjudicação de "
        "um contrato de obras mediante uma percentagem do valor.",
    ),
    DemoReport(
        4, Category.CONFLICT_OF_INTEREST, 0.72, Priority.LOW, ReportStatus.VALIDATED,
        "Concurso público, Direção provincial, Inhambane",
        "Um dos membros do júri do concurso é, segundo o denunciante, sócio de uma das empresas concorrentes, "
        "sem que tal tenha sido declarado.",
    ),
    DemoReport(
        3, Category.EMBEZZLEMENT, 0.69, Priority.MEDIUM, ReportStatus.UNDER_REVIEW, "Instituto público, Maputo",
        "Suspeita de desvio de verbas destinadas a material escolar, com base em faturas que não correspondem "
        "às quantidades efetivamente entregues às escolas.",
    ),
    DemoReport(
        35, Category.INFLUENCE_PEDDLING, 0.81, Priority.HIGH, ReportStatus.UNDER_INVESTIGATION,
        "Tribunal judicial, Xai-Xai",
        "Um advogado terá insinuado ter contactos dentro do tribunal capazes de acelerar uma decisão em troca "
        "de um pagamento adicional não faturado.",
    ),
    DemoReport(
        1, Category.NEPOTISM, 0.76, Priority.MEDIUM, ReportStatus.VALIDATED, "Câmara municipal, Quelimane",
        "Contratação de um familiar direto de um vereador para um cargo técnico sem concurso público, "
        "alegadamente sem cumprir os requisitos mínimos do lugar.",
    ),
    DemoReport(
        31, Category.ABUSE_OF_POWER, 0.88, Priority.HIGH, ReportStatus.ROUTED, "Esquadra, Matola",
        "Denúncia de ameaças a um comerciante para forçar o encerramento de um estabelecimento concorrente de "
        "um negócio ligado a um agente da autoridade.",
    ),
    DemoReport(
        0, Category.FRAUD, 0.84, Priority.CRITICAL, ReportStatus.UNDER_REVIEW, "Direção provincial, Sofala",
        "Suspeita de falsificação de assinaturas em contratos de fornecimento de combustível, com valores "
        "faturados muito acima do consumo real registado.",
    ),
    DemoReport(
        0, Category.EMBEZZLEMENT, 0.91, Priority.MEDIUM, ReportStatus.VALIDATED, "Hospital distrital, Chimoio",
        "Relato de desaparecimento recorrente de medicamentos do armazém do hospital, coincidindo com os "
        "turnos de um responsável específico do armazém.",
    ),
    DemoReport(
        2, Category.OTHER, 0.38, Priority.LOW, ReportStatus.REJECTED, "Mercado municipal, Maputo",
        "Queixa sobre o preço cobrado por um vendedor privado, sem envolvimento de qualquer funcionário ou "
        "entidade pública.",
    ),
    DemoReport(
        0, Category.CONFLICT_OF_INTEREST, 0.72, Priority.LOW, ReportStatus.VALIDATED,
        "Direção de recursos humanos, Tete",
        "Um processo de recrutamento interno terá sido conduzido por um responsável cujo cônjuge era um dos "
        "candidatos, sem que se tenha escusado do processo.",
    ),
    DemoReport(
        0, Category.BRIBERY, 0.91, Priority.HIGH, ReportStatus.PENDING_REVIEW, "Direção provincial, Maputo",
        "Pedido de pagamento não previsto para acelerar a emissão de uma licença de actividade. A entrega em "
        "dinheiro foi proposta fora das instalações, sem qualquer recibo. O atendimento ficou suspenso até ao "
        "pagamento.",
        is_anonymous=True,
    ),
]

# Order in which a report moves through the workflow; each demo report replays
# the steps up to its final status (REJECTED is handled separately).
LIFECYCLE = [
    ReportStatus.RECEIVED,
    ReportStatus.PENDING_REVIEW,
    ReportStatus.UNDER_REVIEW,
    ReportStatus.VALIDATED,
    ReportStatus.ROUTED,
    ReportStatus.UNDER_INVESTIGATION,
    ReportStatus.ARCHIVED,
]


def seed_users(db) -> User:
    technician = None
    for spec in DEMO_USERS:
        user = db.query(User).filter(User.email == spec.email).first()
        if user is None:
            user = User(
                name=spec.name,
                email=spec.email,
                password_hash=hash_password(DEMO_PASSWORD),
                role=spec.role,
                is_active=spec.is_active,
                last_login_at=NOW - spec.last_login_ago,
            )
            db.add(user)
            db.flush()
        if spec.email == DEMO_EMAIL:
            technician = user
    return technician


def seed_report(db, index: int, spec: DemoReport, technician: User) -> None:
    created_at = NOW - timedelta(days=spec.days_ago, hours=index)
    reaches = _status_reached(spec.status)

    report = Report(
        protocol=f"{PROTOCOL_PREFIX}-{NOW.year}-{100 + index:06d}",
        is_anonymous=spec.is_anonymous,
        reporter_name=None if spec.is_anonymous else "Denunciante Fictício",
        location=spec.location,
        incident_date=(created_at - timedelta(days=3)).strftime("%Y-%m-%d"),
        description=spec.description,
        ai_category=spec.category,
        ai_confidence=spec.confidence,
        ai_priority=spec.priority,
        ai_summary="Resumo automático gerado para fins de demonstração.",
        ai_justification="Justificação simulada com base nos indicadores identificados no relato.",
        ai_indicators=spec.indicators,
        ai_model=AI_MODEL,
        status=spec.status,
        created_at=created_at,
        updated_at=created_at,
    )
    if reaches(ReportStatus.UNDER_REVIEW):
        report.assignee_id = technician.id
    if reaches(ReportStatus.VALIDATED):
        report.validated_category = spec.category
        report.validated_priority = spec.priority
        report.reviewer_notes = "Classificação confirmada após análise do relato e dos anexos."
        report.validated_at = created_at + timedelta(hours=3)
    if reaches(ReportStatus.ROUTED):
        report.routed_at = created_at + timedelta(hours=4)
    db.add(report)
    db.flush()

    for step in _history(report, spec, technician, created_at):
        db.add(step)


def _status_reached(final_status: ReportStatus):
    if final_status == ReportStatus.REJECTED:
        return lambda status: status in (ReportStatus.RECEIVED, ReportStatus.PENDING_REVIEW, ReportStatus.UNDER_REVIEW)
    final_index = LIFECYCLE.index(final_status)
    return lambda status: status in LIFECYCLE and LIFECYCLE.index(status) <= final_index


@dataclass(frozen=True)
class HistoryStep:
    action: AuditAction
    description: str
    previous_status: ReportStatus | None
    new_status: ReportStatus
    offset: timedelta
    by_technician: bool = True


def _history(report: Report, spec: DemoReport, technician: User, created_at: datetime) -> list[AuditLog]:
    reaches = _status_reached(spec.status)
    name = technician.name
    category = CATEGORY_LABELS[spec.category]

    steps = [
        HistoryStep(
            AuditAction.CREATED,
            "Denúncia submetida de forma anónima" if spec.is_anonymous else "Denúncia submetida",
            None, ReportStatus.RECEIVED, timedelta(0), by_technician=False,
        ),
        HistoryStep(
            AuditAction.AI_CLASSIFICATION,
            f"{AI_MODEL} sugeriu «{category}», confiança {spec.confidence:.0%}, "
            f"prioridade {PRIORITY_LABELS[spec.priority]}",
            ReportStatus.RECEIVED, ReportStatus.PENDING_REVIEW, timedelta(minutes=1), by_technician=False,
        ),
    ]
    if reaches(ReportStatus.UNDER_REVIEW):
        steps.append(HistoryStep(AuditAction.STATUS_CHANGE, f"{name} abriu o processo para revisão",
                                 ReportStatus.PENDING_REVIEW, ReportStatus.UNDER_REVIEW, timedelta(hours=1)))
    if spec.status == ReportStatus.REJECTED:
        steps.append(HistoryStep(AuditAction.STATUS_CHANGE, f"{name} rejeitou a denúncia",
                                 ReportStatus.UNDER_REVIEW, ReportStatus.REJECTED, timedelta(hours=3)))
    if reaches(ReportStatus.VALIDATED):
        steps.append(HistoryStep(AuditAction.VALIDATION, f"{name} validou a denúncia como «{category}»",
                                 ReportStatus.UNDER_REVIEW, ReportStatus.VALIDATED, timedelta(hours=3)))
    if reaches(ReportStatus.ROUTED):
        steps.append(HistoryStep(AuditAction.ROUTING, f"{name} encaminhou a denúncia para tratamento no GCCC",
                                 ReportStatus.VALIDATED, ReportStatus.ROUTED, timedelta(hours=4)))
    if reaches(ReportStatus.UNDER_INVESTIGATION):
        steps.append(HistoryStep(AuditAction.STATUS_CHANGE, f"{name} iniciou a investigação",
                                 ReportStatus.ROUTED, ReportStatus.UNDER_INVESTIGATION, timedelta(hours=5)))
    if reaches(ReportStatus.ARCHIVED):
        steps.append(HistoryStep(AuditAction.STATUS_CHANGE, f"{name} arquivou a denúncia",
                                 ReportStatus.UNDER_INVESTIGATION, ReportStatus.ARCHIVED, timedelta(hours=6)))

    return [
        AuditLog(
            report_id=report.id,
            user_id=technician.id if step.by_technician else None,
            action=step.action,
            description=step.description,
            previous_status=step.previous_status.value if step.previous_status else None,
            new_status=step.new_status.value,
            created_at=created_at + step.offset,
        )
        for step in steps
    ]


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        technician = seed_users(db)
        db.commit()

        if db.query(Report.id).first() is not None:
            print("Já existem denúncias na base de dados — seed de denúncias ignorado.")
            return

        for index, spec in enumerate(DEMO_REPORTS, start=1):
            seed_report(db, index, spec, technician)
        db.commit()

    print(f"{len(DEMO_USERS)} utilizadores e {len(DEMO_REPORTS)} denúncias fictícias criadas com sucesso.")


if __name__ == "__main__":
    main()
