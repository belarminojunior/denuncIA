import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Categoria(str, enum.Enum):
    SUBORNO = "SUBORNO"
    NEPOTISMO = "NEPOTISMO"
    PECULATO = "PECULATO"
    ABUSO_DE_PODER = "ABUSO_DE_PODER"
    TRAFICO_DE_INFLUENCIA = "TRAFICO_DE_INFLUENCIA"
    CONFLITO_DE_INTERESSES = "CONFLITO_DE_INTERESSES"
    FRAUDE = "FRAUDE"
    CORRUPCAO_ELEITORAL = "CORRUPCAO_ELEITORAL"
    OUTROS = "OUTROS"


class Prioridade(str, enum.Enum):
    BAIXA = "BAIXA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    CRITICA = "CRITICA"


class EstadoDenuncia(str, enum.Enum):
    """ENCAMINHADA marca a aceitação formal da denúncia no sistema de gestão do
    GCCC para tratamento (não um reenvio a uma entidade externa)."""

    RECEBIDA = "RECEBIDA"
    PENDENTE_VALIDACAO = "PENDENTE_VALIDACAO"
    EM_ANALISE = "EM_ANALISE"
    VALIDADA = "VALIDADA"
    ENCAMINHADA = "ENCAMINHADA"
    EM_INVESTIGACAO = "EM_INVESTIGACAO"
    ARQUIVADA = "ARQUIVADA"
    REJEITADA = "REJEITADA"


class Denuncia(Base):
    __tablename__ = "denuncias"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    protocolo: Mapped[str] = mapped_column(String(30), unique=True, index=True)

    # Denunciante (opcional, sobretudo se anonima=True)
    nome_denunciante: Mapped[str | None] = mapped_column(String(150), nullable=True)
    email_denunciante: Mapped[str | None] = mapped_column(String(150), nullable=True)
    telefone_denunciante: Mapped[str | None] = mapped_column(String(30), nullable=True)
    anonima: Mapped[bool] = mapped_column(Boolean, default=False)

    tipo_denuncia: Mapped[str | None] = mapped_column(String(50), nullable=True)  # indicado pelo denunciante, opcional
    local_ocorrencia: Mapped[str | None] = mapped_column(String(255), nullable=True)
    data_ocorrencia: Mapped[str | None] = mapped_column(String(20), nullable=True)
    descricao: Mapped[str] = mapped_column(Text)
    envolvidos: Mapped[str | None] = mapped_column(Text, nullable=True)
    valor_envolvido: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Classificação sugerida pelo LLM (apoio à decisão, não vinculativa)
    categoria_llm: Mapped[Categoria | None] = mapped_column(Enum(Categoria), nullable=True)
    confianca_llm: Mapped[float | None] = mapped_column(Float, nullable=True)
    prioridade_llm: Mapped[Prioridade | None] = mapped_column(Enum(Prioridade), nullable=True)
    resumo_llm: Mapped[str | None] = mapped_column(Text, nullable=True)
    justificacao_llm: Mapped[str | None] = mapped_column(Text, nullable=True)
    indicadores_llm: Mapped[list | None] = mapped_column(JSON, nullable=True)
    llm_modelo: Mapped[str | None] = mapped_column(String(50), nullable=True)
    llm_erro: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Validação humana (decisão final, sempre do técnico)
    categoria_validada: Mapped[Categoria | None] = mapped_column(Enum(Categoria), nullable=True)
    prioridade_validada: Mapped[Prioridade | None] = mapped_column(Enum(Prioridade), nullable=True)
    observacoes_tecnico: Mapped[str | None] = mapped_column(Text, nullable=True)

    estado: Mapped[EstadoDenuncia] = mapped_column(Enum(EstadoDenuncia), default=EstadoDenuncia.RECEBIDA)
    tecnico_responsavel_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    forwarded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    tecnico_responsavel = relationship("User", back_populates="denuncias_responsavel")
    attachments = relationship("Attachment", back_populates="denuncia", cascade="all, delete-orphan")
    audit_logs = relationship(
        "AuditLog", back_populates="denuncia", cascade="all, delete-orphan", order_by="AuditLog.created_at"
    )
