"""
Re-scoring Schemas

Pydantic schemas for evaluation re-scoring.

Reference: TICKET-029 from IMPLEMENTATION_TICKETS.md
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StaleCountResponse(BaseModel):
    """Response for stale evaluation count."""
    stale_count: int
    current_profile_version: int


class RescoreResponse(BaseModel):
    """Response for re-scoring operations."""
    rescored: int
    errors: int
    total: int
    message: str


class EvaluationStaleInfo(BaseModel):
    """Information about evaluation staleness."""
    is_stale: bool
    profile_version_at_evaluation: Optional[int] = None
    current_profile_version: int
    message: Optional[str] = None
