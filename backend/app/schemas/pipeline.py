from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid


class SavedOpportunityBase(BaseModel):
    status: str = "watching"  # watching, pursuing, submitted, won, lost
    notes: Optional[str] = None


class SavedOpportunityCreate(SavedOpportunityBase):
    opportunity_id: uuid.UUID


class SavedOpportunityUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class SavedOpportunity(SavedOpportunityBase):
    id: uuid.UUID
    user_id: uuid.UUID
    opportunity_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class PipelineStats(BaseModel):
    watching: int = 0
    pursuing: int = 0
    submitted: int = 0
    won: int = 0
    lost: int = 0
    total: int = 0


class DeadlineItem(BaseModel):
    opportunity_id: uuid.UUID
    title: str
    response_deadline: datetime
    days_remaining: int
    status: str


class PipelineDeadlines(BaseModel):
    items: List[DeadlineItem]
    total: int
