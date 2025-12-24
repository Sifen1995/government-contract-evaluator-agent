# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GovAI is an AI-powered government contract discovery platform that automatically discovers, evaluates, and recommends government contracting opportunities from SAM.gov using OpenAI GPT-4.

## Development Commands

### Backend Setup & Run

```bash
cd backend

# Create virtual environment (first time)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
# OR with Poetry
poetry install

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup & Run

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Migrations

```bash
cd backend
source venv/bin/activate

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1

# View current migration
alembic current
```

### Running Background Tasks

The app uses standalone Python scripts (run via cron in production):

```bash
cd backend
source venv/bin/activate

# Discover opportunities from SAM.gov
python scripts/discover_opportunities.py

# Evaluate pending opportunities with AI
python scripts/evaluate_pending.py

# Send daily digest emails
python scripts/send_daily_digest.py

# Send deadline reminders
python scripts/send_deadline_reminders.py

# Clean up old opportunities
python scripts/cleanup_opportunities.py
```

## Architecture

### Tech Stack
- **Backend**: Python 3.9+ + FastAPI + SQLAlchemy + MySQL
- **Frontend v1** (`frontend/`): Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Frontend v2** (`froentend-new/`): Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-4
- **Email**: SendGrid (console mode for dev)
- **Scheduled Tasks**: Cron jobs with standalone Python scripts
- **Hosting**: AWS S3 + CloudFront (frontend), EC2 (backend)

### Backend Structure (`backend/`)
- `app/api/v1/` - API route handlers (auth, company, opportunities, reference)
- `app/core/` - Configuration, database connection, security utilities
- `app/models/` - SQLAlchemy models (User, Company, Opportunity, Evaluation)
- `app/schemas/` - Pydantic request/response schemas
- `app/services/` - Business logic (auth, company, opportunity, ai_evaluator, sam_gov, email, discovery, match_scoring)
- `scripts/` - Standalone cron job scripts (discovery, email tasks, cleanup)
- `alembic/` - Database migrations

### Frontend v1 Structure (`frontend/`)
- `app/` - Next.js App Router pages
- `components/` - React components
- `hooks/` - Custom React hooks
- `lib/` - Utilities and API client
- `types/` - TypeScript type definitions

### Frontend v2 Structure (`froentend-new/`)
- `src/` - Source code root
- `src/components/` - React components (shadcn/ui)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities and API client
- `src/types/` - TypeScript type definitions
- `public/` - Static assets

### Key Data Flow
1. Cron job triggers opportunity discovery (every 15 minutes in production)
2. Discovery script queries SAM.gov API and stores opportunities
3. AI evaluation script scores opportunities against company profiles
4. Users view recommendations and manage pipeline (WATCHING → BIDDING → WON/LOST)
5. Email scripts send daily digest (8 AM) and deadline reminders

### External Services
- **SAM.gov API**: Government contract opportunities (requires API key)
- **OpenAI GPT-4**: AI-powered evaluation and scoring
- **SendGrid**: Email notifications (production; console mode for development)

## API Endpoints

- API Documentation: http://localhost:8000/docs (Swagger UI)
- Health checks: `/health`, `/health/detailed`, `/ready`
- All API routes prefixed with `/api/v1/`

## Environment Variables

Create a `.env` file in the `backend/` directory (copy from `.env.example`):

- `DATABASE_URL` - MySQL connection string (e.g., `mysql+pymysql://user:pass@localhost:3306/govai`)
- `JWT_SECRET` - Authentication secret (generate with `openssl rand -hex 32`)
- `SAM_API_KEY` - SAM.gov API key
- `OPENAI_API_KEY` - OpenAI API key
- `EMAIL_MODE` - `console` for dev, `sendgrid` for production
- `DEBUG` - Set to `false` in production

## Production URLs

| Service | URL |
|---------|-----|
| Frontend v1 (Next.js) | https://govcontract-ai.hapotech.com |
| Frontend v2 (Vite/React) | https://govcontract-ai-2.hapotech.com |
| Backend API | https://api.govcontract-ai.hapotech.com |
| Backend API (Direct EC2) | http://ec2-35-173-103-83.compute-1.amazonaws.com:8000 |

### AWS Resources

| Resource | ID/Name |
|----------|---------|
| Frontend v1 CloudFront | d246k2epie5kxs.cloudfront.net |
| Frontend v2 CloudFront | E2ZB5OYHI5GR82 (d1xtbvng3ko6s0.cloudfront.net) |
| Frontend v2 S3 Bucket | govcontract-ai-2.hapotech.com |
| Backend API CloudFront | d1ntjd1d3nmhbf.cloudfront.net |
| Route 53 Hosted Zone | Z0774871S58VKRYXD2JC (hapotech.com) |
| SSL Certificate (v2) | arn:aws:acm:us-east-1:766669461090:certificate/03cb7439-e85c-4f23-b921-0c89df89f788 |

### Demo Credentials

- **Email:** `testuser@techgov.com`
- **Password:** `Test123!@#`

(Created via `python backend/seed_sample_data.py`)

## Production Deployment

See `DEPLOYMENT.md` for production setup on EC2 with systemd services, cron jobs, and Nginx configuration.

### Frontend v2 Deployment (froentend-new)

The new Vite/React frontend is deployed to S3 + CloudFront.

**Environment Configuration:**
- `.env.production` - Contains `VITE_API_URL=https://api.govcontract-ai.hapotech.com/api/v1`

**Deploy Commands:**
```bash
cd froentend-new

# Build for production
npm run build

# Sync to S3
aws s3 sync dist s3://govcontract-ai-2.hapotech.com --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E2ZB5OYHI5GR82 --paths "/*"
```

**Check Deployment Status:**
```bash
aws cloudfront get-distribution --id E2ZB5OYHI5GR82 --query 'Distribution.Status' --output text
```
