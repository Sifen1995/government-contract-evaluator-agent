from pydantic import BaseModel, field_validator
from typing import Optional, List, Any
from datetime import datetime
from decimal import Decimal
from uuid import UUID


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
