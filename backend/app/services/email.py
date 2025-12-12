"""
Email service for sending emails via SendGrid or console (development)
"""
from typing import Optional, List, Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# SendGrid import (optional)
try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail, Email, To, Content, Personalization
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    logger.warning("SendGrid not installed. Using console mode only.")


class EmailService:
    """Email service supporting SendGrid and console modes"""

    def __init__(self):
        self.mode = settings.EMAIL_MODE
        self.from_email = settings.EMAIL_FROM
        self.sendgrid_api_key = settings.SENDGRID_API_KEY

        if self.mode == "sendgrid" and not SENDGRID_AVAILABLE:
            logger.warning("SendGrid mode requested but package not installed. Falling back to console.")
            self.mode = "console"

        if self.mode == "sendgrid" and not self.sendgrid_api_key:
            logger.warning("SendGrid mode requested but API key not set. Falling back to console.")
            self.mode = "console"

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send a single email

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional fallback)

        Returns:
            True if email sent successfully, False otherwise
        """
        if self.mode == "console":
            return self._send_console(to_email, subject, html_content, text_content)
        else:
            return self._send_sendgrid(to_email, subject, html_content, text_content)

    def send_bulk_emails(
        self,
        recipients: List[Dict[str, Any]],
        subject: str,
        html_template: str,
    ) -> Dict[str, int]:
        """
        Send bulk emails with personalization

        Args:
            recipients: List of dicts with 'email' and optional personalization data
            subject: Email subject
            html_template: HTML template with {placeholders}

        Returns:
            Dict with 'sent' and 'failed' counts
        """
        sent = 0
        failed = 0

        for recipient in recipients:
            email = recipient.get('email')
            if not email:
                failed += 1
                continue

            # Replace placeholders in template
            html_content = html_template
            for key, value in recipient.items():
                html_content = html_content.replace(f"{{{key}}}", str(value) if value else "")

            if self.send_email(email, subject, html_content):
                sent += 1
            else:
                failed += 1

        return {"sent": sent, "failed": failed}

    def _send_console(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email to console (development mode)"""
        print("\n" + "=" * 80)
        print("EMAIL NOTIFICATION")
        print("=" * 80)
        print(f"To: {to_email}")
        print(f"From: {self.from_email}")
        print(f"Subject: {subject}")
        print("-" * 80)
        # Print text content if available, otherwise strip HTML tags for preview
        if text_content:
            print(text_content[:500])
        else:
            # Simple HTML tag stripping for preview
            import re
            text_preview = re.sub(r'<[^>]+>', '', html_content)
            text_preview = re.sub(r'\s+', ' ', text_preview).strip()
            print(text_preview[:500])
        print("=" * 80 + "\n")
        return True

    def _send_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send email via SendGrid"""
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )

            if text_content:
                message.add_content(Content("text/plain", text_content))

            sg = SendGridAPIClient(self.sendgrid_api_key)
            response = sg.send(message)

            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"SendGrid returned status {response.status_code}")
                return False

        except Exception as e:
            logger.error(f"Error sending email via SendGrid: {str(e)}")
            return False


# Global email service instance
email_service = EmailService()


# Email Templates

def get_daily_digest_template(
    user_name: str,
    new_opportunities: List[Dict],
    deadline_reminders: List[Dict],
    stats: Dict
) -> str:
    """Generate daily digest email HTML"""

    opportunities_html = ""
    if new_opportunities:
        opportunities_html = "<h2 style='color: #22c55e;'>New BID Recommendations</h2><ul>"
        for opp in new_opportunities[:10]:  # Limit to 10
            opportunities_html += f"""
            <li style='margin-bottom: 15px;'>
                <strong>{opp.get('title', 'Untitled')}</strong><br>
                <span style='color: #6b7280;'>{opp.get('department', 'N/A')} | NAICS: {opp.get('naics_code', 'N/A')}</span><br>
                <span style='color: #22c55e;'>Fit Score: {opp.get('fit_score', 0)}%</span> |
                <span style='color: #8b5cf6;'>Win Probability: {opp.get('win_probability', 0)}%</span><br>
                <span style='color: #dc2626;'>Deadline: {opp.get('deadline', 'N/A')}</span>
            </li>
            """
        opportunities_html += "</ul>"
        if len(new_opportunities) > 10:
            opportunities_html += f"<p><em>...and {len(new_opportunities) - 10} more opportunities</em></p>"
    else:
        opportunities_html = "<p style='color: #6b7280;'>No new BID recommendations today.</p>"

    reminders_html = ""
    if deadline_reminders:
        reminders_html = "<h2 style='color: #f59e0b;'>Upcoming Deadlines</h2><ul>"
        for opp in deadline_reminders[:5]:
            reminders_html += f"""
            <li style='margin-bottom: 10px;'>
                <strong>{opp.get('title', 'Untitled')}</strong><br>
                <span style='color: #dc2626;'>Deadline: {opp.get('deadline', 'N/A')} ({opp.get('days_until', '?')} days)</span>
            </li>
            """
        reminders_html += "</ul>"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #1e40af; margin-bottom: 5px;">GovAI Daily Digest</h1>
            <p style="color: #6b7280; margin-top: 0;">Hello{', ' + user_name if user_name else ''}!</p>

            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">Your Stats</h3>
                <div style="display: flex; gap: 20px;">
                    <div>
                        <span style="font-size: 24px; font-weight: bold; color: #3b82f6;">{stats.get('total_evaluated', 0)}</span>
                        <br><span style="color: #6b7280; font-size: 12px;">Evaluated</span>
                    </div>
                    <div>
                        <span style="font-size: 24px; font-weight: bold; color: #22c55e;">{stats.get('bid_count', 0)}</span>
                        <br><span style="color: #6b7280; font-size: 12px;">BID Recs</span>
                    </div>
                    <div>
                        <span style="font-size: 24px; font-weight: bold; color: #8b5cf6;">{stats.get('in_pipeline', 0)}</span>
                        <br><span style="color: #6b7280; font-size: 12px;">In Pipeline</span>
                    </div>
                </div>
            </div>

            {opportunities_html}

            {reminders_html}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <a href="{settings.FRONTEND_URL}/opportunities" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    View All Opportunities
                </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                You're receiving this because you're subscribed to daily digests.<br>
                <a href="{settings.FRONTEND_URL}/settings" style="color: #3b82f6;">Update your preferences</a>
            </p>
        </div>
    </body>
    </html>
    """


