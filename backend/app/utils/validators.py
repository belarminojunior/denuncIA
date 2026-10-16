import re
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.config import get_settings

settings = get_settings()

ALLOWED_EXTENSIONS = frozenset({".pdf", ".jpg", ".jpeg", ".png", ".docx"})
ALLOWED_MIME_TYPES = frozenset(
    {
        "application/pdf",
        "image/jpeg",
        "image/png",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
)
MAX_FILENAME_LENGTH = 150

_UNSAFE_FILENAME_CHARS = re.compile(r"[^A-Za-z0-9._-]")
_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def validate_upload(upload: UploadFile, size_bytes: int) -> None:
    """Reject files by extension, declared MIME type and size."""
    filename = upload.filename or ""
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extensão de ficheiro não permitida: {extension or 'desconhecida'}.",
        )
    if upload.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo de ficheiro não permitido: {upload.content_type}.",
        )
    if size_bytes > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"O ficheiro '{filename}' excede o limite de {settings.max_upload_size_mb} MB.",
        )


def sanitize_filename(filename: str) -> str:
    """Keep only the base name with safe characters (blocks path traversal)."""
    base_name = filename.strip().replace("\\", "/").split("/")[-1]
    return _UNSAFE_FILENAME_CHARS.sub("_", base_name)[-MAX_FILENAME_LENGTH:] or "ficheiro"


def sanitize_user_text(text: str) -> str:
    """Strip control characters from free text written by citizens.

    Natural-language prompt injection is handled at the prompt level (the text is
    delimited and declared as data); this only removes low-level tricks.
    """
    return _CONTROL_CHARS.sub("", text or "").strip()
