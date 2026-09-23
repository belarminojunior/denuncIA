"""Regras de negócio do ciclo de vida da denúncia.

Fluxo: RECEBIDA -> PENDENTE_VALIDACAO (após classificação do LLM) -> EM_ANALISE
(quando um técnico abre o processo) -> VALIDADA -> ENCAMINHADA (aceite no
sistema de gestão do GCCC para tratamento) -> EM_INVESTIGACAO (opcional) ->
ARQUIVADA, com possibilidade de REJEITADA a partir de qualquer ponto anterior
ao arquivamento.

O LLM nunca decide o estado final: apenas fornece `categoria_llm`/`prioridade_llm`
como sugestão. A validação humana (`categoria_validada`/`prioridade_validada`) é
sempre um ato explícito do técnico, registado em auditoria.
"""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import TipoOperacao
from app.models.denuncia import Denuncia, EstadoDenuncia
from app.models.user import User
from app.schemas.denuncia import DenunciaCreateData
from app.services import audit_service
from app.services.llm_service import classify_denuncia
from app.utils.protocolo import gerar_protocolo
from app.utils.validators import sanitize_user_text


def criar_denuncia(db: Session, dados: DenunciaCreateData) -> Denuncia:
    protocolo = gerar_protocolo(db)

    denuncia = Denuncia(
        protocolo=protocolo,
        nome_denunciante=None if dados.anonima else dados.nome_denunciante,
        email_denunciante=None if dados.anonima else dados.email_denunciante,
        telefone_denunciante=None if dados.anonima else dados.telefone_denunciante,
        anonima=dados.anonima,
        tipo_denuncia=dados.tipo_denuncia,
        local_ocorrencia=dados.local_ocorrencia,
        data_ocorrencia=dados.data_ocorrencia,
        descricao=sanitize_user_text(dados.descricao),
        envolvidos=dados.envolvidos,
        valor_envolvido=dados.valor_envolvido,
        estado=EstadoDenuncia.RECEBIDA,
    )
    db.add(denuncia)
    db.flush()

    audit_service.log_action(
        db,
        denuncia_id=denuncia.id,
        acao="Denúncia criada" + (" (anónima)" if denuncia.anonima else " pelo denunciante"),
        tipo=TipoOperacao.CRIACAO,
        estado_anterior=None,
        estado_novo=EstadoDenuncia.RECEBIDA.value,
    )

    classificacao = classify_denuncia(denuncia.descricao)
    denuncia.categoria_llm = classificacao.categoria
    denuncia.confianca_llm = classificacao.confianca
    denuncia.prioridade_llm = classificacao.prioridade
    denuncia.resumo_llm = classificacao.resumo
    denuncia.justificacao_llm = classificacao.justificacao
    denuncia.indicadores_llm = classificacao.indicadores
    denuncia.llm_modelo = classificacao.modelo
    denuncia.llm_erro = classificacao.erro

    estado_anterior = denuncia.estado
    denuncia.estado = EstadoDenuncia.PENDENTE_VALIDACAO

    if classificacao.erro:
        acao = f"Classificação automática falhou: {classificacao.erro}"
    else:
        acao = (
            f"{classificacao.modelo} sugeriu {classificacao.categoria}, "
            f"confiança {classificacao.confianca:.0%}, prioridade {classificacao.prioridade}"
        )

    audit_service.log_action(
        db,
        denuncia_id=denuncia.id,
        acao=acao,
        tipo=TipoOperacao.CLASSIFICACAO_LLM,
        estado_anterior=estado_anterior.value,
        estado_novo=denuncia.estado.value,
    )

    db.commit()
    db.refresh(denuncia)
    return denuncia


def obter_por_protocolo(db: Session, protocolo: str) -> Denuncia:
    denuncia = db.query(Denuncia).filter(Denuncia.protocolo == protocolo).first()
    if denuncia is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Protocolo não encontrado.")
    return denuncia


