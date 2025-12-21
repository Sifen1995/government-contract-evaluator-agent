#!/usr/bin/env python3
"""
Discover procurement forecasts
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from app.core.database import SessionLocal
from app.services.providers.forecast_provider import ProcurementForecastProvider
from app.services.opportunity import opportunity_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run():
    db = SessionLocal()
    try:
        forecasts = ProcurementForecastProvider.fetch_forecasts()
        parsed = [ProcurementForecastProvider.parse_forecast(f) for f in forecasts]
        opportunity_service.upsert_opportunities_batch(db, parsed)
    finally:
        db.close()


if __name__ == "__main__":
    run()
