from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "GovAI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # JWT Authentication
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # URLs
    API_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"

    # Email
    EMAIL_MODE: str = "console"  # console or sendgrid
    EMAIL_FROM: str = "noreply@govai.com"
    SENDGRID_API_KEY: str = ""

    # Celery
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    # External APIs (Week 2+)
    SAM_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    @field_validator('JWT_SECRET')
    @classmethod
    def validate_jwt_secret(cls, v):
        if len(v) < 32:
            raise ValueError('JWT_SECRET must be at least 32 characters long')
        if v == 'your-super-secret-jwt-key-change-in-production-minimum-32-characters':
            logger.warning('Using default JWT_SECRET! Change this in production!')
        return v

    @field_validator('EMAIL_MODE')
    @classmethod
    def validate_email_mode(cls, v):
        if v not in ['console', 'sendgrid']:
            raise ValueError('EMAIL_MODE must be either "console" or "sendgrid"')
        return v

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    def validate_production_settings(self) -> List[str]:
        """Validate settings for production deployment. Returns list of warnings."""
        warnings = []

        if self.DEBUG:
            warnings.append("DEBUG is True - should be False in production")

        if not self.SAM_API_KEY:
            warnings.append("SAM_API_KEY not set - opportunity discovery will fail")

        if not self.OPENAI_API_KEY:
            warnings.append("OPENAI_API_KEY not set - AI evaluations will fail")

        if self.EMAIL_MODE == 'sendgrid' and not self.SENDGRID_API_KEY:
            warnings.append("EMAIL_MODE is sendgrid but SENDGRID_API_KEY not set")

        if 'localhost' in self.FRONTEND_URL and not self.DEBUG:
            warnings.append("FRONTEND_URL contains localhost in non-debug mode")

        if 'localhost' in self.CORS_ORIGINS and not self.DEBUG:
            warnings.append("CORS_ORIGINS contains localhost in non-debug mode")

        return warnings

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


# Global settings instance
settings = Settings()

# Log production warnings on startup
_warnings = settings.validate_production_settings()
for warning in _warnings:
    logger.warning(f"Configuration warning: {warning}")
