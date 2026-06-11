"""Phone number normalization utilities."""

from __future__ import annotations

from typing import Any

from app.utils.coerce import coerce_str


def normalize_phone(value: Any) -> str | None:
    """Normalize a phone value to E.164 format.

    Returns the cleaned number if it starts with '+' and has at least
    8 digits, otherwise None.
    """
    phone = coerce_str(value)
    if not phone:
        return None
    cleaned = "".join(c for c in phone if c.isdigit() or c == "+")
    if cleaned.startswith("+") and len(cleaned) >= 8:
        return cleaned
    return None


def get_vendor_phone(vendor: dict[str, Any], phone_override: str = "") -> str | None:
    """Extract the best phone number for a vendor.

    If a phone override is configured (for demo calls), it takes precedence.
    Otherwise, the vendor's contact phone is used.
    """
    if phone_override:
        return normalize_phone(phone_override)
    contact = vendor.get("contact") or {}
    return normalize_phone(contact.get("phone") or vendor.get("phone"))
