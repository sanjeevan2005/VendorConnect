"""FastAPI application factory.

The create_app() function builds and configures the full application.
This pattern makes the app testable — tests can call create_app() with
overridden settings and dependencies.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI

from app.config import Settings, get_settings
from app.exceptions import register_exception_handlers
from app.middleware import RequestLoggingMiddleware, configure_cors
from app.rate_limiter import setup_rate_limiting
from app.routers import call, health, rfq, vendor, webhook


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create and configure the FastAPI application.

    Args:
        settings: Optional settings override (for testing).
                  If None, settings are loaded from environment.
    """
    if settings is None:
        settings = get_settings()

    _configure_logging()

    app = FastAPI(
        title="vendrsurf-backend",
        description="AI-powered hardware procurement API",
        version="1.0.0",
    )

    # Global dependencies and middleware
    configure_cors(app, settings)
    app.add_middleware(RequestLoggingMiddleware)
    setup_rate_limiting(app)
    register_exception_handlers(app)

    # Routers
    app.include_router(health.router)
    app.include_router(rfq.router)
    app.include_router(vendor.router)
    app.include_router(call.router)
    app.include_router(webhook.router)

    return app


def _configure_logging() -> None:
    """Configure structured logging for the application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # Quiet noisy third-party loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("supabase").setLevel(logging.WARNING)
