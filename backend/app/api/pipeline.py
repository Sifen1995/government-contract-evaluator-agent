from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_user, require_verified_email
from ..models.user import User
from ..schemas.pipeline import PipelineStats, PipelineDeadlines
from ..services import opportunity as opportunity_service

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.get("", response_model=list)
def get_pipeline(
    status: Optional[str] = Query(None, regex="^(watching|pursuing|submitted|won|lost)$"),
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """Get saved opportunities by status"""
    opportunities = opportunity_service.get_pipeline_opportunities(
        db, str(current_user.id), status
    )

    return opportunities


@router.get("/stats", response_model=PipelineStats)
def get_pipeline_stats(
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """Get pipeline statistics"""
    stats = opportunity_service.get_pipeline_stats(db, str(current_user.id))

    return stats


@router.get("/deadlines", response_model=PipelineDeadlines)
def get_upcoming_deadlines(
    days: int = Query(14, ge=1, le=90),
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """Get upcoming deadlines"""
    deadlines = opportunity_service.get_upcoming_deadlines(
        db, str(current_user.id), days
    )

    return {
        "items": deadlines,
        "total": len(deadlines)
    }
