"""
Celery tasks for automated opportunity discovery and evaluation
"""
from celery import shared_task
from app.core.database import SessionLocal
from app.models.company import Company
from app.services.sam_gov import sam_gov_service
from app.services.ai_evaluator import ai_evaluator_service
from app.services.opportunity import opportunity_service
import asyncio
import logging

logger = logging.getLogger(__name__)


@shared_task(name="discover_opportunities")
def discover_opportunities_task():
    """
    Automated task to discover new opportunities from SAM.gov
    Runs every 15 minutes via Celery Beat

    Returns:
        Dict with counts of discovered and evaluated opportunities
    """
    db = SessionLocal()
    try:
        logger.info("Starting opportunity discovery task...")

        # Get all companies with NAICS codes
        companies = db.query(Company).filter(Company.naics_codes.isnot(None)).all()

        if not companies:
            logger.info("No companies found with NAICS codes")
            return {"companies": 0, "discovered": 0, "evaluated": 0}

        # Collect all unique NAICS codes from all companies
        all_naics_codes = set()
        for company in companies:
            if company.naics_codes:
                all_naics_codes.update(company.naics_codes)

        logger.info(f"Searching SAM.gov for {len(all_naics_codes)} unique NAICS codes from {len(companies)} companies")

        # Search SAM.gov for opportunities
        discovered_count = 0
        evaluated_count = 0

        try:
            # Search for opportunities (limited to 100 per run)
            result = asyncio.run(sam_gov_service.search_opportunities(
                naics_codes=list(all_naics_codes),
                active=True,
                limit=100
            ))

            raw_opportunities = result.get("opportunities", [])
            logger.info(f"Found {len(raw_opportunities)} opportunities from SAM.gov")

            # Process each opportunity
            for raw_opp in raw_opportunities:
                try:
                    # Parse opportunity data
                    opp_data = sam_gov_service.parse_opportunity(raw_opp)

                    # Create or update opportunity
                    opportunity = opportunity_service.create_opportunity(db, opp_data)
                    discovered_count += 1

                    # Evaluate for each company that matches the NAICS code
                    for company in companies:
                        if not company.naics_codes:
                            continue

                        # Check if company's NAICS codes match this opportunity
                        if opportunity.naics_code in company.naics_codes:
                            # Check if already evaluated
                            existing_eval = opportunity_service.get_evaluation_for_opportunity(
                                db, opportunity.id, company.id
                            )

                            if not existing_eval:
                                # Evaluate this opportunity for this company
                                try:
                                    eval_result = asyncio.run(ai_evaluator_service.evaluate_opportunity(
                                        opportunity, company
                                    ))

                                    # Save evaluation
                                    eval_data = {
                                        "opportunity_id": opportunity.id,
                                        "company_id": company.id,
                                        **eval_result
                                    }

                                    opportunity_service.create_evaluation(db, eval_data)
                                    evaluated_count += 1

                                    logger.info(
                                        f"Evaluated opportunity {opportunity.notice_id} for company {company.name}: "
                                        f"{eval_result.get('recommendation')}"
                                    )

                                except Exception as e:
                                    logger.error(
                                        f"Error evaluating opportunity {opportunity.notice_id} "
                                        f"for company {company.id}: {str(e)}"
                                    )
                                    continue

                except Exception as e:
                    logger.error(f"Error processing opportunity: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"Error searching SAM.gov: {str(e)}")

        logger.info(
            f"Discovery task completed: {discovered_count} opportunities discovered, "
            f"{evaluated_count} evaluations created"
        )

        return {
            "companies": len(companies),
            "discovered": discovered_count,
            "evaluated": evaluated_count
        }

    except Exception as e:
        logger.error(f"Error in discovery task: {str(e)}")
        raise
    finally:
        db.close()


@shared_task(name="evaluate_pending_opportunities")
def evaluate_pending_opportunities_task(company_id: str = None):
    """
    Evaluate opportunities that haven't been evaluated yet for a company
    Can be run for a specific company or all companies

    Args:
        company_id: Optional company ID to evaluate for (if None, evaluates for all companies)

    Returns:
        Dict with count of evaluations created
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting evaluation task for company_id={company_id or 'all'}")

        # Get companies to evaluate for
        if company_id:
            companies = db.query(Company).filter(Company.id == company_id).all()
        else:
            companies = db.query(Company).filter(Company.naics_codes.isnot(None)).all()

        if not companies:
            logger.info("No companies found")
            return {"evaluations_created": 0}

        evaluated_count = 0

        for company in companies:
            # Get opportunities needing evaluation
            opportunities = opportunity_service.get_opportunities_needing_evaluation(
                db, company.id, limit=50
            )

            logger.info(f"Found {len(opportunities)} opportunities needing evaluation for company {company.name}")

            for opportunity in opportunities:
                try:
                    # Evaluate opportunity
                    eval_result = asyncio.run(ai_evaluator_service.evaluate_opportunity(
                        opportunity, company
                    ))

                    # Save evaluation
                    eval_data = {
                        "opportunity_id": opportunity.id,
                        "company_id": company.id,
                        **eval_result
                    }

                    opportunity_service.create_evaluation(db, eval_data)
                    evaluated_count += 1

                    logger.info(
                        f"Evaluated opportunity {opportunity.notice_id} for company {company.name}: "
                        f"{eval_result.get('recommendation')}"
                    )

                except Exception as e:
                    logger.error(
                        f"Error evaluating opportunity {opportunity.id} "
                        f"for company {company.id}: {str(e)}"
                    )
                    continue

        logger.info(f"Evaluation task completed: {evaluated_count} evaluations created")

        return {"evaluations_created": evaluated_count}

    except Exception as e:
        logger.error(f"Error in evaluation task: {str(e)}")
        raise
    finally:
        db.close()


@shared_task(name="cleanup_old_opportunities")
def cleanup_old_opportunities_task():
    """
    Clean up old opportunities (older than 90 days)
    Runs daily via Celery Beat

    Returns:
        Dict with count of opportunities deleted
    """
    db = SessionLocal()
    try:
        logger.info("Starting cleanup task...")

        deleted_count = opportunity_service.delete_old_opportunities(db, days_old=90)

        logger.info(f"Cleanup task completed: {deleted_count} opportunities deleted")

        return {"deleted": deleted_count}

    except Exception as e:
        logger.error(f"Error in cleanup task: {str(e)}")
        raise
    finally:
        db.close()
