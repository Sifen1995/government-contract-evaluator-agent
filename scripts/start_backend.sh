#!/bin/bash
cd "$(dirname "$0")/../backend"

echo "Starting GovAI Backend..."

# Activate virtual environment
source venv/bin/activate

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Start backend
echo "Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
