# GovAI - AI-Powered Government Contract Discovery Platform

## Project Overview
An AI-powered platform that automatically finds and evaluates government contracting opportunities for users based on their company profile.

---

## 🚀 Quick Start Guides

**Local Development with Remote Database (Recommended):**
- **Quick Start:** See [QUICK_START_REMOTE.md](QUICK_START_REMOTE.md) for 5-step setup
- **Full Guide:** See [REMOTE_DB_SETUP.md](REMOTE_DB_SETUP.md) for comprehensive documentation

**Local Development with Local Database:**
- See [QUICK_START.md](QUICK_START.md) for original local setup

**Helper Scripts:**
- `verify-setup.bat` - Check if all prerequisites are installed
- `test-remote-db.bat` - Test connection to remote database
- `start-redis.bat` - Start Redis (required for background tasks)
- `setup-database.bat` - Initialize database tables
- `start-backend.bat` - Start backend server
- `start-frontend.bat` - Start frontend server

---

## 🎉 What's Been Generated

### ✅ Backend (FastAPI) - COMPLETE
**35 Python files** covering the entire backend architecture:

#### Core Infrastructure
- `backend/app/core/config.py` - Application configuration with Pydantic settings
- `backend/app/core/database.py` - PostgreSQL connection and session management
- `backend/app/core/security.py` - JWT authentication, password hashing, user dependencies

#### Database Models (SQLAlchemy)
- `backend/app/models/user.py` - User model
- `backend/app/models/company.py` - Company profile model
- `backend/app/models/opportunity.py` - Government opportunities model
- `backend/app/models/evaluation.py` - AI evaluation results model
- `backend/app/models/saved_opportunity.py` - Pipeline/saved opportunities

#### API Schemas (Pydantic)
- `backend/app/schemas/user.py` - User validation schemas
- `backend/app/schemas/company.py` - Company validation schemas
- `backend/app/schemas/opportunity.py` - Opportunity validation schemas
- `backend/app/schemas/evaluation.py` - Evaluation validation schemas
- `backend/app/schemas/pipeline.py` - Pipeline validation schemas

#### Business Logic Services
- `backend/app/services/auth.py` - Authentication logic
- `backend/app/services/opportunity.py` - Opportunity matching and filtering logic

#### API Routers (FastAPI Endpoints)
- `backend/app/api/auth.py` - POST /auth/register, /login, /logout, etc.
- `backend/app/api/users.py` - GET/PUT /users/me
- `backend/app/api/company.py` - GET/POST/PUT /company
- `backend/app/api/opportunities.py` - All opportunity endpoints
- `backend/app/api/pipeline.py` - Pipeline management endpoints

#### AI & Automation Agents
- `backend/agents/discovery.py` - SAM.gov polling agent
- `backend/agents/evaluation.py` - GPT-4 opportunity evaluation agent
- `backend/agents/email_agent.py` - SendGrid daily digest agent

#### Celery Task Queue
- `backend/tasks/celery_app.py` - Celery configuration
- `backend/tasks/scheduled.py` - Scheduled tasks (every 15 min discovery, hourly evaluation, daily digests)

#### Application Entry Point
- `backend/app/main.py` - FastAPI app with CORS and router configuration
- `backend/requirements.txt` - All Python dependencies
- `backend/alembic.ini` - Database migration configuration

---

### ✅ Frontend (Next.js 14) - Core Files Generated
**3 TypeScript files** for core functionality:

- `frontend/lib/api.ts` - Complete API client with all endpoint methods
- `frontend/lib/utils.ts` - Utility functions (date formatting, currency, etc.)
- `frontend/types/index.ts` - TypeScript interfaces for all data models
- `frontend/package.json` - All dependencies (Next.js 14, Tailwind, shadcn/ui)

---

### ✅ Configuration Files
- `.env.example` - Environment variables template
- `README.md` - This file

---

## 📁 Complete Directory Structure

