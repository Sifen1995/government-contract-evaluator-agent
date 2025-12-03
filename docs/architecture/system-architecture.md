# GovAI System Architecture

## Overview

GovAI is a cloud-native, AI-powered platform for discovering and evaluating government contract opportunities. The system uses a microservices-inspired architecture with AI agents, real-time processing, and scalable infrastructure.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐│
│  │   Web App    │      │  Mobile App  │      │  API Clients ││
│  │  (Next.js)   │      │(React Native)│      │   (SDKs)     ││
│  └──────────────┘      └──────────────┘      └──────────────┘│
│         │                      │                      │        │
└─────────┼──────────────────────┼──────────────────────┼────────┘
          │                      │                      │
          └──────────────────────┴──────────────────────┘
                                 │
┌────────────────────────────────┴──────────────────────────────────┐
│                          API GATEWAY                              │
│                      (FastAPI Backend)                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API ENDPOINTS                            ││
│  │  • Authentication  • Users  • Company  • Opportunities      ││
│  │  • Pipeline  • Notifications  • Analytics                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                │                                  │
└────────────────────────────────┼──────────────────────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────┴────────┐  ┌─────────┴────────┐  ┌─────────┴────────┐
│   DISCOVERY      │  │   EVALUATION     │  │     EMAIL        │
│     AGENT        │  │      AGENT       │  │     AGENT        │
│                  │  │                  │  │                  │
│  • SAM.gov API   │  │  • OpenAI GPT-4  │  │  • SendGrid      │
│  • Polling       │  │  • Scoring       │  │  • Digests       │
│  • Filtering     │  │  • Recommendations│  │  • Reminders     │
│  • Celery Task   │  │  • Analysis      │  │  • Celery Task   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                     │                     │
         └─────────────────────┴─────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                      DATA LAYER                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │  PostgreSQL  │      │    Redis     │      │   S3/Blob    │ │
│  │  (Primary)   │      │   (Cache)    │      │  (Storage)   │ │
│  │              │      │              │      │              │ │
│  │ • Users      │      │ • Sessions   │      │ • Documents  │ │
│  │ • Companies  │      │ • Rate Limit │      │ • RFPs       │ │
│  │ • Opps       │      │ • Task Queue │      │ • Proposals  │ │
│  │ • Pipeline   │      │ • Cache      │      │ • Archives   │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │  SAM.gov API │      │ OpenAI API   │      │  SendGrid    │ │
│  │              │      │              │      │              │ │
│  │ • Opportunities│     │ • GPT-4     │      │ • Email      │ │
│  │ • Contracts  │      │ • Embeddings │      │ • Transactional│
│  └──────────────┘      └──────────────┘      └──────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Frontend (Next.js)

**Technology Stack:**
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context + Local State
- **API Client**: Fetch API with custom wrapper

**Key Features:**
- Server-side rendering (SSR)
- Static site generation (SSG) for landing pages
- Client-side routing
- Real-time updates via polling
- Responsive design (mobile-first)

**Pages:**
- `/` - Landing page
- `/register`, `/login` - Authentication
- `/onboarding` - Company profile setup
- `/dashboard` - Main dashboard
- `/opportunities` - Opportunity list and details
- `/pipeline` - Pipeline management
- `/settings` - User and company settings

### 2. Backend (FastAPI)

**Technology Stack:**
- **Framework**: FastAPI 0.104+
- **Language**: Python 3.11+
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **Auth**: JWT (python-jose)

**Architecture Patterns:**
- **Router-based**: Modular route organization
- **Dependency Injection**: FastAPI dependencies for auth, DB
- **Repository Pattern**: Database abstraction layer
- **Service Layer**: Business logic separation

**API Structure:**
```
backend/
├── app/
│   ├── main.py              # FastAPI app initialization
│   ├── core/
│   │   ├── config.py        # Settings (from .env)
│   │   ├── database.py      # Database connection
│   │   ├── security.py      # JWT, password hashing
│   │   └── dependencies.py  # Reusable dependencies
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py
│   │   ├── company.py
│   │   ├── opportunity.py
│   │   └── pipeline.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   ├── company.py
│   │   └── opportunity.py
│   ├── api/                 # API routes
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── company.py
│   │   ├── opportunities.py
│   │   └── pipeline.py
│   └── services/            # Business logic
│       ├── auth_service.py
│       ├── opportunity_service.py
│       └── evaluation_service.py
└── agents/                  # AI Agents
    ├── discovery.py         # SAM.gov polling
    ├── evaluation.py        # OpenAI scoring
    └── email_agent.py       # Email notifications
```

### 3. AI Agents

#### Discovery Agent
**Purpose**: Automatically discover government contract opportunities from SAM.gov

