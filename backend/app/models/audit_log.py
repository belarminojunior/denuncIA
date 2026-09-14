import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TipoOperacao(str, enum.Enum):
    CRIACAO = "CRIACAO"
    CLASSIFICACAO_LLM = "CLASSIFICACAO_LLM"
    ACESSO = "ACESSO"
    ALTERACAO_ESTADO = "ALTERACAO_ESTADO"
    VALIDACAO = "VALIDACAO"
    ENCAMINHAMENTO = "ENCAMINHAMENTO"
    LOGIN = "LOGIN"


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Identificador público estável (usado externamente); id inteiro serve apenas para ordenação/exibição.
    uid: Mapped[str] = mapped_column(String(36), default=lambda: str(uuid.uuid4()), unique=True)
    # Nula para eventos de conta (ex.: LOGIN) que não pertencem a nenhum processo específico.
    denuncia_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("denuncias.id"), nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    tipo: Mapped[TipoOperacao] = mapped_column(Enum(TipoOperacao), default=TipoOperacao.ALTERACAO_ESTADO)
    acao: Mapped[str] = mapped_column(String(255))
    estado_anterior: Mapped[str | None] = mapped_column(String(50), nullable=True)
    estado_novo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    denuncia = relationship("Denuncia", back_populates="audit_logs")
    user = relationship("User")
