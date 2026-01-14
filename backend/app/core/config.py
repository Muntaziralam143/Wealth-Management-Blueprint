# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ✅ This is the fix for your error
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow",          # allow FRONTEND_URL, RESET_TOKEN_EXPIRE_MINUTES, etc
        case_sensitive=False,   # helps on Windows
    )

    # ✅ database
    DATABASE_URL: str

    # ✅ jwt
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # ✅ cors + optional env keys (keep these so old env works)
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    FRONTEND_URL: str = "http://localhost:5173"
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # app metadata / routing
    APP_NAME: str = "Wealth Management API"
    API_V1_PREFIX: str = "/api"

    # ✅ backward compatible aliases if old code uses JWT_SECRET_KEY/JWT_ALGORITHM
    @property
    def JWT_SECRET_KEY(self) -> str:
        return self.SECRET_KEY

    @property
    def JWT_ALGORITHM(self) -> str:
        return self.ALGORITHM


settings = Settings()
