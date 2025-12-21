#!/usr/bin/env python3
"""
Discover awards from USA Spending
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.services.providers.usaspending_provider import USASpendingProvider
from app.services.award import award_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run():
    db = SessionLocal()
    try:
        awards = USASpendingProvider.fetch_awards(
            start_date=datetime.utcnow() - timedelta(days=90)
        )

        parsed = [
            USASpendingProvider.parse_award(raw)
            for raw in awards
        ]

        award_service.upsert_awards_batch(db, parsed)
        logger.info(f"Stored {len(parsed)} awards")

    finally:
        db.close()


if __name__ == "__main__":
    run()
