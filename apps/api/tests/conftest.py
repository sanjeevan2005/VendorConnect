"""Test fixtures and shared configuration."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.factory import create_app

# Create a test app instance
_app = create_app()
test_client = TestClient(_app)
