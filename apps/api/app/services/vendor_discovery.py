"""Vendor discovery service — finds matching suppliers via Crust Data + Claude."""

from __future__ import annotations

import json
import logging
import random
from typing import TYPE_CHECKING, Any

from tenacity import retry, stop_after_attempt, wait_exponential

if TYPE_CHECKING:
    import httpx
    from anthropic import Anthropic

logger = logging.getLogger(__name__)

CRUST_BASE = "https://api.crustdata.com"
WEEKS_TO_DAYS = 7

# Tunable mapping from RFQ quantity to preferred supplier headcount range.
# (qty_lo, qty_hi_exclusive, headcount_lo, headcount_hi)
QTY_TO_HEADCOUNT: list[tuple[int, int | None, int, int | None]] = [
    (0, 1_000, 10, 200),
    (1_000, 10_000, 50, 1_000),
    (10_000, 100_000, 200, 5_000),
    (100_000, None, 500, None),
]

SEARCH_PLAN_PROMPT = """\
You help a procurement tool find suppliers on Crust Data.

Given an RFQ, return strict JSON with three arrays:
- "categories": 2-4 broad Crust Data taxonomy terms for company category search. \
Example for "custom PCBs": ["PCB", "printed circuit board", "electronics manufacturing"].
- "specialities": 3-6 more specific LinkedIn-style speciality terms the supplier would list. \
Example for "custom PCBs": ["pcb design", "pcb assembly", "smt", "through-hole", "rigid-flex pcb"].
- "title_keywords": 3-6 job title fragments for procurement/sales POCs at suppliers. \
Example: ["procurement", "sourcing", "supply chain", "buyer", "sales", "business development"].

Return only JSON, no prose. Keep all terms lowercase.

RFQ:
{rfq}
"""

# ---------------------------------------------------------------------------
# Demo / dummy data
# ---------------------------------------------------------------------------

_DUMMY_STATUSES = ["responded", "qualified", "quoted", "no-response", "declined"]
_DUMMY_OUTCOMES: dict[str, str] = {
    "responded": "Interested, awaiting quote",
    "qualified": "Capability confirmed, moving to quote",
    "quoted": "Formal quote received",
    "no-response": "No callback after 2 attempts",
    "declined": "Capacity full this quarter",
}
_DUMMY_SUMMARIES: dict[str, str] = {
    "responded": "Spoke with sales lead - said they handle this volume regularly and will send a written quote within 48 hours.",
    "qualified": "Confirmed they have in-house tooling for the spec. Lead engineer to follow up with a tech callback to nail down tolerances.",
    "quoted": "Quote received: pricing competitive, lead time aligned. Open to negotiation on payment terms.",
    "no-response": "Two voicemails left, follow-up email sent. No callback yet - agent will retry mid-week.",
    "declined": "Politely declined: production line booked through Q3. Suggested checking back in 8 weeks.",
}


# ---------------------------------------------------------------------------
# Headcount heuristics
# ---------------------------------------------------------------------------


def headcount_range_for_quantity(qty: int | None) -> tuple[int, int | None] | None:
    """Map an RFQ quantity to a preferred supplier headcount range."""
    if qty is None:
        return None
    for q_lo, q_hi, h_lo, h_hi in QTY_TO_HEADCOUNT:
        if qty >= q_lo and (q_hi is None or qty < q_hi):
            return (h_lo, h_hi)
    return None


# ---------------------------------------------------------------------------
# Search plan generation (Claude)
# ---------------------------------------------------------------------------


def build_search_plan(
    anthropic_client: Anthropic | None,
    model: str,
    product_category: str,
    location: str | None,
    quantity: int | None,
    budget_min: float | None,
    budget_max: float | None,
    timeline_weeks: int | None,
) -> dict[str, Any]:
    """Use Claude to generate a multi-strategy search plan.

    Falls back to a simple category-based plan if Claude is unavailable.
    """
    fallback: dict[str, Any] = {
        "categories": [product_category],
        "specialities": [],
        "title_keywords": ["procurement", "supply", "sourcing", "purchasing", "buyer", "sales"],
    }

    if anthropic_client is None:
        return fallback

    rfq_text = json.dumps(
        {
            "product_category": product_category,
            "location": location,
            "quantity": quantity,
            "budget_min": budget_min,
            "budget_max": budget_max,
            "timeline_weeks": timeline_weeks,
        }
    )

    try:
        msg = anthropic_client.messages.create(
            model=model,
            max_tokens=400,
            messages=[{"role": "user", "content": SEARCH_PLAN_PROMPT.format(rfq=rfq_text)}],
        )
        text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text").strip()
        if text.startswith("```"):
            text = text.strip("`").split("\n", 1)[-1].rsplit("```", 1)[0]
        plan = json.loads(text)

        cats = [str(k).strip().lower() for k in plan.get("categories") or [] if str(k).strip()]
        specs = [str(k).strip().lower() for k in plan.get("specialities") or [] if str(k).strip()]
        titles = [str(r).strip().lower() for r in plan.get("title_keywords") or [] if str(r).strip()]

        return {
            "categories": cats or fallback["categories"],
            "specialities": specs,
            "title_keywords": titles or fallback["title_keywords"],
        }
    except Exception:
        logger.exception("Failed to build search plan via Claude; using fallback")
        return fallback


