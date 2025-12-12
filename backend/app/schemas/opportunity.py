"""
Pydantic schemas for Opportunity and Evaluation models
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


# Opportunity Schemas

class OpportunityBase(BaseModel):
    """Base schema for Opportunity"""
    notice_id: str = Field(..., description="SAM.gov notice ID")
    solicitation_number: Optional[str] = Field(None, description="Solicitation number")
    title: str = Field(..., description="Opportunity title")
    description: Optional[str] = Field(None, description="Opportunity description")
    department: Optional[str] = Field(None, description="Government department")
    sub_tier: Optional[str] = Field(None, description="Sub-tier organization")
    office: Optional[str] = Field(None, description="Contracting office")
    naics_code: Optional[str] = Field(None, description="NAICS code")
    naics_description: Optional[str] = Field(None, description="NAICS description")
    psc_code: Optional[str] = Field(None, description="Product Service Code")
    set_aside: Optional[str] = Field(None, description="Set-aside type")
    contract_value: Optional[Decimal] = Field(None, description="Contract value")
    contract_value_min: Optional[Decimal] = Field(None, description="Minimum contract value")
    contract_value_max: Optional[Decimal] = Field(None, description="Maximum contract value")
    posted_date: Optional[datetime] = Field(None, description="Posted date")
    response_deadline: Optional[datetime] = Field(None, description="Response deadline")
    archive_date: Optional[datetime] = Field(None, description="Archive date")
    place_of_performance_city: Optional[str] = Field(None, description="Place of performance city")
    place_of_performance_state: Optional[str] = Field(None, description="Place of performance state")
    place_of_performance_zip: Optional[str] = Field(None, description="Place of performance ZIP")
    place_of_performance_country: Optional[str] = Field(None, description="Place of performance country")
    primary_contact_name: Optional[str] = Field(None, description="Primary contact name")
    primary_contact_email: Optional[str] = Field(None, description="Primary contact email")
    primary_contact_phone: Optional[str] = Field(None, description="Primary contact phone")
    link: Optional[str] = Field(None, description="SAM.gov URL")
    attachment_links: Optional[List[Dict[str, str]]] = Field(None, description="Attachment links")
    type: Optional[str] = Field(None, description="Opportunity type")
    award_number: Optional[str] = Field(None, description="Award number")
    award_amount: Optional[Decimal] = Field(None, description="Award amount")
    is_active: bool = Field(True, description="Is active")


class OpportunityCreate(OpportunityBase):
    """Schema for creating an opportunity"""
    raw_data: Optional[Dict[str, Any]] = Field(None, description="Raw data from SAM.gov")


class OpportunityUpdate(BaseModel):
    """Schema for updating an opportunity"""
    title: Optional[str] = None
    description: Optional[str] = None
    response_deadline: Optional[datetime] = None
    is_active: Optional[bool] = None


class OpportunityInDB(OpportunityBase):
    """Schema for opportunity in database"""
    id: str
    created_at: datetime
    updated_at: datetime
    last_synced_at: datetime

    class Config:
        from_attributes = True


class OpportunityWithEvaluation(OpportunityInDB):
    """Schema for opportunity with its evaluation for a company"""
    evaluation: Optional["EvaluationInDB"] = None

    class Config:
        from_attributes = True


# Evaluation Schemas

class EvaluationBase(BaseModel):
    """Base schema for Evaluation"""
    fit_score: Decimal = Field(..., ge=0, le=100, description="Fit score (0-100)")
    win_probability: Decimal = Field(..., ge=0, le=100, description="Win probability (0-100)")
    recommendation: str = Field(..., description="BID, NO_BID, or RESEARCH")
    strengths: Optional[List[str]] = Field(None, description="List of strengths")
    weaknesses: Optional[List[str]] = Field(None, description="List of weaknesses")
    key_requirements: Optional[List[str]] = Field(None, description="Key requirements")
    missing_capabilities: Optional[List[str]] = Field(None, description="Missing capabilities")
    reasoning: Optional[str] = Field(None, description="Detailed reasoning")
    risk_factors: Optional[List[str]] = Field(None, description="Risk factors")
    naics_match: int = Field(0, ge=0, le=2, description="NAICS match score (0-2)")
    set_aside_match: int = Field(0, ge=0, le=1, description="Set-aside match (0-1)")
    geographic_match: int = Field(0, ge=0, le=1, description="Geographic match (0-1)")
    contract_value_match: int = Field(0, ge=0, le=1, description="Contract value match (0-1)")
    model_version: Optional[str] = Field(None, description="AI model version")
    tokens_used: Optional[int] = Field(None, description="Tokens used")
    evaluation_time_seconds: Optional[Decimal] = Field(None, description="Evaluation time")


class EvaluationCreate(EvaluationBase):
    """Schema for creating an evaluation"""
    opportunity_id: str
    company_id: str


class EvaluationUpdate(BaseModel):
    """Schema for updating an evaluation (user interaction)"""
    user_saved: Optional[str] = Field(None, description="WATCHING, BIDDING, PASSED, WON, LOST")
    user_notes: Optional[str] = Field(None, description="User notes")


class EvaluationInDB(EvaluationBase):
    """Schema for evaluation in database"""
    id: str
    opportunity_id: str
    company_id: str
    user_saved: Optional[str] = None
    user_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EvaluationWithOpportunity(EvaluationInDB):
    """Schema for evaluation with its opportunity"""
    opportunity: OpportunityInDB

    class Config:
        from_attributes = True


# Response schemas

class OpportunityListResponse(BaseModel):
    """Response schema for listing opportunities"""
    opportunities: List[OpportunityInDB]
    total: int
    skip: int
    limit: int


class EvaluationListResponse(BaseModel):
    """Response schema for listing evaluations"""
    evaluations: List[EvaluationWithOpportunity]
    total: int
    skip: int
    limit: int


class OpportunityStatsResponse(BaseModel):
    """Response schema for opportunity statistics"""
    total_opportunities: int
    active_opportunities: int
    total_evaluations: int
    bid_recommendations: int
    no_bid_recommendations: int
    research_recommendations: int
    avg_fit_score: Optional[float] = None
    avg_win_probability: Optional[float] = None
