from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import uuid


class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    legal_structure: Optional[str] = Field(None, max_length=50)
    address_street: Optional[str] = Field(None, max_length=255)
    address_city: Optional[str] = Field(None, max_length=100)
    address_state: Optional[str] = Field(None, max_length=2)
    address_zip: Optional[str] = Field(None, max_length=10)
    uei: Optional[str] = Field(None, max_length=12)
    naics_codes: List[str] = Field(default_factory=list, max_length=10)
    set_asides: List[str] = Field(default_factory=list)
    capabilities: Optional[str] = Field(None, max_length=5000)
    contract_value_min: Optional[Decimal] = None
    contract_value_max: Optional[Decimal] = None
    geographic_preferences: Optional[List[str]] = Field(default_factory=list)


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    legal_structure: Optional[str] = Field(None, max_length=50)
    address_street: Optional[str] = Field(None, max_length=255)
    address_city: Optional[str] = Field(None, max_length=100)
    address_state: Optional[str] = Field(None, max_length=2)
    address_zip: Optional[str] = Field(None, max_length=10)
    uei: Optional[str] = Field(None, max_length=12)
    naics_codes: Optional[List[str]] = None
    set_asides: Optional[List[str]] = None
    capabilities: Optional[str] = Field(None, max_length=5000)
    contract_value_min: Optional[Decimal] = None
    contract_value_max: Optional[Decimal] = None
    geographic_preferences: Optional[List[str]] = None


class Company(CompanyBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
