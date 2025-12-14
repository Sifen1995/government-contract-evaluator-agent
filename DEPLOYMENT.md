# GovAI Production Deployment Guide

Deploy GovAI to EC2 with native Python (no Docker/Redis/Celery).

## Overview

| Component | Deployment |
|-----------|------------|
| Backend API | EC2 + systemd + gunicorn |
| Scheduled Tasks | Cron jobs |
| Database | AWS RDS PostgreSQL |
| Frontend | S3 + CloudFront (static) |

## Prerequisites

- EC2 instance (t3a.large or larger recommended)
- RDS PostgreSQL database
- Python 3.9+ on EC2
- SSH access to EC2
- API keys:
  - SAM.gov API key
  - OpenAI API key
  - SendGrid API key (for production emails)

## Quick Deployment

### 1. Configure Environment

```bash
# Copy production environment template
cp backend/.env.production.example backend/.env.production

# Edit with your production values
nano backend/.env.production
```

**Required settings:**
```bash
# Database - Your RDS endpoint
DATABASE_URL=postgresql://user:password@your-rds.amazonaws.com:5432/govai

# JWT - Generate with: openssl rand -hex 32
JWT_SECRET=your_64_character_secret

# URLs
API_URL=http://your-ec2-ip:8000
FRONTEND_URL=https://your-cloudfront-domain.com
CORS_ORIGINS=https://your-cloudfront-domain.com

# Email
EMAIL_MODE=sendgrid
SENDGRID_API_KEY=your_sendgrid_key

# APIs
SAM_API_KEY=your_sam_gov_key
OPENAI_API_KEY=your_openai_key

# Production
DEBUG=false
```

### 2. Deploy to EC2

```bash
# Full deployment (first time)
./deploy.sh

# Quick deployment (code updates only)
./deploy-quick.sh
```

The deploy script will:
1. Upload backend code to `/opt/govai/backend`
2. Create Python virtual environment
3. Install dependencies
4. Run database migrations
5. Install systemd service
6. Setup cron jobs
7. Start the API

### 3. Verify Deployment

```bash
# SSH to server
ssh ubuntu@your-ec2-ip

# Check service status
sudo systemctl status govai-api

# Check logs
sudo journalctl -u govai-api -f

# Test health endpoint
curl http://localhost:8000/health
curl http://localhost:8000/health/detailed
```

## Service Management

### Backend API

```bash
# Start/Stop/Restart
sudo systemctl start govai-api
sudo systemctl stop govai-api
sudo systemctl restart govai-api

# View logs
sudo journalctl -u govai-api -f
sudo journalctl -u govai-api -n 100 --no-pager

# Enable on boot
sudo systemctl enable govai-api
```

### Cron Jobs (Scheduled Tasks)

```bash
# View installed cron jobs
crontab -l

# Edit cron jobs
crontab -e

# View cron logs
tail -f /var/log/govai/discovery.log
tail -f /var/log/govai/email.log
```

**Scheduled tasks:**
| Task | Schedule | Log |
|------|----------|-----|
| Discover opportunities | Every 15 min | `/var/log/govai/discovery.log` |
| Daily digest emails | 8 AM UTC | `/var/log/govai/email.log` |
| Deadline reminders | 9 AM UTC | `/var/log/govai/email.log` |
| Cleanup old opportunities | 2 AM UTC | `/var/log/govai/cleanup.log` |

### Manual Task Execution

```bash
# SSH to server
ssh ubuntu@your-ec2-ip

# Run discovery manually
cd /opt/govai/backend
source ../venv/bin/activate
python scripts/discover_opportunities.py

# Run other tasks
python scripts/send_daily_digest.py
python scripts/send_deadline_reminders.py
python scripts/cleanup_opportunities.py
```

## Database Migrations

```bash
# SSH to server
ssh ubuntu@your-ec2-ip

# Run migrations
cd /opt/govai/backend
source ../venv/bin/activate
alembic upgrade head

# Check migration status
alembic current

# Rollback
alembic downgrade -1
```

## Directory Structure on EC2

```
/opt/govai/
├── backend/           # Application code
│   ├── app/          # FastAPI application
│   ├── scripts/      # Cron job scripts
│   ├── alembic/      # Database migrations
│   └── .env          # Environment variables
├── venv/             # Python virtual environment
└── logs/             # Application logs (optional)

/var/log/govai/       # Cron job logs
├── discovery.log
├── email.log
└── cleanup.log
```

## Frontend Deployment (S3 + CloudFront)

### Build Static Export

```bash
cd frontend

# Update .env.production with API URL
echo "NEXT_PUBLIC_API_URL=http://your-ec2-ip:8000" > .env.production

# Build static export
npm run build
```

### Upload to S3

```bash
# Create S3 bucket
aws s3 mb s3://govai-frontend

# Upload built files
aws s3 sync out/ s3://govai-frontend --delete

# Configure bucket for static hosting
aws s3 website s3://govai-frontend --index-document index.html --error-document 404.html
```

### Configure CloudFront

1. Create CloudFront distribution with S3 origin
2. Set default root object to `index.html`
3. Configure custom error pages for SPA routing
4. Enable HTTPS with ACM certificate

## Nginx Reverse Proxy (Optional)

If you want HTTPS on the backend:

```bash
sudo apt install nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/govai`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/govai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com
```

## Monitoring

### Health Endpoints

- `/health` - Basic health (API is up)
- `/health/detailed` - Database connectivity check
- `/ready` - Readiness for load balancer

### Log Monitoring

```bash
# API logs
sudo journalctl -u govai-api -f

# Cron logs
tail -f /var/log/govai/*.log

# All logs combined
sudo journalctl -u govai-api -f & tail -f /var/log/govai/*.log
```

### Server Resources

```bash
# Memory usage
free -h

# Disk usage
df -h

# Process monitoring
htop
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u govai-api -n 50 --no-pager

# Common issues:
# - Missing .env file
# - Invalid DATABASE_URL
# - Port already in use
```

### Database Connection Failed

```bash
# Test connection manually
cd /opt/govai/backend
source ../venv/bin/activate
python -c "from app.core.database import engine; engine.connect(); print('OK')"
```

### Cron Jobs Not Running

```bash
# Check cron service
sudo systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Test script manually
cd /opt/govai/backend
source ../venv/bin/activate
python scripts/discover_opportunities.py
```

## Security Checklist

- [ ] `DEBUG=false` in production
- [ ] Strong JWT secret (64+ characters)
- [ ] RDS not publicly accessible
- [ ] EC2 security group: only ports 22, 80, 443, 8000
- [ ] SSH key-based authentication only
- [ ] Regular backups of RDS
- [ ] CloudWatch alarms for monitoring

## Updating

```bash
# Quick code update
./deploy-quick.sh

# Full update with dependencies
./deploy.sh

# Or manually on server:
ssh ubuntu@your-ec2-ip
cd /opt/govai/backend
git pull  # if using git
source ../venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart govai-api
```
