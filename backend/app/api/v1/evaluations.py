"""
Evaluation Re-scoring API Routes

Endpoints for managing evaluation re-scoring when profiles change.

Reference: TICKET-029 from IMPLEMENTATION_TICKETS.md
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.evaluation import Evaluation
from app.services import company as company_service
from app.services.rescoring import rescoring_service
from app.schemas.rescoring import StaleCountResponse, RescoreResponse, EvaluationStaleInfo
from app.schemas.auth import MessageResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_user_company(current_user: User, db: Session):
    """Helper to get user's company or raise 404."""
    company = company_service.get_user_company(db, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found. Please complete onboarding first."
        )
    return company


@router.get("/stale-count", response_model=StaleCountResponse)
def get_stale_evaluation_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get count of stale evaluations for the current user's company.

    - Returns count of evaluations based on old profile version
    - Use this to show user if re-scoring is needed
    """
    company = get_user_company(current_user, db)

    stale_count = rescoring_service.get_stale_count(db, company.id)

    return StaleCountResponse(
        stale_count=stale_count,
        current_profile_version=company.profile_version
    )


@router.post("/rescore-all", response_model=RescoreResponse)
async def rescore_all_evaluations(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger re-scoring of all stale evaluations.

    - Re-evaluates all evaluations based on old profile
    - Returns count of rescored evaluations
    - Rate limited to prevent abuse (handled by slowapi in production)
    """
    company = get_user_company(current_user, db)

    # Check if there are any stale evaluations
    stale_count = rescoring_service.get_stale_count(db, company.id)
    if stale_count == 0:
        return RescoreResponse(
            rescored=0,
            errors=0,
            total=0,
            message="No stale evaluations to rescore"
        )

    # Run re-scoring (synchronously for now, could be async in production)
    try:
        result = await rescoring_service.rescore_all_evaluations(db, company.id)
        return RescoreResponse(
            **result,
            message=f"Successfully rescored {result['rescored']} evaluations"
        )
    except Exception as e:
        logger.error(f"Error during bulk rescore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during re-scoring. Please try again later."
        )


@router.get("/{evaluation_id}/stale-info", response_model=EvaluationStaleInfo)
def get_evaluation_stale_info(
    evaluation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check if a specific evaluation is stale.

    - Returns staleness status and version info
    - Use to show warning on opportunity detail page
    """
    company = get_user_company(current_user, db)

    evaluation = db.query(Evaluation).filter(
        Evaluation.id == evaluation_id,
        Evaluation.company_id == company.id
    ).first()

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found"
        )

    is_stale = evaluation.is_stale
    message = None
    if is_stale:
        message = "This evaluation was based on an older version of your profile. Consider refreshing for accurate scores."

    return EvaluationStaleInfo(
        is_stale=is_stale,
        profile_version_at_evaluation=evaluation.profile_version_at_evaluation,
        current_profile_version=company.profile_version,
        message=message
    )


@router.post("/{evaluation_id}/refresh", response_model=MessageResponse)
async def refresh_evaluation(
    evaluation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Refresh a single evaluation with current profile.

    - Re-evaluates using AI with current company profile
    - Updates profile version tracking
    """
    company = get_user_company(current_user, db)

    evaluation = db.query(Evaluation).filter(
        Evaluation.id == evaluation_id,
        Evaluation.company_id == company.id
    ).first()

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found"
        )

    try:
        await rescoring_service.refresh_evaluation(db, evaluation)
        return MessageResponse(message="Evaluation refreshed successfully")
    except Exception as e:
        logger.error(f"Error refreshing evaluation {evaluation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error refreshing evaluation. Please try again later."
        )


@router.get("/profile-version")
def get_profile_version(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current profile version for the user's company.
    """
    company = get_user_company(current_user, db)

    return {
        "profile_version": company.profile_version,
        "company_id": str(company.id)
    }
