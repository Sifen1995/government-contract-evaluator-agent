# GovAI - Quick Start Testing Guide

## 🚀 Get Testing in 10 Minutes

This guide will get your GovAI platform up and running for comprehensive testing.

---

## Prerequisites Check

- [x] Python 3.13.5 installed ✅
- [x] Node.js installed ✅
- [x] Docker installed ✅
- [ ] Docker Desktop running ❌ **START THIS FIRST**
- [ ] API keys obtained

---

## Step 1: Start Docker Desktop (2 minutes)

1. Open Docker Desktop application
2. Wait for it to fully start (whale icon should be steady)
3. Verify it's running:
   ```bash
   docker ps
   ```
   Should show a table of containers (may be empty)

---

## Step 2: Create .env File (3 minutes)

```bash
# Copy the example file
cp .env.example .env

# Edit with your favorite editor
nano .env  # or vim, code, notepad, etc.
```

**Required API Keys to add:**

```env
# 1. SAM.gov API Key (https://sam.gov → Account → API Keys)
SAM_API_KEY=your-actual-sam-api-key-here

# 2. OpenAI API Key (https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-actual-openai-key-here

# 3. SendGrid API Key (https://sendgrid.com → Settings → API Keys)
SENDGRID_API_KEY=SG.your-actual-sendgrid-key-here
EMAIL_FROM=your-verified-email@example.com

# 4. Generate JWT Secret (run this command):
# python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET=paste-your-generated-32-char-hex-here

# Leave these as-is for local development:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/govai
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379
CELERY_RESULT_BACKEND=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

**Quick Generate JWT Secret:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Step 3: Start All Services (3 minutes)

```bash
# Start all services in detached mode
docker-compose up -d

# This will start:
# - PostgreSQL (database)
# - Redis (cache/queue)
# - Backend API (FastAPI)
# - Celery Worker (background tasks)
# - Celery Beat (scheduler)
# - Frontend (Next.js)
```

**Watch the logs to see when it's ready:**
```bash
docker-compose logs -f
```

Press `Ctrl+C` to stop watching logs (services keep running)

**Check all services are healthy:**
```bash
docker-compose ps
```

You should see 6 services running:
- govai-postgres
- govai-redis
- govai-backend
- govai-celery-worker
- govai-celery-beat
- govai-frontend

---

## Step 4: Initialize Database (1 minute)

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head
```

**Expected output:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> abc123, Initial schema
```

---

## Step 5: Verify Everything Works (1 minute)

### Test Backend API:
```bash
curl http://localhost:8000/health
```

**Expected:**
```json
{"status": "healthy"}
```

### Test Frontend:
Open browser to: http://localhost:3000

**Expected:** GovAI landing page with "Get Started" button

### Test Backend API Docs:
Open browser to: http://localhost:8000/docs

**Expected:** Interactive Swagger API documentation

---

## Step 6: Create Test Account & Start Testing

### Option A: Using the UI (Recommended)

1. Go to http://localhost:3000
2. Click "Get Started"
3. Fill in registration form:
   - Email: test@example.com
   - Password: SecurePass123!
   - First Name: John
   - Last Name: Doe
4. Click Register
5. **Note:** Email verification is required, check your email or database

### Option B: Using API Directly

```bash
# Register a user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

Save the `access_token` from login response for subsequent requests.

---

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery-worker
docker-compose logs -f frontend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Everything
```bash
docker-compose down
```

### Stop and Remove All Data
```bash
docker-compose down -v
```

### Access Database
```bash
docker-compose exec postgres psql -U postgres -d govai
```

### Access Backend Python Shell
```bash
docker-compose exec backend python
```

---

## Testing Checklist

Now that everything is running, follow the comprehensive test plan in `TEST_REPORT.md`:

### Quick Test Flow:

1. **✅ Registration & Login**
   - Register new account via UI
   - Verify email (check database or email)
   - Login successfully

2. **✅ Company Onboarding**
   - Complete company profile form
   - Add NAICS codes: 541512, 541519
   - Add set-asides: 8(a), Small Business
   - Submit and verify saved

3. **✅ Trigger Discovery Agent**
   ```bash
   docker-compose exec backend python
   ```
   ```python
   from agents.discovery import DiscoveryAgent
   from app.core.database import SessionLocal

   db = SessionLocal()
   agent = DiscoveryAgent()
   opps = agent.poll_new_opportunities(db, hours_back=168)  # Last week
   print(f"Found {len(opps)} opportunities")
   ```

4. **✅ View Opportunities**
   - Go to Dashboard
   - See matched opportunities with AI scores
   - Click on opportunity for details

5. **✅ Manage Pipeline**
   - Save opportunity to pipeline
   - Change status to "Pursuing"
   - Add notes
   - View in Pipeline page

6. **✅ Check Email Digest**
   ```bash
   docker-compose logs celery-worker | grep "digest"
   ```

---

## Troubleshooting

### Issue: Docker Compose fails to start

**Solution:**
```bash
# Stop all containers
docker-compose down

# Remove old containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Start again
docker-compose up -d
```

### Issue: Backend shows "Connection refused" to PostgreSQL

**Solution:**
Wait 30 seconds for PostgreSQL to fully start, then:
```bash
docker-compose restart backend
```

### Issue: Frontend can't connect to backend

**Check .env file has:**
```env
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

Then restart:
```bash
docker-compose restart backend
```

### Issue: Database migrations fail

**Solution:**
```bash
# Check if database exists
docker-compose exec postgres psql -U postgres -l

# If govai database doesn't exist, create it:
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE govai;"

# Run migrations again
docker-compose exec backend alembic upgrade head
```

### Issue: SAM.gov API returns errors

**Verify your API key:**
1. Go to https://sam.gov
2. Login → Account Details
3. Check API key is active
4. Update .env file with correct key
5. Restart backend: `docker-compose restart backend`

---

## Performance Tips

### Speed up cold starts:
```bash
# Build images once
docker-compose build

# Then always use:
docker-compose up -d
```

### Monitor resource usage:
```bash
docker stats
```

### Clean up Docker resources:
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

---

## Next Steps

1. ✅ **Complete this quick start**
2. 📋 **Follow detailed test plan** in `TEST_REPORT.md`
3. 🐛 **Report any issues** you find
4. 🚀 **Start using the platform** with real data

---

## Getting Help

- Check logs: `docker-compose logs -f [service-name]`
- View API docs: http://localhost:8000/docs
- Check database: `docker-compose exec postgres psql -U postgres -d govai`
- Python shell: `docker-compose exec backend python`

---

**🎉 You're ready to start testing!**

Open http://localhost:3000 and begin your journey with GovAI.
