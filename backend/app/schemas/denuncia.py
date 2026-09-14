from datetime import datetime

from pydantic import BaseModel, field_validator

from app.models.denuncia import Categoria, EstadoDenuncia, EstadoResposta, Prioridade


class DenunciaCreateData(BaseModel):
    """Dados do formulário público de denúncia, validados antes de persistir."""

    nome_denunciante: str | None = None
    email_denunciante: str | None = None
    telefone_denunciante: str | None = None
    anonima: bool = False
    tipo_denuncia: str | None = None
    local_ocorrencia: str | None = None
    data_ocorrencia: str | None = None
    descricao: str
    envolvidos: str | None = None
    valor_envolvido: str | None = None

    @field_validator("descricao")
    @classmethod
    def descricao_minima(cls, v: str) -> str:
        v = (v or "").strip()
        if len(v) < 20:
            raise ValueError("A descrição deve ter pelo menos 20 caracteres.")
        if len(v) > 5000:
            raise ValueError("A descrição não pode exceder 5000 caracteres.")
        return v

    @field_validator("nome_denunciante", "email_denunciante", "telefone_denunciante", "local_ocorrencia")
    @classmethod
    def strip_optional(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        return v or None


class AttachmentOut(BaseModel):
    id: str
    filename: str
    mimetype: str
    size: int

    model_config = {"from_attributes": True}


class AuditLogOut(BaseModel):
    id: int
    tipo: str
    acao: str
    estado_anterior: str | None
    estado_novo: str | None
    observacao: str | None
    created_at: datetime
    user_nome: str | None = None

    model_config = {"from_attributes": True}


class ProtocoloStatusOut(BaseModel):
    """Vista pública e limitada do estado da denúncia (sem dados internos)."""

    protocolo: str
    estado: EstadoDenuncia
    created_at: datetime
    updated_at: datetime
    historico: list[AuditLogOut]


class DenunciaSubmetidaOut(BaseModel):
    protocolo: str
    estado: EstadoDenuncia
    created_at: datetime


class DenunciaListItemOut(BaseModel):
    id: str
    protocolo: str
    created_at: datetime
    updated_at: datetime
    categoria_llm: Categoria | None
    categoria_validada: Categoria | None
    confianca_llm: float | None
    prioridade_llm: Prioridade | None
    prioridade_validada: Prioridade | None
    estado: EstadoDenuncia
    local_ocorrencia: str | None
    entidade_destinataria: str | None = None
    estado_resposta: EstadoResposta | None = None

    model_config = {"from_attributes": True}


class DenunciaListOut(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[DenunciaListItemOut]


class DenunciaDetailOut(BaseModel):
    id: str
    protocolo: str
    nome_denunciante: str | None
    email_denunciante: str | None
    telefone_denunciante: str | None
    anonima: bool
    tipo_denuncia: str | None
    local_ocorrencia: str | None
    data_ocorrencia: str | None
    descricao: str
    envolvidos: str | None
    valor_envolvido: str | None

    categoria_llm: Categoria | None
    confianca_llm: float | None
    prioridade_llm: Prioridade | None
    resumo_llm: str | None
    justificacao_llm: str | None
    indicadores_llm: list[str] | None
    llm_modelo: str | None
    llm_erro: str | None

    categoria_validada: Categoria | None
    prioridade_validada: Prioridade | None
    observacoes_tecnico: str | None

    estado: EstadoDenuncia
    tecnico_responsavel_nome: str | None = None

    entidade_destinataria: str | None = None
    numero_oficio: str | None = None
    estado_resposta: EstadoResposta | None = None
    data_resposta: datetime | None = None

    created_at: datetime
    updated_at: datetime
    validated_at: datetime | None
    forwarded_at: datetime | None

    attachments: list[AttachmentOut]
    audit_logs: list[AuditLogOut]

    model_config = {"from_attributes": True}


class ValidarDenunciaRequest(BaseModel):
    categoria_validada: Categoria
    prioridade_validada: Prioridade
    observacoes_tecnico: str | None = None


class AcaoDenunciaRequest(BaseModel):
    observacoes_tecnico: str | None = None


class EncaminharDenunciaRequest(BaseModel):
    entidade_destinataria: str
    numero_oficio: str
    observacoes_tecnico: str | None = None

    @field_validator("entidade_destinataria", "numero_oficio")
    @classmethod
    def campo_obrigatorio(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Campo obrigatório para encaminhar a denúncia.")
        return v


class RespostaEncaminhamentoRequest(BaseModel):
    estado_resposta: EstadoResposta
    observacoes_tecnico: str | None = None


class AtualizarDenunciaRequest(BaseModel):
    categoria_validada: Categoria | None = None
    prioridade_validada: Prioridade | None = None
    observacoes_tecnico: str | None = None


class EncaminhamentoItemOut(BaseModel):
    id: str
    protocolo: str
    entidade_destinataria: str
    numero_oficio: str | None
    forwarded_at: datetime
    estado: EstadoDenuncia
    estado_resposta: EstadoResposta
    data_resposta: datetime | None

    model_config = {"from_attributes": True}


class EncaminhamentoListOut(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[EncaminhamentoItemOut]


class EncaminhamentoStatsOut(BaseModel):
    total_encaminhados: int
    sem_resposta_30_dias: int
    com_acusacao: int
    prazo_medio_resposta_dias: float | None


class EncaminhamentoPorEntidadeOut(BaseModel):
    entidade: str
    total: int