# ---------------------------------------------------------------------------
# Crust Data API wrappers
# ---------------------------------------------------------------------------


def _leaf(field: str, op: str, value: Any) -> dict[str, Any]:
    return {"field": field, "type": op, "value": value, "op": "and", "conditions": []}


def _group(conditions: list[dict[str, Any]], op: str = "and") -> dict[str, Any]:
    return {"field": "", "type": "", "value": "", "op": op, "conditions": conditions}


def _crust_headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Token {api_key}",
        "x-api-version": "2025-11-01",
        "Content-Type": "application/json",
    }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def crust_company_search(
    client: httpx.Client,
    headers: dict[str, str],
    category: str | None,
    speciality: str | None,
    country: str | None,
    headcount: tuple[int, int | None] | None,
) -> list[dict[str, Any]]:
    """Search Crust Data for companies matching the given criteria."""
    term_group: list[dict[str, Any]] = []
    if category:
        term_group.append(_leaf("taxonomy.categories", "(.)", category))
    if speciality:
        term_group.append(_leaf("taxonomy.professional_network_specialities", "(.)", speciality))

    conds: list[dict[str, Any]] = []
    if len(term_group) == 1:
        conds.append(term_group[0])
    elif term_group:
        conds.append(_group(term_group, op="or"))
    if country:
        conds.append(_leaf("locations.country", "=", country))
    if headcount:
        lo, hi = headcount
        if lo is not None:
            conds.append(_leaf("headcount.total", ">=", lo))
        if hi is not None:
            conds.append(_leaf("headcount.total", "<=", hi))

    payload = {"filters": _group(conds), "limit": 10}
    r = client.post(f"{CRUST_BASE}/company/search", json=payload, headers=headers, timeout=30.0)
    r.raise_for_status()
    return r.json().get("companies", [])


def search_companies_multi(
    client: httpx.Client,
    headers: dict[str, str],
    categories: list[str],
    specialities: list[str],
    country: str | None,
    headcount: tuple[int, int | None] | None,
) -> list[dict[str, Any]]:
    """Run multiple Crust Data searches with progressive filter relaxation.

    Strategy:
    1. Search by speciality (more granular matches)
    2. Search by category
    3. If <3 results: drop headcount filter
    4. If still <3: drop country filter
    """
    seen: dict[int, dict[str, Any]] = {}

    def _run(
        cats: list[str],
        specs: list[str],
        ctry: str | None,
        hc: tuple[int, int | None] | None,
    ) -> None:
        for sp in specs:
            try:
                for c in crust_company_search(client, headers, None, sp, ctry, hc):
                    cid = c.get("crustdata_company_id")
                    if cid and cid not in seen:
                        seen[cid] = c
            except Exception:
                logger.warning("Crust Data company search failed for speciality=%s", sp)
                continue
        for kw in cats:
            try:
                for c in crust_company_search(client, headers, kw, None, ctry, hc):
                    cid = c.get("crustdata_company_id")
                    if cid and cid not in seen:
                        seen[cid] = c
            except Exception:
                logger.warning("Crust Data company search failed for category=%s", kw)
                continue

    _run(categories, specialities, country, headcount)
    if len(seen) < 3 and headcount:
        logger.info("Relaxing headcount filter (only %d results so far)", len(seen))
        _run(categories, specialities, country, None)
    if len(seen) < 3 and country:
        logger.info("Relaxing country filter (only %d results so far)", len(seen))
        _run(categories, specialities, None, None)

    return list(seen.values())[:10]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def crust_person_search_for_company(
    client: httpx.Client,
    headers: dict[str, str],
    company_id: int,
    title_keywords: list[str],
) -> list[dict[str, Any]]:
    """Find people at a specific company via Crust Data person search."""
    title_conds = [_leaf("experience.employment_details.current.title", "(.)", t) for t in title_keywords]
    conds: list[dict[str, Any]] = [_leaf("experience.employment_details.company_id", "=", company_id)]
    if title_conds:
        conds.append(_group(title_conds, op="or") if len(title_conds) > 1 else title_conds[0])

    payload = {"filters": _group(conds), "limit": 10}
    try:
        r = client.post(f"{CRUST_BASE}/person/search", json=payload, headers=headers, timeout=30.0)
        r.raise_for_status()
        return r.json().get("profiles", [])
    except Exception:
        logger.warning("Person search with title filter failed for company_id=%d, retrying without", company_id)
        # Fall back without title filter — better a less-targeted POC than none
        try:
            r = client.post(
                f"{CRUST_BASE}/person/search",
                json={
                    "filters": _group([_leaf("experience.employment_details.company_id", "=", company_id)]),
                    "limit": 10,
                },
                headers=headers,
                timeout=30.0,
            )
            r.raise_for_status()
            return r.json().get("profiles", [])
        except Exception:
            logger.warning("Person search fallback also failed for company_id=%d", company_id)
            return []


