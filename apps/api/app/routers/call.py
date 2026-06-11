"""Call trigger endpoints."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, Request

from app.auth import verify_api_key
from app.dependencies import get_app_settings, get_supabase_client
from app.exceptions import ConfigurationError, ResourceNotFoundError, ValidationError
from app.models.call import CallRequest, CallResponse, CallVendorRequest
from app.rate_limiter import limiter
from app.services.call_manager import build_call_variables
from app.utils.phone import get_vendor_phone
from vapi import trigger_call

from app.config import Settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["calls"])


@router.post("/call-vendor", response_model=CallResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit("50/minute")
def handle_call_vendor(
    request: Request,
    req: CallVendorRequest,
    settings: Settings = Depends(get_app_settings),
) -> CallResponse:
    """Trigger a Vapi call to a vendor using RFQ + vendor data from the database."""
    if not settings.vapi_assistant_id:
        raise ConfigurationError("Vapi (VAPI_ASSISTANT_ID)")

    sb = get_supabase_client(settings)

    rfq_resp = sb.table("rfqs").select("*").eq("id", req.rfq_id).limit(1).execute()
    if not rfq_resp.data:
        raise ResourceNotFoundError("RFQ", req.rfq_id)

    vendor_resp = sb.table("vendors").select("*").eq("id", req.vendor_id).limit(1).execute()
    if not vendor_resp.data:
        raise ResourceNotFoundError("Vendor", req.vendor_id)

    rfq = rfq_resp.data[0]
    vendor = vendor_resp.data[0]
    variables = build_call_variables(rfq, vendor)
    metadata = {"rfq_id": req.rfq_id, "vendor_id": req.vendor_id}
    vendor_phone = get_vendor_phone(vendor, settings.vendor_phone_override)

    if not vendor_phone:
        raise ValidationError("Vendor phone is missing or not E.164. Set VENDOR_PHONE_OVERRIDE for demo calls.")

    try:
        result = trigger_call(
            assistant_id=settings.vapi_assistant_id,
            vendor_phone=vendor_phone,
            variables=variables,
            metadata=metadata,
        )
    except ValueError as e:
        raise ValidationError(str(e)) from e
    except RuntimeError as e:
        raise ConfigurationError(str(e)) from e
    except Exception:
        logger.exception("Vapi trigger_call failed")
        raise

    call_id = result.get("id", "unknown")

    try:
        sb.table("vendors").update({"status": "calling"}).eq("id", req.vendor_id).execute()
    except Exception:
        logger.exception("Failed to update vendor status to 'calling', vendor_id=%s", req.vendor_id)

    return CallResponse(call_id=call_id)


@router.post("/call", response_model=CallResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit("50/minute")
def handle_make_call(
    request: Request,
    req: CallRequest,
    settings: Settings = Depends(get_app_settings),
) -> CallResponse:
    """Trigger a generic Vapi call with explicitly-provided variables."""
    variables = {
        "buyer_company": req.buyer_company,
        "buyer_one_liner": req.buyer_one_liner,
        "vendor_company": req.vendor_company,
        "contact_first_name": req.contact_first_name,
        "rfq_one_liner": req.rfq_one_liner,
        "preferred_process": req.preferred_process,
        "preferred_material": req.preferred_material,
        "target_quantity_phrase": req.target_quantity_phrase,
        "eau_phrase": req.eau_phrase,
        "key_constraint": req.key_constraint,
        "required_certifications": req.required_certifications,
        "email_followup_contact": req.email_followup_contact,
    }
    metadata: dict[str, Any] = {}
    if req.rfq_id:
        metadata["rfq_id"] = req.rfq_id
    if req.vendor_id:
        metadata["vendor_id"] = req.vendor_id
    if req.callback_url:
        metadata["callback_url"] = req.callback_url

    try:
        result = trigger_call(
            assistant_id=req.assistant_id,
            vendor_phone=req.vendor_phone,
            variables=variables,
            metadata=metadata,
        )
    except ValueError as e:
        raise ValidationError(str(e)) from e
    except RuntimeError as e:
        raise ConfigurationError(str(e)) from e
    except Exception:
        logger.exception("Vapi trigger_call failed")
        raise

    return CallResponse(call_id=result.get("id", "unknown"))
