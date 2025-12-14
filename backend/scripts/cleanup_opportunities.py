#!/usr/bin/env python3
"""
Standalone script for cleaning up old opportunities.
Replaces Celery task - run via cron at 2 AM daily.

Usage:
    python scripts/cleanup_opportunities.py

Cron entry:
    0 2 * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/cleanup_opportunities.py >> /var/log/govai/cleanup.log 2>&1
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from datetime import datetime

from app.core.database import SessionLocal
from app.services.opportunity import opportunity_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def cleanup_old_opportunities():
    """
    Clean up old opportunities (older than 90 days).
    """
    db = SessionLocal()
    try:
        logger.info("Starting cleanup task...")

        deleted_count = opportunity_service.delete_old_opportunities(db, days_old=90)

        logger.info(f"Cleanup completed: {deleted_count} opportunities deleted")

        return {"deleted": deleted_count}

    except Exception as e:
        logger.error(f"Error in cleanup: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    start_time = datetime.now()
    logger.info(f"=== Cleanup job started at {start_time} ===")

    try:
        result = cleanup_old_opportunities()
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.error(f"Job failed: {e}")
        sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"=== Cleanup job completed in {duration:.2f} seconds ===")
