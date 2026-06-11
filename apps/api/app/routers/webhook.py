"""Vapi webhook endpoint."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request

from app.dependencies import get_app_settings, get_optional_supabase_client
from app.models.call import WebhookResponse
from app.services.webhook_handler import (
    extract_callback_url,
    forward_to_callback,
    persist_call_event,
    process_webhook,
    verify_vapi_signature,
)

if TYPE_CHECKING:
    from supabase import Client

    from app.config import Settings

router = APIRouter(tags=["webhooks"])


@router.post("/vapi/webhook", response_model=WebhookResponse)
async def handle_vapi_webhook(
    request: Request,
    x_vapi_secret: str | None = Header(None, alias="x-vapi-secret"),
    settings: Settings = Depends(get_app_settings),
    sb: Client | None = Depends(get_optional_supabase_client),
) -> WebhookResponse:
    """Receive and process Vapi webhook events.

    Persists call events to the database and optionally forwards
    results to a callback URL specified in the call metadata.
    """
    payload: dict[str, Any] = await request.json()

    if settings.has_vapi_webhook_auth:
        if not x_vapi_secret:
            raise HTTPException(status_code=401, detail="Missing Vapi signature header")
        if not verify_vapi_signature(x_vapi_secret, settings.vapi_webhook_secret or ""):
            raise HTTPException(status_code=401, detail="Invalid Vapi signature")

    result = process_webhook(payload)

    if result is None:
        return WebhookResponse()

    persist_call_event(sb, payload, result)

    callback_url = extract_callback_url(payload)
    if callback_url:
        await forward_to_callback(callback_url, result)

    return WebhookResponse(event=result.get("event"))
