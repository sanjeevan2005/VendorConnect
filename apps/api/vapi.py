"""Vapi client for VendrSurf.

Handles:
1. build_assistant_config() — the full Vapi assistant payload
2. create_assistant() / update_assistant() — one-time setup
3. trigger_call() — per-vendor outbound call with dynamic variables
4. handle_webhook() — process webhook event, return dashboard update

Requires: VAPI_API_KEY, VAPI_PHONE_NUMBER_ID env vars.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx
from tenacity import retry, retry_if_not_exception_type, stop_after_attempt, wait_exponential

from prompts import (
    ANALYSIS_PROMPT,
    FIRST_MESSAGE,
    STRUCTURED_DATA_SCHEMA,
    SUCCESS_EVALUATION_PROMPT,
    SYSTEM_PROMPT,
)

logger = logging.getLogger(__name__)

VAPI_BASE_URL = "https://api.vapi.ai"
_DEFAULT_TIMEOUT = 30.0


# =============================================================================
# ASSISTANT CONFIG
# =============================================================================


def build_assistant_config(name: str = "VendrSurf Qualifier v1") -> dict[str, Any]:
    """Return the full Vapi assistant configuration.

    Notes on config choices:
    - gpt-4o: good balance of reasoning + voice latency.
    - 11labs Sarah: professional female voice, clear diction.
    - Deepgram Nova-3: current default, good on technical vocab.
    - silenceTimeoutSeconds=30: hang up if nothing heard for 30s.
    - maxDurationSeconds=600: hard cap at 10 minutes.
    """
    server_url = os.environ.get(
        "WEBHOOK_URL",
        "https://vendrsurf-backend-production.up.railway.app/vapi/webhook",
    )

    return {
        "name": name,
        "serverUrl": server_url,
        "model": {
            "provider": "openai",
            "model": "gpt-4o",
            "temperature": 0.4,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
            ],
        },
        "voice": {
            "provider": "11labs",
            "voiceId": "sarah",
            "stability": 0.5,
            "similarityBoost": 0.75,
            "speed": 1.0,
            "optimizeStreamingLatency": 3,
        },
        "transcriber": {
            "provider": "deepgram",
            "model": "nova-3",
            "language": "en",
        },
        "firstMessage": FIRST_MESSAGE,
        "firstMessageMode": "assistant-speaks-first",
        "endCallFunctionEnabled": True,
        "endCallPhrases": [
            "have a good one",
            "thanks for the time",
            "talk to you soon",
        ],
        "endCallMessage": "Thanks, have a good one.",
        "silenceTimeoutSeconds": 30,
        "maxDurationSeconds": 600,
        "backgroundSound": "office",
        "backchannelingEnabled": False,
        "backgroundDenoisingEnabled": True,
        "analysisPlan": {
            "summaryPrompt": (
                "Summarize this hardware vendor qualification call in 2-3 "
                "sentences. Include the outcome, any pricing/lead time "
                "captured, and any objections or concerns raised."
            ),
            "structuredDataPrompt": ANALYSIS_PROMPT,
            "structuredDataSchema": STRUCTURED_DATA_SCHEMA,
            "successEvaluationPrompt": SUCCESS_EVALUATION_PROMPT,
            "successEvaluationRubric": "PassFail",
        },
    }


# =============================================================================
# AUTH
# =============================================================================


def _auth_headers() -> dict[str, str]:
    key = os.environ.get("VAPI_API_KEY")
    if not key:
        raise RuntimeError("VAPI_API_KEY is not set")
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


# =============================================================================
# CREATE / UPDATE ASSISTANT
# =============================================================================


def create_assistant() -> dict[str, Any]:
    """Create a new Vapi assistant. Returns the full assistant object including id."""
    config = build_assistant_config()
    with httpx.Client(timeout=_DEFAULT_TIMEOUT) as client:
        resp = client.post(
            f"{VAPI_BASE_URL}/assistant",
            headers=_auth_headers(),
            json=config,
        )
        resp.raise_for_status()
        return resp.json()


def update_assistant(assistant_id: str) -> dict[str, Any]:
    """Update an existing Vapi assistant with the current config."""
    config = build_assistant_config()
    with httpx.Client(timeout=_DEFAULT_TIMEOUT) as client:
        resp = client.patch(
            f"{VAPI_BASE_URL}/assistant/{assistant_id}",
            headers=_auth_headers(),
            json=config,
        )
        resp.raise_for_status()
        return resp.json()


# =============================================================================
# TRIGGER OUTBOUND CALL
# =============================================================================


@retry(
    stop=stop_after_attempt(3), 
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_not_exception_type((ValueError, RuntimeError))
)
def trigger_call(
    assistant_id: str,
    vendor_phone: str,
    variables: dict[str, str],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Trigger an outbound call via the Vapi API.

    Args:
        assistant_id: The Vapi assistant id.
        vendor_phone: Vendor phone in E.164 format (e.g. "+14155551234").
        variables: Per-call dynamic variables injected into the assistant prompt.
        metadata: Echoed back on webhooks for correlation (e.g. rfq_id, vendor_id).

    Returns:
        The Vapi call object including id.

    Raises:
        ValueError: If phone format is invalid or required variables are missing.
        RuntimeError: If VAPI_PHONE_NUMBER_ID is not set.
    """
    required = [
        "buyer_company", "buyer_one_liner", "vendor_company",
        "contact_first_name", "rfq_one_liner", "preferred_process",
        "preferred_material", "target_quantity_phrase", "eau_phrase",
        "key_constraint", "required_certifications", "email_followup_contact",
    ]
    missing = [k for k in required if k not in variables]
    if missing:
        raise ValueError(f"Missing required variables: {missing}")

    if not vendor_phone.startswith("+") or len(vendor_phone) < 8:
        raise ValueError("vendor_phone must be E.164 format, e.g. +14155551234")

    phone_number_id = os.environ.get("VAPI_PHONE_NUMBER_ID")
    if not phone_number_id:
        raise RuntimeError("VAPI_PHONE_NUMBER_ID is not set")

    payload: dict[str, Any] = {
        "assistantId": assistant_id,
        "phoneNumberId": phone_number_id,
        "customer": {"number": vendor_phone},
        "assistantOverrides": {
            "variableValues": variables,
        },
    }
    if metadata:
        payload["metadata"] = metadata

    logger.info("Triggering Vapi call to %s for assistant=%s", vendor_phone, assistant_id)

    with httpx.Client(timeout=_DEFAULT_TIMEOUT) as client:
        resp = client.post(
            f"{VAPI_BASE_URL}/call",
            headers=_auth_headers(),
            json=payload,
        )
        resp.raise_for_status()
        result = resp.json()

    logger.info("Vapi call triggered: call_id=%s", result.get("id"))
    return result


