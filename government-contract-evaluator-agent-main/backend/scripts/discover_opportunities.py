#!/usr/bin/env python3
"""
Discover opportunities from SAM.gov
Runs twice daily
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.company import Company
from app.services.discovery import discovery_service
from app.services.opportunity import opportunity_service
from app.services.providers.sam_gov import sam_gov_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_unique_naics_codes(db):
    companies = db.query(Company).filter(Company.naics_codes.isnot(None)).all()
    naics = set()
    for c in companies:
        naics.update(c.naics_codes or [])
    return list(naics)


def run():
    db = SessionLocal()
    discovery_run = None

    try:
        naics_codes = get_unique_naics_codes(db)
        if not naics_codes:
            logger.info("No NAICS codes found")
            return

        last_run = discovery_service.get_last_successful_run(db, source="sam.gov")
        now = datetime.now(timezone.utc)

        posted_from = (
            last_run.completed_at - timedelta(days=1)
            if last_run and last_run.completed_at
            else now - timedelta(days=30)
        )

        discovery_run = discovery_service.start_run(
            db=db,
            source="sam.gov",
            posted_from=posted_from,
            posted_to=now,
            naics_codes=naics_codes
        )

        result = asyncio.run(
            sam_gov_service.search_opportunities_batch(
                naics_codes=naics_codes,
                posted_from=posted_from,
                posted_to=now,
                limit=500
            )
        )

        parsed = [
            sam_gov_service.parse_opportunity(raw)
            for raw in result.get("opportunities", [])
        ]

        upsert = opportunity_service.upsert_opportunities_batch(db, parsed)

        discovery_service.complete_run(db, discovery_run, {
            "found": len(parsed),
            "new": upsert.new,
            "updated": upsert.updated
        })

    except Exception as e:
        logger.error(e)
        if discovery_run:
            discovery_service.fail_run(db, discovery_run, str(e))
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
