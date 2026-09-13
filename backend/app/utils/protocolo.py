from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.denuncia import Denuncia


def gerar_protocolo(db: Session) -> str:
    ano = datetime.utcnow().year
    prefixo = f"GCCC-{ano}-"

    total_ano = (
        db.query(func.count(Denuncia.id)).filter(Denuncia.protocolo.like(f"{prefixo}%")).scalar() or 0
    )
    sequencial = total_ano + 1

    protocolo = f"{prefixo}{sequencial:06d}"
    # Garante unicidade mesmo em caso de corrida ou registos removidos.
    while db.query(Denuncia).filter(Denuncia.protocolo == protocolo).first() is not None:
        sequencial += 1
        protocolo = f"{prefixo}{sequencial:06d}"
    return protocolo
