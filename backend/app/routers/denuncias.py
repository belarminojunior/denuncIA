import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.attachment import Attachment
from app.schemas.denuncia import (
    AuditLogOut,
    DenunciaCreateData,
    DenunciaSubmetidaOut,
    ProtocoloStatusOut,
)
from app.services import denuncia_service
from app.utils.validators import sanitize_filename, validate_upload_file

router = APIRouter(prefix="/api/denuncias", tags=["denuncias"])
settings = get_settings()

# Descrições genéricas por estado, sem nomes de técnicos nem observações internas —
# o histórico devolvido ao cidadão nunca reutiliza o texto interno de `acao`.
_DESCRICAO_PUBLICA_POR_ESTADO = {
    "RECEBIDA": "Denúncia recebida",
    "PENDENTE_VALIDACAO": "Classificação preliminar concluída",
    "EM_ANALISE": "Processo em análise por um técnico",
    "VALIDADA": "Classificação confirmada por um técnico",
    "ENCAMINHADA": "Encaminhada para a entidade competente",
    "EM_INVESTIGACAO": "Em investigação pela entidade competente",
    "ARQUIVADA": "Processo arquivado",
    "REJEITADA": "Denúncia rejeitada",
}


@router.post("", response_model=DenunciaSubmetidaOut, status_code=status.HTTP_201_CREATED)
async def criar_denuncia(
    db: Session = Depends(get_db),
    nome_denunciante: str | None = Form(None),
    email_denunciante: str | None = Form(None),
    telefone_denunciante: str | None = Form(None),
    anonima: bool = Form(False),
    tipo_denuncia: str | None = Form(None),
    local_ocorrencia: str | None = Form(None),
    data_ocorrencia: str | None = Form(None),
    descricao: str = Form(...),
    envolvidos: str | None = Form(None),
    valor_envolvido: str | None = Form(None),
    files: list[UploadFile] = File(default=[]),
):
    try:
        dados = DenunciaCreateData(
            nome_denunciante=nome_denunciante,
            email_denunciante=email_denunciante,
            telefone_denunciante=telefone_denunciante,
            anonima=anonima,
            tipo_denuncia=tipo_denuncia,
            local_ocorrencia=local_ocorrencia,
            data_ocorrencia=data_ocorrencia,
            descricao=descricao,
            envolvidos=envolvidos,
            valor_envolvido=valor_envolvido,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors())

    files = [f for f in files if f.filename]
    if len(files) > settings.max_files_per_denuncia:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Máximo de {settings.max_files_per_denuncia} ficheiros por denúncia.",
        )

    file_payloads: list[tuple[UploadFile, bytes]] = []
    for upload in files:
        content = await upload.read()
        validate_upload_file(upload, len(content))
        file_payloads.append((upload, content))

    denuncia = denuncia_service.criar_denuncia(db, dados)

    if file_payloads:
        denuncia_dir = os.path.join(settings.upload_dir, denuncia.id)
        os.makedirs(denuncia_dir, exist_ok=True)
        for upload, content in file_payloads:
            safe_name = sanitize_filename(upload.filename or "ficheiro")
            stored_name = f"{uuid.uuid4()}_{safe_name}"
            filepath = os.path.join(denuncia_dir, stored_name)
            with open(filepath, "wb") as f:
                f.write(content)
            db.add(
                Attachment(
                    denuncia_id=denuncia.id,
                    filename=safe_name,
                    filepath=filepath,
                    mimetype=upload.content_type or "application/octet-stream",
                    size=len(content),
                )
            )
        db.commit()

    return DenunciaSubmetidaOut(protocolo=denuncia.protocolo, estado=denuncia.estado, created_at=denuncia.created_at)


@router.get("/protocolo/{protocolo}", response_model=ProtocoloStatusOut)
def consultar_protocolo(protocolo: str, db: Session = Depends(get_db)):
    denuncia = denuncia_service.obter_por_protocolo(db, protocolo.strip().upper())

    historico = [
        AuditLogOut(
            id=log.id,
            tipo=log.tipo.value,
            acao=_DESCRICAO_PUBLICA_POR_ESTADO.get(log.estado_novo, "Estado do processo atualizado"),
            estado_anterior=log.estado_anterior,
            estado_novo=log.estado_novo,
            observacao=None,
            created_at=log.created_at,
        )
        for log in denuncia.audit_logs
        if log.estado_novo is not None and log.estado_novo != log.estado_anterior
    ]

    return ProtocoloStatusOut(
        protocolo=denuncia.protocolo,
        estado=denuncia.estado,
        created_at=denuncia.created_at,
        updated_at=denuncia.updated_at,
        historico=historico,
    )
