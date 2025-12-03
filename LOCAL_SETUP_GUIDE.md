# 🚀 GovAI - Complete Local Setup Guide

## Step-by-Step Guide to Run Everything Locally

### Prerequisites Checklist
- [x] Python 3.11+ installed
- [x] Node.js 18+ installed
- [x] PostgreSQL running locally
- [x] Redis running locally (optional for this basic test)
- [x] Environment variables configured

---

## 📋 PART 1: Database Setup

### Step 1: Verify PostgreSQL is Running

```bash
# Check PostgreSQL status
# Windows (if using PostgreSQL service):
sc query postgresql-x64-15

# Or check if port 5432 is listening:
netstat -an | findstr 5432
```

### Step 2: Create Database and Enable Extensions

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside psql:
CREATE DATABASE govai;
\c govai

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

# Verify
SELECT * FROM pg_extension WHERE extname = 'vector';

# Exit
\q
```

### Step 3: Update Database Connection String

Your `.env` file should have:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/govai
```

**⚠️ Important:** Your current `.env` has:
```
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/govai
```

Change `@postgres:5432` to `@localhost:5432` for local development.

---

## 📋 PART 2: Backend Setup

### Step 4: Install Python Dependencies

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 5: Run Database Migrations

```bash
# Still in backend directory
cd backend

# Run migrations to create all tables
python -m alembic upgrade head

# Verify tables were created
python -c "from app.core.database import engine; from sqlalchemy import inspect; print('Tables created:', inspect(engine).get_table_names())"
```

**Expected output:**
```
Tables created: ['alembic_version', 'companies', 'dismissed_opportunities',
'evaluations', 'opportunities', 'opportunity_embeddings', 'saved_opportunities', 'users']
```

### Step 6: Start Backend Server

```bash
# In backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**✅ Backend is now running at: http://localhost:8000**

**Test it:** Open http://localhost:8000/docs to see the API documentation.

---

## 📋 PART 3: Frontend Setup

### Step 7: Install Frontend Dependencies

Open a **NEW terminal** (keep backend running):

```bash
cd frontend

# Install dependencies
npm install
```

### Step 8: Start Frontend Development Server

```bash
# Still in frontend directory
npm run dev
```

**You should see:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 3.5s
```

**✅ Frontend is now running at: http://localhost:3000**

---

## 📋 PART 4: Testing the Complete Flow

### Step 9: Register a New User

1. **Open browser:** http://localhost:3000
2. **Click "Register"** or navigate to http://localhost:3000/register
3. **Fill in the form:**
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
4. **Click "Register"**

**What happens behind the scenes:**
- Frontend calls `POST /api/auth/register`
- Backend creates user in `users` table
- JWT token is generated and stored
- User is redirected to `/onboarding`

**Verify in database:**
```bash
psql -U postgres -d govai
SELECT id, email, first_name, last_name, email_verified, company_id FROM users;
```

---

### Step 10: Complete Company Onboarding

**Step 1: Company Information**
1. Company Name: `Tech Solutions Inc`
2. Legal Structure: `LLC`
3. Street Address: `123 Main St`
4. City: `Washington`
5. State: `DC`
6. ZIP: `20001`
7. UEI (optional): `ABC123456789`
8. Click **"Next"**

**Step 2: NAICS Codes & Certifications**
1. Enter NAICS Code: `541512` (Computer Systems Design Services)
2. Click **"Add"**
3. Add more NAICS codes:
   - `541519` (Other Computer Related Services)
   - `541511` (Custom Computer Programming Services)
4. Check Set-Aside Certifications:
   - ✅ `8(a)`
   - ✅ `Small Business`
5. Select Contract Value Range: `$100K - $1M`
6. Click **"Next"**

**Step 3: Capabilities**
1. Enter your capabilities statement (example):
```
Tech Solutions Inc specializes in software development, cloud computing,
and cybersecurity services. We have 10+ years of experience delivering
custom applications for government agencies. Our expertise includes:
- Full-stack web development (React, Node.js, Python)
- Cloud infrastructure (AWS, Azure)
- DevOps and CI/CD automation
- Cybersecurity assessments and compliance (NIST, FedRAMP)
- Mobile application development
```
2. Click **"Complete Setup"**

**What happens behind the scenes:**
- Frontend calls `POST /api/company`
- Backend creates company in `companies` table
- User's `company_id` is updated
- User is redirected to `/dashboard`

**Verify in database:**
```bash
psql -U postgres -d govai
SELECT id, name, naics_codes, set_asides FROM companies;
SELECT id, email, company_id FROM users;
```

---

### Step 11: Manually Trigger Opportunity Discovery

Since you won't have Celery running yet, let's manually fetch opportunities:

Open a **NEW terminal** (keep frontend and backend running):

