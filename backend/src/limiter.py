import os

from slowapi import Limiter
from slowapi.util import get_remote_address

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


def _client_ip(request) -> str:
    """Return the real client IP behind nginx/Cloudflare."""
    cf = request.headers.get("CF-Connecting-IP")
    if cf:
        return cf
    xff = request.headers.get("X-Forwarded-For")
    if xff:
        # The first address is the closest proxy-aware client.
        return xff.split(",")[0].strip()
    xri = request.headers.get("X-Real-IP")
    if xri:
        return xri
    return get_remote_address(request)


# Use Redis-backed storage when available so limits are shared across workers.
# If Redis is unreachable, slowapi falls back to in-memory storage.
try:
    limiter = Limiter(key_func=_client_ip, storage_uri=REDIS_URL)
except Exception:  # pragma: no cover - Redis unavailable
    limiter = Limiter(key_func=_client_ip)
