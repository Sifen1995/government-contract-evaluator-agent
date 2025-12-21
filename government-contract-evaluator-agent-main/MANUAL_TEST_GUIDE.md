# GovAI Manual Testing Guide

## Test User Account

Use the following credentials for testing:

| Field | Value |
|-------|-------|
| **Email** | `alex.martinez@techsolutions.com` |
| **Password** | `TestPass123!` |
| **First Name** | Alex |
| **Last Name** | Martinez |

---

## Company Profile for Onboarding

### Step 1: Company Information

| Field | Value |
|-------|-------|
| **Company Name** | TechSolutions Federal LLC |
| **Legal Structure** | LLC |
| **UEI Number** | TECH12345678 |
| **Address** | 4500 Innovation Drive, Suite 200, Reston, VA 20190 |

### Step 2: Capabilities & Certifications

| Field | Value |
|-------|-------|
| **NAICS Codes** | 541511 (Custom Computer Programming Services) |
|                 | 541512 (Computer Systems Design Services) |
|                 | 541519 (Other Computer Related Services) |
|                 | 518210 (Data Processing, Hosting Services) |
|                 | 541513 (Computer Facilities Management Services) |
| **Set-Aside Certifications** | 8(a) Business Development |
|                              | Small Business (SB) |
| **Contract Value Range** | Min: $100,000 / Max: $5,000,000 |
| **Geographic Preferences** | Virginia (VA), Maryland (MD), District of Columbia (DC) |

### Step 3: Capabilities Statement

```
TechSolutions Federal LLC is a certified 8(a) small business specializing in
delivering innovative IT solutions to federal government agencies. With over
10 years of experience, we provide:

- Custom Software Development: Modern web and mobile applications using
  Python, JavaScript, React, and cloud-native technologies
- Cloud Migration & Management: AWS GovCloud and Azure Government certified,
  helping agencies modernize their infrastructure
- Cybersecurity Services: FedRAMP compliance consulting, security assessments,
  and continuous monitoring solutions
- Data Analytics: Business intelligence, data visualization, and machine
  learning solutions for evidence-based decision making

Our team holds active SECRET clearances and has delivered successful projects
for DoD, VA, DHS, and civilian agencies. We are committed to delivering
high-quality solutions on time and within budget.

Past Performance:
- VA Electronic Health Records Integration ($2.1M)
- DoD Network Security Assessment ($850K)
- DHS Data Analytics Platform ($1.5M)
```

---

## Testing Steps

### 1. Start the Application

```bash
# From project root directory
docker-compose up -d

# Run database migrations
docker-compose exec backend alembic upgrade head
```


### 2. Access the Application

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

### 3. Register New User

1. Go to http://localhost:3000/register
2. Enter the test user details from above
3. Submit the registration form

### 4. Verify Email

1. Check backend logs for verification link:
   ```bash
   docker-compose logs backend | grep "EMAIL VERIFICATION"
   ```
2. Copy the verification URL and open in browser
3. Your email will be verified

### 5. Login

1. Go to http://localhost:3000/login
2. Enter email: `alex.martinez@techsolutions.com`
3. Enter password: `TestPass123!`
4. Click Login

### 6. Complete Onboarding

1. Fill in Step 1 with company information above
2. Fill in Step 2 with NAICS codes and certifications
3. Fill in Step 3 with capabilities statement
4. Submit to complete onboarding

### 7. Test Opportunity Discovery

1. Navigate to **Dashboard** - View statistics
2. Click **"Run Discovery"** button (triggers SAM.gov fetch)
3. Wait 30-60 seconds for discovery to complete
4. Navigate to **Opportunities** page

### 8. View AI Evaluations

1. On Opportunities page, you should see:
   - List of opportunities matching your NAICS codes
   - AI recommendations: BID (green), RESEARCH (yellow), NO_BID (red)
   - Fit scores and win probabilities
2. Filter by recommendation type
3. Filter by minimum fit score

### 9. Review Opportunity Details

1. Click on any opportunity to view details
2. Review AI analysis:
   - Fit Score
   - Win Probability
   - Recommendation
   - Strengths
   - Weaknesses
   - Key Requirements
   - Risk Factors

### 10. Pipeline Management

1. Save an opportunity to pipeline (WATCHING, BIDDING, or PASSED)
2. Add personal notes
3. Navigate to **Pipeline** page
4. View Kanban board with your saved opportunities
5. Move opportunities between statuses

### 11. Settings

1. Navigate to **Settings** page
2. Update email notification preferences
3. Modify company profile if needed

---

## Expected Results

### Dashboard
- Total opportunities: Should show count
- BID recommendations: Should show count
- Average fit score: Should display

### Opportunities Page
- List of opportunities from SAM.gov
- Each with AI evaluation scores
- Filtering works correctly

### Opportunity Detail
- Full AI analysis displayed
- Can save to pipeline
- Can add notes

### Pipeline
- Shows saved opportunities
- Status columns work
- Can move between statuses

---

## Troubleshooting

### No Opportunities Showing
1. Check if SAM_API_KEY is configured in `.env`
2. Check backend logs: `docker-compose logs backend`
3. Manually trigger discovery via API Docs

### AI Evaluations Missing
1. Check if OPENAI_API_KEY is configured in `.env`
2. Check celery worker logs: `docker-compose logs celery-worker`

### Login Issues
1. Make sure email is verified
2. Check backend logs for errors
3. Try password reset flow

### Docker Issues
1. Restart Docker Desktop
2. Run `docker-compose down` then `docker-compose up -d --build`
3. Check all services: `docker-compose ps`

---

## Quick Commands

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View celery worker logs
docker-compose logs -f celery-worker

# Check service status
docker-compose ps

# Restart all services
docker-compose restart

# Stop all services
docker-compose down

# Complete reset (removes data)
docker-compose down -v
docker-compose up -d --build
docker-compose exec backend alembic upgrade head
```

---

## API Testing (Optional)

### Using Swagger UI

1. Go to http://localhost:8000/docs
2. Register via POST /api/v1/auth/register
3. Login via POST /api/v1/auth/login
4. Copy the access_token
5. Click "Authorize" and paste token
6. Test other endpoints

### Direct API Calls

```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.martinez@techsolutions.com",
    "password": "TestPass123!",
    "first_name": "Alex",
    "last_name": "Martinez"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alex.martinez@techsolutions.com",
    "password": "TestPass123!"
  }'

# Get opportunities (use token from login)
curl http://localhost:8000/api/v1/opportunities/opportunities \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Trigger discovery
curl -X POST http://localhost:8000/api/v1/opportunities/actions/trigger-discovery \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
