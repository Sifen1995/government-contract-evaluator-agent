# GovAI Production Deployment Guide

This guide covers deploying GovAI to a production environment.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)
- API keys ready:
  - SAM.gov API key
  - OpenAI API key
  - SendGrid API key (for emails)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd government-contract-evaluator-agent-main
```

### 2. Configure Environment Variables

```bash
# Copy production environment template
cp .env.production.example .env

# Edit with your production values
nano .env
```

**Critical settings to update:**
- `MYSQL_ROOT_PASSWORD` - Strong database root password
- `MYSQL_PASSWORD` - Strong database user password
- `JWT_SECRET` - Generate with `openssl rand -hex 32`
- `API_URL` - Your API domain (e.g., https://api.yourdomain.com)
- `FRONTEND_URL` - Your frontend domain (e.g., https://yourdomain.com)
- `CORS_ORIGINS` - Your frontend domain
- `SENDGRID_API_KEY` - Your SendGrid API key
- `SAM_API_KEY` - Your SAM.gov API key
- `OPENAI_API_KEY` - Your OpenAI API key
- `DEBUG=false` - **Important!**

### 3. Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate database passwords
openssl rand -base64 24
```

### 4. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 5. Verify Deployment

```bash
# Check health endpoint
curl https://api.yourdomain.com/health

# Check detailed health
curl https://api.yourdomain.com/health/detailed

# Check readiness
curl https://api.yourdomain.com/ready
```

## Nginx Reverse Proxy Setup

### Install Nginx

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### Configure Nginx

Create `/etc/nginx/sites-available/govai`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Enable Site and SSL

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/govai /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## Database Backup

### Manual Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p govai > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p govai < backup_20240101.sql
```

### Automated Backups

Create `/etc/cron.daily/govai-backup`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/govai"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f /path/to/govai/docker-compose.prod.yml exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD govai > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

## Monitoring

### Health Checks

- `/health` - Basic health check (always returns 200 if API is up)
- `/health/detailed` - Checks database and Redis connectivity
- `/ready` - Readiness check (returns 503 if dependencies are down)

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f celery-worker

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Scaling

### Horizontal Scaling (Multiple Workers)

Edit `docker-compose.prod.yml` to add more Celery workers:

```yaml
celery-worker-2:
  build:
    context: ./backend
    dockerfile: Dockerfile.prod
  container_name: govai-celery-worker-2
  # ... same config as celery-worker
```

### Vertical Scaling

Adjust resource limits in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Increase as needed
    reservations:
      memory: 512M
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

### Database Connection Issues

```bash
# Check MySQL is running
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p -e "SELECT 1"

# Check connection from backend
docker-compose -f docker-compose.prod.yml exec backend python -c "from app.core.database import engine; print(engine.connect())"
```

### Celery Tasks Not Running

```bash
# Check worker logs
docker-compose -f docker-compose.prod.yml logs celery-worker

# Check beat scheduler logs
docker-compose -f docker-compose.prod.yml logs celery-beat

# Verify Redis connection
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

### Email Not Sending

1. Verify `EMAIL_MODE=sendgrid` in `.env`
2. Check SendGrid API key is valid
3. Verify sender email is verified in SendGrid
4. Check backend logs for email errors

## Security Checklist

- [ ] `DEBUG=false` in production
- [ ] Strong, unique passwords for database
- [ ] JWT secret is 64+ characters
- [ ] HTTPS enabled with valid SSL certificate
- [ ] CORS configured for your domain only
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Database not exposed to internet
- [ ] Redis not exposed to internet
- [ ] Regular backups configured
- [ ] Log monitoring in place

## Updating

### Rolling Update

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run any new migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### Full Restart

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Rebuild everything
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## Support

For issues:
1. Check the logs first
2. Verify all environment variables are set
3. Check the health endpoints
4. Review this deployment guide
