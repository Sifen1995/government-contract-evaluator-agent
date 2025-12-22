#!/usr/bin/env python3
"""
Standalone script for sending deadline reminder emails.
Replaces Celery task - run via cron at 9 AM daily.

Usage:
    python scripts/send_deadline_reminders.py

Cron entry:
    0 9 * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/send_deadline_reminders.py >> /var/log/govai/email.log 2>&1
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
    get_deadline_reminder_template,
)
from app.services.auth import get_or_create_unsubscribe_token

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def send_deadline_reminders():
    """
    Send deadline reminder emails for opportunities with deadlines in 1, 3, and 7 days.
    """
    db = SessionLocal()
    try:
        logger.info("Starting deadline reminder task...")

        # Get reminder thresholds (1, 3, 7 days)
        reminder_days = [1, 3, 7]
        sent = 0
        failed = 0

        for days in reminder_days:
            # Calculate target date
            target_date = datetime.utcnow().date() + timedelta(days=days)
            target_start = datetime.combine(target_date, datetime.min.time())
            target_end = datetime.combine(target_date, datetime.max.time())

            # Get evaluations with deadlines on this date
            evaluations = db.query(Evaluation).join(Opportunity).join(
                Company, Evaluation.company_id == Company.id
            ).join(
                User, User.company_id == Company.id
            ).filter(
                Evaluation.user_saved.in_(["WATCHING", "BIDDING"]),
                Opportunity.response_deadline >= target_start,
                Opportunity.response_deadline <= target_end,
                User.email_verified == True,
                User.email_frequency != "none"
            ).all()

            for evaluation in evaluations:
                try:
                    # Get user
                    user = db.query(User).filter(
                        User.company_id == evaluation.company_id,
                        User.email_verified == True
                    ).first()

                    if not user:
                        continue

                    opp = evaluation.opportunity

                    # Format opportunity data
                    opp_data = {
                        "id": opp.id,
                        "title": opp.title,
                        "department": opp.department,
                        "naics_code": opp.naics_code,
                        "deadline": opp.response_deadline.strftime("%Y-%m-%d %H:%M") if opp.response_deadline else "N/A",
                        "status": evaluation.user_saved
                    }

                    # Get or create unsubscribe token for one-click unsubscribe
                    unsubscribe_token = get_or_create_unsubscribe_token(db, user)

                    # Generate email
                    html_content = get_deadline_reminder_template(
                        user_name=user.first_name,
                        opportunity=opp_data,
                        days_until=days,
                        unsubscribe_token=unsubscribe_token
                    )

                    # Send email
                    success = email_service.send_email(
                        to_email=user.email,
                        subject=f"Deadline Reminder: {days} Day{'s' if days != 1 else ''} - {opp.title[:50]}",
                        html_content=html_content
                    )

                    if success:
                        sent += 1
                        logger.info(f"Sent {days}-day reminder to {user.email} for opportunity {opp.id}")
                    else:
                        failed += 1

                except Exception as e:
                    logger.error(f"Error sending reminder for evaluation {evaluation.id}: {str(e)}")
                    failed += 1
                    continue

        logger.info(f"Deadline reminder completed: {sent} sent, {failed} failed")
        return {"sent": sent, "failed": failed}

    except Exception as e:
        logger.error(f"Error in deadline reminder: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    start_time = datetime.now()
    logger.info(f"=== Deadline reminder job started at {start_time} ===")

    try:
        result = send_deadline_reminders()
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.error(f"Job failed: {e}")
        sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"=== Deadline reminder job completed in {duration:.2f} seconds ===")
