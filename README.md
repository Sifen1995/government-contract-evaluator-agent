# GovAI - AI-Powered Government Contract Discovery Platform

An intelligent platform that automatically discovers, evaluates, and recommends government contracting opportunities using AI.

## Tech Stack

- **Backend**: Python 3.11 + FastAPI + SQLAlchemy + MySQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Database**: MySQL 8.0
- **Cache/Queue**: Redis 7
- **Task Queue**: Celery
- **AI**: OpenAI GPT-4 (Week 3+)
- **Email**: SendGrid (Week 5+)

## Prerequisites

- Docker & Docker Compose
- Git

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd government-contract-evaluator-agent-main

# Copy environment file
cp .env.example .env

# Edit .env and set secure passwords for production
```

### 2. Start All Services

```bash
# Start all services (MySQL, Redis, Backend, Frontend, Celery)
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 3. Initialize Database

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Alternative API Docs**: http://localhost:8000/redoc

## Development

### Backend Development

```bash
# Access backend container
docker-compose exec backend bash

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Run migrations
docker-compose exec backend alembic upgrade head

# Rollback migration
docker-compose exec backend alembic downgrade -1

# Python shell
docker-compose exec backend python
```

### Frontend Development

```bash
# Access frontend container
docker-compose exec frontend sh

# Install new package
docker-compose exec frontend npm install <package-name>

# Rebuild frontend
docker-compose restart frontend
```

### Database Access

```bash
# MySQL CLI
docker-compose exec mysql mysql -u govai_user -p govai

# Password: govai_password_change_me (or your custom password from .env)
```

### Redis CLI

```bash
docker-compose exec redis redis-cli
```

### Celery

```bash
# View worker status
docker-compose logs -f celery-worker

# View beat scheduler status
docker-compose logs -f celery-beat
```

## Project Structure

```
government-contract-evaluator-agent-main/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Config, database, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── agents/             # AI agents (Week 2+)
│   ├── tasks/              # Celery tasks
│   ├── alembic/            # Database migrations
│   └── requirements.txt
│
├── frontend/                # Next.js frontend
│   ├── app/                # App router pages
│   ├── components/         # React components
│   ├── lib/                # Utilities
│   ├── hooks/              # Custom hooks
│   └── types/              # TypeScript types
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Completed Features

### Week 1: Authentication
✅ User registration
✅ Email verification (console-based for development)
✅ Login/Logout with JWT authentication
✅ Password reset flow
✅ Protected routes
✅ Docker Compose setup for all services

### Week 2: Company Onboarding
✅ 3-step company onboarding wizard
✅ NAICS code selection (searchable, up to 10)
✅ Set-aside certifications (8(a), WOSB, SDVOSB, etc.)
✅ Capabilities statement (500 words)
✅ Contract value ranges
✅ Geographic preferences
✅ Company settings page
✅ Reference data API

### Week 3: SAM.gov Integration & AI Evaluation
✅ SAM.gov API integration
✅ Automated opportunity discovery (every 15 minutes via Celery Beat)
✅ NAICS code matching algorithm
✅ OpenAI GPT-4 integration
✅ Opportunity scoring (fit score 0-100, win probability 0-100)
✅ BID/NO_BID/RESEARCH recommendations with detailed reasoning
✅ Evaluation storage with strengths, weaknesses, and risk factors
✅ Background tasks (discovery, evaluation, cleanup)
✅ Opportunity and evaluation API endpoints
✅ Statistics and filtering endpoints

### Week 4: Dashboard & Opportunity Management
✅ Opportunities list page with AI scores and recommendations
✅ Filter by recommendation (BID/NO_BID/RESEARCH)
✅ Filter by minimum fit score (50%, 60%, 70%, 80%)
✅ Opportunity detail page with complete AI analysis
✅ Display strengths, weaknesses, key requirements, and risk factors
✅ Pipeline management (save as WATCHING, BIDDING, or PASSED)
✅ Add personal notes to opportunities
✅ Real-time statistics dashboard
✅ Manual discovery trigger button
✅ Pagination for large result sets
✅ Responsive design (desktop, tablet, mobile)

### Week 5: Pipeline Management + Email Notifications
✅ Kanban-style pipeline board (WATCHING → BIDDING → WON/LOST)
✅ Pipeline status transitions
✅ Pipeline statistics (total, by status, win rate)
✅ SendGrid email integration (with console fallback)
✅ Daily digest emails (8 AM) with new BID recommendations
✅ Deadline reminder emails (1, 3, 7 days before)
✅ Email notification preferences (real-time, daily, weekly, none)
✅ User settings for email frequency
✅ Beautiful HTML email templates

### Week 6: Polish + Launch (Current)
✅ Global error boundary and error handling components
✅ Loading states and skeleton components
✅ Toast notifications for user feedback
✅ Production Docker configuration (multi-stage builds)
✅ Health check endpoints (/health, /health/detailed, /ready)
✅ Rate limiting on authentication endpoints
✅ Environment variable validation
✅ Production deployment guide
✅ Security hardening (non-root containers, resource limits)

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive production deployment instructions.

## Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build

# Stop and remove all containers, volumes
docker-compose down -v
```

## Testing

### Manual Testing (Week 1)

1. **Register Flow**:
   - Visit http://localhost:3000/register
   - Register with email/password
   - Check backend logs for verification link
   - Click link to verify email

2. **Login Flow**:
   - Visit http://localhost:3000/login
   - Login with verified credentials
   - Should redirect to dashboard

3. **Password Reset**:
   - Visit http://localhost:3000/forgot-password
   - Enter email
   - Check backend logs for reset link
   - Use link to reset password

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :3306

# Stop Docker services and try again
docker-compose down
docker-compose up -d
```

### Database Connection Issues

```bash
# Check MySQL is running
docker-compose ps

# Check MySQL logs
docker-compose logs mysql

# Recreate MySQL container
docker-compose down
docker-compose up -d mysql
```

### Frontend Not Loading

```bash
# Rebuild frontend
docker-compose up -d --build frontend

# Check for errors
docker-compose logs frontend
```

### Backend Errors

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose up -d --build backend
```

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL`: MySQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret key for JWT tokens (change in production!)
- `CORS_ORIGINS`: Allowed frontend origins
- `EMAIL_MODE`: `console` for development, `sendgrid` for production

## Security Notes

⚠️ **Important for Production**:
- Change all default passwords in `.env`
- Use strong `JWT_SECRET` (minimum 32 characters)
- Enable HTTPS
- Set `DEBUG=false`
- Configure proper CORS origins
- Use environment-specific `.env` files

## Contributing

This is an MVP development project following a 6-week build plan. See `docs/PRD_MVP.md` for complete product requirements.

## License

Proprietary - All rights reserved

## Support

For issues and questions, please check:
- Backend API docs: http://localhost:8000/docs
- Docker logs: `docker-compose logs -f`
- GitHub issues (if repository is public)
