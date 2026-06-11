"""Call-related Pydantic models."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CallRequest(BaseModel):
    """Request body for POST /api/call (generic call trigger)."""

    model_config = {"extra": "forbid"}
    assistant_id: str
    vendor_phone: str = Field(..., description="E.164 format, e.g. +14155551234")
    contact_first_name: str
    vendor_company: str
    buyer_company: str
    buyer_one_liner: str
    rfq_one_liner: str
    preferred_process: str
    preferred_material: str
    target_quantity_phrase: str = Field(..., description="Spoken form, e.g. 'five hundred units'")
    eau_phrase: str = Field(..., description="Spoken form, e.g. 'around ten thousand per year'")
    key_constraint: str
    required_certifications: str = "none"
    email_followup_contact: str = Field(..., description="Spoken form, e.g. 'kaustubh at vendrsurf dot com'")
    rfq_id: str | None = None
    vendor_id: str | None = None
    callback_url: str | None = Field(
        default=None,
        description="URL to POST webhook results to when call events arrive.",
    )


class CallVendorRequest(BaseModel):
    """Request body for POST /api/call-vendor (DB-backed call trigger)."""

    model_config = {"extra": "forbid"}
    rfq_id: str = Field(..., min_length=1)
    vendor_id: str = Field(..., min_length=1)


class CallResponse(BaseModel):
    """Response body for call trigger endpoints."""

    model_config = {"extra": "forbid"}
    call_id: str
    status: str = "triggered"
    message: str = "Call initiated successfully"


class WebhookResponse(BaseModel):
    """Response body for POST /vapi/webhook."""

    model_config = {"extra": "forbid"}
    received: bool = True
    event: str | None = None
