#!/bin/bash

# GovAI API Deployment Script
# Deploys the FastAPI backend to EC2 server

set -e  # Exit on any error

# Configuration
SERVER="ubuntu@ec2-35-173-103-83.compute-1.amazonaws.com"
REMOTE_DIR="/opt/govai"
SERVICE_NAME="govai-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting GovAI API deployment...${NC}"

# Step 1: Create remote directory structure
echo -e "${YELLOW}Setting up remote directories...${NC}"
ssh ${SERVER} "sudo mkdir -p ${REMOTE_DIR}/backend ${REMOTE_DIR}/logs && sudo chown -R ubuntu:ubuntu ${REMOTE_DIR}"

# Step 2: Sync backend code to server
echo -e "${YELLOW}Uploading backend code...${NC}"
rsync -avz --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude '.env' \
    --exclude 'venv' \
    --exclude '.git' \
    --exclude 'alembic/versions/__pycache__' \
    backend/ ${SERVER}:${REMOTE_DIR}/backend/

# Step 3: Upload environment file if it exists
if [ -f "backend/.env.production" ]; then
    echo -e "${YELLOW}Uploading production environment file...${NC}"
    scp backend/.env.production ${SERVER}:${REMOTE_DIR}/backend/.env
elif [ -f "backend/.env" ]; then
    echo -e "${YELLOW}Uploading environment file...${NC}"
    scp backend/.env ${SERVER}:${REMOTE_DIR}/backend/.env
else
    echo -e "${RED}Warning: No .env file found. Make sure to configure ${REMOTE_DIR}/backend/.env on the server${NC}"
fi

# Step 4: Upload systemd service file
echo -e "${YELLOW}Uploading systemd service file...${NC}"
scp govai-api.service ${SERVER}:/tmp/
ssh ${SERVER} "sudo mv /tmp/govai-api.service /etc/systemd/system/ && sudo systemctl daemon-reload"

# Step 5: Setup Python virtual environment and install dependencies
echo -e "${YELLOW}Setting up Python environment...${NC}"
ssh ${SERVER} << 'ENDSSH'
cd /opt/govai

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# Create log directory
sudo mkdir -p /var/log/govai
sudo chown ubuntu:ubuntu /var/log/govai
ENDSSH

# Step 6: Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
ssh ${SERVER} << 'ENDSSH'
cd /opt/govai/backend
source ../venv/bin/activate
alembic upgrade head
ENDSSH

# Step 7: Setup cron jobs
echo -e "${YELLOW}Setting up cron jobs...${NC}"
ssh ${SERVER} << 'ENDSSH'
# Make scripts executable
chmod +x /opt/govai/backend/scripts/*.py

# Install crontab (preserving existing user cron jobs)
crontab -l 2>/dev/null | grep -v "govai" > /tmp/current_cron || true
cat /opt/govai/backend/scripts/govai-crontab >> /tmp/current_cron
crontab /tmp/current_cron
rm /tmp/current_cron
ENDSSH

# Step 8: Restart the service
echo -e "${YELLOW}Restarting ${SERVICE_NAME} service...${NC}"
ssh ${SERVER} "sudo systemctl enable ${SERVICE_NAME} && sudo systemctl restart ${SERVICE_NAME}"

# Step 9: Check service status
echo -e "${YELLOW}Checking service status...${NC}"
sleep 3
SERVICE_STATUS=$(ssh ${SERVER} "sudo systemctl is-active ${SERVICE_NAME}")

if [ "$SERVICE_STATUS" = "active" ]; then
    echo -e "${GREEN}Service restarted successfully and is running${NC}"
else
    echo -e "${RED}Service failed to start. Status: ${SERVICE_STATUS}${NC}"
    echo -e "${YELLOW}Last few log entries:${NC}"
    ssh ${SERVER} "sudo journalctl -u ${SERVICE_NAME} --no-pager -n 20"
    exit 1
fi

# Step 10: Test API health
echo -e "${YELLOW}Testing API health...${NC}"
sleep 5
if ssh ${SERVER} "curl -f -s http://localhost:8000/health > /dev/null"; then
    echo -e "${GREEN}API health check passed${NC}"
else
    echo -e "${YELLOW}API health check failed (might still be starting up)${NC}"
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo -e "   - Backend code deployed to ${REMOTE_DIR}/backend"
echo -e "   - Service: ${SERVICE_NAME}"
echo -e "   - API: http://35.173.103.83:8000"
echo -e "   - Cron jobs installed for scheduled tasks"
echo -e ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "   ssh ${SERVER}"
echo -e "   sudo systemctl status ${SERVICE_NAME}"
echo -e "   sudo journalctl -u ${SERVICE_NAME} -f"
echo -e "   crontab -l"
