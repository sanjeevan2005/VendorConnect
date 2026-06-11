"""Application configuration with validation.

All environment variables are validated at startup. Missing required
variables surface as clear error messages instead of silent empty-string
defaults that cause cryptic failures downstream.
"""

from __future__ import annotations

import logging

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Validated application settings loaded from environment variables."""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    # --- Required for core functionality ---
    anthropic_api_key: str = Field(default="", description="Anthropic API key for Claude.")
    anthropic_model: str = Field(default="claude-sonnet-4-6", description="Anthropic model name.")
    crust_data_api_key: str = Field(default="", description="Crust Data API key for vendor search.")
    supabase_url: str = Field(default="", description="Supabase project URL.")
    supabase_service_role_key: str = Field(default="", description="Supabase service-role key.")

    # --- Vapi voice AI ---
    vapi_api_key: str = Field(default="", description="Vapi API key.")
    vapi_phone_number_id: str = Field(default="", description="Vapi outbound phone number ID.")
    vapi_assistant_id: str = Field(default="", description="Vapi assistant ID.")
    vapi_webhook_secret: str = Field(default="", description="Vapi webhook shared secret.")
    webhook_url: str = Field(
        default="http://127.0.0.1:8000/vapi/webhook",
        description="Public URL for Vapi webhook delivery.",
    )

    # --- CORS & Auth ---
    cors_allow_origins: list[str] = Field(
        default=["http://localhost:3000"],
        description="Comma-separated list of allowed CORS origins.",
    )
    api_key: str = Field(
        default="",
        description="Static API key required to access core endpoints (optional).",
    )

    # --- Demo / override ---
    vendor_phone_override: str = Field(
        default="",
        description="E.164 phone number override for demo calls.",
    )
    demo_mode: bool = Field(
        default=False,
        description="Enable demo mode (synthetic vendor data for non-primary vendors).",
    )

    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def _parse_cors_origins(cls, v: object) -> list[str]:
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        if isinstance(v, list):
            return v
        return ["http://localhost:3000"]

    # --- Convenience predicates ---

    @property
    def has_anthropic(self) -> bool:
        return bool(self.anthropic_api_key)

    @property
    def has_crust_data(self) -> bool:
        return bool(self.crust_data_api_key)

    @property
    def has_supabase(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    @property
    def has_vapi(self) -> bool:
        """Return True if Vapi is fully configured."""
        return bool(self.vapi_api_key and self.vapi_assistant_id and self.vapi_phone_number_id)

    @property
    def has_vapi_webhook_auth(self) -> bool:
        """Return True if Vapi webhook verification is configured."""
        return bool(self.vapi_webhook_secret)


def get_settings() -> Settings:
    """Create and return validated settings. Called once at startup."""
    settings = Settings()

    # Log configuration status (never log secrets)
    configured: list[str] = []
    missing: list[str] = []
    for name, present in [
        ("Anthropic", settings.has_anthropic),
        ("Crust Data", settings.has_crust_data),
        ("Supabase", settings.has_supabase),
        ("Vapi", settings.has_vapi),
    ]:
        (configured if present else missing).append(name)

    logger.info(
        "Configuration loaded: services_configured=%s, services_missing=%s, demo_mode=%s",
        configured,
        missing,
        settings.demo_mode,
    )
    return settings