```bash
cd backend

# Activate virtual environment if you created one
# Windows:
venv\Scripts\activate

# Run discovery manually
python -c "
from agents.discovery import run_discovery
print('Starting discovery...')
run_discovery()
print('Discovery completed!')
"
```

**What this does:**
- Polls SAM.gov API for opportunities matching your NAICS codes
- Saves opportunities to `opportunities` table
- Skips duplicates

**Verify in database:**
```bash
psql -U postgres -d govai
SELECT COUNT(*) FROM opportunities;
SELECT id, title, agency, naics_code, response_deadline FROM opportunities LIMIT 5;
```

---

### Step 12: Manually Trigger AI Evaluation

Still in the same terminal:

```bash
# Run AI evaluation manually
python -c "
from agents.evaluation import run_evaluation
print('Starting evaluation...')
run_evaluation()
print('Evaluation completed!')
"
```

**What this does:**
- Evaluates all unevaluated opportunities using GPT-4
- Generates fit scores (0-100)
- Creates BID/NO_BID/REVIEW recommendations
- Saves evaluations to `evaluations` table

**Verify in database:**
```bash
psql -U postgres -d govai
SELECT COUNT(*) FROM evaluations;
SELECT
    e.fit_score,
    e.recommendation,
    o.title
FROM evaluations e
JOIN opportunities o ON e.opportunity_id = o.id
ORDER BY e.fit_score DESC
LIMIT 5;
```

---

### Step 13: Manually Generate Embeddings

```bash
# Run embedding generation manually
python -c "
from agents.embedding_agent import run_embedding_generation
print('Starting embedding generation...')
count = run_embedding_generation()
print(f'Generated {count} embeddings!')
"
```

**What this does:**
- Generates 1536-dimension vectors for opportunities
- Extracts keywords
- Saves to `opportunity_embeddings` table

**Verify in database:**
```bash
psql -U postgres -d govai
SELECT COUNT(*) FROM opportunity_embeddings;
SELECT
    oe.keywords,
    o.title
FROM opportunity_embeddings oe
JOIN opportunities o ON oe.opportunity_id = o.id
LIMIT 5;
```

---

### Step 14: View Opportunities in Dashboard

1. **Go to dashboard:** http://localhost:3000/dashboard
2. **You should see:**
   - Quick stats (opportunities count)
   - List of opportunities with AI scores
   - Fit scores displayed (green for high, yellow for medium, red for low)
   - AI recommendations (BID/NO_BID/REVIEW)

3. **Try filters:**
   - Sort by: Fit Score, Deadline, Posted Date
   - Filter by: Set-Aside, Agency, Min Score

---

### Step 15: View Opportunity Details

1. **Click on any opportunity** or the "→" button
2. **You should see:**
   - AI Analysis section with:
     - Fit Score (0-100)
     - Win Probability
     - Recommendation (BID/NO_BID/REVIEW)
     - Strengths and Weaknesses
     - Executive Summary
   - Opportunity Details:
     - Agency, Office, Solicitation Number
     - Posted Date, Due Date
     - Estimated Value
     - Contact Information
   - Full Description
   - Attachments (if available)

3. **Try actions:**
   - Click **"Save"** to add to pipeline
   - Click **"Dismiss"** to hide the opportunity

**Verify in database:**
```bash
psql -U postgres -d govai
SELECT * FROM saved_opportunities;
SELECT * FROM dismissed_opportunities;
```

---

### Step 16: View Pipeline

1. **Navigate to:** http://localhost:3000/pipeline
2. **You should see:**
   - Stats cards showing counts by status
   - Saved opportunities grouped by status:
     - Watching
     - Pursuing
     - Submitted
     - Won
     - Lost

3. **Try changing status:**
   - Use dropdown to change opportunity status
   - Status updates in real-time

**Verify in database:**
```bash
psql -U postgres -d govai
SELECT
    so.status,
    o.title,
    so.notes,
    so.created_at
FROM saved_opportunities so
JOIN opportunities o ON so.opportunity_id = o.id;
```

---

### Step 17: Update Settings

1. **Navigate to:** http://localhost:3000/settings
2. **You should see:**
   - User Profile section
   - Company Profile section
3. **Try updating:**
   - Email frequency (Daily/Weekly/Never)
   - Company capabilities
   - Click "Save" to update

**Verify in database:**
```bash
psql -U postgres -d govai
SELECT email, email_frequency, first_name, last_name FROM users;
SELECT name, capabilities FROM companies;
```

---

## 📋 PART 5: Running Celery Workers (Optional - For Automated Tasks)

If you want automated polling and evaluation:

### Step 18: Start Redis (Required for Celery)

```bash
# Windows - if Redis is installed:
redis-server

# Or use Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

### Step 19: Start Celery Worker

Open a **NEW terminal**:

```bash
cd backend
venv\Scripts\activate  # if using venv

