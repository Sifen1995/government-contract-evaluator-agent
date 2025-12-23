#!/usr/bin/env python3
"""
Standalone script for sending certification expiration reminder emails.
Sends reminders at 90, 60, and 30 days before expiration.

Usage:
    python scripts/send_certification_reminders.py

Cron entry (daily at 10 AM):
    0 10 * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/send_certification_reminders.py >> /var/log/govai/email.log 2>&1
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
from app.models.document import CertificationDocument
from app.services.email import email_service
from app.services.auth import get_or_create_unsubscribe_token

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


CERTIFICATION_TYPE_LABELS = {
    "8(a)": "8(a) Business Development Program",
    "WOSB": "Women-Owned Small Business (WOSB)",
    "EDWOSB": "Economically Disadvantaged WOSB (EDWOSB)",
    "SDVOSB": "Service-Disabled Veteran-Owned Small Business (SDVOSB)",
    "VOSB": "Veteran-Owned Small Business (VOSB)",
    "HUBZone": "HUBZone Certified",
    "SDB": "Small Disadvantaged Business (SDB)",
}


def get_certification_reminder_template(
    user_name: str,
    certification_type: str,
    expiration_date: str,
    days_until: int,
    unsubscribe_token: str
) -> str:
    """Generate HTML email template for certification expiration reminder."""
    cert_label = CERTIFICATION_TYPE_LABELS.get(certification_type, certification_type)

    urgency_color = "#f59e0b"  # Orange for 90/60 days
    urgency_text = "coming up"
    if days_until <= 30:
        urgency_color = "#ef4444"  # Red for 30 days
        urgency_text = "urgent"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background: #ffffff; padding: 20px; border: 1px solid #e5e7eb; }}
            .alert-box {{ background: #fef3c7; border: 2px solid {urgency_color}; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .days-badge {{ background: {urgency_color}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 18px; font-weight: bold; display: inline-block; }}
            .btn {{ display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }}
            .footer {{ background: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">Certification Expiration Reminder</h1>
            </div>
            <div class="content">
                <p>Hi {user_name or 'there'},</p>

                <div class="alert-box">
                    <p style="margin: 0 0 10px 0;"><strong>Your {cert_label} certification is expiring soon!</strong></p>
                    <p style="margin: 0;">
                        <span class="days-badge">{days_until} days</span>
                        until expiration on <strong>{expiration_date}</strong>
                    </p>
                </div>

                <h3>What you should do:</h3>
                <ul>
                    <li>Review your certification requirements</li>
                    <li>Gather necessary documentation for renewal</li>
                    <li>Submit your renewal application before the deadline</li>
                    <li>Update your certification document in GovAI once renewed</li>
                </ul>

                <h3>Why this matters:</h3>
                <p>Maintaining your certifications ensures you remain eligible for set-aside contracts and continue to receive relevant opportunity recommendations.</p>

                <p style="margin-top: 20px;">
                    <a href="https://app.govai.com/settings" class="btn">Manage Certifications</a>
                </p>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                    Need help? Reply to this email or visit our help center.
                </p>
            </div>
            <div class="footer">
                <p>You received this email because you have an expiring certification in GovAI.</p>
                <p><a href="https://app.govai.com/unsubscribe?token={unsubscribe_token}">Unsubscribe</a> from all emails</p>
            </div>
        </div>
    </body>
    </html>
    """


def send_certification_reminders():
    """
    Send certification expiration reminder emails.
    Sends reminders at 90, 60, and 30 days before expiration.
    """
    db = SessionLocal()
    try:
        logger.info("Starting certification reminder task...")

        # Reminder thresholds (90, 60, 30 days)
        reminder_days = [90, 60, 30]
        sent = 0
        failed = 0

        for days in reminder_days:
            # Calculate target date
            target_date = datetime.utcnow().date() + timedelta(days=days)

            # Get certifications expiring on this date
            certifications = db.query(CertificationDocument).join(
                Company, CertificationDocument.company_id == Company.id
            ).filter(
                CertificationDocument.expiration_date == target_date,
                CertificationDocument.status != "expired"
            ).all()

            for cert in certifications:
                try:
                    # Get user for this company
                    user = db.query(User).filter(
                        User.company_id == cert.company_id,
                        User.email_verified == True,
                        User.email_frequency != "none"
                    ).first()

                    if not user:
                        continue

                    # Get unsubscribe token
                    unsubscribe_token = get_or_create_unsubscribe_token(db, user)

                    # Generate email
                    html_content = get_certification_reminder_template(
                        user_name=user.first_name,
                        certification_type=cert.certification_type,
                        expiration_date=cert.expiration_date.strftime("%B %d, %Y"),
                        days_until=days,
                        unsubscribe_token=unsubscribe_token
                    )

                    # Send email
                    success = email_service.send_email(
                        to_email=user.email,
                        subject=f"Certification Expiring in {days} Days - {cert.certification_type}",
                        html_content=html_content
                    )

                    if success:
                        sent += 1
                        logger.info(f"Sent {days}-day cert reminder to {user.email} for {cert.certification_type}")
                    else:
                        failed += 1

                except Exception as e:
                    logger.error(f"Error sending cert reminder for {cert.id}: {str(e)}")
                    failed += 1
                    continue

        # Also check for already expired certifications and update status
        expired = db.query(CertificationDocument).filter(
            CertificationDocument.expiration_date < datetime.utcnow().date(),
            CertificationDocument.status != "expired"
        ).all()

        for cert in expired:
            cert.status = "expired"

        db.commit()

        if expired:
            logger.info(f"Marked {len(expired)} certifications as expired")

        logger.info(f"Certification reminder completed: {sent} sent, {failed} failed")
        return {"sent": sent, "failed": failed, "expired": len(expired)}

    except Exception as e:
        logger.error(f"Error in certification reminder: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    start_time = datetime.now()
    logger.info(f"=== Certification reminder job started at {start_time} ===")

    try:
        result = send_certification_reminders()
        logger.info(f"Result: {result}")
    except Exception as e:
        logger.error(f"Job failed: {e}")
        sys.exit(1)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"=== Certification reminder job completed in {duration:.2f} seconds ===")
