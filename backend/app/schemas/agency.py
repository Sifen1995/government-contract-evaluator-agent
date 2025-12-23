"""
Agency and Contact Schemas

Pydantic schemas for government agencies, contacts, and matching.

Reference: TICKET-018, TICKET-019 from IMPLEMENTATION_TICKETS.md
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class ContactType:
    OSDBU = "osdbu"
    CONTRACTING_OFFICER = "contracting_officer"
    INDUSTRY_LIAISON = "industry_liaison"


class AgencyLevel:
    DEPARTMENT = "department"
    AGENCY = "agency"
    SUB_AGENCY = "sub_agency"
    OFFICE = "office"


# ============== Agency Schemas ==============

class AgencyBase(BaseModel):
    """Base agency schema."""
    name: str
    abbreviation: Optional[str] = None
    level: Optional[str] = None


class AgencyCreate(AgencyBase):
    """Schema for creating an agency."""
    parent_agency_id: Optional[UUID] = None
    sam_gov_id: Optional[str] = None
    usaspending_id: Optional[str] = None
    small_business_url: Optional[str] = None
    forecast_url: Optional[str] = None
    vendor_portal_url: Optional[str] = None
    small_business_goal_pct: Optional[Decimal] = None
    eight_a_goal_pct: Optional[Decimal] = None
    wosb_goal_pct: Optional[Decimal] = None
    sdvosb_goal_pct: Optional[Decimal] = None
    hubzone_goal_pct: Optional[Decimal] = None


class AgencyResponse(AgencyBase):
    """Response schema for an agency."""
    id: UUID
    parent_agency_id: Optional[UUID] = None
    sam_gov_id: Optional[str] = None
    usaspending_id: Optional[str] = None
    small_business_url: Optional[str] = None
    forecast_url: Optional[str] = None
    vendor_portal_url: Optional[str] = None
    small_business_goal_pct: Optional[float] = None
    eight_a_goal_pct: Optional[float] = None
    wosb_goal_pct: Optional[float] = None
    sdvosb_goal_pct: Optional[float] = None
    hubzone_goal_pct: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgencyDetailResponse(AgencyResponse):
    """Detailed agency response with contacts and stats."""
    contacts: List["ContactResponse"] = []
    active_opportunities_count: int = 0
    avg_contract_value: Optional[float] = None


class AgencyListResponse(BaseModel):
    """Response for listing agencies."""
    agencies: List[AgencyResponse]
    total: int


# ============== Contact Schemas ==============

class ContactBase(BaseModel):
    """Base contact schema."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_type: str


class ContactCreate(ContactBase):
    """Schema for creating a contact."""
    agency_id: Optional[UUID] = None
    office_name: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None


class ContactResponse(ContactBase):
    """Response schema for a contact."""
    id: UUID
    agency_id: Optional[UUID] = None
    office_name: Optional[str] = None
    full_name: str = ""
    is_active: bool = True
    last_verified: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContactListResponse(BaseModel):
    """Response for listing contacts."""
    contacts: List[ContactResponse]
    total: int


# ============== Matching Schemas ==============

class AgencyMatchScore(BaseModel):
    """Match score between a company and an agency."""
    agency_id: UUID
    agency_name: str
    agency_abbreviation: Optional[str] = None
    match_score: int = Field(..., ge=0, le=100)
    naics_score: int = Field(0, ge=0, le=100)
    set_aside_score: int = Field(0, ge=0, le=100)
    geographic_score: int = Field(0, ge=0, le=100)
    award_history_score: int = Field(0, ge=0, le=100)
    reasoning: Optional[str] = None
    active_opportunities_count: int = 0
    avg_contract_value: Optional[float] = None

    class Config:
        from_attributes = True


class RecommendedAgenciesResponse(BaseModel):
    """Response for recommended agencies."""
    agencies: List[AgencyMatchScore]
    total: int


class OpportunityContactsResponse(BaseModel):
    """Response for opportunity-specific contacts."""
    contracting_officer: Optional[ContactResponse] = None
    osdbu_contact: Optional[ContactResponse] = None
    industry_liaison: Optional[ContactResponse] = None
    agency: Optional[AgencyResponse] = None


# Forward reference update
AgencyDetailResponse.model_rebuild()
