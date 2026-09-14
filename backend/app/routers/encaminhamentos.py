from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.denuncia import Denuncia, EstadoResposta
from app.models.user import User
from app.schemas.denuncia import (
    EncaminhamentoItemOut,
    EncaminhamentoListOut,
    EncaminhamentoPorEntidadeOut,
    EncaminhamentoStatsOut,
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/admin/encaminhamentos", tags=["encaminhamentos"])


def _base_query(db: Session):
    return db.query(Denuncia).filter(Denuncia.entidade_destinataria.isnot(None))


@router.get("", response_model=EncaminhamentoListOut)
def listar_encaminhamentos(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    estado_resposta: EstadoResposta | None = None,
    entidade: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    query = _base_query(db)
    if estado_resposta:
        query = query.filter(Denuncia.estado_resposta == estado_resposta)
    if entidade:
        query = query.filter(Denuncia.entidade_destinataria == entidade)

    total = query.count()
    items = (
        query.order_by(Denuncia.forwarded_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return EncaminhamentoListOut(
        total=total,
        page=page,
        page_size=page_size,
        items=[EncaminhamentoItemOut.model_validate(d) for d in items],
    )


@router.get("/stats", response_model=EncaminhamentoStatsOut)
def stats_encaminhamentos(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    query = _base_query(db)
    total = query.count()

    limite_30_dias = datetime.utcnow() - timedelta(days=30)
    sem_resposta_30_dias = query.filter(
        Denuncia.estado_resposta == EstadoResposta.AGUARDA,
        Denuncia.forwarded_at < limite_30_dias,
    ).count()

    com_acusacao = query.filter(Denuncia.estado_resposta == EstadoResposta.ACUSACAO).count()

    respondidos = query.filter(
        Denuncia.data_resposta.isnot(None),
        Denuncia.forwarded_at.isnot(None),
    ).all()
    if respondidos:
        prazos = [(d.data_resposta - d.forwarded_at).total_seconds() / 86400 for d in respondidos]
        prazo_medio = round(sum(prazos) / len(prazos), 1)
    else:
        prazo_medio = None

    return EncaminhamentoStatsOut(
        total_encaminhados=total,
        sem_resposta_30_dias=sem_resposta_30_dias,
        com_acusacao=com_acusacao,
        prazo_medio_resposta_dias=prazo_medio,
    )


@router.get("/por-entidade", response_model=list[EncaminhamentoPorEntidadeOut])
def por_entidade(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        _base_query(db)
        .with_entities(Denuncia.entidade_destinataria, func.count(Denuncia.id).label("total"))
        .group_by(Denuncia.entidade_destinataria)
        .order_by(func.count(Denuncia.id).desc())
        .all()
    )
    return [EncaminhamentoPorEntidadeOut(entidade=entidade, total=total) for entidade, total in rows]
