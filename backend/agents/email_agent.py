"""
Email Agent - Email Notification and Digest Agent

This agent is responsible for:
- Sending daily digest emails with new BID recommendations
- Sending deadline reminder notifications (1, 3, 7 days before)
- Sending real-time notifications for high-value opportunities
- Managing email preferences and subscriptions
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging

from app.core.database import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.models.evaluation import Evaluation
from app.services.email import (
    email_service,
    get_daily_digest_template,
    get_deadline_reminder_template
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailAgent:
    """
    Agent for automated email notifications and digests.

    This agent handles:
    1. Daily digest emails summarizing new BID recommendations
    2. Deadline reminder emails at 1, 3, and 7 days before response deadline
    3. Real-time notifications for high-priority opportunities
    """

    def __init__(self, db_session=None):
        """
        Initialize the Email Agent.

        Args:
            db_session: Optional SQLAlchemy session. If not provided,
                       a new session will be created.
        """
        self.db = db_session
        self._owns_session = db_session is None

    def __enter__(self):
        if self._owns_session:
            self.db = SessionLocal()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self._owns_session and self.db:
            self.db.close()

    def get_digest_subscribers(self) -> List[User]:
        """
        Get all users subscribed to daily digest emails.

        Returns:
            List of User objects with daily email preference
        """
        return self.db.query(User).filter(
            User.email_verified == True,
            User.email_frequency == "daily",
            User.company_id.isnot(None)
        ).all()

    def get_new_bid_recommendations(
        self,
        company_id: str,
        since: datetime
    ) -> List[Evaluation]:
        """
        Get new BID recommendations for a company since a given time.

        Args:
            company_id: The company ID
            since: Only return evaluations created after this time

        Returns:
            List of Evaluation objects with BID recommendation
        """
        return self.db.query(Evaluation).join(Opportunity).filter(
            Evaluation.company_id == company_id,
            Evaluation.recommendation == "BID",
            Evaluation.created_at >= since
        ).all()

    def get_upcoming_deadlines(
        self,
        company_id: str,
        days_ahead: int = 7
    ) -> List[Evaluation]:
        """
        Get pipeline items with upcoming deadlines.

        Args:
            company_id: The company ID
            days_ahead: Number of days to look ahead

        Returns:
            List of Evaluation objects with upcoming deadlines
        """
        cutoff_date = datetime.utcnow() + timedelta(days=days_ahead)

        return self.db.query(Evaluation).join(Opportunity).filter(
            Evaluation.company_id == company_id,
            Evaluation.user_saved.in_(["WATCHING", "BIDDING"]),
            Opportunity.response_deadline.isnot(None),
            Opportunity.response_deadline >= datetime.utcnow(),
            Opportunity.response_deadline <= cutoff_date
        ).order_by(Opportunity.response_deadline).all()

    def get_company_stats(self, company_id: str) -> Dict:
        """
        Get statistics for a company's evaluations.

        Args:
            company_id: The company ID

        Returns:
            Dict with evaluation statistics
        """
        total_evaluated = self.db.query(Evaluation).filter(
            Evaluation.company_id == company_id
        ).count()

        bid_count = self.db.query(Evaluation).filter(
            Evaluation.company_id == company_id,
            Evaluation.recommendation == "BID"
        ).count()

        in_pipeline = self.db.query(Evaluation).filter(
            Evaluation.company_id == company_id,
            Evaluation.user_saved.isnot(None)
        ).count()

        return {
            "total_evaluated": total_evaluated,
            "bid_count": bid_count,
            "in_pipeline": in_pipeline
        }

    def format_opportunities_for_email(
        self,
        evaluations: List[Evaluation]
    ) -> List[Dict]:
        """
        Format evaluation/opportunity data for email templates.

        Args:
            evaluations: List of Evaluation objects

        Returns:
            List of formatted dicts for email templates
        """
        formatted = []
        for eval in evaluations:
            opp = eval.opportunity
            formatted.append({
                "title": opp.title,
                "department": opp.department,
                "naics_code": opp.naics_code,
                "fit_score": float(eval.fit_score) if eval.fit_score else 0,
                "win_probability": float(eval.win_probability) if eval.win_probability else 0,
                "deadline": opp.response_deadline.strftime("%Y-%m-%d") if opp.response_deadline else "N/A"
            })
        return formatted

    def send_daily_digest(self, user: User) -> bool:
        """
        Send daily digest email to a single user.

        Args:
            user: The user to send the digest to

        Returns:
            True if email sent successfully
        """
        if not user.company_id:
            return False

        # Get company
        company = self.db.query(Company).filter(
            Company.id == user.company_id
        ).first()

        if not company:
            return False

        # Get new BID recommendations from last 24 hours
        yesterday = datetime.utcnow() - timedelta(days=1)
        new_recommendations = self.get_new_bid_recommendations(
            str(company.id), yesterday
        )

        # Get upcoming deadlines
        deadline_items = self.get_upcoming_deadlines(str(company.id))

        # Skip if no content
        if not new_recommendations and not deadline_items:
            logger.info(f"Skipping digest for {user.email} - no new content")
            return True

        # Format data
        new_opps = self.format_opportunities_for_email(new_recommendations)
        reminders = []
        for eval in deadline_items:
            opp = eval.opportunity
            days_until = (opp.response_deadline - datetime.utcnow()).days
            reminders.append({
                "title": opp.title,
                "deadline": opp.response_deadline.strftime("%Y-%m-%d"),
                "days_until": days_until
            })

        # Get stats
        stats = self.get_company_stats(str(company.id))

        # Generate email
        html_content = get_daily_digest_template(
            user_name=user.first_name,
            new_opportunities=new_opps,
            deadline_reminders=reminders,
            stats=stats
        )

        # Send email
        success = email_service.send_email(
            to_email=user.email,
            subject=f"GovAI Daily Digest - {len(new_opps)} New BID Recommendations",
            html_content=html_content
        )

        if success:
            logger.info(f"Sent daily digest to {user.email}")
        else:
            logger.error(f"Failed to send daily digest to {user.email}")

        return success

    def send_deadline_reminder(
        self,
        user: User,
        evaluation: Evaluation,
        days_until: int
    ) -> bool:
        """
        Send a deadline reminder email.

        Args:
            user: The user to notify
            evaluation: The evaluation with upcoming deadline
            days_until: Days until the deadline

        Returns:
            True if email sent successfully
        """
        opp = evaluation.opportunity

        opp_data = {
            "id": str(opp.id),
            "title": opp.title,
            "department": opp.department,
            "naics_code": opp.naics_code,
            "deadline": opp.response_deadline.strftime("%Y-%m-%d %H:%M") if opp.response_deadline else "N/A",
            "status": evaluation.user_saved
        }

        html_content = get_deadline_reminder_template(
            user_name=user.first_name,
            opportunity=opp_data,
            days_until=days_until
        )

        success = email_service.send_email(
            to_email=user.email,
            subject=f"Deadline Reminder: {days_until} Day{'s' if days_until != 1 else ''} - {opp.title[:50]}",
            html_content=html_content
        )

        if success:
            logger.info(f"Sent {days_until}-day reminder to {user.email}")

        return success

    def run_daily_digests(self) -> Dict:
        """
        Send daily digest emails to all subscribed users.

        Returns:
            Dict with email statistics
        """
        logger.info("Starting daily digest email task...")

        subscribers = self.get_digest_subscribers()

        if not subscribers:
            logger.info("No users subscribed to daily digests")
            return {"sent": 0, "failed": 0, "skipped": 0}

        sent = 0
        failed = 0
        skipped = 0

        for user in subscribers:
            try:
                if self.send_daily_digest(user):
                    sent += 1
                else:
                    skipped += 1
            except Exception as e:
                logger.error(f"Error sending digest to {user.email}: {str(e)}")
                failed += 1

        logger.info(f"Daily digest complete: {sent} sent, {failed} failed, {skipped} skipped")
        return {"sent": sent, "failed": failed, "skipped": skipped}

    def run_deadline_reminders(self) -> Dict:
        """
        Send deadline reminder emails for opportunities due in 1, 3, or 7 days.

        Returns:
            Dict with email statistics
        """
        logger.info("Starting deadline reminder task...")

        reminder_days = [1, 3, 7]
        sent = 0
        failed = 0

        for days in reminder_days:
            # Calculate target date
            target_date = datetime.utcnow().date() + timedelta(days=days)
            target_start = datetime.combine(target_date, datetime.min.time())
            target_end = datetime.combine(target_date, datetime.max.time())

            # Get evaluations with deadlines on this date
            evaluations = self.db.query(Evaluation).join(Opportunity).filter(
                Evaluation.user_saved.in_(["WATCHING", "BIDDING"]),
                Opportunity.response_deadline >= target_start,
                Opportunity.response_deadline <= target_end
            ).all()

            for evaluation in evaluations:
                try:
                    # Get user for this company
                    user = self.db.query(User).filter(
                        User.company_id == evaluation.company_id,
                        User.email_verified == True,
                        User.email_frequency != "none"
                    ).first()

                    if not user:
                        continue

                    if self.send_deadline_reminder(user, evaluation, days):
                        sent += 1
                    else:
                        failed += 1

                except Exception as e:
                    logger.error(f"Error sending reminder: {str(e)}")
                    failed += 1

        logger.info(f"Deadline reminders complete: {sent} sent, {failed} failed")
        return {"sent": sent, "failed": failed}


def run_email_agent_digests() -> Dict:
    """
    Convenience function to run daily digest emails.

    This function is called by the Celery task.

    Returns:
        Dict with email statistics
    """
    with EmailAgent() as agent:
        return agent.run_daily_digests()


def run_email_agent_reminders() -> Dict:
    """
    Convenience function to run deadline reminder emails.

    This function is called by the Celery task.

    Returns:
        Dict with email statistics
    """
    with EmailAgent() as agent:
        return agent.run_deadline_reminders()
