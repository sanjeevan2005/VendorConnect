"""Vendor-related Pydantic models."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class DiscoverVendorsRequest(BaseModel):
    """Request body for POST /discover-vendors."""
    model_config = {"extra": "forbid"}


    rfq_id: str = Field(..., min_length=1, description="RFQ identifier.")
    location: str | None = Field(default=None, description="ISO3 country code (e.g. 'USA').")
    product_category: str = Field(..., min_length=1, description="Short category label for search.")
    quantity: int | None = Field(default=None, ge=1)
    budget_min: float | None = Field(default=None, ge=0)
    budget_max: float | None = Field(default=None, ge=0)
    timeline_weeks: int | None = Field(default=None, ge=1)


class VendorContact(BaseModel):
    """Point-of-contact information discovered via Crust Data."""
    model_config = {"extra": "forbid"}


    name: str | None = None
    title: str | None = None
    linkedin: str | None = None
    has_business_email: bool = False


class VendorRow(BaseModel):
    """A vendor record as stored in Supabase and returned to the frontend."""
    model_config = {"extra": "forbid"}


    id: str
    rfq_id: str
    name: str = "Unknown"
    location: str | None = None
    employees: str | None = None
    contact: VendorContact | dict[str, Any] | None = None
    status: str = "discovered"
    unit_price: float | None = None
    lead_time: int | None = None
    moq: int | None = None
    nre: float | None = None
    email: str | None = None
    call_duration: str | None = None
    call_outcome: str | None = None
    summary: str | None = None
    payment_terms: str | None = None


class SearchPlan(BaseModel):
    """AI-generated search plan for vendor discovery."""
    model_config = {"extra": "forbid"}


    categories: list[str] = Field(default_factory=list)
    specialities: list[str] = Field(default_factory=list)
    title_keywords: list[str] = Field(default_factory=list)
    headcount_range: list[int | None] | None = None


class DiscoverVendorsResponse(BaseModel):
    """Response body for POST /discover-vendors."""
    model_config = {"extra": "forbid"}


    vendors: list[dict[str, Any]] = Field(default_factory=list)
    search_plan: SearchPlan
    auto_call_error: str | None = None
