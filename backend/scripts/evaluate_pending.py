#!/usr/bin/env python3
"""
Generic opportunity evaluation script.
Evaluates opportunities that haven't been processed yet using AI.

This performs company-agnostic evaluation to assess opportunity quality,
complexity, and requirements. Run after discover_opportunities.py.

Run via cron (30 minutes after discovery):
    30 6,18 * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/evaluate_pending.py >> /var/log/govai/evaluation.log 2>&1
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import asyncio
import logging
from datetime import datetime
from typing import List

from app.core.database import SessionLocal
from app.models.opportunity import Opportunity
from app.services.ai_evaluator import ai_evaluator_service
from app.services.opportunity import opportunity_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
MAX_EVALUATIONS_PER_RUN = 20  # Limit to control API costs
BATCH_SIZE = 5  # Process in smaller batches with delays


async def evaluate_opportunity_safe(opportunity: Opportunity) -> dict:
    """Evaluate a single opportunity with error handling."""
    try:
        result = await ai_evaluator_service.evaluate_opportunity_generic(opportunity)
        return {"success": True, "result": result, "opportunity_id": str(opportunity.id)}
    except Exception as e:
        logger.error(f"Error evaluating {opportunity.notice_id}: {e}")
        return {"success": False, "error": str(e), "opportunity_id": str(opportunity.id)}


async def evaluate_batch(opportunities: List[Opportunity]) -> List[dict]:
    """Evaluate a batch of opportunities concurrently."""
    tasks = [evaluate_opportunity_safe(opp) for opp in opportunities]
    return await asyncio.gather(*tasks)


def evaluate_pending_opportunities():
    """
    Evaluate all pending opportunities using generic AI evaluation.

    This processes opportunities that have:
    - evaluation_status = 'pending' or NULL
    - status = 'active'
    - response_deadline in the future
    """
    db = SessionLocal()

    try:
        # Get pending opportunities
        pending = opportunity_service.get_opportunities_pending_evaluation(
            db, limit=MAX_EVALUATIONS_PER_RUN
        )

        if not pending:
            logger.info("No pending opportunities to evaluate")
            return {"status": "completed", "evaluated": 0, "skipped": 0, "errors": 0}

        logger.info(f"Found {len(pending)} opportunities pending evaluation")

        evaluated = 0
        skipped = 0
        errors = 0

        # Process in batches
        for i in range(0, len(pending), BATCH_SIZE):
            batch = pending[i:i + BATCH_SIZE]
            logger.info(f"Processing batch {i // BATCH_SIZE + 1} ({len(batch)} opportunities)")

            # Run async evaluation
            results = asyncio.run(evaluate_batch(batch))

            for result in results:
                opp_id = result["opportunity_id"]

                if result["success"]:
                    try:
                        # Save generic evaluation to opportunity
                        opportunity_service.mark_opportunity_evaluated(
                            db, opp_id, result["result"]
                        )
                        evaluated += 1
                        logger.info(f"Saved evaluation for opportunity {opp_id}")
                    except Exception as e:
                        logger.error(f"Error saving evaluation for {opp_id}: {e}")
                        errors += 1
                else:
                    # Mark as skipped if evaluation failed
                    try:
                        opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
                        if opp:
                            opp.evaluation_status = 'skipped'
                            opp.generic_evaluation = {"error": result["error"]}
                            db.commit()
                        skipped += 1
                    except Exception as e:
                        logger.error(f"Error marking {opp_id} as skipped: {e}")
                        errors += 1

            # Small delay between batches to avoid rate limiting
            if i + BATCH_SIZE < len(pending):
                logger.info("Waiting 2 seconds before next batch...")
                import time
                time.sleep(2)

        logger.info(
            f"Evaluation completed: {evaluated} evaluated, "
            f"{skipped} skipped, {errors} errors"
        )

        return {
            "status": "completed",
            "total_pending": len(pending),
            "evaluated": evaluated,
            "skipped": skipped,
            "errors": errors
        }

    except Exception as e:
        logger.error(f"Evaluation job failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    start_time = datetime.now()
    logger.info(f"=== Generic evaluation job started at {start_time} ===")

    try:
        result = evaluate_pending_opportunities()
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.error(f"Job failed: {e}")
        sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"=== Evaluation job completed in {duration:.2f} seconds ===")
