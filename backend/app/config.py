"""Application configuration using Pydantic settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "Pulse"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 0
    
    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str = ""
    
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017/pulse_logs"
    mongodb_host: str = "localhost"
    mongodb_port: int = 27017
    mongodb_db: str = "pulse_logs"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:3000"]
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]
    
    # File Upload
    max_upload_size: int = 10485760  # 10MB
    upload_dir: str = "./uploads"
    
    # Stripe (Phase 1)
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id_employees: str = ""
    stripe_price_id_finance: str = ""
    stripe_price_id_payroll: str = ""
    stripe_price_id_communication: str = ""
    stripe_price_id_all_access: str = ""
    
    # SendGrid (Phase 1)
    sendgrid_api_key: str = ""
    sender_email: str = "noreply@pulse.com"
    sender_name: str = "Pulse"
    
    # AWS S3 (Phase 2)
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket_name: str = ""
    aws_region: str = "us-east-1"
    
    # Sentry (Phase 2)
    sentry_dsn: str = ""
    sentry_environment: str = "production"
    sentry_traces_sample_rate: float = 0.1
    
    # Celery (Phase 2)
    celery_broker_url: str = ""
    celery_result_backend: str = ""
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/app.log"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    @property
    def redis_url(self) -> str:
        """Construct Redis URL from components."""
        if self.redis_password:
            return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"


# Global settings instance
settings = Settings()