# =============================================================================
# WEBHOOK HANDLER (delegated to app/services/webhook_handler.py in new arch)
# =============================================================================
# Kept here for backward compatibility with the CLI commands below.

def handle_webhook(event: dict[str, Any]) -> dict[str, Any] | None:
    """Process a Vapi webhook event. Delegates to the service layer."""
    from app.services.webhook_handler import process_webhook
    return process_webhook(event)


# =============================================================================
# CLI
# =============================================================================


if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) < 2:
        print(
            "Usage:\n"
            "  python vapi.py create                     # create new assistant\n"
            "  python vapi.py update <assistant_id>      # update existing assistant\n"
            "  python vapi.py test <assistant_id> <phone>  # fire a test call"
        )
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "create":
        result = create_assistant()
        print(f"Created assistant: {result['id']}")
        print("Save this ID and set VAPI_ASSISTANT_ID env var.")
        print(json.dumps(result, indent=2)[:500] + "...")

    elif cmd == "update":
        if len(sys.argv) < 3:
            print("Need assistant_id")
            sys.exit(1)
        result = update_assistant(sys.argv[2])
        print(f"Updated assistant {result['id']}")

    elif cmd == "test":
        if len(sys.argv) < 4:
            print("Need assistant_id and phone (E.164 format, e.g. +14155551234)")
            sys.exit(1)
        test_vars = {
            "buyer_company": "Helios Robotics",
            "buyer_one_liner": (
                "Helios Robotics builds autonomous warehouse robots - "
                "headquartered in San Francisco, Series A."
            ),
            "vendor_company": "Precision CNC Inc",
            "contact_first_name": "Alex",
            "rfq_one_liner": "a mounting bracket for our robot chassis",
            "preferred_process": "CNC machining",
            "preferred_material": "6061 aluminum",
            "target_quantity_phrase": "five hundred units",
            "eau_phrase": "around ten thousand per year",
            "key_constraint": (
                "a bore tolerance of plus or minus two thousandths on the "
                "main mounting hole"
            ),
            "required_certifications": "ISO 9001",
            "email_followup_contact": "kaustubh at vendrsurf dot com",
        }
        result = trigger_call(
            assistant_id=sys.argv[2],
            vendor_phone=sys.argv[3],
            variables=test_vars,
            metadata={"rfq_id": "test-rfq-001", "vendor_id": "test-vendor-001"},
        )
        print(f"Call triggered: {result.get('id')}")
        print(json.dumps(result, indent=2)[:500] + "...")

    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)
