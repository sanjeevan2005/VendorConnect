"""FastAPI dependency injection.

Provides injectable clients for Supabase and Anthropic. These are created
via Depends() so they can be easily mocked in tests.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from anthropic import Anthropic
from supabase import Client, create_client

from app.config import Settings, get_settings
from app.exceptions import ConfigurationError

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _cached_settings() -> Settings:
    """Return cached settings (created once per process)."""
    return get_settings()


def get_app_settings() -> Settings:
    """FastAPI dependency that provides application settings."""
    return _cached_settings()


def get_supabase_client(settings: Settings | None = None) -> Client:
    """FastAPI dependency that provides a Supabase client.

    Raises ConfigurationError if Supabase is not configured.
    """
    s = settings or _cached_settings()
    if not s.has_supabase:
        raise ConfigurationError("Supabase")
    return create_client(s.supabase_url, s.supabase_service_role_key)


def get_optional_supabase_client(settings: Settings | None = None) -> Client | None:
    """Return a Supabase client if configured, otherwise None.

    Used in non-critical paths where Supabase is optional (e.g. webhook persistence).
    """
    s = settings or _cached_settings()
    if not s.has_supabase:
        return None
    try:
        return create_client(s.supabase_url, s.supabase_service_role_key)
    except Exception:
        logger.exception("Failed to create Supabase client")
        return None


def get_anthropic_client(settings: Settings | None = None) -> Anthropic:
    """FastAPI dependency that provides an Anthropic client.

    Raises ConfigurationError if the Anthropic API key is not set.
    """
    s = settings or _cached_settings()
    if not s.has_anthropic:
        raise ConfigurationError("Anthropic (ANTHROPIC_API_KEY)")
    return Anthropic(api_key=s.anthropic_api_key)
