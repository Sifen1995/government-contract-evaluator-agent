from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

# Create Celery app
celery_app = Celery(
    "govai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Configure Celery Beat Schedule (Week 3+)
celery_app.conf.beat_schedule = {
    "discover-opportunities-every-15-minutes": {
        "task": "discover_opportunities",
        "schedule": 900.0,  # 15 minutes in seconds
    },
    "cleanup-old-opportunities-daily": {
        "task": "cleanup_old_opportunities",
        "schedule": crontab(hour=2, minute=0),  # Run at 2 AM daily
    },
    # Week 5: Email tasks
    "send-daily-digest-emails": {
        "task": "send_daily_digest_emails",
        "schedule": crontab(hour=8, minute=0),  # Run at 8 AM daily
    },
    "send-deadline-reminders": {
        "task": "send_deadline_reminders",
        "schedule": crontab(hour=9, minute=0),  # Run at 9 AM daily
    },
}

# Import tasks here
from tasks import discovery  # noqa
from tasks import email_tasks  # noqa
