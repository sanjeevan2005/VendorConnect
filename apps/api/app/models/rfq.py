"""RFQ-related Pydantic models."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ParseRFQRequest(BaseModel):
    """Request body for POST /parse-rfq."""

    transcript: str = Field(..., min_length=1, description="Voice transcript to extract RFQ fields from.")


class ParsedRFQFields(BaseModel):
    """Structured fields extracted from an RFQ transcript."""

    product_description: str | None = None
    product_category: str | None = None
    location: str | None = None
    quantity: int | None = None
    unit_of_measure: str | None = None
    target_unit_price: float | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    delivery_destination: str | None = None
    timeline_weeks: int | None = None
    certifications: list[str] = Field(default_factory=list)
    payment_terms: str | None = None
    sample_required: bool = False
    recurring: bool = False


class ParseRFQResponse(BaseModel):
    """Response body for POST /parse-rfq."""

    fields: ParsedRFQFields