celery -A tasks.celery_app worker --loglevel=info
```

### Step 20: Start Celery Beat (Scheduler)

Open **ANOTHER NEW terminal**:

```bash
cd backend
venv\Scripts\activate  # if using venv

celery -A tasks.celery_app beat --loglevel=info
```

**Now the system will automatically:**
- Poll SAM.gov every 15 minutes
- Evaluate opportunities every hour
- Generate embeddings every 30 minutes
- Send email digests at 8 AM daily
- Send deadline reminders at 9 AM daily

---

## 🧪 PART 6: Database Verification Queries

### Check All Data

```sql
-- Connect to database
psql -U postgres -d govai

-- User and company
SELECT u.email, u.first_name, c.name as company_name, c.naics_codes
FROM users u
LEFT JOIN companies c ON u.company_id = c.id;

-- Opportunities count
SELECT COUNT(*) as total_opportunities FROM opportunities;

-- Evaluations with scores
SELECT
    o.title,
    e.fit_score,
    e.recommendation,
    e.executive_summary
FROM evaluations e
JOIN opportunities o ON e.opportunity_id = o.id
ORDER BY e.fit_score DESC
LIMIT 10;

-- Embeddings count
SELECT COUNT(*) as total_embeddings FROM opportunity_embeddings;

-- Pipeline opportunities
SELECT
    so.status,
    COUNT(*) as count
FROM saved_opportunities so
GROUP BY so.status;

-- All tables and record counts
SELECT
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM pg_class c WHERE c.relname = tablename) as row_count
FROM pg_tables
WHERE schemaname = 'public';
```

---

## 🔍 Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue: "Database connection failed"

**Solution:**
```bash
# Check PostgreSQL is running
psql -U postgres -l

# Update .env file:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/govai
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port:
npm run dev -- -p 3001
```

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Kill process on port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port:
uvicorn app.main:app --reload --port 8001
```

### Issue: "OpenAI API error"

**Solution:**
```bash
# Verify API key in .env:
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# Test API key:
python -c "
from openai import OpenAI
client = OpenAI()
print('API key valid!')
"
```

### Issue: "SAM.gov API error"

**Solution:**
```bash
# Get API key from https://sam.gov
# Add to .env:
SAM_API_KEY=YOUR_SAM_API_KEY

# Test manually with small date range
```

### Issue: "pgvector extension not found"

**Solution:**
```bash
# Install pgvector for PostgreSQL
# Windows: Download from https://github.com/pgvector/pgvector/releases
# macOS: brew install pgvector
# Linux: apt-get install postgresql-15-pgvector

# Then enable in database:
psql -U postgres -d govai
CREATE EXTENSION vector;
\q
```

---

## 📊 Expected Results

After completing all steps, you should have:

1. **Database Tables:** 8 tables with data
   - users (1 record - you)
   - companies (1 record - your company)
   - opportunities (10-100 records from SAM.gov)
   - evaluations (10-100 records with AI scores)
   - opportunity_embeddings (10-100 records with vectors)
   - saved_opportunities (records when you save opps)
   - dismissed_opportunities (records when you dismiss opps)
   - alembic_version (migration tracking)

2. **Working Frontend:**
   - Login/Register pages
   - Onboarding flow
   - Dashboard with opportunities
   - Opportunity detail pages
   - Pipeline management
   - Settings page

3. **Working Backend:**
   - REST API at http://localhost:8000
   - API docs at http://localhost:8000/docs
   - All CRUD operations working
   - AI evaluation working
   - Vector embeddings working

---

## 🎯 Quick Start Commands Summary

**Terminal 1 - Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 3 - Manual Tasks (one-time):**
```bash
cd backend
python -c "from agents.discovery import run_discovery; run_discovery()"
python -c "from agents.evaluation import run_evaluation; run_evaluation()"
python -c "from agents.embedding_agent import run_embedding_generation; run_embedding_generation()"
```

**Terminal 4 - Celery Worker (optional):**
```bash
cd backend
celery -A tasks.celery_app worker --loglevel=info
```

**Terminal 5 - Celery Beat (optional):**
```bash
cd backend
celery -A tasks.celery_app beat --loglevel=info
```

---

## ✅ Verification Checklist

- [ ] PostgreSQL running on port 5432
- [ ] Database "govai" created with pgvector extension
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Can register new user
- [ ] Can complete onboarding
- [ ] Opportunities fetched from SAM.gov
- [ ] AI evaluations generated
- [ ] Embeddings created
- [ ] Can view dashboard with scored opportunities
- [ ] Can save/dismiss opportunities
- [ ] Can view pipeline
- [ ] Can update settings
- [ ] All data visible in PostgreSQL database

---

**🎉 You're all set! Enjoy your GovAI application!**

If you encounter any issues, check the troubleshooting section above or review the logs in your terminal windows.