def obter_por_id(db: Session, denuncia_id: str) -> Denuncia:
    denuncia = db.get(Denuncia, denuncia_id)
    if denuncia is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Denúncia não encontrada.")
    return denuncia


def abrir_para_revisao(db: Session, denuncia: Denuncia, tecnico: User) -> Denuncia:
    """Transita PENDENTE_VALIDACAO -> EM_ANALISE quando um técnico abre o processo."""
    if denuncia.estado == EstadoDenuncia.PENDENTE_VALIDACAO:
        estado_anterior = denuncia.estado
        denuncia.estado = EstadoDenuncia.EM_ANALISE
        audit_service.log_action(
            db,
            denuncia_id=denuncia.id,
            acao=f"{tecnico.name} abriu o processo para revisão",
            tipo=TipoOperacao.ALTERACAO_ESTADO,
            user_id=tecnico.id,
            estado_anterior=estado_anterior.value,
            estado_novo=denuncia.estado.value,
        )
        db.commit()
        db.refresh(denuncia)
    return denuncia


def registar_acesso_anexo(db: Session, denuncia: Denuncia, tecnico: User, filename: str) -> None:
    audit_service.log_action(
        db,
        denuncia_id=denuncia.id,
        acao=f"{tecnico.name} consultou o anexo '{filename}'",
        tipo=TipoOperacao.ACESSO,
        user_id=tecnico.id,
    )
    db.commit()


def _aplicar_validacao_parcial(
    denuncia: Denuncia,
    categoria_validada,
    prioridade_validada,
    observacoes_tecnico: str | None,
) -> None:
    if categoria_validada is not None:
        denuncia.categoria_validada = categoria_validada
    if prioridade_validada is not None:
        denuncia.prioridade_validada = prioridade_validada
    if observacoes_tecnico is not None:
        denuncia.observacoes_tecnico = observacoes_tecnico


def validar_denuncia(db: Session, denuncia: Denuncia, tecnico: User, categoria_validada, prioridade_validada, observacoes_tecnico):
    estado_anterior = denuncia.estado
    _aplicar_validacao_parcial(denuncia, categoria_validada, prioridade_validada, observacoes_tecnico)
    denuncia.estado = EstadoDenuncia.VALIDADA
    denuncia.tecnico_responsavel_id = tecnico.id
    denuncia.validated_at = datetime.utcnow()

    categoria_alterada = (
        denuncia.categoria_llm is not None and categoria_validada is not None and categoria_validada.value != denuncia.categoria_llm.value
    )
    acao = f"{tecnico.name} validou a denúncia"
    if categoria_alterada:
        acao = f"{tecnico.name} corrigiu {denuncia.categoria_llm.value} → {categoria_validada.value} e validou a denúncia"

    audit_service.log_action(
        db,
        denuncia_id=denuncia.id,
        acao=acao,
        tipo=TipoOperacao.VALIDACAO,
        user_id=tecnico.id,
        estado_anterior=estado_anterior.value,
        estado_novo=denuncia.estado.value,
        observacao=observacoes_tecnico,
    )
    db.commit()
    db.refresh(denuncia)
    return denuncia


def encaminhar_denuncia(db: Session, denuncia: Denuncia, tecnico: User, observacoes_tecnico: str | None):
    """Aceita formalmente a denúncia validada no sistema de gestão do GCCC.

    Não envolve nenhuma entidade externa — é a transição interna que marca a
    denúncia como assumida para tratamento, depois de validada.
    """
    if denuncia.categoria_validada is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A denúncia tem de ser validada antes de ser encaminhada.",
        )
    estado_anterior = denuncia.estado
    if observacoes_tecnico is not None:
        denuncia.observacoes_tecnico = observacoes_tecnico
    denuncia.estado = EstadoDenuncia.ENCAMINHADA
    denuncia.tecnico_responsavel_id = tecnico.id
    denuncia.forwarded_at = datetime.utcnow()

    audit_service.log_action(
        db,
        denuncia_id=denuncia.id,
        acao=f"{tecnico.name} encaminhou a denúncia para tratamento no GCCC",
        tipo=TipoOperacao.ENCAMINHAMENTO,
        user_id=tecnico.id,
        estado_anterior=estado_anterior.value,
        estado_novo=denuncia.estado.value,
        observacao=observacoes_tecnico,
    )
    db.commit()
    db.refresh(denuncia)
    return denuncia


