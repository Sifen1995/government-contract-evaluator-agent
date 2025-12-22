#!/bin/bash

# Quick deployment script (skips environment setup)
# Use for code-only updates after initial deployment

set -e

SERVER="ubuntu@ec2-35-173-103-83.compute-1.amazonaws.com"
REMOTE_DIR="/opt/govai"
SERVICE_NAME="govai-api"

echo "Quick deployment starting..."

# Sync backend code
echo "Uploading backend code..."
rsync -avz --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.env' \
    --exclude 'venv' \
    --exclude '.git' \
    backend/ ${SERVER}:${REMOTE_DIR}/backend/

# Restart service
echo "Restarting service..."
ssh ${SERVER} "sudo systemctl restart ${SERVICE_NAME}"

# Quick status check
sleep 2
STATUS=$(ssh ${SERVER} "sudo systemctl is-active ${SERVICE_NAME}")
echo "Service status: ${STATUS}"

# Health check
sleep 3
if ssh ${SERVER} "curl -f -s http://localhost:8000/health > /dev/null"; then
    echo "Health check: OK"
else
    echo "Health check: FAILED (may still be starting)"
fi

echo "Quick deployment complete!"
