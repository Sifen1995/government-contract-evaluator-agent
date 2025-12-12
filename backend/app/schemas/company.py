from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class CompanyBase(BaseModel):
    name: str
    legal_structure: Optional[str] = None
    address_street: Optional[str] = None
    address_city: Optional[str] = None
    address_state: Optional[str] = None
    address_zip: Optional[str] = None
    uei: Optional[str] = None
    naics_codes: List[str] = []
    set_asides: List[str] = []
    capabilities: Optional[str] = None
    contract_value_min: Optional[Decimal] = None
    contract_value_max: Optional[Decimal] = None
    geographic_preferences: List[str] = []


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(CompanyBase):
    name: Optional[str] = None


class CompanyResponse(CompanyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
