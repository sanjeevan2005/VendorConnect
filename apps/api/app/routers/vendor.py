"""Vendor discovery endpoint."""

from __future__ import annotations

import logging
import uuid
from typing import TYPE_CHECKING, Any

import httpx
from fastapi import APIRouter, Depends, Request

from app.auth import verify_api_key
from app.dependencies import get_anthropic_client, get_app_settings, get_supabase_client
from app.exceptions import ConfigurationError, ExternalServiceError
from app.models.vendor import DiscoverVendorsRequest, DiscoverVendorsResponse, SearchPlan
from app.rate_limiter import limiter
from app.services.call_manager import build_call_variables
from app.services.vendor_discovery import (
    _crust_headers,
    build_search_plan,
    crust_person_search_for_company,
    headcount_range_for_quantity,
    pick_poc,
    populate_dummy_vendor,
    search_companies_multi,
)
from app.utils.phone import get_vendor_phone
from vapi import trigger_call

if TYPE_CHECKING:
    from app.config import Settings


logger = logging.getLogger(__name__)

router = APIRouter(tags=["vendors"])


@router.post("/discover-vendors", response_model=DiscoverVendorsResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
def handle_discover_vendors(
    request: Request,
    req: DiscoverVendorsRequest,
    settings: Settings = Depends(get_app_settings),
) -> DiscoverVendorsResponse:
    """Discover vendors for an RFQ via Crust Data, upsert to Supabase, and auto-call vendor #0."""
    if not settings.has_crust_data:
        raise ConfigurationError("Crust Data (CRUST_DATA_API_KEY)")

    sb = get_supabase_client(settings)

    # Build AI search plan
    anthropic_client = None
    if settings.has_anthropic:
        anthropic_client = get_anthropic_client(settings)

    plan = build_search_plan(
        anthropic_client,
        settings.anthropic_model,
        req.product_category,
        req.location,
        req.quantity,
        req.budget_min,
        req.budget_max,
        req.timeline_weeks,
    )
    categories = plan["categories"]
    specialities = plan["specialities"]
    title_keywords = plan["title_keywords"]
    headcount = headcount_range_for_quantity(req.quantity)
    headers = _crust_headers(settings.crust_data_api_key)

    try:
        with httpx.Client() as client:
            companies = search_companies_multi(
                client,
                headers,
                categories,
                specialities,
                req.location,
                headcount,
            )

            vendors_out: list[dict[str, Any]] = []
            auto_call_error: str | None = None

            for idx, c in enumerate(companies):
                basic = c.get("basic_info", {}) or {}
                loc = c.get("locations", {}) or {}
                headcount_info = c.get("headcount", {}) or {}
                company_id = c.get("crustdata_company_id")

                profiles = (
                    crust_person_search_for_company(client, headers, company_id, title_keywords) if company_id else []
                )
                contact = pick_poc(profiles, company_id, title_keywords) if profiles else None

                row: dict[str, Any] = {
                    "id": f"v-{uuid.uuid4().hex[:12]}",
                    "rfq_id": req.rfq_id,
                    "name": basic.get("name") or "Unknown",
                    "location": loc.get("country"),
                    "employees": (
                        str(headcount_info.get("total"))
                        if headcount_info.get("total") is not None
                        else basic.get("employee_count_range")
                    ),
                    "contact": contact,
                    "status": "discovered",
                }

                # Demo mode: only vendor #0 gets a real call; others get synthetic data
                if idx == 0:
                    if settings.vendor_phone_override:
                        contact_data = dict(row.get("contact") or {})
                        contact_data["phone"] = settings.vendor_phone_override
                        row["contact"] = contact_data
                else:
                    populate_dummy_vendor(row, req.budget_min, req.budget_max, req.timeline_weeks)

                sb.table("vendors").upsert(row).execute()
                vendors_out.append(row)

            # Auto-trigger Vapi call on vendor #0
            if vendors_out and settings.has_vapi:
                vendor0 = vendors_out[0]
                try:
                    rfq_resp = sb.table("rfqs").select("*").eq("id", req.rfq_id).limit(1).execute()
                    rfq_row = rfq_resp.data[0] if rfq_resp.data else {}
                    variables = build_call_variables(rfq_row, vendor0)
                    metadata = {"rfq_id": req.rfq_id, "vendor_id": vendor0["id"]}
                    vendor_phone = get_vendor_phone(vendor0, settings.vendor_phone_override)
                    if not vendor_phone:
                        raise ValueError("Vendor phone missing or not E.164")
                    trigger_call(
                        assistant_id=settings.vapi_assistant_id,
                        vendor_phone=vendor_phone,
                        variables=variables,
                        metadata=metadata,
                    )
                    sb.table("vendors").update({"status": "calling"}).eq("id", vendor0["id"]).execute()
                    vendors_out[0]["status"] = "calling"
                except Exception as e:
                    logger.exception("Auto-call on vendor #0 failed")
                    auto_call_error = str(e)

            return DiscoverVendorsResponse(
                vendors=vendors_out,
                search_plan=SearchPlan(
                    **plan,
                    headcount_range=list(headcount) if headcount else None,
                ),
                auto_call_error=auto_call_error,
            )
    except httpx.HTTPStatusError as e:
        raise ExternalServiceError(
            "Crust Data",
            f"{e.response.status_code}: {e.response.text[:200]}",
        ) from e


@router.get("/vendors/{vendor_id}", dependencies=[Depends(verify_api_key)])
@limiter.limit("50/minute")
def get_vendor(
    request: Request,
    vendor_id: str,
    settings: Settings = Depends(get_app_settings),
) -> dict[str, Any]:
    """Fetch a single vendor, its thread events, and call events."""
    sb = get_supabase_client(settings)

    v_res = sb.table("vendors").select("*").eq("id", vendor_id).maybeSingle().execute()
    e_res = sb.table("thread_events").select("*").eq("vendor_id", vendor_id).order("created_at", desc=False).execute()
    c_res = sb.table("call_events").select("*").eq("vendor_id", vendor_id).order("created_at", desc=False).execute()

    return {
        "vendor": v_res.data,
        "thread_events": e_res.data,
        "call_events": c_res.data,
    }
