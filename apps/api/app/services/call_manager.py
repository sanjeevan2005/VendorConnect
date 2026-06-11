"""Call management service — builds call variables and triggers Vapi calls."""

from __future__ import annotations

import logging
from typing import Any

from app.utils.spoken_form import eau_phrase, email_to_spoken, quantity_phrase

logger = logging.getLogger(__name__)


def build_call_variables(rfq: dict[str, Any], vendor: dict[str, Any]) -> dict[str, str]:
    """Build the dynamic variable dict that Vapi injects into the assistant prompt.

    These are all spoken-form strings because Vapi's TTS reads them aloud.
    """
    contact = vendor.get("contact") or {}
    contact_first_name = (contact.get("name") or "there").split()[0] if contact.get("name") else "there"
    certs = rfq.get("certifications") or []
    certs_phrase = ", ".join(certs) if certs else "none"
    buyer_name = rfq.get("workspace_name") or "VendrSurf"
    buyer_email_raw = rfq.get("current_user_email") or "team@vendrsurf.com"
    buyer_email_spoken = email_to_spoken(buyer_email_raw)

    return {
        "buyer_company": buyer_name,
        "buyer_one_liner": f"{buyer_name} is sourcing {rfq.get('product_category') or 'custom manufacturing'}.",
        "vendor_company": vendor.get("name") or "your company",
        "contact_first_name": contact_first_name,
        "rfq_one_liner": _rfq_one_liner(rfq),
        "preferred_process": rfq.get("product_category") or "manufacturing",
        "preferred_material": rfq.get("material") or "to be discussed",
        "target_quantity_phrase": quantity_phrase(rfq.get("quantity"), rfq.get("unit_of_measure")),
        "eau_phrase": eau_phrase(rfq.get("quantity"), rfq.get("unit_of_measure"), bool(rfq.get("recurring"))),
        "key_constraint": _key_constraint(rfq),
        "required_certifications": certs_phrase,
        "email_followup_contact": buyer_email_spoken,
    }


def _rfq_one_liner(rfq: dict[str, Any]) -> str:
    """Generate a single-sentence RFQ description."""
    return rfq.get("product_description") or rfq.get("product_category") or rfq.get("title") or "a custom part"


def _key_constraint(rfq: dict[str, Any]) -> str:
    """Summarize the RFQ's most important constraints as a spoken phrase."""
    parts: list[str] = []
    if rfq.get("tolerance"):
        parts.append(f"tolerance of {rfq['tolerance']}")
    if rfq.get("finish"):
        parts.append(f"finish: {rfq['finish']}")
    if rfq.get("max_lead_time_days"):
        parts.append(f"delivery within {rfq['max_lead_time_days']} days")
    elif rfq.get("timeline_weeks"):
        parts.append(f"delivery within {rfq['timeline_weeks']} weeks")
    if rfq.get("target_unit_price"):
        parts.append(f"target unit price around {rfq['target_unit_price']} dollars")
    return "; ".join(parts) or "standard commercial terms"
