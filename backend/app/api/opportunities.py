from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from ..core.database import get_db
from ..core.security import get_current_user, require_verified_email
from ..models.user import User
from ..models.opportunity import Opportunity
from ..schemas.opportunity import (
    OpportunityWithEvaluation, OpportunityList, OpportunityFilter
)
from ..schemas.pipeline import SavedOpportunityCreate
from ..services import opportunity as opportunity_service

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


@router.get("", response_model=OpportunityList)
def list_opportunities(
    set_aside: Optional[str] = None,
    agency: Optional[str] = None,
    naics_code: Optional[str] = None,
    min_score: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("fit_score", regex="^(fit_score|deadline|posted_date)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """List opportunities with evaluations"""
    filters = OpportunityFilter(
        set_aside=set_aside,
        agency=agency,
        naics_code=naics_code,
        min_score=min_score,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )

    opportunities, total = opportunity_service.get_opportunities_for_user(db, current_user, filters)
    pages = math.ceil(total / page_size)

    return {
        "items": opportunities,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }


@router.get("/{opportunity_id}", response_model=OpportunityWithEvaluation)
def get_opportunity(
    opportunity_id: str,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """Get opportunity detail with evaluation"""
    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )

    # Get evaluation if exists
    from ..models.evaluation import Evaluation
    evaluation = db.query(Evaluation).filter(
        Evaluation.opportunity_id == opportunity_id,
        Evaluation.company_id == current_user.company_id
    ).first()

    return {
        **opportunity.__dict__,
        "evaluation": evaluation
    }


@router.post("/{opportunity_id}/save", status_code=status.HTTP_201_CREATED)
def save_opportunity(
    opportunity_id: str,
    status: str = "watching",
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """Save opportunity to pipeline"""
    saved = opportunity_service.save_opportunity(
        db, str(current_user.id), opportunity_id, status
    )
    return {"message": "Opportunity saved", "saved": saved}


@router.delete("/{opportunity_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def remove_saved_opportunity(
    opportunity_id: str,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """Remove opportunity from pipeline"""
    from ..models.saved_opportunity import SavedOpportunity
    from sqlalchemy import and_

    saved = db.query(SavedOpportunity).filter(
        and_(
            SavedOpportunity.user_id == current_user.id,
            SavedOpportunity.opportunity_id == opportunity_id
        )
    ).first()

    if not saved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved opportunity not found"
        )

    db.delete(saved)
    db.commit()

    return None


@router.post("/{opportunity_id}/dismiss", status_code=status.HTTP_201_CREATED)
def dismiss_opportunity(
    opportunity_id: str,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """Dismiss an opportunity"""
    dismissed = opportunity_service.dismiss_opportunity(
        db, str(current_user.id), opportunity_id
    )
    return {"message": "Opportunity dismissed", "dismissed": dismissed}


@router.put("/{opportunity_id}/status", status_code=status.HTTP_200_OK)
def update_opportunity_status(
    opportunity_id: str,
    status: str,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """Update pipeline opportunity status"""
    from ..models.saved_opportunity import SavedOpportunity
    from sqlalchemy import and_

    saved = db.query(SavedOpportunity).filter(
        and_(
            SavedOpportunity.user_id == current_user.id,
            SavedOpportunity.opportunity_id == opportunity_id
        )
    ).first()

    if not saved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved opportunity not found"
        )

    saved.status = status
    db.commit()
    db.refresh(saved)

    return {"message": "Status updated", "saved": saved}


@router.post("/{opportunity_id}/notes", status_code=status.HTTP_200_OK)
def add_opportunity_notes(
    opportunity_id: str,
    notes: str,
    current_user: User = Depends(require_verified_email),
    db: Session = Depends(get_db)
):
    """Add notes to a saved opportunity"""
    from ..models.saved_opportunity import SavedOpportunity
    from sqlalchemy import and_

    saved = db.query(SavedOpportunity).filter(
        and_(
            SavedOpportunity.user_id == current_user.id,
            SavedOpportunity.opportunity_id == opportunity_id
        )
    ).first()

    if not saved:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved opportunity not found"
        )

    saved.notes = notes
    db.commit()
    db.refresh(saved)

    return {"message": "Notes added", "saved": saved}
