# GovAI System Architecture

## Overview

GovAI is an AI-powered government contract discovery platform built with a modern microservices architecture. The system automatically discovers, evaluates, and recommends government contracting opportunities from SAM.gov using artificial intelligence.

## System Diagram

```
                                    +-------------------+
                                    |    Frontend       |
                                    |   (Next.js 14)    |
                                    |   Port: 3000      |
                                    +--------+----------+
                                             |
                                             | HTTP/REST
                                             v
+-------------------+              +-------------------+              +-------------------+
|    SAM.gov API    | <----------> |    Backend API    | <----------> |     MySQL 8.0     |
|    (External)     |   HTTP/REST  |    (FastAPI)      |   SQLAlchemy |   Port: 3306      |
+-------------------+              |   Port: 8000      |              +-------------------+
                                   +--------+----------+
                                            |
                    +-----------------------+-----------------------+
                    |                       |                       |
                    v                       v                       v
          +-------------------+   +-------------------+   +-------------------+
          |   Celery Worker   |   |   Celery Beat     |   |      Redis        |
          | (Task Processing) |   |   (Scheduler)     |   |   Port: 6379      |
          +-------------------+   +-------------------+   +-------------------+
                    |
                    v
          +-------------------+
          |   OpenAI GPT-4    |
          |   (AI Evaluation) |
          +-------------------+
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + Custom Hooks
- **HTTP Client**: Fetch API with custom wrapper

### Backend
- **Framework**: FastAPI (Python 3.11)
- **ORM**: SQLAlchemy 2.0
- **Database Migrations**: Alembic
- **Authentication**: JWT (JSON Web Tokens)
- **Rate Limiting**: SlowAPI

### Database
- **Primary**: MySQL 8.0
- **Cache/Queue Broker**: Redis 7

### Task Processing
- **Worker**: Celery 5.x
- **Scheduler**: Celery Beat
- **Tasks**: Discovery, Evaluation, Email Notifications

### External Services
- **SAM.gov API**: Government contract opportunities
- **OpenAI GPT-4**: AI-powered evaluation
- **SendGrid**: Email notifications (production)

## Architecture Components

### 1. Authentication Layer
- JWT-based authentication with access tokens
- Password hashing with bcrypt
- Email verification flow
- Password reset functionality
- Rate limiting on auth endpoints (5/min register, 10/min login)

### 2. Company Profile Management
- Multi-step onboarding wizard
- NAICS code selection (up to 10)
- Set-aside certifications (8(a), WOSB, SDVOSB, HUBZone)
- Capabilities statement storage
- Geographic preferences

### 3. Opportunity Discovery
- SAM.gov API integration
- Automated polling every 15 minutes (Celery Beat)
- NAICS code-based filtering
- Active opportunity tracking
- Deduplication handling

### 4. AI Evaluation Engine
- OpenAI GPT-4 integration
- Fit score calculation (0-100)
- Win probability estimation (0-100)
- BID/NO_BID/RESEARCH recommendations
- Strengths, weaknesses, and risk analysis
- Key requirements extraction

### 5. Pipeline Management
- Kanban-style workflow
- Status tracking: WATCHING → BIDDING → WON/LOST
- User notes and annotations
- Win rate tracking

### 6. Notification System
- Email notifications via SendGrid
- Daily digest emails (8 AM)
- Deadline reminders (1, 3, 7 days before)
- Configurable frequency preferences

## Data Flow

### Opportunity Discovery Flow
1. Celery Beat triggers discovery task every 15 minutes
2. Discovery agent queries SAM.gov API
3. New opportunities are stored in MySQL
4. Evaluation task is triggered for each company
5. AI evaluates opportunities against company profile
6. Evaluations are stored with scores and recommendations

### User Interaction Flow
1. User authenticates via JWT
2. Frontend fetches opportunities and evaluations
3. User reviews AI recommendations
4. User saves opportunities to pipeline
5. System tracks pipeline progression
6. Email notifications for new matches and deadlines

## Security Architecture

### Authentication
- JWT tokens with configurable expiration
- Secure password hashing (bcrypt)
- Email verification required

### API Security
- CORS configuration for frontend origin
- Rate limiting on sensitive endpoints
- Input validation via Pydantic schemas

### Data Protection
- Environment-based configuration
- Secrets stored in environment variables
- Non-root container execution (production)

## Scalability

### Horizontal Scaling
- Stateless backend API
- Multiple Celery workers supported
- Redis for distributed task queue

### Vertical Scaling
- Resource limits configurable in Docker
- Database connection pooling
- Response pagination

## Monitoring

### Health Checks
- `/health` - Basic API health
- `/health/detailed` - Database and Redis connectivity
- `/ready` - Readiness probe for load balancers

### Logging
- Structured logging throughout
- Docker container logs
- Error tracking and debugging

## Directory Structure

```
government-contract-evaluator-agent/
├── backend/
│   ├── app/
│   │   ├── api/           # API route handlers
│   │   │   ├── deps.py    # Dependencies (auth, db)
│   │   │   └── v1/        # Versioned endpoints
│   │   ├── core/          # Configuration, database, security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   └── data/          # Static data (NAICS codes)
│   ├── agents/            # AI agents
│   ├── tasks/             # Celery tasks
│   ├── alembic/           # Database migrations
│   └── requirements.txt
├── frontend/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API client
│   └── types/             # TypeScript type definitions
├── docs/                  # Documentation
├── docker-compose.yml     # Development setup
└── docker-compose.prod.yml # Production setup
```

## Deployment Options

### Development
- Docker Compose with hot-reload
- Console-based email verification
- Debug logging enabled

### Production
- Multi-stage Docker builds
- Nginx reverse proxy with SSL
- SendGrid email integration
- Resource limits and health checks