# ---------------------------------------------------------------------------
# POC ranking
# ---------------------------------------------------------------------------


def pick_poc(
    profiles: list[dict[str, Any]],
    company_id: int,
    title_keywords: list[str],
) -> dict[str, Any] | None:
    """Rank and pick the best point-of-contact from search results."""
    ranked: list[tuple[int, dict[str, Any]]] = []
    for p in profiles:
        current = p.get("experience", {}).get("employment_details", {}).get("current") or []
        if not any(e.get("crustdata_company_id") == company_id for e in current):
            continue
        title = (p.get("basic_profile", {}).get("current_title") or "").lower()
        contact = p.get("contact", {}) or {}
        score = 0
        if any(t in title for t in title_keywords):
            score += 10
        if contact.get("has_business_email"):
            score += 5
        if contact.get("has_phone_number"):
            score += 2
        ranked.append((score, p))

    if not ranked:
        return None
    ranked.sort(key=lambda x: x[0], reverse=True)
    return _format_poc(ranked[0][1])


def _format_poc(p: dict[str, Any]) -> dict[str, Any]:
    """Format a Crust Data profile into a contact dict."""
    bp = p.get("basic_profile", {}) or {}
    social = p.get("social_handles", {}) or {}
    contact = p.get("contact", {}) or {}
    return {
        "name": bp.get("name"),
        "title": bp.get("current_title"),
        "linkedin": (social.get("professional_network_identifier") or {}).get("profile_url"),
        "has_business_email": bool(contact.get("has_business_email")),
    }


# ---------------------------------------------------------------------------
# Dummy vendor data (demo mode)
# ---------------------------------------------------------------------------


def populate_dummy_vendor(
    row: dict[str, Any],
    budget_min: float | None,
    budget_max: float | None,
    timeline_weeks: int | None,
) -> dict[str, Any]:
    """Fill a vendor row with deterministic synthetic outreach data.

    Uses the vendor ID as RNG seed so results are stable across requests.
    """
    rng = random.Random(row["id"])
    status = rng.choice(_DUMMY_STATUSES)

    contact = dict(row.get("contact") or {})
    if not contact.get("name"):
        contact["name"] = rng.choice(
            [
                "Alex Chen",
                "Priya Shah",
                "Marco Rossi",
                "Sam Patel",
                "Rin Tanaka",
                "Dana Klein",
            ]
        )
    if not contact.get("title"):
        contact["title"] = rng.choice(
            [
                "Sales Director",
                "Head of BD",
                "Procurement Lead",
                "Account Executive",
            ]
        )
    contact["email"] = _dummy_email_seeded(rng, row["name"])
    contact["phone"] = _dummy_phone_seeded(rng)
    row["contact"] = contact
    row["status"] = status
    row["email"] = contact["email"]

    if status in ("quoted", "qualified", "responded"):
        lo = budget_min or 20.0
        hi = budget_max or max(lo * 1.6, lo + 10)
        row["unit_price"] = round(rng.uniform(lo, hi), 2)
        if timeline_weeks is None:
            lead_weeks = rng.choice([3, 4, 5, 6, 8, 10, 12])
        else:
            lead_weeks = rng.randint(max(1, timeline_weeks - 2), timeline_weeks + 4)
        row["lead_time"] = lead_weeks * WEEKS_TO_DAYS
        row["payment_terms"] = rng.choice(["net_30", "net_60", "advance"])

    if status != "no-response":
        row["call_duration"] = f"{rng.randint(120, 480)}s"

    row["call_outcome"] = _DUMMY_OUTCOMES[status]
    row["summary"] = _DUMMY_SUMMARIES[status]
    return row


def _dummy_email_seeded(rng: random.Random, name: str) -> str:
    base = "".join(c.lower() for c in name if c.isalnum())[:18] or "info"
    handle = rng.choice(["sales", "procurement", "info", "contact", "sourcing"])
    return f"{handle}@{base}.com"


def _dummy_phone_seeded(rng: random.Random) -> str:
    area = rng.choice(["415", "650", "408", "212", "312", "617"])
    return f"+1{area}{rng.randint(2_000_000, 9_999_999)}"
