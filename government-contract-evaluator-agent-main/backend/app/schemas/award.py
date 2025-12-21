from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AwardOut(BaseModel):
    source_id: str
    agency: Optional[str]
    vendor: Optional[str]
    naics: Optional[str]
    amount: Optional[float]
    award_date: Optional[datetime]
    award_type: Optional[str]

    class Config:
        orm_mode = True
