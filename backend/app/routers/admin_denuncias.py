import os

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attachment import Attachment
from app.models.denuncia import Categoria, Denuncia, EstadoDenuncia, Prioridade
from app.models.user import User
from app.schemas.denuncia import (
    AcaoDenunciaRequest,
    AtualizarDenunciaRequest,
    AttachmentOut,
    AuditLogOut,
    DenunciaDetailOut,
    DenunciaListItemOut,
    DenunciaListOut,
    ValidarDenunciaRequest,
)
from app.services import denuncia_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/admin/denuncias", tags=["admin-denuncias"])


def _to_detail_out(denuncia: Denuncia) -> DenunciaDetailOut:
    return DenunciaDetailOut(
        id=denuncia.id,
        protocolo=denuncia.protocolo,
        nome_denunciante=denuncia.nome_denunciante,
        email_denunciante=denuncia.email_denunciante,
        telefone_denunciante=denuncia.telefone_denunciante,
        anonima=denuncia.anonima,
        tipo_denuncia=denuncia.tipo_denuncia,
        local_ocorrencia=denuncia.local_ocorrencia,
        data_ocorrencia=denuncia.data_ocorrencia,
        descricao=denuncia.descricao,
        envolvidos=denuncia.envolvidos,
        valor_envolvido=denuncia.valor_envolvido,
        categoria_llm=denuncia.categoria_llm,
        confianca_llm=denuncia.confianca_llm,
        prioridade_llm=denuncia.prioridade_llm,
        resumo_llm=denuncia.resumo_llm,
        justificacao_llm=denuncia.justificacao_llm,
        indicadores_llm=denuncia.indicadores_llm,
        llm_modelo=denuncia.llm_modelo,
        llm_erro=denuncia.llm_erro,
        categoria_validada=denuncia.categoria_validada,
        prioridade_validada=denuncia.prioridade_validada,
        observacoes_tecnico=denuncia.observacoes_tecnico,
        estado=denuncia.estado,
        tecnico_responsavel_nome=denuncia.tecnico_responsavel.name if denuncia.tecnico_responsavel else None,
        created_at=denuncia.created_at,
        updated_at=denuncia.updated_at,
        validated_at=denuncia.validated_at,
        forwarded_at=denuncia.forwarded_at,
        attachments=[AttachmentOut.model_validate(a) for a in denuncia.attachments],
        audit_logs=[
            AuditLogOut(
                id=log.id,
                tipo=log.tipo.value,
                acao=log.acao,
                estado_anterior=log.estado_anterior,
                estado_novo=log.estado_novo,
                observacao=log.observacao,
                created_at=log.created_at,
                user_nome=log.user.name if log.user else None,
            )
            for log in denuncia.audit_logs
        ],
    )


