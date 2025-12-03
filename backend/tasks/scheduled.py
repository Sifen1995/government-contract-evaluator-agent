"""Scheduled Celery tasks"""
from celery import shared_task
from celery.schedules import crontab
from .celery_app import celery_app
from agents.discovery import run_discovery
from agents.evaluation import run_evaluation
from agents.email_agent import run_daily_digest, run_deadline_reminders
import logging

logger = logging.getLogger(__name__)


@shared_task(name="tasks.discover_opportunities")
def discover_opportunities():
    """Discover new opportunities from SAM.gov"""
    logger.info("Starting opportunity discovery task")
    try:
        run_discovery()
        logger.info("Opportunity discovery completed")
    except Exception as e:
        logger.error(f"Error in discovery task: {e}")
        raise


@shared_task(name="tasks.evaluate_opportunities")
def evaluate_opportunities():
    """Evaluate new opportunities with AI"""
    logger.info("Starting opportunity evaluation task")
    try:
        run_evaluation()
        logger.info("Opportunity evaluation completed")
    except Exception as e:
        logger.error(f"Error in evaluation task: {e}")
        raise


@shared_task(name="tasks.send_daily_digests")
def send_daily_digests():
    """Send daily email digests to users"""
    logger.info("Starting daily digest task")
    try:
        run_daily_digest()
        logger.info("Daily digest completed")
    except Exception as e:
        logger.error(f"Error in daily digest task: {e}")
        raise


@shared_task(name="tasks.send_deadline_reminders")
def send_deadline_reminders():
    """Send deadline reminders"""
    logger.info("Starting deadline reminder task")
    try:
        run_deadline_reminders()
        logger.info("Deadline reminders completed")
    except Exception as e:
        logger.error(f"Error in deadline reminder task: {e}")
        raise


# Configure beat schedule
celery_app.conf.beat_schedule = {
    # Poll SAM.gov every 15 minutes
    "discover-opportunities": {
        "task": "tasks.discover_opportunities",
        "schedule": crontab(minute="*/15"),
    },
    # Evaluate new opportunities every hour
    "evaluate-opportunities": {
        "task": "tasks.evaluate_opportunities",
        "schedule": crontab(minute=0),
    },
    # Send daily digests at 8 AM
    "send-daily-digests": {
        "task": "tasks.send_daily_digests",
        "schedule": crontab(hour=8, minute=0),
    },
    # Send deadline reminders at 9 AM
    "send-deadline-reminders": {
        "task": "tasks.send_deadline_reminders",
        "schedule": crontab(hour=9, minute=0),
    },
}
