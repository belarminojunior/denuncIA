import logging
import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings
from app.database import Base, engine
from app.routers import admin_reports, audit_logs, auth, chat, dashboard, public_reports, users
from app.services import llm_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()

# Tables are created on startup to keep the academic prototype simple to run;
# a production deployment should use versioned migrations (e.g. Alembic).
Base.metadata.create_all(bind=engine)
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Loading the model takes 15 s or more on CPU; doing it in the background at startup
    # keeps that delay off the first citizen's report without blocking the API.
    threading.Thread(target=llm_service.warm_up, daemon=True).start()
    yield


app = FastAPI(
    lifespan=lifespan,
    title=f"{settings.app_name} — Plataforma de Denúncias de Corrupção",
    description=(
        "API de apoio à categorização, validação e gestão de denúncias de corrupção do GCCC. "
        "O LLM local (Qwen3:4B-Instruct via Ollama) fornece apenas uma classificação "
        "preliminar; a decisão final é sempre de um técnico."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def handle_http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def handle_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    # exc.errors() may embed the original exception object, which is not JSON-serializable.
    errors = [{"loc": error.get("loc"), "msg": error.get("msg"), "type": error.get("type")} for error in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.exception_handler(Exception)
async def handle_unexpected_error(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor."})


for router in (
    auth.router,
    public_reports.router,
    admin_reports.router,
    dashboard.router,
    audit_logs.router,
    users.router,
    chat.router,
):
    app.include_router(router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "llm_mode": settings.llm_mode}
