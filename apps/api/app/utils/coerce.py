"""Type coercion helpers for LLM-parsed JSON.

LLM responses return loosely-typed JSON. These functions coerce raw values
into strict Python types with consistent null handling.
"""

from __future__ import annotations

from typing import Any


def coerce_int(value: Any) -> int | None:
    """Coerce a value to int, returning None for missing/invalid values."""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        return int(s)
    except (ValueError, TypeError):
        return None


def coerce_float(value: Any) -> float | None:
    """Coerce a value to float, returning None for missing/invalid values."""
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def coerce_str(value: Any) -> str | None:
    """Coerce a value to a non-empty string, returning None for blank/missing values."""
    if value is None:
        return None
    s = str(value).strip()
    return s or None


def coerce_bool(value: Any) -> bool:
    """Coerce a value to bool. Only truthy string values return True."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ("true", "yes", "1")
    return False


def coerce_enum(value: Any, allowed: set[str]) -> str | None:
    """Coerce a value to one of the allowed enum strings (case-insensitive).

    Returns None if the value is not in the allowed set.
    """
    s = coerce_str(value)
    if s is None:
        return None
    s = s.lower()
    return s if s in allowed else None
