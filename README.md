# GovAI - AI-Powered Government Contract Discovery Platform

An intelligent platform that automatically discovers, evaluates, and recommends government contracting opportunities using AI.

## Tech Stack

- **Backend**: Python 3.9+ / FastAPI / SQLAlchemy / MySQL
- **Frontend**: Next.js 14 / TypeScript / Tailwind CSS / shadcn/ui
- **AI**: OpenAI GPT-4
- **Email**: SendGrid (console mode for development)
- **Scheduled Tasks**: Cron jobs (standalone Python scripts)

## Prerequisites

- Python 3.9+
- Node.js 18+
- MySQL 8.0
- API Keys:
  - SAM.gov API key ([get one here](https://sam.gov/data-services/))
  - OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## Quick Start (Local Development)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd government-contract-evaluator-agent-2
```

### 2. Setup MySQL Database

```bash
# Create database and user
mysql -u root -p
```

```sql
CREATE DATABASE govai;
CREATE USER 'govai_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON govai.* TO 'govai_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (choose one)
pip install -r requirements.txt
# OR with Poetry
poetry install

# Copy and configure environment
cp ../.env.example .env
# Edit .env with your database credentials and API keys
```

**Required `.env` settings:**
```bash
DATABASE_URL=mysql+pymysql://govai_user:your_password@localhost:3306/govai
JWT_SECRET=your_jwt_secret_here  # Generate with: openssl rand -hex 32
SAM_API_KEY=your_sam_gov_api_key
OPENAI_API_KEY=your_openai_api_key
```

```bash
# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)

## Development Commands

### Backend

```bash
cd backend
source venv/bin/activate

# Start server
uvicorn app.main:app --reload --port 8000

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1
```

### Frontend

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint
```

### Running Scheduled Tasks Manually

The app uses standalone Python scripts instead of Celery for background tasks:

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

## Project Structure

```
government-contract-evaluator-agent-2/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Config, database, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── scripts/            # Standalone cron job scripts
│   ├── alembic/            # Database migrations
│   └── requirements.txt
│
├── frontend/               # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities
│   ├── hooks/             # Custom hooks
│   └── types/             # TypeScript types
│
├── .env.example           # Environment template
├── DEPLOYMENT.md          # Production deployment guide
└── README.md
```

## Features

### Authentication & User Management
- User registration with email verification
- Login/Logout with JWT authentication
- Password reset flow
- Protected routes

### Company Onboarding
- 3-step company onboarding wizard
- NAICS code selection (searchable, up to 10)
- Set-aside certifications (8(a), WOSB, SDVOSB, etc.)
- Capabilities statement
- Contract value ranges
- Geographic preferences

### SAM.gov Integration & AI Evaluation
- SAM.gov API integration for opportunity discovery
- Automated NAICS code matching
- OpenAI GPT-4 powered evaluation
- Opportunity scoring (fit score, win probability)
- BID/NO_BID/RESEARCH recommendations
- Strengths, weaknesses, and risk analysis

### Dashboard & Pipeline Management
- Opportunities list with AI scores and recommendations
- Advanced filtering (by recommendation, score, NAICS, etc.)
- Opportunity detail pages with complete AI analysis
- Kanban-style pipeline board (WATCHING → BIDDING → WON/LOST)
- Personal notes on opportunities

### Email Notifications
- Daily digest emails with new recommendations
- Deadline reminder emails (1, 3, 7 days before)
- Configurable notification preferences

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | Yes |
| `SAM_API_KEY` | SAM.gov API key | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `EMAIL_MODE` | `console` (dev) or `sendgrid` (prod) | No |
| `SENDGRID_API_KEY` | SendGrid API key | For prod |
| `DEBUG` | `true` or `false` | No |

## Testing

### Manual Testing

1. **Register Flow**:
   - Visit http://localhost:3000/register
   - Register with email/password
   - Check backend logs for verification link
   - Click link to verify email

2. **Login Flow**:
   - Visit http://localhost:3000/login
   - Login with verified credentials

3. **API Testing**:
   - Visit http://localhost:8000/docs
   - Use Swagger UI to test endpoints

## Troubleshooting

### Database Connection Issues

```bash
# Check MySQL is running
mysql -u govai_user -p -e "SELECT 1"

# Verify DATABASE_URL in .env
```

### Backend Errors

```bash
# Check for import errors
cd backend
source venv/bin/activate
python -c "from app.main import app; print('OK')"
```

### Frontend Not Loading

```bash
# Check for errors
cd frontend
npm run build
```

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment to EC2 with:
- Systemd service configuration
- Cron job setup
- Nginx reverse proxy
- S3 + CloudFront for frontend

## Security Notes

**Important for Production**:
- Use strong `JWT_SECRET` (minimum 32 characters)
- Set `DEBUG=false`
- Enable HTTPS
- Configure proper CORS origins
- Never commit `.env` files

## License

Proprietary - All rights reserved
