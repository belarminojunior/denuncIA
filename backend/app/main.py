import logging
import os

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.database import Base, engine
from app.routers import admin_denuncias, auditoria, auth, chatbot, dashboard, denuncias, users

logging.basicConfig(level=logging.INFO)
settings = get_settings()

# Cria as tabelas se ainda não existirem. Num ambiente de produção real,
# preferir uma ferramenta de migrações (ex.: Alembic); mantido simples aqui
# por se tratar de um protótipo académico.
Base.metadata.create_all(bind=engine)
os.makedirs(settings.upload_dir, exist_ok=True)

app = FastAPI(
    title="GCCC — Plataforma de Denúncias de Corrupção",
    description=(
        "API de apoio à categorização, validação e gestão de denúncias de corrupção. "
        "O LLM local (Qwen3:4B-Instruct via Ollama) fornece apenas uma classificação "
        "preliminar; a decisão final é sempre do técnico do GCCC."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    # exc.errors() pode incluir em 'ctx' a exceção Python original (não serializável em
    # JSON); mantemos apenas os campos serializáveis (loc/msg/type) para a resposta.
    errors = [{"loc": e.get("loc"), "msg": e.get("msg"), "type": e.get("type")} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc: Exception):
    logging.getLogger(__name__).exception("Erro não tratado")
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor."})


app.include_router(auth.router)
app.include_router(denuncias.router)
app.include_router(admin_denuncias.router)
app.include_router(dashboard.router)
app.include_router(chatbot.router)
app.include_router(auditoria.router)
app.include_router(users.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "llm_mode": settings.llm_mode}
