from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "2b2t Store Backend"
    debug: bool = False

    # Database (no default password; must be supplied via env)
    database_url: str

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Stripe
    stripe_secret_key: str
    stripe_publishable_key: str
    stripe_webhook_secret: str
    stripe_currency: str = "usd"

    # Business rules
    min_order_usd: float = 10.0
    cart_ttl_seconds: int = 86400  # 24 hours

    # Bot / Admin API keys (no defaults; required for production)
    bot_api_key: str
    admin_api_key: str

    # Frontend URL used to build Stripe success/cancel URLs
    frontend_url: str = "http://localhost:5173"

    # Comma-separated list of allowed CORS origins (defaults to local dev)
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Optional default ZenithProxy Web API (for single-bot demos).
    # Per-bot config in the bots table overrides these.
    zenith_web_api_url: str = ""
    zenith_web_api_token: str = ""

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
