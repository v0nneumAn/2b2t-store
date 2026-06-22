from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "2b2t Store Backend"
    debug: bool = True

    # Database
    database_url: str = "postgresql+psycopg2://store:store@localhost:5432/store"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Stripe
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_currency: str = "usd"

    # Business rules
    min_order_usd: float = 10.0
    cart_ttl_seconds: int = 86400  # 24 hours

    # Bot
    bot_api_key: str = "change-me-in-production"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
