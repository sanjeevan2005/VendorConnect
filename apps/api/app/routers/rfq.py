"""RFQ parsing endpoint."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.config import Settings
from app.dependencies import get_anthropic_client, get_app_settings
from app.models.rfq import ParseRFQRequest, ParseRFQResponse
from app.services.rfq_parser import parse_rfq

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
