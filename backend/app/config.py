from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
import ipaddress


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
    firebase_service_account_path: str | None = None
    firebase_service_account_json: str | None = None
    app_env: str = "development"
    rate_limit_enabled: bool = False
    trusted_proxy_cidrs: str = ""
    database_pool_size: int = 5
    database_max_overflow: int = 5
    database_pool_timeout: int = 10
    # The React portal is served by Vite in development. Keep the static
    # frontend origins too, so either client can be used during migration.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5500,http://127.0.0.1:5500"

    @property
    def allowed_origins(self) -> list[str]:
        import re
        origins = re.split(r"[\s,;]+", self.cors_origins.strip())
        return [origin.rstrip("/") for origin in origins if origin]

    @property
    def trusted_proxy_networks(self) -> list[ipaddress.IPv4Network | ipaddress.IPv6Network]:
        values = [value.strip() for value in self.trusted_proxy_cidrs.split(",") if value.strip()]
        networks = []
        for value in values:
            try:
                networks.append(ipaddress.ip_network(value, strict=False))
            except ValueError:
                continue
        return networks


@lru_cache
def get_settings() -> Settings:
    return Settings()