@router.get("", response_model=DenunciaListOut)
def listar_denuncias(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    search: str | None = None,
    categoria: Categoria | None = None,
    estado: EstadoDenuncia | None = None,
    prioridade: Prioridade | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    query = db.query(Denuncia)

    if search:
        termo = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Denuncia.protocolo.ilike(termo),
                Denuncia.local_ocorrencia.ilike(termo),
                Denuncia.descricao.ilike(termo),
            )
        )

    if categoria:
        query = query.filter(
            or_(Denuncia.categoria_validada == categoria, Denuncia.categoria_llm == categoria)
        )

    if estado:
        query = query.filter(Denuncia.estado == estado)

    if prioridade:
        query = query.filter(
            or_(Denuncia.prioridade_validada == prioridade, Denuncia.prioridade_llm == prioridade)
        )

    total = query.count()
    items = (
        query.order_by(Denuncia.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return DenunciaListOut(
        total=total,
        page=page,
        page_size=page_size,
        items=[DenunciaListItemOut.model_validate(d) for d in items],
    )


@router.get("/{denuncia_id}", response_model=DenunciaDetailOut)
def obter_denuncia(denuncia_id: str, db: Session = Depends(get_db), tecnico: User = Depends(get_current_user)):
    denuncia = denuncia_service.obter_por_id(db, denuncia_id)
    denuncia = denuncia_service.abrir_para_revisao(db, denuncia, tecnico)
    return _to_detail_out(denuncia)


@router.put("/{denuncia_id}", response_model=DenunciaDetailOut)
def atualizar_denuncia(
    denuncia_id: str,
    payload: AtualizarDenunciaRequest,
    db: Session = Depends(get_db),
    tecnico: User = Depends(get_current_user),
):
    denuncia = denuncia_service.obter_por_id(db, denuncia_id)
    denuncia = denuncia_service.atualizar_denuncia(
        db, denuncia, tecnico, payload.categoria_validada, payload.prioridade_validada, payload.observacoes_tecnico
    )
    return _to_detail_out(denuncia)


@router.post("/{denuncia_id}/validar", response_model=DenunciaDetailOut)
def validar_denuncia(
    denuncia_id: str,
    payload: ValidarDenunciaRequest,
    db: Session = Depends(get_db),
    tecnico: User = Depends(get_current_user),
):
    denuncia = denuncia_service.obter_por_id(db, denuncia_id)
    denuncia = denuncia_service.validar_denuncia(
        db, denuncia, tecnico, payload.categoria_validada, payload.prioridade_validada, payload.observacoes_tecnico
    )
    return _to_detail_out(denuncia)


@router.post("/{denuncia_id}/encaminhar", response_model=DenunciaDetailOut)
def encaminhar_denuncia(
    denuncia_id: str,
    payload: AcaoDenunciaRequest,
    db: Session = Depends(get_db),
    tecnico: User = Depends(get_current_user),
):
    denuncia = denuncia_service.obter_por_id(db, denuncia_id)
    denuncia = denuncia_service.encaminhar_denuncia(db, denuncia, tecnico, payload.observacoes_tecnico)
    return _to_detail_out(denuncia)


@router.post("/{denuncia_id}/investigar", response_model=DenunciaDetailOut)
def investigar_denuncia(
    denuncia_id: str,
    payload: AcaoDenunciaRequest,
    db: Session = Depends(get_db),
    tecnico: User = Depends(get_current_user),
):
    denuncia = denuncia_service.obter_por_id(db, denuncia_id)
    denuncia = denuncia_service.investigar_denuncia(db, denuncia, tecnico, payload.observacoes_tecnico)
    return _to_detail_out(denuncia)


@router.post("/{denuncia_id}/rejeitar", response_model=DenunciaDetailOut)
def rejeitar_denuncia(
    denuncia_id: str,
    payload: AcaoDenunciaRequest,
    db: Session = Depends(get_db),
    tecnico: User = Depends(get_current_user),
):
    denuncia = denuncia_service.obter_por_id(db, denuncia_id)
    denuncia = denuncia_service.rejeitar_denuncia(db, denuncia, tecnico, payload.observacoes_tecnico)
    return _to_detail_out(denuncia)


@router.post("/{denuncia_id}/arquivar", response_model=DenunciaDetailOut)
def arquivar_denuncia(
    denuncia_id: str,
    payload: AcaoDenunciaRequest,
    db: Session = Depends(get_db),
    tecnico: User = Depends(get_current_user),
):
    denuncia = denuncia_service.obter_por_id(db, denuncia_id)
    denuncia = denuncia_service.arquivar_denuncia(db, denuncia, tecnico, payload.observacoes_tecnico)
    return _to_detail_out(denuncia)


@router.get("/{denuncia_id}/anexos/{attachment_id}")
def download_anexo(
    denuncia_id: str,
    attachment_id: str,
    db: Session = Depends(get_db),
    tecnico: User = Depends(get_current_user),
):
    attachment = (
        db.query(Attachment)
        .filter(Attachment.id == attachment_id, Attachment.denuncia_id == denuncia_id)
        .first()
    )
    if attachment is None or not os.path.isfile(attachment.filepath):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anexo não encontrado.")
    denuncia = denuncia_service.obter_por_id(db, denuncia_id)
    denuncia_service.registar_acesso_anexo(db, denuncia, tecnico, attachment.filename)
    return FileResponse(attachment.filepath, media_type=attachment.mimetype, filename=attachment.filename)
