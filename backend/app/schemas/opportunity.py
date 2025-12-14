"""
Pydantic schemas for Opportunity and Evaluation models
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from uuid import UUID


# Opportunity Schemas

class OpportunityBase(BaseModel):
    """Base schema for Opportunity"""
    source: str = Field("sam.gov", description="Source of opportunity")
    source_id: str = Field(..., description="SAM.gov notice ID")
    solicitation_number: Optional[str] = Field(None, description="Solicitation number")
    title: str = Field(..., description="Opportunity title")
    description: Optional[str] = Field(None, description="Opportunity description")
    notice_type: Optional[str] = Field(None, description="Notice type")
    agency: Optional[str] = Field(None, description="Government agency")
    sub_agency: Optional[str] = Field(None, description="Sub-agency")
    office: Optional[str] = Field(None, description="Contracting office")
    naics_code: Optional[str] = Field(None, description="NAICS code")
    psc_code: Optional[str] = Field(None, description="Product Service Code")
    set_aside_type: Optional[str] = Field(None, description="Set-aside type")
    pop_city: Optional[str] = Field(None, description="Place of performance city")
    pop_state: Optional[str] = Field(None, description="Place of performance state")
    pop_zip: Optional[str] = Field(None, description="Place of performance ZIP")
    posted_date: Optional[datetime] = Field(None, description="Posted date")
    response_deadline: Optional[datetime] = Field(None, description="Response deadline")
    estimated_value_low: Optional[Decimal] = Field(None, description="Estimated value low")
    estimated_value_high: Optional[Decimal] = Field(None, description="Estimated value high")
    contact_name: Optional[str] = Field(None, description="Contact name")
    contact_email: Optional[str] = Field(None, description="Contact email")
    contact_phone: Optional[str] = Field(None, description="Contact phone")
    source_url: Optional[str] = Field(None, description="SAM.gov URL")
    attachments: Optional[Any] = Field(None, description="Attachments (list of URLs or dicts)")
    status: Optional[str] = Field("active", description="Status")


class OpportunityCreate(OpportunityBase):
    """Schema for creating an opportunity"""
    raw_data: Optional[Dict[str, Any]] = Field(None, description="Raw data from SAM.gov")


class OpportunityUpdate(BaseModel):
    """Schema for updating an opportunity"""
    title: Optional[str] = None
    description: Optional[str] = None
    response_deadline: Optional[datetime] = None
    status: Optional[str] = None


class OpportunityInDB(OpportunityBase):
    """Schema for opportunity in database"""
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, UUID):
            return str(v)
        return v

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
    fit_score: Optional[int] = Field(None, ge=0, le=100, description="Fit score (0-100)")
    win_probability: Optional[int] = Field(None, ge=0, le=100, description="Win probability (0-100)")
    recommendation: Optional[str] = Field(None, description="BID, NO_BID, or RESEARCH")
    confidence: Optional[int] = Field(None, ge=0, le=100, description="Confidence level (0-100)")
    reasoning: Optional[str] = Field(None, description="Detailed reasoning")
    strengths: Optional[List[str]] = Field(None, description="List of strengths")
    weaknesses: Optional[List[str]] = Field(None, description="List of weaknesses")
    executive_summary: Optional[str] = Field(None, description="Executive summary")


class EvaluationCreate(EvaluationBase):
    """Schema for creating an evaluation"""
    opportunity_id: str
    company_id: str


class EvaluationUpdate(BaseModel):
    """Schema for updating an evaluation"""
    fit_score: Optional[int] = None
    win_probability: Optional[int] = None
    recommendation: Optional[str] = None
    reasoning: Optional[str] = None


class EvaluationInDB(EvaluationBase):
    """Schema for evaluation in database"""
    id: str
    opportunity_id: str
    company_id: str
    evaluated_at: Optional[datetime] = None

    @field_validator('id', 'opportunity_id', 'company_id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, UUID):
            return str(v)
        return v

    # Aliases for backward compatibility
    @property
    def created_at(self):
        return self.evaluated_at

    @property
    def updated_at(self):
        return self.evaluated_at

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
