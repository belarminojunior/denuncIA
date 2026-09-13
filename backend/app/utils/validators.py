import re

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

settings = get_settings()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".docx"}


def validate_upload_file(file: UploadFile, size_bytes: int) -> None:
    filename = file.filename or ""
    extension = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensão de ficheiro não permitida: {extension or 'desconhecida'}.",
        )

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de ficheiro não permitido: {file.content_type}.",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ficheiro '{filename}' excede o limite de {settings.max_upload_size_mb} MB.",
        )


def sanitize_filename(filename: str) -> str:
    filename = filename.strip().replace("\\", "/").split("/")[-1]
    filename = re.sub(r"[^A-Za-z0-9._-]", "_", filename)
    return filename[-150:] or "ficheiro"


_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def sanitize_user_text(text: str) -> str:
    """Remove caracteres de controlo do texto livre submetido pelo cidadão.

    Não interpreta nem remove instruções em linguagem natural: essa defesa é
    feita ao nível do prompt (delimitação clara + tratamento como dados), não
    aqui. Esta função apenas neutraliza truques de baixo nível (caracteres de
    controlo, ficheiros binários disfarçados de texto, etc.).
    """
    if not text:
        return ""
    text = _CONTROL_CHARS_RE.sub("", text)
    return text.strip()
