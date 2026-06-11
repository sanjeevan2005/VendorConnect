"""Webhook handler service — processes Vapi webhook events and persists results."""

from __future__ import annotations

import hmac
import logging
from typing import TYPE_CHECKING, Any

import httpx

if TYPE_CHECKING:
    from supabase import Client

logger = logging.getLogger(__name__)

WEEKS_TO_DAYS = 7


def verify_vapi_signature(signature: str, secret: str) -> bool:
    """Verify the Vapi webhook signature using HMAC.

    In production, Vapi currently passes the exact secret in the header instead of
    a true HMAC. If they change to true HMAC, use hmac.compare_digest.
    For now, we just do a secure string comparison.
    """
    return hmac.compare_digest(signature, secret)


def process_webhook(payload: dict[str, Any]) -> dict[str, Any] | None:
    """Process a Vapi webhook event and return a dashboard-ready dict.

    Returns None for non-actionable event types.
    """
    msg = payload.get("message", payload)
    msg_type = msg.get("type")

    if msg_type == "status-update":
        return _handle_status_update(msg)
    if msg_type == "end-of-call-report":
        return _handle_end_of_call_report(msg)

    logger.debug("Ignoring webhook event type: %s", msg_type)
    return None


def persist_call_event(
    sb: Client | None,
    payload: dict[str, Any],
    result: dict[str, Any],
) -> None:
    """Persist a call event to the database and update the vendor row.

    Non-critical: failures are logged but do not propagate.
    """
    if sb is None:
        return

    event = result.get("event")
    row = {
        "call_id": result.get("call_id"),
        "rfq_id": result.get("rfq_id"),
        "vendor_id": result.get("vendor_id"),
        "event_type": event,
        "status": result.get("status"),
        "payload": result,
        "raw": payload,
    }

    try:
        sb.table("call_events").insert(row).execute()
    except Exception:
        logger.exception("Failed to insert call_event row, call_id=%s", result.get("call_id"))

    vendor_id = result.get("vendor_id")
    if not vendor_id:
        return

    if event == "status_update":
        _update_vendor_status(sb, vendor_id, result.get("status"))
    elif event == "call_complete":
        _update_vendor_on_completion(sb, vendor_id, result)