**Process:**
```python
1. Poll SAM.gov API every 15 minutes (Celery beat task)
2. Filter by company NAICS codes and set-asides
3. Check for duplicates (avoid re-processing)
4. Store new opportunities in database
5. Trigger evaluation agent for new opportunities
```

**Technology:**
- Celery for scheduled tasks
- Requests library for SAM.gov API
- SQLAlchemy for database operations

**Configuration:**
```python
DISCOVERY_SCHEDULE = 15  # minutes
SAM_API_LOOKBACK = 24    # hours
MAX_RESULTS_PER_POLL = 100
```

#### Evaluation Agent
**Purpose**: Score opportunities using AI to recommend bid/no-bid decisions

**Scoring Algorithm:**
```python
FIT SCORE (0-100) =
  NAICS Alignment      (0-30 points) +
  Set-Aside Match      (0-25 points) +
  Contract Value Fit   (0-20 points) +
  Capability Alignment (0-25 points)

WIN PROBABILITY (0-100%) = Based on:
  - Fit score
  - Past performance alignment
  - Competition level
  - Historical win rates

RECOMMENDATION:
  - BID:     Fit >= 80 AND Pwin >= 60%
  - REVIEW:  Fit 60-80 OR Pwin 40-60%
  - NO_BID:  Fit < 60 OR Pwin < 40%
```

**Technology:**
- OpenAI GPT-4 for analysis
- Prompt engineering for consistent scoring
- Structured JSON outputs
- Retry logic with exponential backoff

**Evaluation Process:**
```python
1. Receive new opportunity from discovery agent
2. Load company profile from database
3. Build evaluation prompt with opportunity + company data
4. Call OpenAI API with structured output format
5. Parse and validate AI response
6. Store evaluation in database
7. Send notification if fit_score > threshold
```

#### Email Agent
**Purpose**: Send automated email notifications and digests

**Email Types:**
1. **Daily Digest**: Top 5 opportunities (8 AM local time)
2. **Deadline Reminders**: 7, 3, 1 days before deadline
3. **High-Fit Alerts**: Real-time for fit_score > 85

**Technology:**
- SendGrid for email delivery
- Jinja2 templates for email HTML
- Celery for scheduled sends
- User preference management

### 4. Database (PostgreSQL)

**Schema Design:**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  naics_codes TEXT[],  -- Array of NAICS codes
  set_asides TEXT[],   -- Array of set-asides
  capabilities TEXT,
  contract_value_min INTEGER,
  contract_value_max INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Opportunities table
CREATE TABLE opportunities (
  id UUID PRIMARY KEY,
  notice_id VARCHAR(255) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  agency VARCHAR(255),
  naics_code VARCHAR(10),
  set_aside_type VARCHAR(50),
  posted_date TIMESTAMP,
  response_deadline TIMESTAMP,
  contract_value_min INTEGER,
  contract_value_max INTEGER,
  description TEXT,
  raw_data JSONB,  -- Full SAM.gov response
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id),
  company_id UUID REFERENCES companies(id),
  fit_score INTEGER,
  win_probability INTEGER,
  recommendation VARCHAR(20),
  strengths TEXT[],
  weaknesses TEXT[],
  executive_summary TEXT,
  evaluated_at TIMESTAMP DEFAULT NOW()
);

-- Pipeline table (many-to-many: companies <-> opportunities)
CREATE TABLE pipeline (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  opportunity_id UUID REFERENCES opportunities(id),
  status VARCHAR(50),  -- watching, pursuing, preparing, submitted, won, lost
  saved_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, opportunity_id)
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
```sql
-- Performance indexes
CREATE INDEX idx_opportunities_naics ON opportunities(naics_code);
CREATE INDEX idx_opportunities_deadline ON opportunities(response_deadline);
CREATE INDEX idx_opportunities_posted ON opportunities(posted_date);
CREATE INDEX idx_evaluations_fit_score ON evaluations(fit_score DESC);
CREATE INDEX idx_pipeline_company_status ON pipeline(company_id, status);
```

### 5. Cache & Queue (Redis)

**Usage:**

1. **Session Storage**: JWT token blacklist
2. **Rate Limiting**: API request counting
3. **Caching**: Frequently accessed data (30 min TTL)
4. **Task Queue**: Celery broker and result backend

**Redis Keys:**
```
sessions:user:{user_id}              # Session data
ratelimit:ip:{ip_address}            # Rate limit counters
cache:company:{company_id}           # Company profile cache
cache:opportunities:{company_id}     # Opportunity list cache
celery:task:{task_id}                # Celery task results
```

## Data Flow

### Opportunity Discovery Flow