def investigar_denuncia(db: Session, denuncia: Denuncia, tecnico: User, observacoes_tecnico: str | None):
    """Marca a denúncia encaminhada como estando sob investigação ativa."""
    estado_anterior = denuncia.estado
    denuncia.estado = EstadoDenuncia.EM_INVESTIGACAO
    denuncia.tecnico_responsavel_id = tecnico.id
    if observacoes_tecnico is not None:
        denuncia.observacoes_tecnico = observacoes_tecnico

    audit_service.log_action(
        db,
        denuncia_id=denuncia.id,
        acao=f"{tecnico.name} marcou a denúncia como em investigação",
        tipo=TipoOperacao.ALTERACAO_ESTADO,
        user_id=tecnico.id,
        estado_anterior=estado_anterior.value,
        estado_novo=denuncia.estado.value,
        observacao=observacoes_tecnico,
    )
    db.commit()
    db.refresh(denuncia)
    return denuncia


def rejeitar_denuncia(db: Session, denuncia: Denuncia, tecnico: User, observacoes_tecnico: str | None):
    estado_anterior = denuncia.estado
    denuncia.estado = EstadoDenuncia.REJEITADA
    denuncia.tecnico_responsavel_id = tecnico.id
    if observacoes_tecnico is not None:
        denuncia.observacoes_tecnico = observacoes_tecnico

    audit_service.log_action(
        db,
        denuncia_id=denuncia.id,
        acao=f"{tecnico.name} rejeitou a denúncia",
        tipo=TipoOperacao.ALTERACAO_ESTADO,
        user_id=tecnico.id,
        estado_anterior=estado_anterior.value,
        estado_novo=denuncia.estado.value,
        observacao=observacoes_tecnico,
    )
    db.commit()
    db.refresh(denuncia)
    return denuncia


def arquivar_denuncia(db: Session, denuncia: Denuncia, tecnico: User, observacoes_tecnico: str | None):
    estado_anterior = denuncia.estado
    denuncia.estado = EstadoDenuncia.ARQUIVADA
    denuncia.tecnico_responsavel_id = tecnico.id
    if observacoes_tecnico is not None:
        denuncia.observacoes_tecnico = observacoes_tecnico

    audit_service.log_action(
        db,
        denuncia_id=denuncia.id,
        acao=f"{tecnico.name} arquivou a denúncia",
        tipo=TipoOperacao.ALTERACAO_ESTADO,
        user_id=tecnico.id,
        estado_anterior=estado_anterior.value,
        estado_novo=denuncia.estado.value,
        observacao=observacoes_tecnico,
    )
    db.commit()
    db.refresh(denuncia)
    return denuncia


def atualizar_denuncia(db: Session, denuncia: Denuncia, tecnico: User, categoria_validada, prioridade_validada, observacoes_tecnico):
    estado_anterior = denuncia.estado
    _aplicar_validacao_parcial(denuncia, categoria_validada, prioridade_validada, observacoes_tecnico)

    audit_service.log_action(
        db,
        denuncia_id=denuncia.id,
        acao=f"{tecnico.name} atualizou observações/classificação",
        tipo=TipoOperacao.VALIDACAO,
        user_id=tecnico.id,
        estado_anterior=estado_anterior.value,
        estado_novo=denuncia.estado.value,
        observacao=observacoes_tecnico,
    )
    db.commit()
    db.refresh(denuncia)
    return denuncia
