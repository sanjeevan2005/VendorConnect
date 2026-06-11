"""VendrSurf backend — application entrypoint.

This module creates the FastAPI app instance and serves as the uvicorn
entry point. All business logic lives in the app/ package.

Usage:
    uvicorn main:app --host 127.0.0.1 --port 8000 --reload
"""

from app.factory import create_app

app = create_app()
