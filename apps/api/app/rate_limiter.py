"""Rate limiting middleware using SlowAPI."""

from fastapi import FastAPI
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# Initialize limiter with a sensible default (client IP)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


def setup_rate_limiting(app: FastAPI) -> None:
    """Attach the rate limiter to the FastAPI application."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
