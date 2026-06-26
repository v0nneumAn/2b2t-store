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

    # JWT secret for admin session cookies
    admin_jwt_secret: str

    # Demo features
    demo_mode: bool = False

    # Frontend URL used to build Stripe success/cancel URLs
    frontend_url: str = "http://localhost:5173"

    # Comma-separated list of allowed CORS origins (defaults to local dev)
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Optional default ZenithProxy Web API (for single-bot demos).
    # Per-bot config in the bots table overrides these.
    zenith_web_api_url: str = ""
    zenith_web_api_token: str = ""

    # Comma-separated whitelist of ZenithProxy commands the backend is allowed
    # to relay via /api/bots/{role}/zenith/command. First-token matching.
    zenith_allowed_commands: str = (
        "status,connect,disconnect,reconnect,respawn,pathfinder,walk,look,jump,use,"
        "attack,swap,slot,drop,inventory,echest,chunks,chunk,stop"
    )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def zenith_allowed_command_set(self) -> set[str]:
        return {
            cmd.strip().lower()
            for cmd in self.zenith_allowed_commands.split(",")
            if cmd.strip()
        }

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
