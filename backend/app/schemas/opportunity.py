from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal
import uuid


class OpportunityBase(BaseModel):
    source: str = "SAM"
    source_id: str
    solicitation_number: Optional[str] = None
    title: str
    description: Optional[str] = None
    notice_type: Optional[str] = None
    agency: Optional[str] = None
    sub_agency: Optional[str] = None
    office: Optional[str] = None
    naics_code: Optional[str] = None
    psc_code: Optional[str] = None
    set_aside_type: Optional[str] = None
    pop_city: Optional[str] = None
    pop_state: Optional[str] = None
    pop_zip: Optional[str] = None
    posted_date: Optional[datetime] = None
    response_deadline: Optional[datetime] = None
    estimated_value_low: Optional[Decimal] = None
    estimated_value_high: Optional[Decimal] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    source_url: Optional[str] = None
    attachments: Optional[List[dict]] = []
    status: str = "active"
    raw_data: Optional[dict] = None


class OpportunityCreate(OpportunityBase):
    pass


class Opportunity(OpportunityBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OpportunityWithEvaluation(Opportunity):
    evaluation: Optional[Any] = None


class OpportunityList(BaseModel):
    items: List[OpportunityWithEvaluation]
    total: int
    page: int
    page_size: int
    pages: int


class OpportunityFilter(BaseModel):
    set_aside: Optional[str] = None
    agency: Optional[str] = None
    naics_code: Optional[str] = None
    min_score: Optional[int] = None
    page: int = 1
    page_size: int = 20
    sort_by: str = "fit_score"
    sort_order: str = "desc"
