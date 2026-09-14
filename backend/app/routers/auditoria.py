import csv
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.audit_log import AuditLog, TipoOperacao
from app.models.denuncia import Denuncia
from app.models.user import User
from app.schemas.auditoria import AuditoriaItemOut, AuditoriaListOut
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/admin/auditoria", tags=["auditoria"])


def _build_query(db: Session, search: str | None, tipo: TipoOperacao | None, user_id: str | None, dias: int):
    query = db.query(AuditLog).options(joinedload(AuditLog.user), joinedload(AuditLog.denuncia))

    if dias > 0:
        limite = datetime.utcnow() - timedelta(days=dias)
        query = query.filter(AuditLog.created_at >= limite)

    if tipo:
        query = query.filter(AuditLog.tipo == tipo)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    if search:
        termo = f"%{search.lower()}%"
        query = query.outerjoin(Denuncia, AuditLog.denuncia_id == Denuncia.id).filter(
            or_(
                AuditLog.acao.ilike(termo),
                Denuncia.protocolo.ilike(termo),
            )
        )

    return query.order_by(AuditLog.id.desc())


def _to_item(log: AuditLog) -> AuditoriaItemOut:
    return AuditoriaItemOut(
        id=log.id,
        tipo=log.tipo.value,
        acao=log.acao,
        estado_anterior=log.estado_anterior,
        estado_novo=log.estado_novo,
        observacao=log.observacao,
        created_at=log.created_at,
        user_nome=log.user.name if log.user else None,
        denuncia_id=log.denuncia_id,
        protocolo=log.denuncia.protocolo if log.denuncia else None,
    )


@router.get("", response_model=AuditoriaListOut)
def listar_auditoria(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    search: str | None = None,
    tipo: TipoOperacao | None = None,
    user_id: str | None = None,
    dias: int = Query(7, description="0 = todo o período"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=200),
):
    query = _build_query(db, search, tipo, user_id, dias)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return AuditoriaListOut(
        total=total,
        page=page,
        page_size=page_size,
        items=[_to_item(log) for log in items],
    )


@router.get("/export")
def exportar_auditoria(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    search: str | None = None,
    tipo: TipoOperacao | None = None,
    user_id: str | None = None,
    dias: int = Query(7),
):
    query = _build_query(db, search, tipo, user_id, dias).limit(5000)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "data_hora", "tipo", "protocolo", "autor", "acao", "estado_anterior", "estado_novo", "observacao"])
    for log in query.all():
        writer.writerow(
            [
                log.id,
                log.created_at.isoformat(),
                log.tipo.value,
                log.denuncia.protocolo if log.denuncia else "",
                log.user.name if log.user else "sistema",
                log.acao,
                log.estado_anterior or "",
                log.estado_novo or "",
                log.observacao or "",
            ]
        )
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=auditoria_gccc.csv"},
    )
