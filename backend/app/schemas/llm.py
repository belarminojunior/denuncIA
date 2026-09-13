from pydantic import BaseModel, Field, field_validator

from app.models.denuncia import Categoria, Prioridade

CATEGORIAS_VALIDAS = {c.value for c in Categoria}
PRIORIDADES_VALIDAS = {p.value for p in Prioridade}


class LLMClassification(BaseModel):
    """Estrutura normalizada e validada devolvida pelo serviço de LLM.

    Nunca é confiada cegamente: é sempre tratada como sugestão de apoio à
    decisão, sujeita a validação humana pelo técnico do GCCC.
    """

    categoria: str = Categoria.OUTROS.value
    confianca: float = Field(default=0.0, ge=0.0, le=1.0)
    prioridade: str = Prioridade.MEDIA.value
    resumo: str = ""
    justificacao: str = ""
    indicadores: list[str] = Field(default_factory=list)
    modelo: str = ""
    erro: str | None = None

    @field_validator("categoria")
    @classmethod
    def valida_categoria(cls, v: str) -> str:
        v = (v or "").strip().upper().replace(" ", "_")
        return v if v in CATEGORIAS_VALIDAS else Categoria.OUTROS.value

    @field_validator("prioridade")
    @classmethod
    def valida_prioridade(cls, v: str) -> str:
        v = (v or "").strip().upper()
        return v if v in PRIORIDADES_VALIDAS else Prioridade.MEDIA.value

    @field_validator("indicadores")
    @classmethod
    def limita_indicadores(cls, v: list[str]) -> list[str]:
        return [str(i)[:120] for i in (v or [])][:10]
