from datetime import datetime

from pydantic import BaseModel


class AuditoriaItemOut(BaseModel):
    id: int
    tipo: str
    acao: str
    estado_anterior: str | None
    estado_novo: str | None
    observacao: str | None
    created_at: datetime
    user_nome: str | None = None
    denuncia_id: str | None = None
    protocolo: str | None = None

    model_config = {"from_attributes": True}


class AuditoriaListOut(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AuditoriaItemOut]
