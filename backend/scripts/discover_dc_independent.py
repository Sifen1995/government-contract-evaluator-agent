#!/usr/bin/env python3
"""
Discover DC Independent Agency solicitations.

This script fetches solicitations from DC independent government agencies
(such as DC Housing Authority, DC Water, etc.) and stores them as opportunities.

Note: Requires Playwright for full functionality. Without it, only placeholder
data will be returned.

Run via cron daily:
    0 5 * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/discover_dc_independent.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging

from app.core.database import SessionLocal
from app.services.providers.dc_independent_provider import DCIndependentProvider
from app.services.opportunity import opportunity_service

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def discover_dc_independent():
    """Fetch and store DC Independent Agency solicitations."""
    db = SessionLocal()

    try:
        logger.info("Starting DC Independent Agencies discovery...")

        # Fetch solicitations from all independent agencies
        solicitations = await DCIndependentProvider.fetch_all_solicitations()

        if not solicitations:
            logger.info("No DC Independent Agency solicitations found")
            return

        logger.info(f"Fetched {len(solicitations)} DC Independent Agency solicitations")

        # Normalize and store
        stored = 0
        for raw in solicitations:
            try:
                normalized = DCIndependentProvider.normalize(raw)
                opportunity_service.upsert_opportunity(db, normalized)
                stored += 1
            except Exception as e:
                logger.warning(f"Error storing DC Independent opportunity: {e}")

        logger.info(f"Stored {stored} DC Independent Agency opportunities")

    except Exception as e:
        logger.error(f"Error discovering DC Independent Agencies: {e}")
        raise
    finally:
        db.close()


def run():
    """Run the discovery process."""
    asyncio.run(discover_dc_independent())


if __name__ == "__main__":
    run()
