"""
API endpoints for opportunities and evaluations
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
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
from app.services.match_scoring import match_scoring_service
from app.services.opportunity_filter import opportunity_filter
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# Opportunity endpoints

@router.get("/", response_model=List[OpportunityListResponse])
def list_opportunities(
    db: Session = Depends(get_db),

    source: Optional[str] = Query(None, description="Filter by data source"),
    is_forecast: Optional[bool] = Query(None, description="Forecast or live opportunities"),
    status: Optional[str] = Query("active", description="Opportunity status"),
):
    """
    List opportunities with optional filters.
    """

    query = db.query(Opportunity)

    if source:
        query = query.filter(Opportunity.source == source)

    if is_forecast is not None:
        query = query.filter(Opportunity.is_forecast == is_forecast)

    if status:
        query = query.filter(Opportunity.status == status)

    return query.order_by(Opportunity.posted_date.desc()).all()



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


@router.get("/opportunities/{opportunity_id}/contacts")
async def get_opportunity_contacts(
    opportunity_id: str,
    db: Session = Depends(get_db),
):
    """
    Get recommended contacts for an opportunity.

    Returns:
    - contracting_officer: The contracting officer from the opportunity (if available)
    - osdbu_contact: The OSDBU contact for the issuing agency (if available)
    - industry_liaison: The industry liaison for the agency (if available)
    - agency: The issuing agency details (if found)
    """
    from app.models.agency import Agency, GovernmentContact

    try:
        opportunity = opportunity_service.get_opportunity_by_id(db, opportunity_id)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")

        result = {
            "contracting_officer": None,
            "osdbu_contact": None,
            "industry_liaison": None,
            "agency": None
        }

        # Try to find the agency in our database
        agency = None
        if opportunity.issuing_agency:
            # Try to match by name or abbreviation
            agency = db.query(Agency).filter(
                (Agency.name.ilike(f"%{opportunity.issuing_agency}%")) |
                (Agency.abbreviation.ilike(f"%{opportunity.issuing_agency}%"))
            ).first()

        if agency:
            result["agency"] = {
                "id": str(agency.id),
                "name": agency.name,
                "abbreviation": agency.abbreviation,
                "small_business_url": agency.small_business_url,
                "forecast_url": agency.forecast_url,
                "vendor_portal_url": agency.vendor_portal_url
            }

            # Get OSDBU contact for this agency
            osdbu_contact = db.query(GovernmentContact).filter(
                GovernmentContact.agency_id == agency.id,
                GovernmentContact.contact_type == "osdbu",
                GovernmentContact.is_active == True
            ).first()

            if osdbu_contact:
                result["osdbu_contact"] = {
                    "id": str(osdbu_contact.id),
                    "first_name": osdbu_contact.first_name,
                    "last_name": osdbu_contact.last_name,
                    "title": osdbu_contact.title,
                    "email": osdbu_contact.email,
                    "phone": osdbu_contact.phone,
                    "contact_type": osdbu_contact.contact_type
                }

            # Get industry liaison if available
            industry_liaison = db.query(GovernmentContact).filter(
                GovernmentContact.agency_id == agency.id,
                GovernmentContact.contact_type == "industry_liaison",
                GovernmentContact.is_active == True
            ).first()

            if industry_liaison:
                result["industry_liaison"] = {
                    "id": str(industry_liaison.id),
                    "first_name": industry_liaison.first_name,
                    "last_name": industry_liaison.last_name,
                    "title": industry_liaison.title,
                    "email": industry_liaison.email,
                    "phone": industry_liaison.phone,
                    "contact_type": industry_liaison.contact_type
                }

        # Include opportunity's primary contact as contracting officer
        if opportunity.primary_contact_name or opportunity.primary_contact_email:
            result["contracting_officer"] = {
                "id": None,
                "first_name": opportunity.primary_contact_name.split()[0] if opportunity.primary_contact_name else None,
                "last_name": " ".join(opportunity.primary_contact_name.split()[1:]) if opportunity.primary_contact_name and len(opportunity.primary_contact_name.split()) > 1 else None,
                "title": "Contracting Officer",
                "email": opportunity.primary_contact_email,
                "phone": opportunity.primary_contact_phone,
                "contact_type": "contracting_officer"
            }

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting opportunity contacts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get opportunity contacts")


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
            Opportunity.status == "active"
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
        evaluations = query.order_by(Evaluation.evaluated_at.desc()).offset(skip).limit(limit).all()

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


@router.post("/opportunities/{opportunity_id}/evaluate")
async def evaluate_opportunity_lazy(
    opportunity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lazy evaluation: Evaluate an opportunity for the user's company on-demand.

    This endpoint:
    1. Returns existing evaluation if already evaluated
    2. Computes rule-based match score (instant, no AI)
    3. Triggers AI evaluation in background if not yet evaluated

    This approach provides immediate feedback while expensive AI evaluation
    runs asynchronously.
    """
    from app.services.ai_evaluator import ai_evaluator_service
    import asyncio

    try:
        # Get opportunity
        opportunity = opportunity_service.get_opportunity_by_id(db, opportunity_id)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")

        # Get company
        company = get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=400, detail="Company profile required")

        # Check for existing evaluation
        existing_eval = opportunity_service.get_evaluation_for_opportunity(
            db, opportunity_id, company.id
        )

        if existing_eval:
            # Return existing evaluation with opportunity data
            return {
                "status": "existing",
                "evaluation": {
                    "id": str(existing_eval.id),
                    "fit_score": existing_eval.fit_score,
                    "win_probability": existing_eval.win_probability,
                    "recommendation": existing_eval.recommendation,
                    "reasoning": existing_eval.reasoning,
                    "strengths": existing_eval.strengths,
                    "weaknesses": existing_eval.weaknesses,
                    "evaluated_at": existing_eval.evaluated_at.isoformat() if existing_eval.evaluated_at else None
                },
                "match_scores": None  # Already have full AI evaluation
            }

        # Check if opportunity passes basic filters
        filter_result = opportunity_filter.filter_opportunity(opportunity, company)

        if not filter_result.passed:
            # Opportunity filtered out - return quick NO_BID recommendation
            return {
                "status": "filtered",
                "filter_reason": filter_result.reason,
                "recommendation": "NO_BID",
                "match_scores": None,
                "message": f"Opportunity filtered: {filter_result.reason}"
            }

        # Compute instant rule-based match scores
        match_scores = match_scoring_service.compute_score(opportunity, company, db)

        # Cache the match scores
        try:
            match_scoring_service.compute_and_cache(db, opportunity, company)
        except Exception as e:
            logger.warning(f"Failed to cache match scores: {e}")

        # Determine quick recommendation based on match scores
        fit_score = match_scores['fit_score']
        if fit_score >= 70:
            quick_recommendation = "BID"
        elif fit_score >= 50:
            quick_recommendation = "RESEARCH"
        else:
            quick_recommendation = "NO_BID"

        # Perform AI evaluation synchronously for immediate result
        # (We could make this async/background for even faster response)
        try:
            eval_result = await ai_evaluator_service.evaluate_opportunity(
                opportunity, company
            )

            # Save evaluation
            eval_data = {
                "opportunity_id": opportunity.id,
                "company_id": company.id,
                **eval_result
            }
            saved_eval = opportunity_service.create_evaluation(db, eval_data)

            return {
                "status": "evaluated",
                "evaluation": {
                    "id": str(saved_eval.id),
                    "fit_score": saved_eval.fit_score,
                    "win_probability": saved_eval.win_probability,
                    "recommendation": saved_eval.recommendation,
                    "reasoning": saved_eval.reasoning,
                    "strengths": saved_eval.strengths,
                    "weaknesses": saved_eval.weaknesses,
                    "evaluated_at": saved_eval.evaluated_at.isoformat() if saved_eval.evaluated_at else None
                },
                "match_scores": match_scores
            }

        except Exception as e:
            logger.error(f"AI evaluation failed: {e}")
            # Return rule-based evaluation as fallback
            return {
                "status": "rule_based",
                "message": "AI evaluation unavailable, showing rule-based assessment",
                "evaluation": {
                    "fit_score": fit_score,
                    "recommendation": quick_recommendation,
                    "reasoning": f"Rule-based evaluation: NAICS match={match_scores['naics_score']}%, "
                                f"Certification match={match_scores['cert_score']}%, "
                                f"Size fit={match_scores['size_score']}%, "
                                f"Geographic fit={match_scores['geo_score']}%"
                },
                "match_scores": match_scores
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in lazy evaluation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to evaluate opportunity")


@router.get("/opportunities/{opportunity_id}/match-score")
async def get_match_score(
    opportunity_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get instant rule-based match score for an opportunity (no AI).

    This is a fast endpoint that returns immediately with rule-based scoring.
    Use this for quick filtering and sorting before requesting full AI evaluation.
    """
    try:
        # Get opportunity
        opportunity = opportunity_service.get_opportunity_by_id(db, opportunity_id)
        if not opportunity:
            raise HTTPException(status_code=404, detail="Opportunity not found")

        # Get company
        company = get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=400, detail="Company profile required")

        # Check cache first
        cached = match_scoring_service.get_cached_score(db, opportunity_id, str(company.id))

        if cached:
            return {
                "status": "cached",
                "fit_score": float(cached.fit_score) if cached.fit_score else None,
                "naics_score": float(cached.naics_score) if cached.naics_score else None,
                "cert_score": float(cached.cert_score) if cached.cert_score else None,
                "size_score": float(cached.size_score) if cached.size_score else None,
                "geo_score": float(cached.geo_score) if cached.geo_score else None,
                "deadline_score": float(cached.deadline_score) if cached.deadline_score else None,
                "computed_at": cached.computed_at.isoformat() if cached.computed_at else None
            }

        # Compute fresh scores
        scores = match_scoring_service.compute_score(opportunity, company, db)

        # Cache for future requests
        try:
            match_scoring_service.compute_and_cache(db, opportunity, company)
        except Exception as e:
            logger.warning(f"Failed to cache match scores: {e}")

        return {
            "status": "computed",
            **scores,
            "computed_at": None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error computing match score: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to compute match score")


@router.post("/actions/trigger-discovery")
async def trigger_discovery(
    force_refresh: bool = Query(False, description="Force refresh from SAM.gov even if cache is fresh"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Manually trigger opportunity discovery and evaluation for user's company.

    Uses smart caching - if opportunities for your NAICS codes were fetched
    within the last 15 minutes, it will use cached data instead of calling SAM.gov.

    Set force_refresh=true to bypass the cache.
    """
    from app.services.providers.sam_gov import sam_gov_service
    from app.services.ai_evaluator import ai_evaluator_service

    try:
        # Get company
        company = get_user_company(db, current_user.id)
        if not company:
            raise HTTPException(status_code=400, detail="Company profile required")

        if not company.naics_codes:
            raise HTTPException(status_code=400, detail="Company NAICS codes required")

        # Run discovery directly (async)
        try:
            discovered_count = 0
            evaluated_count = 0
            from_cache = False

            # Use smart search with caching
            logger.info(f"Smart search for NAICS codes: {company.naics_codes} (force_refresh={force_refresh})")
            result = await sam_gov_service.search_opportunities_smart(
                db=db,
                naics_codes=company.naics_codes,
                force_refresh=force_refresh,
                active=True,
                limit=50
            )

            from_cache = result.get("from_cache", False)
            raw_opportunities = result.get("opportunities", [])
            cached_opportunities = result.get("cached_opportunities")

            if from_cache:
                logger.info(f"Using {len(cached_opportunities) if cached_opportunities else 0} cached opportunities")
            else:
                logger.info(f"Found {len(raw_opportunities)} opportunities from SAM.gov")

            # Process each opportunity
            for raw_opp in raw_opportunities:
                try:
                    # Parse opportunity data
                    opp_data = sam_gov_service.parse_opportunity(raw_opp)

                    # Create or update opportunity
                    opportunity = opportunity_service.create_opportunity(db, opp_data)
                    discovered_count += 1

                    # Check if company's NAICS codes match this opportunity
                    logger.info(f"Checking opportunity {opportunity.notice_id}: NAICS={opportunity.naics_code}, Company NAICS={company.naics_codes}")
                    if opportunity.naics_code and opportunity.naics_code in company.naics_codes:
                        # Check if already evaluated
                        existing_eval = opportunity_service.get_evaluation_for_opportunity(
                            db, opportunity.id, company.id
                        )

                        if not existing_eval:
                            # Evaluate this opportunity for this company
                            try:
                                eval_result = await ai_evaluator_service.evaluate_opportunity(
                                    opportunity, company
                                )

                                # Save evaluation
                                eval_data = {
                                    "opportunity_id": opportunity.id,
                                    "company_id": company.id,
                                    **eval_result
                                }

                                opportunity_service.create_evaluation(db, eval_data)
                                evaluated_count += 1

                                logger.info(
                                    f"Evaluated opportunity {opportunity.notice_id}: "
                                    f"{eval_result.get('recommendation')}"
                                )

                            except Exception as e:
                                logger.error(f"Error evaluating opportunity {opportunity.notice_id}: {str(e)}")
                                continue

                except Exception as e:
                    logger.error(f"Error processing opportunity: {str(e)}")
                    continue

            # If we got cached data or no new discoveries, evaluate existing unevaluated opportunities
            opportunities_to_evaluate = []

            if from_cache and cached_opportunities:
                # Use cached opportunities for evaluation
                opportunities_to_evaluate = cached_opportunities
                discovered_count = len(cached_opportunities)
            elif evaluated_count == 0:
                # No new evaluations from discovery, check existing opportunities
                logger.info("No new evaluations from discovery, checking existing opportunities...")
                opportunities_to_evaluate = opportunity_service.list_opportunities(
                    db,
                    skip=0,
                    limit=100,
                    active_only=True,
                    naics_codes=company.naics_codes
                )

            # Evaluate unevaluated opportunities
            for opp in opportunities_to_evaluate:
                existing_eval = opportunity_service.get_evaluation_for_opportunity(
                    db, opp.id, company.id
                )

                if not existing_eval:
                    try:
                        logger.info(f"Evaluating opportunity: {opp.source_id}")
                        eval_result = await ai_evaluator_service.evaluate_opportunity(
                            opp, company
                        )

                        eval_data = {
                            "opportunity_id": opp.id,
                            "company_id": company.id,
                            **eval_result
                        }

                        opportunity_service.create_evaluation(db, eval_data)
                        evaluated_count += 1

                        logger.info(f"Evaluated opportunity {opp.source_id}: {eval_result.get('recommendation')}")

                    except Exception as e:
                        logger.error(f"Error evaluating opportunity {opp.source_id}: {str(e)}")
                        continue

            return {
                "message": "Discovery completed successfully",
                "discovered": discovered_count,
                "evaluated": evaluated_count,
                "from_cache": from_cache,
                "cache_info": f"Data {'from cache' if from_cache else 'fetched from SAM.gov'}"
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
