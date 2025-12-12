"""
Celery tasks for scheduled email notifications
"""
from celery import shared_task
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from app.core.database import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.evaluation import Evaluation
from app.models.opportunity import Opportunity
from app.services.email import (
    email_service,
    get_daily_digest_template,
    get_deadline_reminder_template
)
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


@shared_task(name="send_daily_digest_emails")
def send_daily_digest_emails_task():
    """
    Send daily digest emails to all users subscribed to daily digests
    Runs every day at 8 AM via Celery Beat

    Returns:
        Dict with counts of emails sent and failed
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

                html_content = get_daily_digest_template(
                    user_name=user.first_name,
                    new_opportunities=new_opps_formatted,
                    deadline_reminders=reminders_formatted,
                    stats=stats
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

        logger.info(f"Daily digest task completed: {sent} sent, {failed} failed, {skipped} skipped")
        return {"sent": sent, "failed": failed, "skipped": skipped}

    except Exception as e:
        logger.error(f"Error in daily digest task: {str(e)}")
        raise
    finally:
        db.close()


@shared_task(name="send_deadline_reminders")
def send_deadline_reminders_task():
    """
    Send deadline reminder emails for opportunities with deadlines in 1, 3, and 7 days
    Runs every day at 9 AM via Celery Beat

    Returns:
        Dict with counts of emails sent
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

                    # Generate email
                    html_content = get_deadline_reminder_template(
                        user_name=user.first_name,
                        opportunity=opp_data,
                        days_until=days
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

        logger.info(f"Deadline reminder task completed: {sent} sent, {failed} failed")
        return {"sent": sent, "failed": failed}

    except Exception as e:
        logger.error(f"Error in deadline reminder task: {str(e)}")
        raise
    finally:
        db.close()


@shared_task(name="send_realtime_notification")
def send_realtime_notification_task(user_id: str, opportunity_id: str, evaluation_id: str):
    """
    Send real-time notification for a new BID recommendation
    Called immediately when a new BID evaluation is created for users with realtime notifications

    Args:
        user_id: User ID
        opportunity_id: Opportunity ID
        evaluation_id: Evaluation ID

    Returns:
        Dict with success status
    """
    db = SessionLocal()
    try:
        # Get user
        user = db.query(User).filter(
            User.id == user_id,
            User.email_verified == True,
            User.email_frequency == "realtime"
        ).first()

        if not user:
            return {"sent": False, "reason": "User not found or not subscribed to realtime"}

        # Get evaluation and opportunity
        evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()

        if not evaluation or not opportunity:
            return {"sent": False, "reason": "Evaluation or opportunity not found"}

        # Only notify for BID recommendations
        if evaluation.recommendation != "BID":
            return {"sent": False, "reason": "Not a BID recommendation"}

        # Generate simple notification email
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #22c55e; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="margin: 0;">New BID Recommendation!</h2>
            </div>

            <p>Hello{', ' + user.first_name if user.first_name else ''}!</p>

            <p>A new opportunity matching your company profile has been evaluated as a strong BID candidate:</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">{opportunity.title}</h3>
                <p><strong>Department:</strong> {opportunity.department or 'N/A'}</p>
                <p><strong>NAICS:</strong> {opportunity.naics_code or 'N/A'}</p>
                <p style="color: #22c55e;"><strong>Fit Score:</strong> {evaluation.fit_score}%</p>
                <p style="color: #8b5cf6;"><strong>Win Probability:</strong> {evaluation.win_probability}%</p>
                <p><strong>Deadline:</strong> {opportunity.response_deadline.strftime('%Y-%m-%d') if opportunity.response_deadline else 'N/A'}</p>
            </div>

            <a href="{settings.FRONTEND_URL}/opportunities/{opportunity.id}"
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View Details
            </a>
        </body>
        </html>
        """

        success = email_service.send_email(
            to_email=user.email,
            subject=f"New BID Recommendation: {opportunity.title[:50]}",
            html_content=html_content
        )

        return {"sent": success}

    except Exception as e:
        logger.error(f"Error sending realtime notification: {str(e)}")
        return {"sent": False, "reason": str(e)}
    finally:
        db.close()
