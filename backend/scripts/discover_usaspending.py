#!/usr/bin/env python3
"""
Discover awards from USA Spending API.

This script fetches prime contract awards from USASpending.gov and stores them
in the database for analytics and competitive analysis.

Run via cron daily:
    0 2 * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/discover_usaspending.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.services.providers.usaspending_provider import USASpendingProvider
from app.services.award import award_service

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def discover_awards():
    """Fetch and store awards from USA Spending."""
    db = SessionLocal()

    try:
        logger.info("Starting USA Spending awards discovery...")

        # Fetch awards from the last 90 days
        start_date = datetime.now(timezone.utc) - timedelta(days=90)

        awards = await USASpendingProvider.fetch_all_pages(
            start_date=start_date,
            max_results=500
        )

        if not awards:
            logger.info("No new awards found")
            return

        logger.info(f"Fetched {len(awards)} awards from USA Spending")

        # Parse and store awards
        parsed = [
            USASpendingProvider.parse_award(raw)
            for raw in awards
        ]

        # Store in database
        stored = award_service.upsert_awards_batch(db, parsed)
        logger.info(f"Stored {stored} awards in database")

    except Exception as e:
        logger.error(f"Error discovering USA Spending awards: {e}")
        raise
    finally:
        db.close()


def run():
    """Run the discovery process."""
    asyncio.run(discover_awards())


if __name__ == "__main__":
    run()
