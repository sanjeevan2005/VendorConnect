"""Authentication middleware and dependencies."""

from __future__ import annotations

import hmac
import logging

from fastapi import Depends, HTTPException, Security
from fastapi.security import APIKeyHeader

from app.config import Settings  # noqa: TC001
from app.dependencies import get_app_settings

logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def verify_api_key(
    api_key: str | None = Security(api_key_header),
    settings: Settings = Depends(get_app_settings),
) -> None:
    """FastAPI dependency to verify the incoming API key against config.

    If settings.api_key is empty, the API is considered public.
    """
    if not settings.api_key:
        return

    if not api_key:
        raise HTTPException(status_code=401, detail="Missing X-API-Key header")

    # Use hmac.compare_digest to prevent timing attacks
    if not hmac.compare_digest(api_key, settings.api_key):
        raise HTTPException(status_code=403, detail="Invalid API Key")
