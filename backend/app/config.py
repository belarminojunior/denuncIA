from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://gccc:gccc@localhost:5432/denuncia"

    secret_key: str = "change-this-secret-in-production-please"
    access_token_expire_minutes: int = 480
    algorithm: str = "HS256"

    cors_origins: str = "http://localhost:3000"

    llm_mode: str = "mock"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen3:4b-instruct"
    ollama_timeout_seconds: int = 60

    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 10
    max_files_per_denuncia: int = 5

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
