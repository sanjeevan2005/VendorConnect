"""RFQ parsing endpoint."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Depends

from app.dependencies import get_anthropic_client, get_app_settings, get_supabase_client
from app.models.rfq import CreateRFQRequest, ParseRFQRequest, ParseRFQResponse
from app.services.rfq_parser import parse_rfq

if TYPE_CHECKING:
    from app.config import Settings

router = APIRouter(tags=["rfq"])


@router.post("/parse-rfq", response_model=ParseRFQResponse)
def handle_parse_rfq(
    req: ParseRFQRequest,
    settings: Settings = Depends(get_app_settings),
) -> ParseRFQResponse:
    """Parse a voice transcript into structured RFQ fields using Claude."""
    client = get_anthropic_client(settings)
    fields = parse_rfq(client, settings.anthropic_model, req.transcript)
    return ParseRFQResponse(fields=fields)


@router.get("/rfqs")
def list_rfqs(
    settings: Settings = Depends(get_app_settings),
) -> dict[str, Any]:
    """Fetch all RFQs (Replacing frontend Supabase query)."""
    sb = get_supabase_client(settings)
    res = sb.table("rfqs").select("*").execute()
    return {"data": res.data}


@router.post("/rfqs")
def create_rfq(
    req: CreateRFQRequest,
    settings: Settings = Depends(get_app_settings),
) -> dict[str, Any]:
    """Create a new RFQ."""
    sb = get_supabase_client(settings)
    row = req.model_dump()
    res = sb.table("rfqs").insert(row).execute()
    return {"data": res.data}


@router.get("/rfqs/{rfq_id}")
def get_rfq(
    rfq_id: str,
    settings: Settings = Depends(get_app_settings),
) -> dict[str, Any]:
    """Fetch a single RFQ and its vendors."""
    sb = get_supabase_client(settings)
    r_res = sb.table("rfqs").select("*").eq("id", rfq_id).maybeSingle().execute()
    v_res = sb.table("vendors").select("*").eq("rfq_id", rfq_id).execute()
    return {"rfqRow": r_res.data, "vendors": v_res.data}

