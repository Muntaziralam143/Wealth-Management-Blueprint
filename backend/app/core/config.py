# backend/app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Load .env and allow extra env vars safely
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow",
        case_sensitive=False,
    )

    # =========================
    # Database
    # =========================
    DATABASE_URL: str

    # =========================
    # JWT / Auth
    # =========================
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # =========================
    # CORS (IMPORTANT FIX)
    # =========================
    # Allow frontend from Vercel + local dev
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "https://wealth-management-blueprint.vercel.app",
    ]

    # Frontend base URL (used for emails, reset links, redirects)
    FRONTEND_URL: str = "https://wealth-management-blueprint.vercel.app"

    # Password reset
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # =========================
    # App metadata
    # =========================
    APP_NAME: str = "Wealth Management API"
    API_V1_PREFIX: str = "/api"

    # =========================
    # Backward compatibility
    # =========================
    @property
    def JWT_SECRET_KEY(self) -> str:
        return self.SECRET_KEY

    @property
    def JWT_ALGORITHM(self) -> str:
        return self.ALGORITHM


# Settings instance
settings = Settings()
