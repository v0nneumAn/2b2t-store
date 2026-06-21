from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "2b2t Store Backend"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./store.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Monero
    monero_wallet_rpc_url: str = "http://localhost:18082/json_rpc"
    monero_wallet_rpc_user: str = ""
    monero_wallet_rpc_password: str = ""
    monero_confirmations_required: int = 10
    monero_price_lock_seconds: int = 900  # 15 minutes

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
