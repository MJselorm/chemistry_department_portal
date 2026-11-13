from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    database_url: str = "sqlite:///./chemistry_hub.db"
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    supabase_storage_bucket: str = "directory-media"
    supabase_academic_storage_bucket: str = "academic-resources"
    vapid_public_key: str | None = None
    vapid_private_key: str | None = None
    vapid_subject: str = "mailto:admin@example.invalid"
    firebase_service_account_path: str | None = None
    firebase_service_account_json: str | None = None
    # The React portal is served by Vite in development. Keep the static
    # frontend origins too, so either client can be used during migration.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500"

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        url = make_url(value)
        if url.drivername in {"postgres", "postgresql"}:
            url = url.set(drivername="postgresql+psycopg")
        return url.render_as_string(hide_password=False)

    @model_validator(mode="after")
    def require_postgresql_in_production(self):
        if self.app_env.lower() == "production" and make_url(self.database_url).get_backend_name() != "postgresql":
            raise ValueError("Production requires DATABASE_URL to point to PostgreSQL.")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        import re
        origins = re.split(r"[\s,;]+", self.cors_origins.strip())
        return [origin.rstrip("/") for origin in origins if origin]


@lru_cache
def get_settings() -> Settings:
    return Settings()
