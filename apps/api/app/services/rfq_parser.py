"""RFQ parsing service — extracts structured fields from voice transcripts via Claude."""

from __future__ import annotations

import json
import logging
from typing import Any

from anthropic import Anthropic, APIError
from tenacity import retry, stop_after_attempt, wait_exponential

from app.exceptions import ExternalServiceError
from app.models.rfq import ParsedRFQFields
from app.utils.coerce import coerce_bool, coerce_enum, coerce_float, coerce_int, coerce_str

logger = logging.getLogger(__name__)

PARSE_RFQ_PROMPT = """\
You extract structured RFQ fields from a procurement buyer's voice transcript. \
The output feeds a voice-AI that will negotiate with vendors, so precision matters - never guess.

Return strict JSON with exactly these keys. Use null for anything not stated.

Extraction rules per field:
- product_description (string): free-text spec - grade, dimensions, material, tolerances. \
Extract VERBATIM from the buyer's words; do NOT summarize or paraphrase. \
This is the #1 anchor for any quote.
- product_category (string): short category label for Crust Data search \
(e.g. "CNC-machined aluminum enclosures", "custom PCBs", "plastic bottles"). \
Infer from product_description if not said directly.
- location (string): country the RFQ is sourced from (3-letter ISO code like "USA", "IND", "CHN") if stated.
- quantity (integer): numeric quantity.
- unit_of_measure (string, one of: units | kg | tons | meters | liters | pieces): \
pairs with quantity. Infer from product type if buyer omits \
(plastic pellets -> kg, bottles -> units, metal parts -> pieces).
- target_unit_price (number): per-unit anchor price. \
Extract ONLY if buyer states per-unit explicitly ("under $0.50 a piece"). \
NEVER divide total budget by quantity.
- budget_min (number): total budget lower bound if stated.
- budget_max (number): total budget upper bound if stated.
- delivery_destination (string): "City, Country" more specific than location. \
If buyer gives only country, still record it.
- timeline_weeks (integer): delivery window in weeks.
- certifications (string[]): RoHS, ISO 9001, REACH, FDA, UL, etc. \
Extract acronym matches only; do NOT infer from product category.
- payment_terms (string, one of: advance | net_30 | net_60 | net_90): \
extract only if stated; leave null otherwise.
- sample_required (boolean): true if buyer mentions "sample", "prototype", "swatch"; default false.
- recurring (boolean): true if buyer says "monthly", "quarterly", "ongoing", "repeat"; \
default false (one-time).

Return only JSON, no prose.

Transcript:
{transcript}
"""

UOM_ALLOWED = {"units", "kg", "tons", "meters", "liters", "pieces"}
PAYMENT_TERMS_ALLOWED = {"advance", "net_30", "net_60", "net_90"}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _call_anthropic(client: Anthropic, model: str, prompt: str) -> str:
    """Make the API call to Anthropic with exponential backoff."""
    msg = client.messages.create(
        model=model,
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(b.text for b in msg.content if getattr(b, "type", "") == "text").strip()


def parse_rfq(client: Anthropic, model: str, transcript: str) -> ParsedRFQFields:
    """Parse a voice transcript into structured RFQ fields using Claude.

    Args:
        client: Anthropic API client.
        model: Model name (e.g. "claude-sonnet-4-6").
        transcript: Raw voice transcript text.

    Returns:
        Validated ParsedRFQFields with coerced types.

    Raises:
        ExternalServiceError: If the Claude API call fails or returns unparseable output.
    """
    try:
        text = _call_anthropic(client, model, PARSE_RFQ_PROMPT.format(transcript=transcript))
    except APIError as e:
        logger.exception("Anthropic API call failed during RFQ parsing")
        raise ExternalServiceError("Anthropic", str(e)) from e

    raw = _extract_json(text)
    return _coerce_fields(raw)


def _extract_json(text: str) -> dict[str, Any]:
    """Strip markdown code fences and parse JSON."""
    cleaned = text
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").split("\n", 1)[-1].rsplit("```", 1)[0]
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse LLM JSON output: %s", cleaned[:200])
        raise ExternalServiceError("Anthropic", f"Invalid JSON in response: {e}") from e


def _coerce_fields(raw: dict[str, Any]) -> ParsedRFQFields:
    """Coerce raw LLM JSON into validated, typed fields."""
    certs_raw = raw.get("certifications") or []
    certs = [s for s in (coerce_str(c) for c in certs_raw) if s]

    return ParsedRFQFields(
        product_description=coerce_str(raw.get("product_description")),
        product_category=coerce_str(raw.get("product_category")),
        location=coerce_str(raw.get("location")),
        quantity=coerce_int(raw.get("quantity")),
        unit_of_measure=coerce_enum(raw.get("unit_of_measure"), UOM_ALLOWED),
        target_unit_price=coerce_float(raw.get("target_unit_price")),
        budget_min=coerce_float(raw.get("budget_min")),
        budget_max=coerce_float(raw.get("budget_max")),
        delivery_destination=coerce_str(raw.get("delivery_destination")),
        timeline_weeks=coerce_int(raw.get("timeline_weeks")),
        certifications=certs,
        payment_terms=coerce_enum(raw.get("payment_terms"), PAYMENT_TERMS_ALLOWED),
        sample_required=coerce_bool(raw.get("sample_required")),
        recurring=coerce_bool(raw.get("recurring")),
    )
