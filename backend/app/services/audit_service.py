from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog, TipoOperacao


def log_action(
    db: Session,
    *,
    acao: str,
    tipo: TipoOperacao,
    denuncia_id: str | None = None,
    user_id: str | None = None,
    estado_anterior: str | None = None,
    estado_novo: str | None = None,
    observacao: str | None = None,
) -> AuditLog:
    entry = AuditLog(
        denuncia_id=denuncia_id,
        user_id=user_id,
        tipo=tipo,
        acao=acao,
        estado_anterior=estado_anterior,
        estado_novo=estado_novo,
        observacao=observacao,
    )
    db.add(entry)
    db.flush()
    return entry
