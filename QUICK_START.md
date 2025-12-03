# 🚀 GovAI - Quick Start Guide

## Prerequisites
- ✅ PostgreSQL installed and running
- ✅ Node.js 18+ installed
- ✅ Python 3.11+ installed

## Step 1: Setup Database (First Time Only)

**Double-click:** `setup-database.bat`

This will:
- Create the `govai` database
- Enable pgvector extension
- Run all migrations
- Create all tables

## Step 2: Start Backend

**Double-click:** `start-backend.bat`

This will:
- Install Python dependencies
- Run migrations (if any new ones)
- Start FastAPI server on http://localhost:8000

**Keep this terminal open!**

## Step 3: Start Frontend

**Double-click:** `start-frontend.bat`

This will:
- Install Node dependencies
- Start Next.js server on http://localhost:3000

**Keep this terminal open!**

## Step 4: Open Application

Open your browser: **http://localhost:3000**

## Step 5: Register & Login

1. Click "Register"
2. Fill in your details:
   - Email: `test@example.com`
   - Password: `password123`
   - First Name: `John`
   - Last Name: `Doe`
3. Click "Register"

## Step 6: Complete Onboarding

### Company Information
- Company Name: `Tech Solutions Inc`
- Legal Structure: `LLC`
- Address: `123 Main St, Washington, DC 20001`
- UEI: (optional)
- Click "Next"

### NAICS Codes
- Add NAICS: `541512` (Computer Systems Design)
- Add NAICS: `541519` (Other Computer Services)
- Check certifications: `8(a)`, `Small Business`
- Select value range: `$100K - $1M`
- Click "Next"

### Capabilities
Enter your capabilities:
```
We specialize in software development, cloud computing, and cybersecurity.
Our team has 10+ years of government contracting experience with expertise in:
- Full-stack web development (React, Python, Node.js)
- Cloud infrastructure (AWS, Azure)
- DevOps and CI/CD
- Cybersecurity and compliance (NIST, FedRAMP)
```
- Click "Complete Setup"

## Step 7: Fetch Opportunities

**Double-click:** `run-discovery.bat`

This will fetch opportunities from SAM.gov matching your NAICS codes.
Wait for completion message.

## Step 8: Run AI Evaluation

**Double-click:** `run-evaluation.bat`

This will evaluate all opportunities using GPT-4 and generate scores.
Wait for completion message.

## Step 9: Generate Embeddings (Optional)

**Double-click:** `run-embeddings.bat`

This generates vector embeddings for semantic search.
Wait for completion message.

## Step 10: View Your Dashboard

Go back to: **http://localhost:3000/dashboard**

You should now see:
- ✅ Opportunities from SAM.gov
- ✅ AI-generated fit scores
- ✅ BID/NO_BID recommendations
- ✅ Strengths and weaknesses

## Step 11: Test Features

### View Opportunity Details
- Click on any opportunity
- See full AI analysis
- Check strengths/weaknesses
- View contact information

### Save to Pipeline
- Click "Save" button
- Go to http://localhost:3000/pipeline
- See your saved opportunities
- Change status (Watching → Pursuing → Submitted)

### Update Settings
- Go to http://localhost:3000/settings
- Update your profile
- Change email preferences
- Update company capabilities

---

## 🔍 Verify Data in Database

Open Command Prompt and run:

```bash
psql -U postgres -d govai
```

Then run these queries:

```sql
-- Check your user
SELECT email, first_name, company_id FROM users;

-- Check your company
SELECT name, naics_codes, set_asides FROM companies;

-- Check opportunities
SELECT COUNT(*) FROM opportunities;
SELECT title, agency, naics_code FROM opportunities LIMIT 5;

-- Check evaluations
SELECT COUNT(*) FROM evaluations;
SELECT fit_score, recommendation FROM evaluations ORDER BY fit_score DESC LIMIT 5;

-- Check embeddings
SELECT COUNT(*) FROM opportunity_embeddings;

-- Check saved opportunities
SELECT * FROM saved_opportunities;
```

Type `\q` to exit psql.

---

## 📊 File Structure

```
government-contract-evaluator-agent/
│
├── start-backend.bat       ← Start backend server
├── start-frontend.bat      ← Start frontend server
├── setup-database.bat      ← Setup database (first time)
├── run-discovery.bat       ← Fetch opportunities
├── run-evaluation.bat      ← Run AI evaluation
├── run-embeddings.bat      ← Generate embeddings
│
├── backend/
│   ├── app/               ← API code
│   ├── agents/            ← AI agents
│   ├── tasks/             ← Celery tasks
│   └── migrations/        ← Database migrations
│
└── frontend/
    ├── app/               ← Next.js pages
    ├── components/        ← React components
    └── lib/               ← API client
```

---

## 🆘 Troubleshooting

### Backend won't start
```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
```

### Frontend won't start
```bash
cd frontend
npm install
```

### Database connection error
Check your `.env` file:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/govai
```

Make sure PostgreSQL is running!

### No opportunities showing
1. Run `run-discovery.bat` to fetch opportunities
2. Run `run-evaluation.bat` to generate AI scores
3. Refresh your dashboard

### OpenAI API error
Check your `.env` file has valid API key:
```
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

---

## 🎯 What to Expect

After completing all steps:

1. **Database:** 8 tables with data
2. **Backend:** Running on http://localhost:8000
3. **Frontend:** Running on http://localhost:3000
4. **Opportunities:** 10-100 from SAM.gov (depending on your NAICS)
5. **AI Scores:** All opportunities evaluated with fit scores
6. **Dashboard:** Working with filters and sorting

---

## ⚡ Quick Commands

### Start Everything
1. `setup-database.bat` (first time only)
2. `start-backend.bat` (keep open)
3. `start-frontend.bat` (keep open)
4. `run-discovery.bat` (run once)
5. `run-evaluation.bat` (run once)
6. Open http://localhost:3000

### Stop Everything
- Press `CTRL+C` in backend terminal
- Press `CTRL+C` in frontend terminal

---

**🎉 That's it! You're ready to use GovAI locally!**

For detailed information, see: `LOCAL_SETUP_GUIDE.md`
