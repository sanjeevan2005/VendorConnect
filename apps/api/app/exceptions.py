"""Custom exception hierarchy and global FastAPI exception handlers.

Every exception carries enough context to produce a useful API response
without leaking implementation details to callers.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Exception classes
# ---------------------------------------------------------------------------


class VendrSurfError(Exception):
    """Base exception for all application errors."""

    def __init__(self, message: str, *, status_code: int = 500, detail: str | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.detail = detail or message


class ConfigurationError(VendrSurfError):
    """A required service is not configured (missing API key, etc.)."""

    def __init__(self, service: str) -> None:
        super().__init__(
            f"{service} is not configured. Check environment variables.",
            status_code=500,
        )


class ResourceNotFoundError(VendrSurfError):
    """A requested resource does not exist."""

    def __init__(self, resource: str, resource_id: str) -> None:
        super().__init__(
            f"{resource} '{resource_id}' not found.",
            status_code=404,
        )


class ExternalServiceError(VendrSurfError):
    """An external API call failed."""

    def __init__(self, service: str, reason: str, *, status_code: int = 502) -> None:
        super().__init__(
            f"{service} error: {reason}",
            status_code=status_code,
        )


class ValidationError(VendrSurfError):
    """Request validation failed at the business-logic level."""

    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=400)


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------


def _error_response(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": True, "detail": detail},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Attach global exception handlers to the FastAPI app."""

    @app.exception_handler(VendrSurfError)
    async def _vendrsurf_error_handler(request: Request, exc: VendrSurfError) -> JSONResponse:
        logger.warning(
            "Application error: status=%d detail=%s path=%s",
            exc.status_code,
            exc.detail,
            request.url.path,
        )
        return _error_response(exc.status_code, exc.detail or str(exc))

    @app.exception_handler(Exception)
    async def _unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return _error_response(500, "Internal server error.")
