# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GovAI is an AI-powered government contract discovery platform that automatically discovers, evaluates, and recommends government contracting opportunities from SAM.gov using OpenAI GPT-4.

## Development Commands

### Start/Stop Services

```bash
# Start all services (MySQL, Redis, Backend, Frontend, Celery)
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View logs (all or specific service)
docker-compose logs -f
docker-compose logs -f backend
```

### Database Migrations

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Rollback migration
docker-compose exec backend alembic downgrade -1
```

### Direct Container Access

```bash
# Backend shell
docker-compose exec backend bash

# MySQL CLI
docker-compose exec mysql mysql -u govai_user -p govai

# Redis CLI
docker-compose exec redis redis-cli
```

### Frontend Development

```bash
docker-compose exec frontend sh
docker-compose exec frontend npm install <package-name>
```

## Architecture

### Tech Stack
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy + MySQL 8.0
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Task Queue**: Celery with Redis broker
- **AI**: OpenAI GPT-4

### Backend Structure (`backend/`)
- `app/api/v1/` - API route handlers (auth, company, opportunities, reference)
- `app/core/` - Configuration, database connection, security utilities
- `app/models/` - SQLAlchemy models (User, Company, Opportunity, Evaluation)
- `app/schemas/` - Pydantic request/response schemas
- `app/services/` - Business logic (auth, company, opportunity, ai_evaluator, sam_gov, email)
- `agents/` - AI agents (discovery, evaluation, email_agent)
- `tasks/` - Celery tasks (discovery, email_tasks)
- `alembic/` - Database migrations

### Frontend Structure (`frontend/`)
- `app/` - Next.js App Router pages
- `components/` - React components
- `hooks/` - Custom React hooks
- `lib/` - Utilities and API client
- `types/` - TypeScript type definitions

### Key Data Flow
1. Celery Beat triggers opportunity discovery every 15 minutes
2. Discovery agent queries SAM.gov API
3. AI evaluation agent scores opportunities against company profiles
4. Users view recommendations and manage pipeline (WATCHING → BIDDING → WON/LOST)
5. Email notifications for daily digest (8 AM) and deadline reminders

### External Services
- **SAM.gov API**: Government contract opportunities (requires API key)
- **OpenAI GPT-4**: AI-powered evaluation and scoring
- **SendGrid**: Email notifications (production; console mode for development)

## API Endpoints

- API Documentation: http://localhost:8000/docs (Swagger UI)
- Health checks: `/health`, `/health/detailed`, `/ready`
- All API routes prefixed with `/api/v1/`

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`, `REDIS_URL` - Database connections
- `JWT_SECRET` - Authentication secret (generate with `openssl rand -hex 32`)
- `SAM_API_KEY`, `OPENAI_API_KEY` - External API keys
- `EMAIL_MODE` - `console` for dev, `sendgrid` for production
- `DEBUG` - Set to `false` in production

## Production Deployment

See `DEPLOYMENT.md` for production setup with docker-compose.prod.yml, Nginx configuration, SSL, and security hardening.