```
1. Celery Beat triggers scheduled task (every 15 min)
2. Discovery Agent queries SAM.gov API
3. Filter opportunities by NAICS/set-asides
4. Check database for duplicates
5. Insert new opportunities
6. For each new opportunity:
   a. Queue evaluation task
   b. Evaluation Agent calls OpenAI
   c. Store evaluation results
   d. Check notification preferences
   e. Send emails if thresholds met
7. Update last_poll_timestamp
```

### User Interaction Flow

```
1. User logs in → JWT token issued
2. User views dashboard:
   a. Backend checks cache for opportunities
   b. Cache miss → Query database with filters
   c. Join opportunities + evaluations
   d. Sort by fit_score
   e. Cache results (30 min TTL)
   f. Return to frontend
3. User saves opportunity:
   a. Insert into pipeline table
   b. Invalidate cache
   c. Send confirmation
4. User adds note:
   a. Insert into notes table
   b. Notify team members (if enabled)
```

## Scalability Considerations

### Horizontal Scaling

**Backend API:**
- Stateless design (JWT tokens)
- Deploy multiple instances behind load balancer
- Shared PostgreSQL and Redis

**Celery Workers:**
- Scale workers independently
- Distribute tasks across multiple workers
- Separate queues for priority tasks

### Caching Strategy

**L1 Cache (Redis)**: 30-minute TTL
- Company profiles
- Opportunity lists (per company)
- User sessions

**L2 Cache (Database Indexes)**:
- Opportunities by NAICS
- Opportunities by deadline
- Evaluations by fit_score

### Database Optimization

**Partitioning:**
- Partition opportunities table by posted_date (monthly)
- Archive old opportunities (> 6 months)

**Read Replicas:**
- Route read queries to replicas
- Primary for writes only
- Reduce load on primary database

## Security Architecture

### Authentication
- JWT tokens with 24-hour expiration
- Refresh tokens for extended sessions
- Password hashing with bcrypt (cost factor: 12)
- Email verification required

### Authorization
- Role-based access control (RBAC)
- Company-level data isolation
- Row-level security in PostgreSQL

### Data Protection
- Encryption at rest (database level)
- Encryption in transit (TLS 1.3)
- Secrets management (environment variables)
- API key rotation policy

### API Security
- Rate limiting (1000 req/hr per user)
- CORS configuration (whitelist)
- Input validation (Pydantic)
- SQL injection prevention (ORM)
- XSS protection (output sanitization)

## Monitoring & Observability

### Metrics
- **Application**: Request latency, error rates
- **Database**: Query performance, connection pool
- **AI Agents**: Evaluation time, API costs
- **Queue**: Task queue length, worker utilization

### Logging
- **Structured Logging**: JSON format
- **Log Levels**: DEBUG, INFO, WARNING, ERROR
- **Correlation IDs**: Track requests across services
- **Log Aggregation**: ELK Stack or CloudWatch

### Alerts
- API error rate > 1%
- Database CPU > 80%
- Queue backlog > 1000 tasks
- Disk space < 20%
- AI API failures

## Deployment Architecture

### Development
```
localhost:3000    → Next.js dev server
localhost:8000    → FastAPI with reload
localhost:5432    → PostgreSQL
localhost:6379    → Redis
```

### Production
```
cdn.govai.com         → Static assets (CloudFront/Cloudflare)
app.govai.com         → Next.js (Vercel/AWS)
api.govai.com         → FastAPI (AWS ECS/Kubernetes)
db.govai.internal     → PostgreSQL RDS (Multi-AZ)
redis.govai.internal  → ElastiCache
```

## Technology Choices - Rationale

| Technology | Why Chosen |
|------------|------------|
| **Next.js** | SSR, great DX, React ecosystem, Vercel deployment |
| **FastAPI** | Fast, modern Python, async support, auto docs |
| **PostgreSQL** | ACID compliant, JSON support, mature ecosystem |
| **Redis** | Fast caching, Celery support, simple setup |
| **OpenAI GPT-4** | Best AI model for structured analysis |
| **SAM.gov API** | Official government source, well-documented |
| **Celery** | Mature task queue, Python ecosystem, scheduling |
| **JWT** | Stateless, scalable, industry standard |
| **Docker** | Consistent environments, easy deployment |

## Future Architecture Enhancements

1. **Event-Driven Architecture**: Replace polling with webhooks
2. **GraphQL API**: More flexible client queries
3. **Microservices**: Split agents into separate services
4. **Real-Time Updates**: WebSockets for live notifications
5. **Machine Learning**: Custom models for win probability
6. **Multi-Tenancy**: Support for enterprise customers
7. **API Gateway**: Kong or AWS API Gateway for routing
8. **Service Mesh**: Istio for inter-service communication
