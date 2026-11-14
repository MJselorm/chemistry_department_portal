from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    supabase_storage_bucket: str = "directory-media"
    supabase_academic_storage_bucket: str = "academic-resources"
    vapid_public_key: str | None = None
    vapid_private_key: str | None = None
    vapid_subject: str = "mailto:admin@example.invalid"
    privacy_contact_email: str | None = None
    # This salt pseudonymizes IP addresses in rate-limit scopes and audit data.
    # It must be replaced with a secret deployment value outside development.
    privacy_rate_limit_salt: str = "development-only-change-me"
    privacy_request_rate_limit: int = Field(default=5, ge=1, le=100)
    privacy_export_rate_limit: int = Field(default=3, ge=1, le=100)
    privacy_admin_rate_limit: int = Field(default=120, ge=1, le=1000)
    privacy_rate_limit_window_seconds: int = Field(default=3600, ge=60, le=86400)
    privacy_export_max_records: int = Field(default=1000, ge=1, le=10000)
    firebase_service_account_path: str | None = None
    firebase_service_account_json: str | None = None
    # The React portal is served by Vite in development. Keep the static
    # frontend origins too, so either client can be used during migration.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500"

    @property
    def allowed_origins(self) -> list[str]:
        import re
        origins = re.split(r"[\s,;]+", self.cors_origins.strip())
        return [origin.rstrip("/") for origin in origins if origin]


@lru_cache
def get_settings() -> Settings:
    return Settings()
