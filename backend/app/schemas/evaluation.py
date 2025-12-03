from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class EvaluationBase(BaseModel):
    fit_score: int = Field(..., ge=0, le=100)
    win_probability: int = Field(..., ge=0, le=100)
    recommendation: str  # BID, NO_BID, REVIEW
    confidence: Optional[int] = Field(None, ge=0, le=100)
    reasoning: Optional[str] = None
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    executive_summary: Optional[str] = None


class EvaluationCreate(EvaluationBase):
    opportunity_id: uuid.UUID
    company_id: uuid.UUID


class Evaluation(EvaluationBase):
    id: uuid.UUID
    opportunity_id: uuid.UUID
    company_id: uuid.UUID
    evaluated_at: datetime

    class Config:
        from_attributes = True


class EvaluationRequest(BaseModel):
    opportunity_id: uuid.UUID
    force_reevaluate: bool = False
