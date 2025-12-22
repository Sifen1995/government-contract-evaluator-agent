#!/usr/bin/env python3
"""
Discover procurement forecasts from acquisition.gov.

This script fetches federal agency procurement forecasts and stores them
as forecast opportunities for future planning.

Run via cron weekly:
    0 3 * * 0 cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/discover_forecasts.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging

from app.core.database import SessionLocal
from app.services.providers.forecast_provider import ProcurementForecastProvider
from app.services.opportunity import opportunity_service

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def discover_forecasts():
    """Fetch and store procurement forecasts."""
    db = SessionLocal()

    try:
        logger.info("Starting procurement forecast discovery...")

        # Fetch forecasts from all agencies
        forecasts = await ProcurementForecastProvider.fetch_all_forecasts()

        if not forecasts:
            logger.info("No forecasts found")
            return

        logger.info(f"Fetched {len(forecasts)} forecasts")

        # Normalize forecasts
        normalized = [
            ProcurementForecastProvider.normalize(f)
            for f in forecasts
        ]

        # Store as opportunities with is_forecast=True
        stored = 0
        for opp in normalized:
            try:
                opportunity_service.upsert_opportunity(db, opp)
                stored += 1
            except Exception as e:
                logger.warning(f"Error storing forecast: {e}")

        logger.info(f"Stored {stored} forecasts in database")

    except Exception as e:
        logger.error(f"Error discovering forecasts: {e}")
        raise
    finally:
        db.close()


def run():
    """Run the discovery process."""
    asyncio.run(discover_forecasts())


if __name__ == "__main__":
    run()
