#!/usr/bin/env python3
"""
Optimized standalone script for automated opportunity discovery.
Uses batch API calls, deduplication, and discovery run tracking.

Run via cron twice daily (6 AM and 6 PM UTC):
    0 6,18 * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/discover_opportunities.py >> /var/log/govai/discovery.log 2>&1
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Set

from app.core.database import SessionLocal
from app.models.company import Company
from app.services.sam_gov import sam_gov_service
from app.services.opportunity import opportunity_service
from app.services.discovery import discovery_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_unique_naics_codes(db) -> List[str]:
    """Get all unique NAICS codes from all companies."""
    companies = db.query(Company).filter(Company.naics_codes.isnot(None)).all()

    naics_set: Set[str] = set()
    for company in companies:
        if company.naics_codes:
            naics_set.update(company.naics_codes)

    return list(naics_set)


def discover_opportunities():
    """
    Discover new opportunities from SAM.gov using optimized batch fetching.

    Improvements over previous version:
    1. Single batch API call instead of per-company calls
    2. Deduplication via source_id before database operations
    3. Discovery run tracking for incremental fetching
    4. Only fetches opportunities posted since last successful run
    """
    db = SessionLocal()
    discovery_run = None

    try:
        # Get unique NAICS codes from all companies
        naics_codes = get_unique_naics_codes(db)

        if not naics_codes:
            logger.info("No NAICS codes configured for any company")
            return {"status": "skipped", "reason": "no_naics_codes"}

        logger.info(f"Starting discovery for {len(naics_codes)} unique NAICS codes: {naics_codes}")

        # Determine date range based on last successful run
        last_run = discovery_service.get_last_successful_run(db)
        now = datetime.now(timezone.utc)

        if last_run and last_run.completed_at:
            # Incremental: only fetch opportunities posted since last run
            # Add 1 day buffer to catch any stragglers
            completed_at = last_run.completed_at
            # Make timezone-aware if needed
            if completed_at.tzinfo is None:
                completed_at = completed_at.replace(tzinfo=timezone.utc)
            posted_from = completed_at - timedelta(days=1)
            logger.info(f"Incremental fetch: opportunities posted since {posted_from}")
        else:
            # First run: fetch last 30 days
            posted_from = now - timedelta(days=30)
            logger.info(f"Initial fetch: opportunities from last 30 days")

        posted_to = now

        # Start discovery run tracking
        discovery_run = discovery_service.start_run(
            db=db,
            naics_codes=naics_codes,
            posted_from=posted_from,
            posted_to=posted_to
        )

        # Batch fetch from SAM.gov
        try:
            result = asyncio.run(sam_gov_service.search_opportunities_batch(
                naics_codes=naics_codes,
                posted_from=posted_from,
                posted_to=posted_to,
                limit=500
            ))
        except Exception as e:
            logger.error(f"SAM.gov API error: {e}")
            discovery_service.fail_run(db, discovery_run, str(e))
            return {"status": "failed", "error": str(e)}

        raw_opportunities = result.get("opportunities", [])
        api_calls = result.get("api_calls", 0)
        errors = result.get("errors", [])
        # Check if any errors indicate rate limiting
        rate_limited = any("429" in str(e) or "rate" in str(e).lower() for e in (errors or []))

        logger.info(f"SAM.gov returned {len(raw_opportunities)} opportunities in {api_calls} API calls")

        if rate_limited:
            logger.warning("Rate limited by SAM.gov - partial results")

        # Parse all opportunities
        parsed_opportunities = []
        for raw_opp in raw_opportunities:
            try:
                opp_data = sam_gov_service.parse_opportunity(raw_opp)
                parsed_opportunities.append(opp_data)
            except Exception as e:
                logger.error(f"Error parsing opportunity: {e}")
                continue

        logger.info(f"Parsed {len(parsed_opportunities)} opportunities")

        # Batch upsert with deduplication
        if parsed_opportunities:
            upsert_result = opportunity_service.upsert_opportunities_batch(db, parsed_opportunities)
            results_dict = upsert_result.to_dict()
        else:
            results_dict = {'new': 0, 'updated': 0, 'unchanged': 0, 'errors': 0}

        # Complete discovery run
        run_results = {
            'api_calls': api_calls,
            'found': len(raw_opportunities),
            'new': results_dict['new'],
            'updated': results_dict['updated'],
            'unchanged': results_dict['unchanged'],
            'evaluations': 0  # Generic evaluation happens in separate job
        }

        if rate_limited:
            discovery_service.partial_run(
                db, discovery_run, run_results,
                "Rate limited by SAM.gov API"
            )
        else:
            discovery_service.complete_run(db, discovery_run, run_results)

        logger.info(
            f"Discovery completed: {run_results['new']} new, "
            f"{run_results['updated']} updated, "
            f"{run_results['unchanged']} unchanged"
        )

        return {
            "status": "completed" if not rate_limited else "partial",
            "naics_codes": len(naics_codes),
            "api_calls": api_calls,
            "found": len(raw_opportunities),
            "new": results_dict['new'],
            "updated": results_dict['updated'],
            "unchanged": results_dict['unchanged'],
            "errors": results_dict['errors']
        }

    except Exception as e:
        logger.error(f"Discovery failed: {e}")
        if discovery_run:
            discovery_service.fail_run(db, discovery_run, str(e))
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