async def forward_to_callback(url: str, data: dict[str, Any]) -> None:
    """Forward webhook data to an external callback URL.

    Non-critical: failures are logged but do not propagate.
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json=data)
        logger.info("Forwarded webhook to callback_url=%s", url)
    except Exception:
        logger.warning("Failed to forward webhook to callback_url=%s", url)


def extract_callback_url(payload: dict[str, Any]) -> str | None:
    """Extract the callback URL from webhook payload metadata."""
    msg = payload.get("message", payload)
    call = msg.get("call", {})
    metadata = call.get("metadata") or {}
    return metadata.get("callback_url")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _handle_status_update(msg: dict[str, Any]) -> dict[str, Any]:
    call = msg.get("call", {})
    return {
        "event": "status_update",
        "call_id": call.get("id"),
        "status": msg.get("status"),
        "rfq_id": (call.get("metadata") or {}).get("rfq_id"),
        "vendor_id": (call.get("metadata") or {}).get("vendor_id"),
    }


def _handle_end_of_call_report(msg: dict[str, Any]) -> dict[str, Any]:
    call = msg.get("call", {})
    analysis = msg.get("analysis", {})
    structured = analysis.get("structuredData", {}) or {}
    metadata = call.get("metadata") or {}
    artifact = msg.get("artifact", {}) or {}

    return {
        "event": "call_complete",
        "call_id": call.get("id"),
        "rfq_id": metadata.get("rfq_id"),
        "vendor_id": metadata.get("vendor_id"),
        "ended_reason": msg.get("endedReason"),
        "duration_seconds": msg.get("durationSeconds"),
        "cost_usd": msg.get("cost"),
        "recording_url": (
            artifact.get("recordingUrl")
            or artifact.get("stereoRecordingUrl")
            or msg.get("recordingUrl")
            or msg.get("stereoRecordingUrl")
        ),
        "transcript": artifact.get("transcript") or msg.get("transcript"),
        "messages": artifact.get("messages") or msg.get("messages") or [],
        "summary": analysis.get("summary"),
        "success": analysis.get("successEvaluation"),
        # Structured fields — flattened for dashboard
        "outcome": structured.get("outcome"),
        "capability_qualified": structured.get("capability_qualified"),
        "capability_notes": structured.get("capability_notes"),
        "vendor_ballpark_unit_price_low": structured.get("vendor_ballpark_unit_price_low"),
        "vendor_ballpark_unit_price_high": structured.get("vendor_ballpark_unit_price_high"),
        "vendor_lead_time_first_article_weeks": structured.get("vendor_lead_time_first_article_weeks"),
        "vendor_lead_time_production_weeks": structured.get("vendor_lead_time_production_weeks"),
        "vendor_moq": structured.get("vendor_moq"),
        "vendor_nre_estimate_usd": structured.get("vendor_nre_estimate_usd"),
        "quote_interest_confirmed": structured.get("quote_interest_confirmed"),
        "quote_interest_reason": structured.get("quote_interest_reason"),
        "vendor_email_captured": structured.get("vendor_email_captured"),
        "vendor_requested_response_days": structured.get("vendor_requested_response_days"),
        "correct_contact_name": structured.get("correct_contact_name"),
        "correct_contact_title": structured.get("correct_contact_title"),
        "objections_raised": structured.get("objections_raised") or [],
        "vendor_notes_for_buyer": structured.get("vendor_notes_for_buyer"),
    }


def _map_call_status(vapi_status: str) -> str:
    """Map Vapi call status to vendor dashboard status."""
    if vapi_status in ("queued", "ringing", "in-progress", "forwarding"):
        return "calling"
    if vapi_status == "ended":
        return "completed"
    return "calling"


def _update_vendor_status(sb: Client, vendor_id: str, status: str | None) -> None:
    if not status:
        return
    try:
        sb.table("vendors").update({"status": _map_call_status(status)}).eq("id", vendor_id).execute()
    except Exception:
        logger.exception("Failed to update vendor status, vendor_id=%s", vendor_id)


def _update_vendor_on_completion(sb: Client, vendor_id: str, result: dict[str, Any]) -> None:
    """Update vendor row with call completion data (price, lead time, transcript, etc.)."""
    update: dict[str, Any] = {"status": "completed"}

    low = result.get("vendor_ballpark_unit_price_low")
    high = result.get("vendor_ballpark_unit_price_high")
    if low is not None and high is not None:
        update["unit_price"] = (float(low) + float(high)) / 2
    elif low is not None:
        update["unit_price"] = float(low)
    elif high is not None:
        update["unit_price"] = float(high)

    lead = result.get("vendor_lead_time_production_weeks") or result.get("vendor_lead_time_first_article_weeks")
    if lead is not None:
        try:
            update["lead_time"] = int(float(lead) * WEEKS_TO_DAYS)
        except (ValueError, TypeError):
            logger.warning("Invalid lead_time value: %s", lead)

    if result.get("vendor_moq") is not None:
        try:
            update["moq"] = int(result["vendor_moq"])
        except (ValueError, TypeError):
            logger.warning("Invalid MOQ value: %s", result.get("vendor_moq"))

    if result.get("outcome"):
        update["call_outcome"] = result["outcome"]
    if result.get("summary"):
        update["summary"] = result["summary"]
    if result.get("duration_seconds") is not None:
        update["call_duration"] = f"{int(result['duration_seconds'])}s"
    if result.get("transcript"):
        update["transcript"] = result["transcript"]
    if result.get("recording_url"):
        update["recording_url"] = result["recording_url"]
    if result.get("vendor_email_captured"):
        update["email"] = result["vendor_email_captured"]

    try:
        sb.table("vendors").update(update).eq("id", vendor_id).execute()
    except Exception:
        logger.exception("Failed to update vendor on call completion, vendor_id=%s", vendor_id)