```
government-contract-evaluator-agent/
├── backend/
│   ├── agents/
│   │   ├── discovery.py (SAM.gov polling)
│   │   ├── evaluation.py (AI evaluation)
│   │   └── email_agent.py (Email digests)
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── company.py
│   │   │   ├── opportunities.py
│   │   │   └── pipeline.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── company.py
│   │   │   ├── opportunity.py
│   │   │   ├── evaluation.py
│   │   │   └── saved_opportunity.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── company.py
│   │   │   ├── opportunity.py
│   │   │   ├── evaluation.py
│   │   │   └── pipeline.py
│   │   ├── services/
│   │   │   ├── auth.py
│   │   │   └── opportunity.py
│   │   └── main.py
│   ├── migrations/
│   │   └── versions/
│   ├── tasks/
│   │   ├── celery_app.py
│   │   └── scheduled.py
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── opportunities/
│   │   │   │   └── [id]/
│   │   │   ├── pipeline/
│   │   │   └── settings/
│   │   └── onboarding/
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   └── dashboard/
│   ├── lib/
│   │   ├── api.ts (✅ Complete API client)
│   │   └── utils.ts (✅ Utility functions)
│   ├── types/
│   │   └── index.ts (✅ All TypeScript types)
│   └── package.json (✅ Dependencies)
│
├── scripts/
│   ├── start_frontend.sh
│   ├── start_backend.sh
│   ├── start_worker.sh
│   └── setup.sh
│
├── .env.example (✅ Complete)
└── README.md (✅ This file)
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy .env file from root
cp ../.env.example .env
# Edit .env with your API keys

# 5. Create database
createdb govai

# 6. Run migrations
alembic upgrade head

# 7. Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Celery Workers

```bash
# Terminal 2: Start Celery worker
cd backend
celery -A tasks.celery_app worker --loglevel=info

# Terminal 3: Start Celery beat (scheduler)
celery -A tasks.celery_app beat --loglevel=info
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local

# 4. Start development server
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📋 What Still Needs To Be Done

### Frontend Pages (Need Implementation)
The directory structure exists, but page content needs to be created:

1. **Auth Pages**
   - `frontend/app/(auth)/login/page.tsx`
   - `frontend/app/(auth)/register/page.tsx`
   - `frontend/app/(auth)/forgot-password/page.tsx`

2. **Dashboard Pages**
   - `frontend/app/(dashboard)/dashboard/page.tsx`
   - `frontend/app/(dashboard)/opportunities/page.tsx`
   - `frontend/app/(dashboard)/opportunities/[id]/page.tsx`
   - `frontend/app/(dashboard)/pipeline/page.tsx`
   - `frontend/app/(dashboard)/settings/page.tsx`

3. **Onboarding Page**
   - `frontend/app/onboarding/page.tsx`

4. **Layout Files**
   - `frontend/app/layout.tsx` (root layout)
   - `frontend/app/(auth)/layout.tsx` (auth layout)
   - `frontend/app/(dashboard)/layout.tsx` (dashboard layout)
   - `frontend/app/page.tsx` (landing page)

5. **UI Components** (using shadcn/ui)
   - Button, Input, Select, Card, Badge, Dialog, etc.
   - Install with: `npx shadcn-ui@latest init`

6. **Configuration Files**
   - `frontend/next.config.js`
   - `frontend/tailwind.config.ts`
   - `frontend/tsconfig.json`

### Infrastructure Files
1. **Docker**
   - `docker-compose.yml` (PostgreSQL, Redis, Backend, Frontend)
   - `backend/Dockerfile`
   - `frontend/Dockerfile`

2. **PM2 Configuration**
   - `ecosystem.config.js` (PM2 process manager config)

3. **Scripts**
   - `scripts/start_frontend.sh`
   - `scripts/start_backend.sh`
   - `scripts/start_worker.sh`
   - `scripts/setup.sh`

---

## 🗄️ Database Schema

The backend models define these PostgreSQL tables:

- **users** - User accounts
- **companies** - Company profiles
- **opportunities** - Government contract opportunities from SAM.gov
- **evaluations** - AI evaluation results (fit scores, recommendations)
- **saved_opportunities** - User's pipeline (watching, pursuing, submitted, won, lost)
- **dismissed_opportunities** - Opportunities user dismissed

---

## 🔌 API Endpoints

