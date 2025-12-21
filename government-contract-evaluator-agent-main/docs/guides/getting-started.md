# Getting Started with GovAI

This guide will help you get the GovAI platform running locally for development or testing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
  - Download: https://www.docker.com/products/docker-desktop
- **Git** for version control
  - Download: https://git-scm.com/downloads

## Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd government-contract-evaluator-agent
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

The default `.env` file is pre-configured for local development. For production, see the [Deployment Guide](../DEPLOYMENT.md).

### 3. Start All Services

```bash
docker-compose up -d
```

This command starts:
- **MySQL** database (port 3306)
- **Redis** cache (port 6379)
- **Backend** API (port 8000)
- **Frontend** web app (port 3000)
- **Celery Worker** for background tasks
- **Celery Beat** for scheduled tasks

### 4. Initialize the Database

```bash
docker-compose exec backend alembic upgrade head
```

### 5. Access the Application

Open your browser and navigate to:

- **Frontend**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## First-Time User Flow

### 1. Register an Account

1. Go to http://localhost:3000
2. Click "Get Started" or navigate to `/register`
3. Fill in your details:
   - Email address
   - Password (min 8 characters)
   - First and last name
4. Submit the form

### 2. Verify Your Email

In development mode, email verification links are printed to the console:

```bash
# View backend logs
docker-compose logs backend
```

Look for:
```
================================================================================
EMAIL VERIFICATION LINK FOR: your@email.com
Link: http://localhost:3000/verify-email?token=abc123...
================================================================================
```

Copy and open this link in your browser.

### 3. Complete Company Onboarding

After logging in, you'll be guided through a 3-step onboarding:

**Step 1 - Company Information**:
- Company name
- Legal structure (LLC, Corporation, etc.)
- UEI number (optional)
- Business address

**Step 2 - Capabilities**:
- NAICS codes (search and select up to 10)
- Set-aside certifications (8(a), WOSB, SDVOSB, HUBZone)
- Contract value range
- Geographic preferences (states)

**Step 3 - Capabilities Statement**:
- Describe your company's capabilities (up to 500 words)
- Review and submit

### 4. Explore the Dashboard

After onboarding, you can:
- View AI-evaluated opportunities
- Filter by recommendation (BID/NO_BID/RESEARCH)
- Review detailed analysis
- Save opportunities to your pipeline
- Manage saved opportunities

## Configuration

### Environment Variables

Key variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | Local MySQL |
| `REDIS_URL` | Redis connection string | Local Redis |
| `JWT_SECRET` | Secret for JWT tokens | Development key |
| `EMAIL_MODE` | `console` or `sendgrid` | `console` |
| `OPENAI_API_KEY` | For AI evaluations | Required for AI |
| `SAM_API_KEY` | For SAM.gov API | Required for discovery |

### API Keys (Optional for Development)

For full functionality, you'll need:

1. **OpenAI API Key**: https://platform.openai.com/api-keys
2. **SAM.gov API Key**: https://sam.gov/api

Add these to your `.env` file:
```bash
OPENAI_API_KEY=sk-your-key-here
SAM_API_KEY=your-sam-api-key
```

## Common Commands

### Managing Docker Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Stop and remove all data
docker-compose down -v
```

### Database Commands

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Rollback migration
docker-compose exec backend alembic downgrade -1

# Access MySQL CLI
docker-compose exec mysql mysql -u govai_user -p govai
# Password: govai_password_dev (or from .env)
```

### Development Shell

```bash
# Access backend container
docker-compose exec backend bash

# Python shell with app context
docker-compose exec backend python
>>> from app.models import User
>>> from app.core.database import SessionLocal
>>> db = SessionLocal()
>>> users = db.query(User).all()
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port (Windows)
netstat -ano | findstr :3000

# Check what's using the port (Mac/Linux)
lsof -i :3000

# Solution: Stop Docker and restart
docker-compose down
docker-compose up -d
```

### Database Connection Errors

```bash
# Check if MySQL is running
docker-compose ps

# View MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Wait 30 seconds, then restart other services
docker-compose restart backend celery-worker
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend
```

### Backend Errors

```bash
# View backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check if migrations ran
docker-compose exec backend alembic current
```

### "Module Not Found" Errors

```bash
# Rebuild all containers
docker-compose down
docker-compose up -d --build
```

## Testing the API

### Using Swagger UI

1. Open http://localhost:8000/docs
2. Click "Authorize" button
3. Enter your JWT token (after login)
4. Try out the endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","first_name":"Test","last_name":"User"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use token in requests
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

1. **Explore the API**: http://localhost:8000/docs
2. **Read the Architecture**: [System Architecture](../architecture/system-architecture.md)
3. **Review User Stories**: [User Stories](../user-stories/)
4. **Deploy to Production**: [Deployment Guide](../../DEPLOYMENT.md)

## Getting Help

- **API Documentation**: http://localhost:8000/docs
- **Check Logs**: `docker-compose logs -f`
- **Container Status**: `docker-compose ps`
