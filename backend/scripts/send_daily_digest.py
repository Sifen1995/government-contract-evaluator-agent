#!/usr/bin/env python3
"""
Standalone script for sending daily digest emails.
Replaces Celery task - run via cron at 8 AM daily.

Usage:
    python scripts/send_daily_digest.py

Cron entry:
    0 8 * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/send_daily_digest.py >> /var/log/govai/email.log 2>&1
"""
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from datetime import datetime, timedelta

from app.core.database import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.evaluation import Evaluation
from app.models.opportunity import Opportunity
from app.services.email import (
    email_service,
    get_daily_digest_template,
)
from app.services.auth import get_or_create_unsubscribe_token

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def send_daily_digest_emails():
    """
    Send daily digest emails to all users subscribed to daily digests.
    """
    db = SessionLocal()
    try:
        logger.info("Starting daily digest email task...")

        # Get all users subscribed to daily emails
        users = db.query(User).filter(
            User.email_verified == True,
            User.email_frequency == "daily",
            User.company_id.isnot(None)
        ).all()

        if not users:
            logger.info("No users subscribed to daily digests")
            return {"sent": 0, "failed": 0, "skipped": 0}

        sent = 0
        failed = 0
        skipped = 0

        for user in users:
            try:
                # Get company
                company = db.query(Company).filter(Company.id == user.company_id).first()
                if not company:
                    skipped += 1
                    continue

                # Get new BID recommendations from last 24 hours
                yesterday = datetime.utcnow() - timedelta(days=1)
                new_opportunities = db.query(Evaluation).join(Opportunity).filter(
                    Evaluation.company_id == company.id,
                    Evaluation.recommendation == "BID",
                    Evaluation.created_at >= yesterday
                ).all()

                # Get upcoming deadlines (next 7 days) for pipeline items
                next_week = datetime.utcnow() + timedelta(days=7)
                deadline_reminders = db.query(Evaluation).join(Opportunity).filter(
                    Evaluation.company_id == company.id,
                    Evaluation.user_saved.in_(["WATCHING", "BIDDING"]),
                    Opportunity.response_deadline.isnot(None),
                    Opportunity.response_deadline >= datetime.utcnow(),
                    Opportunity.response_deadline <= next_week
                ).order_by(Opportunity.response_deadline).all()

                # Get stats
                total_evaluated = db.query(Evaluation).filter(
                    Evaluation.company_id == company.id
                ).count()

                bid_count = db.query(Evaluation).filter(
                    Evaluation.company_id == company.id,
                    Evaluation.recommendation == "BID"
                ).count()

                in_pipeline = db.query(Evaluation).filter(
                    Evaluation.company_id == company.id,
                    Evaluation.user_saved.isnot(None)
                ).count()

                # Format opportunities for email
                new_opps_formatted = []
                for eval in new_opportunities:
                    opp = eval.opportunity
                    new_opps_formatted.append({
                        "title": opp.title,
                        "department": opp.department,
                        "naics_code": opp.naics_code,
                        "fit_score": float(eval.fit_score),
                        "win_probability": float(eval.win_probability),
                        "deadline": opp.response_deadline.strftime("%Y-%m-%d") if opp.response_deadline else "N/A"
                    })

                # Format deadline reminders
                reminders_formatted = []
                for eval in deadline_reminders:
                    opp = eval.opportunity
                    days_until = (opp.response_deadline - datetime.utcnow()).days
                    reminders_formatted.append({
                        "title": opp.title,
                        "deadline": opp.response_deadline.strftime("%Y-%m-%d"),
                        "days_until": days_until
                    })

                # Skip if no new content
                if not new_opps_formatted and not reminders_formatted:
                    skipped += 1
                    continue

                # Generate email
                stats = {
                    "total_evaluated": total_evaluated,
                    "bid_count": bid_count,
                    "in_pipeline": in_pipeline
                }

                # Get or create unsubscribe token for one-click unsubscribe
                unsubscribe_token = get_or_create_unsubscribe_token(db, user)

                html_content = get_daily_digest_template(
                    user_name=user.first_name,
                    new_opportunities=new_opps_formatted,
                    deadline_reminders=reminders_formatted,
                    stats=stats,
                    unsubscribe_token=unsubscribe_token
                )

                # Send email
                success = email_service.send_email(
                    to_email=user.email,
                    subject=f"GovAI Daily Digest - {len(new_opps_formatted)} New BID Recommendations",
                    html_content=html_content
                )

                if success:
                    sent += 1
                    logger.info(f"Sent daily digest to {user.email}")
                else:
                    failed += 1
                    logger.error(f"Failed to send daily digest to {user.email}")

            except Exception as e:
                logger.error(f"Error processing digest for user {user.id}: {str(e)}")
                failed += 1
                continue

        logger.info(f"Daily digest completed: {sent} sent, {failed} failed, {skipped} skipped")
        return {"sent": sent, "failed": failed, "skipped": skipped}

    except Exception as e:
        logger.error(f"Error in daily digest: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    start_time = datetime.now()
    logger.info(f"=== Daily digest job started at {start_time} ===")

    try:
        result = send_daily_digest_emails()
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.error(f"Job failed: {e}")
        sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"=== Daily digest job completed in {duration:.2f} seconds ===")