All endpoints are fully implemented in the backend:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email` - Verify email with token

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile
- `PUT /api/users/me/preferences` - Update email preferences

### Company
- `GET /api/company` - Get company profile
- `POST /api/company` - Create company (onboarding)
- `PUT /api/company` - Update company profile

### Opportunities
- `GET /api/opportunities` - List opportunities (with filters, pagination, sorting)
- `GET /api/opportunities/:id` - Get opportunity detail with AI evaluation
- `POST /api/opportunities/:id/save` - Save to pipeline
- `DELETE /api/opportunities/:id/save` - Remove from pipeline
- `POST /api/opportunities/:id/dismiss` - Dismiss opportunity
- `PUT /api/opportunities/:id/status` - Update pipeline status
- `POST /api/opportunities/:id/notes` - Add notes

### Pipeline
- `GET /api/pipeline` - Get saved opportunities by status
- `GET /api/pipeline/stats` - Get pipeline statistics
- `GET /api/pipeline/deadlines` - Get upcoming deadlines

---

## 🤖 Background Tasks

### Discovery Agent
- Runs every **15 minutes**
- Polls SAM.gov API for new opportunities
- Filters by NAICS codes from all companies
- Stores opportunities in database

### Evaluation Agent
- Runs every **hour**
- Evaluates new opportunities using GPT-4
- Generates fit scores (0-100)
- Provides BID/NO_BID/REVIEW recommendations
- Lists strengths and weaknesses

### Email Agent
- Runs **daily at 8 AM**
- Sends digest with top 5 opportunities
- Only sends to verified emails with daily frequency

### Deadline Reminders
- Runs **daily at 9 AM**
- Sends reminders for deadlines in next 3 days

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for JWT tokens (generate a strong random string)
- `SAM_API_KEY` - Get from https://sam.gov (Account → API Key)
- `OPENAI_API_KEY` - Get from https://platform.openai.com/api-keys
- `SENDGRID_API_KEY` - Get from https://sendgrid.com
- `EMAIL_FROM` - Your sender email (must be verified in SendGrid)

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CloudFront (Production)                    │
│         app.govai.com/* ──────────────▶ EC2:3000 (Next.js)         │
│         app.govai.com/api/* ──────────▶ EC2:8000 (FastAPI)         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            EC2 Instance                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│   │  Next.js    │  │  FastAPI    │  │   Celery    │                │
│   │   :3000     │  │   :8000     │  │   Workers   │                │
│   └─────────────┘  └─────────────┘  └─────────────┘                │
│   ┌─────────────┐  ┌─────────────┐                                 │
│   │   Redis     │  │ PostgreSQL  │                                 │
│   │   :6379     │  │   :5432     │                                 │
│   └─────────────┘  └─────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
          ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
          │  SAM.gov    │   │   OpenAI    │   │  SendGrid   │
          │    API      │   │   GPT-4     │   │   Email     │
          └─────────────┘   └─────────────┘   └─────────────┘
```

---

## 📝 Next Steps

1. **Complete Frontend Pages**
   - Install shadcn/ui components
   - Create all auth and dashboard pages
   - Implement forms for onboarding

2. **Create Docker Setup**
   - docker-compose.yml for local development
   - Dockerfiles for production deployment

3. **Add PM2 Configuration**
   - Process management for production
   - Auto-restart and logging

4. **Testing**
   - Backend: pytest for API tests
   - Frontend: Jest + React Testing Library

5. **Deployment**
   - Set up PostgreSQL RDS
   - Configure Redis ElastiCache
   - Deploy to EC2 with PM2
   - Set up CloudFront CDN

---

## 📚 Resources

- **SAM.gov API Documentation**: https://open.gsa.gov/api/get-opportunities-public-api/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Next.js 14 Documentation**: https://nextjs.org/docs
- **shadcn/ui Components**: https://ui.shadcn.com/

---

## 🏗️ Development Status

| Component | Status | Files |
|-----------|--------|-------|
| Backend API | ✅ Complete | 35 files |
| Backend Models | ✅ Complete | All tables |
| Backend Services | ✅ Complete | Auth, Opportunity |
| AI Agents | ✅ Complete | Discovery, Evaluation, Email |
| Celery Tasks | ✅ Complete | All scheduled tasks |
| Frontend API Client | ✅ Complete | Full typed client |
| Frontend Types | ✅ Complete | All interfaces |
| Frontend Pages | ⏳ Pending | Need implementation |
| Frontend Components | ⏳ Pending | Need shadcn/ui |
| Docker Setup | ⏳ Pending | Need docker-compose |
| PM2 Config | ⏳ Pending | Need ecosystem.config.js |

---

## 🤝 Contributing

This is an MVP project. Priority tasks:
1. Frontend page implementation
2. UI component library setup
3. Docker containerization
4. Production deployment scripts

---

## 📄 License

MIT

---

**Built with ❤️ using FastAPI, Next.js 14, PostgreSQL, Redis, Celery, OpenAI GPT-4, and SendGrid**
