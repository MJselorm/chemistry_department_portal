from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None
    supabase_storage_bucket: str = "directory-media"
    # Intentionally unset by default.  Test Drive transfers must name a separate,
    # pre-existing bucket rather than ever falling back to the production bucket.
    supabase_test_storage_bucket: str | None = None
    supabase_academic_storage_bucket: str = "academic-resources"
    firebase_service_account_path: str | None = None
    firebase_service_account_json: str | None = None
    # Google Drive credentials are deliberately separate from Firebase credentials.
    # In production prefer the JSON environment variable supplied by the host secret store.
    google_drive_root_folder_id: str | None = None
    google_drive_service_account_path: str | None = None
    google_drive_service_account_json: str | None = None
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
