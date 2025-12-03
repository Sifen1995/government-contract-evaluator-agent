#!/bin/bash
cd "$(dirname "$0")/../backend"

echo "Starting GovAI Celery Workers..."

# Activate virtual environment
source venv/bin/activate

# Start Celery worker and beat in background
echo "Starting Celery worker..."
celery -A tasks.celery_app worker --loglevel=info &

echo "Starting Celery beat scheduler..."
celery -A tasks.celery_app beat --loglevel=info
