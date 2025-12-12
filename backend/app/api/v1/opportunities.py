"""
API endpoints for opportunities and evaluations
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Optional
from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.opportunity import Opportunity
from app.models.evaluation import Evaluation
from app.schemas.opportunity import (
    OpportunityInDB,
    OpportunityWithEvaluation,
    OpportunityListResponse,
    OpportunityStatsResponse,
    EvaluationInDB,
    EvaluationWithOpportunity,
    EvaluationListResponse,
    EvaluationUpdate,
)
from app.services.opportunity import opportunity_service
from app.services.company import get_user_company
from tasks.discovery import evaluate_pending_opportunities_task
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# Opportunity endpoints

@router.get("/opportunities", response_model=OpportunityListResponse)
async def list_opportunities(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    naics_code: Optional[str] = None,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all opportunities (optionally filtered by NAICS code)
    """
    try:
        # Get user's company to filter by NAICS codes
        company = get_user_company(db, current_user.id)
        naics_codes = None

        if naics_code:
            naics_codes = [naics_code]
        elif company and company.naics_codes:
            naics_codes = company.naics_codes

        # Get opportunities
        opportunities = opportunity_service.list_opportunities(
            db,
            skip=skip,
            limit=limit,
            active_only=active_only,
            naics_codes=naics_codes
        )

        # Get total count
        query = db.query(Opportunity)
        if active_only:
            query = query.filter(Opportunity.is_active == True)
        if naics_codes:
            query = query.filter(Opportunity.naics_code.in_(naics_codes))
        total = query.count()

        return {
            "opportunities": opportunities,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    except Exception as e:
        logger.error(f"Error listing opportunities: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list opportunities")


@router.get("/opportunities/{opportunity_id}", response_model=OpportunityWithEvaluation)
async def get_opportunity(
    opportunity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific opportunity by ID (with evaluation if exists)
    """
    try:
        opportunity = opportunity_service.get_opportunity_by_id(db, opportunity_id)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")

        # Get company
        company = get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=400, detail="Company profile required")

        # Get evaluation if exists
        evaluation = opportunity_service.get_evaluation_for_opportunity(
            db, opportunity_id, company.id
        )

        # Convert to schema
        result = OpportunityWithEvaluation.from_orm(opportunity)
        result.evaluation = evaluation

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting opportunity: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get opportunity")


# Evaluation endpoints

@router.get("/evaluations", response_model=EvaluationListResponse)
async def list_evaluations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    recommendation: Optional[str] = Query(None, regex="^(BID|NO_BID|RESEARCH)$"),
    min_fit_score: Optional[float] = Query(None, ge=0, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List evaluations for the current user's company
    """
    try:
        # Get company
        company = get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=400, detail="Company profile required")

        # Get evaluations
        evaluations = opportunity_service.list_evaluations_for_company(
            db,
            company.id,
            skip=skip,
            limit=limit,
            recommendation=recommendation,
            min_fit_score=min_fit_score
        )

        # Get total count
        query = db.query(Evaluation).filter(Evaluation.company_id == company.id)
        if recommendation:
            query = query.filter(Evaluation.recommendation == recommendation)
        if min_fit_score is not None:
            query = query.filter(Evaluation.fit_score >= min_fit_score)
        total = query.count()

        # Load opportunities for each evaluation
        results = []
        for evaluation in evaluations:
            eval_with_opp = EvaluationWithOpportunity.from_orm(evaluation)
            eval_with_opp.opportunity = evaluation.opportunity
            results.append(eval_with_opp)

        return {
            "evaluations": results,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing evaluations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list evaluations")


@router.get("/evaluations/{evaluation_id}", response_model=EvaluationWithOpportunity)
async def get_evaluation(
    evaluation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific evaluation by ID
    """
    try:
        evaluation = opportunity_service.get_evaluation_by_id(db, evaluation_id)
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        # Verify user owns this evaluation
        company = get_user_company(db, current_user.id)
        if not company or evaluation.company_id != company.id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Load opportunity
        result = EvaluationWithOpportunity.from_orm(evaluation)
        result.opportunity = evaluation.opportunity

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting evaluation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get evaluation")


@router.put("/evaluations/{evaluation_id}", response_model=EvaluationInDB)
async def update_evaluation(
    evaluation_id: str,
    update_data: EvaluationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an evaluation (user interaction: save to pipeline, add notes)
    """
    try:
        evaluation = opportunity_service.get_evaluation_by_id(db, evaluation_id)
        if not evaluation:
            raise HTTPException(status_code=404, detail="Evaluation not found")

        # Verify user owns this evaluation
        company = get_user_company(db, current_user.id)
        if not company or evaluation.company_id != company.id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Update evaluation
        updated = opportunity_service.update_evaluation(
            db, evaluation_id, update_data.dict(exclude_unset=True)
        )

        return updated

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating evaluation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update evaluation")


# Stats endpoint

@router.get("/stats", response_model=OpportunityStatsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get opportunity and evaluation statistics for the current user's company
    """
    try:
        # Get company
        company = get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=400, detail="Company profile required")

        # Get total opportunities (matching company's NAICS codes)
        total_opportunities = db.query(Opportunity).filter(
            Opportunity.naics_code.in_(company.naics_codes)
        ).count()

        active_opportunities = db.query(Opportunity).filter(
            Opportunity.naics_code.in_(company.naics_codes),
            Opportunity.is_active == True
        ).count()

        # Get evaluation stats
        total_evaluations = db.query(Evaluation).filter(
            Evaluation.company_id == company.id
        ).count()

        bid_recommendations = db.query(Evaluation).filter(
            Evaluation.company_id == company.id,
            Evaluation.recommendation == "BID"
        ).count()

        no_bid_recommendations = db.query(Evaluation).filter(
            Evaluation.company_id == company.id,
            Evaluation.recommendation == "NO_BID"
        ).count()

        research_recommendations = db.query(Evaluation).filter(
            Evaluation.company_id == company.id,
            Evaluation.recommendation == "RESEARCH"
        ).count()

        # Get averages
        avg_scores = db.query(
            func.avg(Evaluation.fit_score).label("avg_fit"),
            func.avg(Evaluation.win_probability).label("avg_win")
        ).filter(
            Evaluation.company_id == company.id
        ).first()

        return {
            "total_opportunities": total_opportunities,
            "active_opportunities": active_opportunities,
            "total_evaluations": total_evaluations,
            "bid_recommendations": bid_recommendations,
            "no_bid_recommendations": no_bid_recommendations,
            "research_recommendations": research_recommendations,
            "avg_fit_score": float(avg_scores.avg_fit) if avg_scores.avg_fit else None,
            "avg_win_probability": float(avg_scores.avg_win) if avg_scores.avg_win else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")


# Action endpoints

# Pipeline endpoints

@router.get("/pipeline", response_model=EvaluationListResponse)
async def list_pipeline(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    status: Optional[str] = Query(None, regex="^(WATCHING|BIDDING|PASSED|WON|LOST)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List evaluations saved to pipeline (WATCHING, BIDDING, PASSED, WON, LOST)
    """
    try:
        # Get company
        company = get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=400, detail="Company profile required")

        # Build query
        query = db.query(Evaluation).filter(
            Evaluation.company_id == company.id,
            Evaluation.user_saved.isnot(None)
        )

        if status:
            query = query.filter(Evaluation.user_saved == status)

        total = query.count()

        # Get evaluations with pagination
        evaluations = query.order_by(Evaluation.updated_at.desc()).offset(skip).limit(limit).all()

        # Load opportunities for each evaluation
        results = []
        for evaluation in evaluations:
            eval_with_opp = EvaluationWithOpportunity.from_orm(evaluation)
            eval_with_opp.opportunity = evaluation.opportunity
            results.append(eval_with_opp)

        return {
            "evaluations": results,
            "total": total,
            "skip": skip,
            "limit": limit
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing pipeline: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to list pipeline")


@router.get("/pipeline/stats")
async def get_pipeline_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get pipeline statistics for the current user's company
    """
    try:
        # Get company
        company = get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=400, detail="Company profile required")

        # Count by status
        watching = db.query(Evaluation).filter(
            Evaluation.company_id == company.id,
            Evaluation.user_saved == "WATCHING"
        ).count()

        bidding = db.query(Evaluation).filter(
            Evaluation.company_id == company.id,
            Evaluation.user_saved == "BIDDING"
        ).count()

        passed = db.query(Evaluation).filter(
            Evaluation.company_id == company.id,
            Evaluation.user_saved == "PASSED"
        ).count()

        won = db.query(Evaluation).filter(
            Evaluation.company_id == company.id,
            Evaluation.user_saved == "WON"
        ).count()

        lost = db.query(Evaluation).filter(
            Evaluation.company_id == company.id,
            Evaluation.user_saved == "LOST"
        ).count()

        total = watching + bidding + passed + won + lost

        return {
            "total": total,
            "watching": watching,
            "bidding": bidding,
            "passed": passed,
            "won": won,
            "lost": lost,
            "win_rate": round(won / (won + lost) * 100, 1) if (won + lost) > 0 else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting pipeline stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get pipeline statistics")


@router.post("/actions/trigger-discovery")
async def trigger_discovery(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Manually trigger opportunity discovery and evaluation for user's company
    """
    try:
        # Get company
        company = get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=400, detail="Company profile required")

        # Run discovery synchronously (without Celery for local dev)
        try:
            result = evaluate_pending_opportunities_task(company.id)
            return {
                "message": "Discovery completed successfully",
                "result": result
            }
        except Exception as task_error:
            logger.error(f"Discovery task error: {str(task_error)}")
            return {
                "message": "Discovery triggered but encountered errors",
                "error": str(task_error)
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering discovery: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to trigger discovery")
