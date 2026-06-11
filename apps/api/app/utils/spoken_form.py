"""Convert structured data into spoken-form strings for TTS.

Vapi's TTS reads these values aloud, so digits and units need to be
phrased naturally (e.g. "five hundred units" not "500 units").
"""

from __future__ import annotations

_NUM_WORDS: dict[int, str] = {
    0: "zero",
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
}


def quantity_phrase(qty: int | None, uom: str | None) -> str:
    """Convert a numeric quantity + unit into a spoken phrase.

    Examples:
        quantity_phrase(500, "units") -> "five hundred units"
        quantity_phrase(10_000, "kg") -> "10 thousand kg"
        quantity_phrase(None, None) -> "an unspecified quantity"
    """
    if qty is None:
        return "an unspecified quantity"

    if qty < 11:
        word = _NUM_WORDS[qty]
    elif qty < 1_000:
        word = str(qty)
    elif qty < 1_000_000:
        word = f"{qty / 1_000:.1f}".rstrip("0").rstrip(".") + " thousand"
    else:
        word = f"{qty / 1_000_000:.1f}".rstrip("0").rstrip(".") + " million"

    unit = uom or "units"
    return f"{word} {unit}"


def eau_phrase(qty: int | None, uom: str | None, recurring: bool) -> str:
    """Convert quantity info into an estimated annual usage spoken phrase.

    Examples:
        eau_phrase(500, "units", True) -> "around five hundred units per year"
        eau_phrase(500, "units", False) -> "a one-time order of five hundred units"
    """
    if qty is None:
        return "ongoing volume to be confirmed"

    base = quantity_phrase(qty, uom)
    return f"around {base} per year" if recurring else f"a one-time order of {base}"


def email_to_spoken(email: str) -> str:
    """Convert an email address to spoken form for TTS.

    Example: "team@vendrsurf.com" -> "team at vendrsurf dot com"
    """
    return email.replace("@", " at ").replace(".", " dot ")
