#!/usr/bin/env python3
"""
Discover DC OCP (Office of Contracting and Procurement) solicitations.

This script fetches open solicitations from the DC government procurement
portal and stores them as opportunities.

Note: Requires Playwright for full functionality. Without it, only placeholder
data will be returned.

Run via cron every 4 hours:
    0 */4 * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/discover_dc_ocp.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging

from app.core.database import SessionLocal
from app.services.providers.dc_ocp_provider import DCOCPProvider
from app.services.opportunity import opportunity_service

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def discover_dc_ocp():
    """Fetch and store DC OCP solicitations."""
    db = SessionLocal()

    try:
        logger.info("Starting DC OCP discovery...")

        # Fetch open solicitations
        solicitations = await DCOCPProvider.fetch_solicitations(status="open")

        if not solicitations:
            logger.info("No DC OCP solicitations found")
            return

        logger.info(f"Fetched {len(solicitations)} DC OCP solicitations")

        # Normalize and store
        stored = 0
        for raw in solicitations:
            try:
                normalized = DCOCPProvider.normalize(raw)
                opportunity_service.upsert_opportunity(db, normalized)
                stored += 1
            except Exception as e:
                logger.warning(f"Error storing DC OCP opportunity: {e}")

        logger.info(f"Stored {stored} DC OCP opportunities")

    except Exception as e:
        logger.error(f"Error discovering DC OCP: {e}")
        raise
    finally:
        db.close()


def run():
    """Run the discovery process."""
    asyncio.run(discover_dc_ocp())


if __name__ == "__main__":
    run()
