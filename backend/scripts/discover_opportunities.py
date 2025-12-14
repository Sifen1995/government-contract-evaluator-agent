#!/usr/bin/env python3
"""
Standalone script for automated opportunity discovery and evaluation.
Replaces Celery task - run via cron every 15 minutes.

Usage:
    python scripts/discover_opportunities.py

Cron entry:
    */15 * * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/discover_opportunities.py >> /var/log/govai/discovery.log 2>&1
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
from datetime import datetime

from app.core.database import SessionLocal
from app.models.company import Company
from app.services.sam_gov import sam_gov_service
from app.services.ai_evaluator import ai_evaluator_service
from app.services.opportunity import opportunity_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def discover_opportunities():
    """
    Discover new opportunities from SAM.gov and evaluate them.
    """
    db = SessionLocal()
    try:
        logger.info("Starting opportunity discovery...")

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
            f"Discovery completed: {discovered_count} opportunities discovered, "
            f"{evaluated_count} evaluations created"
        )

        return {
            "companies": len(companies),
            "discovered": discovered_count,
            "evaluated": evaluated_count
        }

    except Exception as e:
        logger.error(f"Error in discovery: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    start_time = datetime.now()
    logger.info(f"=== Discovery job started at {start_time} ===")

    try:
        result = discover_opportunities()
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.error(f"Job failed: {e}")
        sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"=== Discovery job completed in {duration:.2f} seconds ===")
