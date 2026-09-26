from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    app_env: Literal["development", "test", "production"] = "development"
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    supabase_storage_bucket: str = "directory-media"
    firebase_service_account_path: str | None = None
    firebase_service_account_json: str | None = None
    allowed_email_domains: str = ""
    allowed_user_emails: str = ""
    require_verified_email: bool = False
    # The React portal is served by Vite in development. Keep the static
    # frontend origins too, so either client can be used during migration.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500"

    @property
    def allowed_origins(self) -> list[str]:
        import re
        origins = re.split(r"[\s,;]+", self.cors_origins.strip())
        return [origin.rstrip("/") for origin in origins if origin]

    @staticmethod
    def _split_values(value: str) -> set[str]:
        import re
        return {item.strip().lower() for item in re.split(r"[\s,;]+", value) if item.strip()}

    @property
    def permitted_email_domains(self) -> set[str]:
        return self._split_values(self.allowed_email_domains)

    @property
    def permitted_user_emails(self) -> set[str]:
        return self._split_values(self.allowed_user_emails)


@lru_cache
def get_settings() -> Settings:
    return Settings()
