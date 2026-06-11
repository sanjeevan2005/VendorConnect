"""Health check endpoint."""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def health() -> dict[str, object]:
    """Health check endpoint. Returns service status."""
    return {"ok": True, "service": "vendrsurf-backend"}