def get_deadline_reminder_template(
    user_name: str,
    opportunity: Dict,
    days_until: int
) -> str:
    """Generate deadline reminder email HTML"""

    urgency_color = "#dc2626" if days_until <= 3 else "#f59e0b" if days_until <= 7 else "#3b82f6"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background-color: {urgency_color}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h2 style="margin: 0;">Deadline Alert: {days_until} Day{'s' if days_until != 1 else ''} Remaining</h2>
            </div>

            <p style="color: #6b7280;">Hello{', ' + user_name if user_name else ''}!</p>

            <p>An opportunity in your pipeline has an upcoming deadline:</p>

            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #111827;">{opportunity.get('title', 'Untitled')}</h3>
                <p style="margin: 5px 0; color: #6b7280;">{opportunity.get('department', 'N/A')}</p>
                <p style="margin: 5px 0;"><strong>NAICS:</strong> {opportunity.get('naics_code', 'N/A')}</p>
                <p style="margin: 5px 0;"><strong>Deadline:</strong> <span style="color: {urgency_color}; font-weight: bold;">{opportunity.get('deadline', 'N/A')}</span></p>
                <p style="margin: 5px 0;"><strong>Status:</strong> {opportunity.get('status', 'N/A')}</p>
            </div>

            <div style="margin-top: 20px;">
                <a href="{settings.FRONTEND_URL}/opportunities/{opportunity.get('id', '')}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    View Opportunity
                </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                You're receiving this because this opportunity is in your pipeline.<br>
                <a href="{settings.FRONTEND_URL}/settings" style="color: #3b82f6;">Update your preferences</a>
            </p>
        </div>
    </body>
    </html>
    """


def get_verification_email_template(verification_link: str) -> str:
    """Generate email verification HTML"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #1e40af;">Welcome to GovAI!</h1>

            <p>Thank you for signing up. Please verify your email address to get started.</p>

            <div style="margin: 30px 0;">
                <a href="{verification_link}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    Verify Email Address
                </a>
            </div>

            <p style="color: #6b7280;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">{verification_link}</p>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                This link will expire in 24 hours.<br>
                If you didn't create an account, you can safely ignore this email.
            </p>
        </div>
    </body>
    </html>
    """


def get_password_reset_template(reset_link: str) -> str:
    """Generate password reset HTML"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #1e40af;">Reset Your Password</h1>

            <p>We received a request to reset your password. Click the button below to create a new password:</p>

            <div style="margin: 30px 0;">
                <a href="{reset_link}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    Reset Password
                </a>
            </div>

            <p style="color: #6b7280;">Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">{reset_link}</p>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
                This link will expire in 1 hour.<br>
                If you didn't request a password reset, you can safely ignore this email.
            </p>
        </div>
    </body>
    </html>
    """
