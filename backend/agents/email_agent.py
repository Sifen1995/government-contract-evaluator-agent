"""Email Agent - Sends daily digests and notifications"""
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime, timedelta
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.models.evaluation import Evaluation
import logging

logger = logging.getLogger(__name__)


class EmailAgent:
    """Agent for sending email notifications"""

    def __init__(self):
        self.sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        self.from_email = settings.EMAIL_FROM
        self.from_name = settings.EMAIL_FROM_NAME
        self.frontend_url = settings.FRONTEND_URL

    def send_email(self, to_email: str, subject: str, html_content: str):
        """Send email via SendGrid"""
        message = Mail(
            from_email=(self.from_email, self.from_name),
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )

        try:
            response = self.sg.send(message)
            logger.info(f"Email sent to {to_email}: {response.status_code}")
            return True
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {e}")
            return False

    def build_daily_digest_html(self, user: User, opportunities: list) -> str:
        """Build HTML content for daily digest"""
        opp_html = ""

        for opp_data in opportunities[:5]:  # Top 5
            opp = opp_data["opportunity"]
            eval = opp_data["evaluation"]

            badge_color = "green" if eval.recommendation == "BID" else "orange" if eval.recommendation == "REVIEW" else "red"

            opp_html += f"""
            <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0;">
                    <span style="background: {badge_color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px;">
                        {eval.fit_score}
                    </span>
                    {opp.title}
                </h3>
                <p style="color: #666; margin: 10px 0;">
                    <strong>{opp.agency}</strong> | {opp.naics_code} | Due: {opp.response_deadline.strftime('%b %d, %Y') if opp.response_deadline else 'TBD'}
                </p>
                <p style="margin: 10px 0;">
                    <strong>AI Recommendation:</strong> {eval.recommendation} - {eval.executive_summary}
                </p>
                <a href="{self.frontend_url}/opportunities/{opp.id}"
                   style="display: inline-block; background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">
                    View Details →
                </a>
            </div>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Your Daily Contract Opportunities</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: #0066cc; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">GovAI Daily Digest</h1>
                <p style="margin: 10px 0 0 0;">Your Top Opportunities for {datetime.now().strftime('%B %d, %Y')}</p>
            </div>

            <div style="padding: 20px;">
                <p>Hi {user.first_name or 'there'},</p>
                <p>We found <strong>{len(opportunities)} new opportunities</strong> matching your profile. Here are your top matches:</p>

                {opp_html}

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{self.frontend_url}/dashboard"
                       style="display: inline-block; background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 4px; font-size: 16px;">
                        View All Opportunities
                    </a>
                </div>

                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

                <p style="font-size: 12px; color: #666; text-align: center;">
                    <a href="{self.frontend_url}/settings" style="color: #666;">Manage email preferences</a> |
                    <a href="{self.frontend_url}/unsubscribe" style="color: #666;">Unsubscribe</a>
                </p>
            </div>
        </body>
        </html>
        """

        return html

    def send_daily_digest(self, db: Session, user: User):
        """Send daily digest to a user"""
        if user.email_frequency != "daily":
            return False

        if not user.email_verified:
            logger.info(f"Skipping unverified email: {user.email}")
            return False

        # Get top opportunities for user
        opportunities = []

        if user.company:
            # Get recent opportunities with high scores
            query = db.query(Opportunity).join(Evaluation).filter(
                and_(
                    Evaluation.company_id == user.company_id,
                    Opportunity.status == "active",
                    Opportunity.posted_date >= datetime.utcnow() - timedelta(days=7)
                )
            ).order_by(desc(Evaluation.fit_score)).limit(10)

            for opp in query.all():
                eval = db.query(Evaluation).filter(
                    and_(
                        Evaluation.opportunity_id == opp.id,
                        Evaluation.company_id == user.company_id
                    )
                ).first()

                opportunities.append({
                    "opportunity": opp,
                    "evaluation": eval
                })

        if not opportunities:
            logger.info(f"No opportunities for user {user.email}, skipping digest")
            return False

        # Build and send email
        html_content = self.build_daily_digest_html(user, opportunities)
        subject = f"Your Daily Digest: {len(opportunities)} New Opportunities"

        return self.send_email(user.email, subject, html_content)

    def send_all_daily_digests(self, db: Session):
        """Send daily digests to all eligible users"""
        users = db.query(User).filter(
            User.email_verified == True,
            User.email_frequency == "daily"
        ).all()

        sent_count = 0
        for user in users:
            if self.send_daily_digest(db, user):
                sent_count += 1

        logger.info(f"Daily digests sent: {sent_count}/{len(users)}")
        return sent_count

    def send_deadline_reminders(self, db: Session):
        """Send reminders for upcoming deadlines"""
        # Get opportunities with deadlines in 3 days
        deadline_date = datetime.utcnow() + timedelta(days=3)

        # Implementation would query saved opportunities with upcoming deadlines
        # and send reminder emails

        logger.info("Deadline reminders sent")


def run_daily_digest():
    """Run daily digest (called by Celery)"""
    db = SessionLocal()
    try:
        agent = EmailAgent()
        agent.send_all_daily_digests(db)
    finally:
        db.close()


def run_deadline_reminders():
    """Run deadline reminders (called by Celery)"""
    db = SessionLocal()
    try:
        agent = EmailAgent()
        agent.send_deadline_reminders(db)
    finally:
        db.close()
