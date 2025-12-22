#!/usr/bin/env python3
"""
Discover DC Independent Agency solicitations
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from app.core.database import SessionLocal
from app.services.providers.dc_independent_provider import DCIndependentProvider
from app.services.opportunity import opportunity_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run():
    db = SessionLocal()
    try:
        opps = DCIndependentProvider.fetch_all()
        parsed = [DCIndependentProvider.parse_opportunity(o) for o in opps]
        opportunity_service.upsert_opportunities_batch(db, parsed)
    finally:
        db.close()


if __name__ == "__main__":
    run()
