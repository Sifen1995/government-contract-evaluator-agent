# 🎯 START HERE - Run GovAI Locally

## Your Database Configuration
✅ **Database Name:** GovAI
✅ **Username:** sifenGovAI
✅ **Password:** sifen1995
✅ **Host:** localhost:5432

---

## 🚀 Step-by-Step Instructions

### STEP 1: Setup Database (One Time Only)

**📌 Double-click this file:**
```
setup-database.bat
```

**What it does:**
- Creates the GovAI database
- Enables pgvector extension for vector search
- Runs all migrations (creates 8 tables)

**⏱️ Takes:** ~1 minute

**✅ Success looks like:**
```
Tables created: ['users', 'companies', 'opportunities', 'evaluations',
'saved_opportunities', 'dismissed_opportunities', 'opportunity_embeddings', 'alembic_version']
Total tables: 8
```

---

### STEP 2: Start Backend API

**📌 Double-click this file:**
```
start-backend.bat
```

**What it does:**
- Installs Python dependencies
- Starts FastAPI server on port 8000

**⏱️ Takes:** ~2 minutes (first time)

**✅ Success looks like:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**🔗 Test it:** Open http://localhost:8000/docs

**⚠️ Keep this terminal window OPEN!**

---

### STEP 3: Start Frontend

**📌 Open NEW terminal and double-click this file:**
```
start-frontend.bat
```

**What it does:**
- Installs Node dependencies
- Starts Next.js server on port 3000

**⏱️ Takes:** ~3 minutes (first time)

**✅ Success looks like:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
✓ Ready in 3.5s
```

**🔗 Open in browser:** http://localhost:3000

**⚠️ Keep this terminal window OPEN!**

---

### STEP 4: Create Your Account

**🌐 In browser at http://localhost:3000**

1. Click **"Register"** (top right)
2. Fill in:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click **"Register"** button

**✅ You'll be redirected to: http://localhost:3000/onboarding**

---

### STEP 5: Complete Company Profile

**📝 Step 1 of 3 - Company Information**

Fill in:
- Company Name: `Tech Solutions Inc`
- Legal Structure: `LLC`
- Street Address: `123 Main St`
- City: `Washington`
- State: `DC`
- ZIP: `20001`
- UEI: (leave blank or enter: `ABC123456789`)

Click **"Next"**

---

**📝 Step 2 of 3 - NAICS Codes & Certifications**

1. **Add NAICS Codes:**
   - Type: `541512` and click "Add" (Computer Systems Design)
   - Type: `541519` and click "Add" (Other Computer Services)
   - Type: `541511` and click "Add" (Custom Programming)

2. **Select Certifications:**
   - ✅ Check `8(a)`
   - ✅ Check `Small Business`

3. **Contract Value Range:**
   - Select: `$100K - $1M`

Click **"Next"**

---

**📝 Step 3 of 3 - Capabilities Statement**

Copy and paste this example:
```
Tech Solutions Inc specializes in software development, cloud computing,
and cybersecurity services. We have 10+ years of experience delivering
custom applications for federal agencies.

Our core capabilities include:
- Full-stack web development (React, Node.js, Python, Java)
- Cloud infrastructure and migration (AWS, Azure, GCP)
- DevOps automation and CI/CD pipelines
- Cybersecurity assessments and NIST compliance
- Mobile application development (iOS, Android)
- Data analytics and visualization
- API integration and microservices architecture

We hold active security clearances and have experience with:
- FedRAMP compliance
- FISMA requirements
- NIST 800-53 controls
- Agile development methodologies

Past performance includes successful projects with DoD, VA, and civilian agencies.
```

Click **"Complete Setup"**

**✅ You'll be redirected to: http://localhost:3000/dashboard**

---

### STEP 6: Fetch Opportunities from SAM.gov

**⚠️ Dashboard will be empty at first - this is normal!**

**📌 Double-click this file:**
```
run-discovery.bat
```

**What it does:**
- Connects to SAM.gov API
- Fetches opportunities matching your NAICS codes (541512, 541519, 541511)
- Saves them to your GovAI database

**⏱️ Takes:** ~2-3 minutes

**✅ Success looks like:**
```
Discovery completed: 45 new opportunities added
```

**📊 Verify in database:**
```bash
psql -U sifenGovAI -d GovAI -c "SELECT COUNT(*) FROM opportunities;"
```

---

### STEP 7: Run AI Evaluation

**📌 Double-click this file:**
```
run-evaluation.bat
```

**What it does:**
- Takes each opportunity
- Analyzes it using GPT-4
- Generates fit score (0-100)
- Creates BID/NO_BID/REVIEW recommendation
- Lists strengths and weaknesses

**⏱️ Takes:** ~5-10 minutes (depends on number of opportunities)

**✅ Success looks like:**
```
Evaluation completed: 45 opportunities evaluated
```

**📊 Verify in database:**
```bash
psql -U sifenGovAI -d GovAI -c "SELECT fit_score, recommendation FROM evaluations LIMIT 5;"
```

---

### STEP 8: Generate Embeddings (Optional but Recommended)

**📌 Double-click this file:**
```
run-embeddings.bat
```

**What it does:**
- Creates vector embeddings for semantic search
- Extracts keywords from opportunities
- Enables "find similar" functionality

**⏱️ Takes:** ~2-3 minutes

**✅ Success looks like:**
```
Generated 45 embeddings!
```

---

### STEP 9: View Your Dashboard! 🎉

**🌐 Refresh your browser:** http://localhost:3000/dashboard

**You should now see:**

1. **Quick Stats Cards:**
   - New This Week: [number]
   - Saved Total: 0
   - Pursuing: 0
   - Avg Fit Score: [number]

2. **Opportunities List:**
   Each opportunity shows:
   - 🟢 **Fit Score** (green badge 75-100)
   - 🟡 **Fit Score** (yellow badge 50-74)
   - 🔴 **Fit Score** (red badge 0-49)
   - **Title** of the opportunity
   - **Agency** name
   - **NAICS Code**
   - **Deadline** (days remaining)
   - **AI Recommendation:** BID / REVIEW / NO_BID
   - **Summary** from AI

3. **Action Buttons:**
   - **Dismiss** - Hide this opportunity
   - **Save** - Add to your pipeline
   - **View →** - See full details

---

### STEP 10: Click on an Opportunity

**Click any "View →" button or the opportunity title**

**You'll see:**

**AI ANALYSIS Section:**
```
Recommendation: BID ✓
Win Probability: 65%

