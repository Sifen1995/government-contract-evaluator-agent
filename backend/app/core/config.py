from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "GovAI"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_STR: str = "/api"

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Auth
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # SAM.gov API
    SAM_API_KEY: str
    SAM_API_BASE_URL: str = "https://api.sam.gov/opportunities/v2/search"

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4"

    # SendGrid
    SENDGRID_API_KEY: str
    EMAIL_FROM: str = "noreply@govai.com"
    EMAIL_FROM_NAME: str = "GovAI"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Celery
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
