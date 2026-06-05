from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LeoNote API"
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="127.0.0.1", alias="APP_HOST")
    app_port: int = Field(default=9111, alias="APP_PORT")
    app_timezone: str = Field(default="Asia/Ho_Chi_Minh", alias="APP_TIMEZONE")
    api_prefix: str = "/api"

    database_url: str = Field(alias="DATABASE_URL")
    jwt_secret_key: str = Field(alias="JWT_SECRET_KEY")
    jwt_access_token_expire_minutes: int = Field(
        default=60,
        alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    jwt_refresh_token_expire_days: int = Field(
        default=30,
        alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS",
    )
    cors_origins: str = Field(default="", alias="CORS_ORIGINS")
    cookie_secure: bool = Field(default=False, alias="COOKIE_SECURE")
    cookie_domain: str | None = Field(default=None, alias="COOKIE_DOMAIN")
    seed_username: str | None = Field(default=None, alias="SEED_USERNAME")
    seed_password: SecretStr | None = Field(default=None, alias="SEED_PASSWORD")
    seed_display_name: str | None = Field(default=None, alias="SEED_DISPLAY_NAME")
    seed_enforce_single_user: bool = Field(default=False, alias="SEED_ENFORCE_SINGLE_USER")
    allow_registration: bool = Field(default=True, alias="ALLOW_REGISTRATION")

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        if not self.cors_origins.strip():
            return []
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