STRENGTHS:
✓ Exact NAICS match
✓ 8(a) eligible
✓ Strong IT capabilities

WEAKNESSES:
⚠ Limited DoD experience
⚠ Contract value at high end

SUMMARY:
This opportunity is a strong fit given your 8(a) status
and IT capabilities. Recommend pursuing with focus on
demonstrating relevant past performance.
```

**OPPORTUNITY DETAILS Section:**
- Agency, Office, Solicitation Number
- Posted Date, Due Date
- Estimated Value
- Contact Information
- Place of Performance
- Link to SAM.gov

**DESCRIPTION Section:**
- Full opportunity description
- Requirements
- Attachments (if available)

**Action Buttons:**
- **Save** - Add to pipeline
- **Dismiss** - Hide forever

---

### STEP 11: Test Pipeline Feature

1. **Click "Save"** on a few opportunities
2. **Navigate to:** http://localhost:3000/pipeline
3. **You'll see:**
   - Status cards (Watching, Pursuing, Submitted, Won, Lost)
   - Your saved opportunities grouped by status
   - Dropdown to change status
   - Notes field (optional)

**Try it:**
- Change status from "Watching" to "Pursuing"
- Status updates instantly in database

---

### STEP 12: Test Settings

**Navigate to:** http://localhost:3000/settings

**You can update:**

**User Profile:**
- First Name
- Last Name
- Email Frequency (Daily/Weekly/Never)

**Company Profile:**
- Company Name
- NAICS Codes (displayed, read-only)
- Capabilities Statement (edit and save)

Click **"Save"** to update.

---

## 🎯 Verify Everything in Database

Open Command Prompt and run:

```bash
psql -U sifenGovAI -d GovAI
```

**Check your data:**

```sql
-- Your user account
SELECT email, first_name, last_name, company_id FROM users;

-- Your company
SELECT name, naics_codes, set_asides FROM companies;

-- Count opportunities
SELECT COUNT(*) FROM opportunities;

-- Top 5 opportunities by score
SELECT
    o.title,
    e.fit_score,
    e.recommendation
FROM evaluations e
JOIN opportunities o ON e.opportunity_id = o.id
ORDER BY e.fit_score DESC
LIMIT 5;

-- Check embeddings
SELECT COUNT(*) FROM opportunity_embeddings;

-- Check saved opportunities
SELECT
    so.status,
    o.title
FROM saved_opportunities so
JOIN opportunities o ON so.opportunity_id = o.id;

-- Exit
\q
```

---

## 📊 Expected Results Summary

After completing all steps:

| Item | Expected Count |
|------|---------------|
| **Users** | 1 (you) |
| **Companies** | 1 (your company) |
| **Opportunities** | 20-100 (from SAM.gov) |
| **Evaluations** | 20-100 (AI scored) |
| **Embeddings** | 20-100 (vectors) |
| **Saved Opps** | 0-10 (when you save) |

---

## 🔄 Daily Workflow

### To Start Working:
1. **Start Backend:** Double-click `start-backend.bat`
2. **Start Frontend:** Double-click `start-frontend.bat`
3. **Open Browser:** http://localhost:3000

### To Get New Opportunities:
1. **Run Discovery:** Double-click `run-discovery.bat`
2. **Run Evaluation:** Double-click `run-evaluation.bat`
3. **Refresh Dashboard**

### To Stop:
- Press `CTRL+C` in backend terminal
- Press `CTRL+C` in frontend terminal

---

## 🆘 Common Issues & Solutions

### Issue: "Port 8000 already in use"
**Solution:**
```bash
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID [PID_NUMBER] /F
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### Issue: "Module not found: openai"
**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue: "Database connection failed"
**Solution:**
- Check PostgreSQL is running
- Verify credentials in `.env` file
- Try connecting manually: `psql -U sifenGovAI -d GovAI`

### Issue: "No opportunities showing"
**Solution:**
1. Run `run-discovery.bat` first
2. Then run `run-evaluation.bat`
3. Refresh dashboard

### Issue: "OpenAI API error"
**Solution:**
- Check your API key in `.env` file is valid
- Verify billing is active at https://platform.openai.com/account/billing

---

## 📚 Additional Resources

- **Detailed Guide:** `LOCAL_SETUP_GUIDE.md`
- **Quick Reference:** `QUICK_START.md`
- **AI Pipeline Analysis:** `AI_PIPELINE_ANALYSIS.md`
- **Backend Setup:** `backend/README_SETUP.md`

---

## ✅ Final Checklist

Before you start, make sure:
- [ ] PostgreSQL is running
- [ ] Database "GovAI" exists
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] `.env` file configured
- [ ] OpenAI API key is valid
- [ ] SAM.gov API key is valid

---

**🎉 You're all set! Enjoy GovAI!**

**Need help?** Check the troubleshooting section or review `LOCAL_SETUP_GUIDE.md` for more details.
