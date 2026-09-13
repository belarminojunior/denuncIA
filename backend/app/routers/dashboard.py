from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.denuncia import Denuncia, EstadoDenuncia, Prioridade
from app.models.user import User
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/admin/dashboard", tags=["dashboard"])

_MESES_PT = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total = db.query(func.count(Denuncia.id)).scalar() or 0

    def count_estado(estado: EstadoDenuncia) -> int:
        return db.query(func.count(Denuncia.id)).filter(Denuncia.estado == estado).scalar() or 0

    return {
        "total": total,
        "pendentes_validacao": count_estado(EstadoDenuncia.PENDENTE_VALIDACAO),
        "em_analise": count_estado(EstadoDenuncia.EM_ANALISE),
        "validadas": count_estado(EstadoDenuncia.VALIDADA),
        "encaminhadas": count_estado(EstadoDenuncia.ENCAMINHADA),
        "em_investigacao": count_estado(EstadoDenuncia.EM_INVESTIGACAO),
        "arquivadas": count_estado(EstadoDenuncia.ARQUIVADA),
        "rejeitadas": count_estado(EstadoDenuncia.REJEITADA),
    }


@router.get("/categories")
def get_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    categoria_efetiva = func.coalesce(Denuncia.categoria_validada, Denuncia.categoria_llm)
    rows = (
        db.query(categoria_efetiva.label("categoria"), func.count(Denuncia.id).label("total"))
        .group_by("categoria")
        .all()
    )
    resultado = [{"categoria": categoria.value if categoria else "OUTROS", "total": total} for categoria, total in rows]
    resultado.sort(key=lambda r: r["total"], reverse=True)
    return resultado


@router.get("/status")
def get_status(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = (
        db.query(Denuncia.estado, func.count(Denuncia.id).label("total"))
        .group_by(Denuncia.estado)
        .all()
    )
    return [{"estado": estado.value, "total": total} for estado, total in rows]


@router.get("/priority")
def get_priority(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    prioridade_efetiva = func.coalesce(Denuncia.prioridade_validada, Denuncia.prioridade_llm)
    rows = (
        db.query(prioridade_efetiva.label("prioridade"), func.count(Denuncia.id).label("total"))
        .group_by("prioridade")
        .all()
    )
    ordem = {p.value: i for i, p in enumerate([Prioridade.CRITICA, Prioridade.ALTA, Prioridade.MEDIA, Prioridade.BAIXA])}
    resultado = [{"prioridade": p.value if p else "MEDIA", "total": total} for p, total in rows]
    resultado.sort(key=lambda r: ordem.get(r["prioridade"], 99))
    return resultado


@router.get("/monthly")
def get_monthly(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    denuncias = db.query(Denuncia.created_at).all()
    contagem: dict[str, int] = {}
    for (created_at,) in denuncias:
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        chave = f"{created_at.year}-{created_at.month:02d}"
        contagem[chave] = contagem.get(chave, 0) + 1

    chaves_ordenadas = sorted(contagem.keys())[-7:]
    return [
        {"mes": _MESES_PT[int(chave.split("-")[1]) - 1], "total": contagem[chave]} for chave in chaves_ordenadas
    ]
