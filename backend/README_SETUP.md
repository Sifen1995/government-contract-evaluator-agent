# GovAI Backend Setup Guide

## Database Setup with pgvector

### 1. Enable pgvector Extension

After creating your PostgreSQL database, you need to enable the pgvector extension for vector similarity search:

```bash
# Connect to your database
psql -d govai -U postgres

# Inside psql, run:
CREATE EXTENSION IF NOT EXISTS vector;

# Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';
```

**Or use the provided SQL script:**

```bash
cd backend
psql -d govai -U postgres -f migrations/scripts/enable_pgvector.sql
```

### 2. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**New dependencies added:**
- `pgvector==0.2.4` - PostgreSQL vector extension Python client
- `openai==1.54.0` - Updated OpenAI SDK (from 1.9.0)

### 3. Run Database Migrations

```bash
# Generate migration for vector embeddings
cd backend
python -m alembic revision --autogenerate -m "Add opportunity embeddings table"

# Apply migrations
python -m alembic upgrade head
```

### 4. Verify Tables Created

```bash
python -c "
from app.core.database import engine
from sqlalchemy import inspect
insp = inspect(engine)
tables = insp.get_table_names()
print('Tables:', tables)
print('opportunity_embeddings' in tables)
"
```

## AI Pipeline Features

### A. SAM.gov Opportunity Caching ✅
- **File:** `agents/discovery.py`
- **Celery Task:** Runs every 15 minutes
- **What it does:**
  - Polls SAM.gov API for new opportunities
  - Matches by company NAICS codes
  - Skips duplicates using `(source, source_id)` unique constraint
  - Stores normalized data in `opportunities` table

### B. AI Evaluation Pipeline ✅
- **File:** `agents/evaluation.py`
- **Celery Task:** Runs every hour
- **What it does:**
  - Evaluates opportunities using GPT-4
  - Generates fit scores (0-100)
  - Provides BID/NO_BID/REVIEW recommendation
  - Analyzes strengths and weaknesses
  - Creates executive summary

**Scoring Breakdown:**
- NAICS alignment: 30 points
- Set-aside match: 25 points
- Contract value fit: 20 points
- Capability alignment: 25 points

### C. Vector Embeddings ✅ (NEW)
- **Files:**
  - `app/models/opportunity_embedding.py` - Database model
  - `app/services/embeddings.py` - Embedding generation service
  - `agents/embedding_agent.py` - Celery task
- **Celery Task:** Runs every 30 minutes
- **What it does:**
  - Generates 1536-dimension embeddings using OpenAI text-embedding-3-small
  - Stores embeddings in `opportunity_embeddings` table with pgvector
  - Enables semantic similarity search
  - Extracts and stores keywords from opportunity text

**Usage Example:**
```python
from app.services.embeddings import EmbeddingService
from app.core.database import SessionLocal

db = SessionLocal()
service = EmbeddingService()

# Find semantically similar opportunities
results = service.semantic_search(db, company, limit=20)
```

### D. Keyword Extraction ✅ (NEW)
- **File:** `app/services/embeddings.py:extract_keywords()`
- **What it does:**
  - Extracts relevant keywords from opportunity descriptions
  - Removes stop words
  - Stores keywords for faster filtering
  - Used in embeddings for better matching

### E. Capability Matching ✅ (NEW)
- **File:** `app/services/capability_matcher.py`
- **What it does:**
  - Detailed matching between company capabilities and opportunity requirements
  - Extracts capability terms from text
  - Calculates match score (0-100)
  - Identifies matching terms and gaps
  - Provides category-based matching (IT, engineering, consulting, etc.)
  - Generates human-readable narratives

**Usage Example:**
```python
from app.services.capability_matcher import CapabilityMatcher

matcher = CapabilityMatcher()
result = matcher.match_capabilities(
    company_capabilities="Software development, cloud services, cybersecurity",
    opportunity_description="Seeking IT services for cloud migration...",
    opportunity_title="Cloud Migration Services"
)

print(result['match_score'])  # 85.4
print(result['matching_terms'])  # ['cloud', 'software', 'IT']
```

### F. Email Notifications ✅
- **File:** `agents/email_agent.py`
- **Celery Tasks:**
  - Daily digests: 8 AM daily
  - Deadline reminders: 9 AM daily
- **What it does:**
  - Sends top 5 opportunities to users
  - HTML email templates
  - Respects email preferences

## Celery Task Schedule

```python
beat_schedule = {
    "discover-opportunities": {
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
    },
    "evaluate-opportunities": {
        "schedule": crontab(minute=0),  # Every hour
    },
    "generate-embeddings": {
        "schedule": crontab(minute="*/30"),  # Every 30 minutes (NEW)
    },
    "send-daily-digests": {
        "schedule": crontab(hour=8, minute=0),  # 8 AM daily
    },
    "send-deadline-reminders": {
        "schedule": crontab(hour=9, minute=0),  # 9 AM daily
    },
}
```

## Running the Pipeline

### Start Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Celery Worker
```bash
cd backend
celery -A tasks.celery_app worker --loglevel=info
```

### Start Celery Beat (Scheduler)
```bash
cd backend
celery -A tasks.celery_app beat --loglevel=info
```

### Manual Task Execution (for testing)
```python
from agents.discovery import run_discovery
from agents.evaluation import run_evaluation
from agents.embedding_agent import run_embedding_generation

# Run discovery
run_discovery()

# Run evaluation
run_evaluation()

# Run embedding generation
run_embedding_generation()
```

## Architecture Flow

```
1. SAM.gov Discovery (Every 15 min)
   ↓
2. Store in opportunities table
   ↓
3. AI Evaluation (Every hour)
   ↓
4. Store evaluations in evaluations table
   ↓
5. Generate Embeddings (Every 30 min)
   ↓
6. Store embeddings in opportunity_embeddings table
   ↓
7. Dashboard fetches cached data (NOT SAM.gov directly)
   ↓
8. Users interact with pre-evaluated, pre-embedded data
```

## Best Practices Implemented

✅ **Database:**
- Unique constraints prevent duplicates
- Proper indexes for fast queries
- Foreign keys with CASCADE delete
- Vector index for fast similarity search

✅ **API Integration:**
- Proper error handling and retries
- Timeout configuration
- Rate limiting awareness
- Batch processing

✅ **AI/ML:**
- Cost-effective embedding model (text-embedding-3-small)
- Fallback evaluations on errors
- Confidence scores
- JSON response format enforcement

✅ **Async Processing:**
- Celery for background tasks
- Beat scheduler for cron-like jobs
- Redis for message queue
- Task retry logic

✅ **Code Quality:**
- Type hints
- Logging throughout
- Dependency injection
- Service layer pattern
- Clean separation of concerns

## Troubleshooting

### pgvector not found
```bash
# Install pgvector extension
# Ubuntu/Debian:
sudo apt-get install postgresql-15-pgvector

# macOS (Homebrew):
brew install pgvector

# Then enable in database
psql -d govai -c "CREATE EXTENSION vector;"
```

### OpenAI API errors
- Check API key is valid
- Verify billing is active
- Check rate limits
- Review model availability

### Celery not picking up tasks
- Ensure Redis is running
- Check Celery worker is started
- Verify beat scheduler is running
- Check task names match schedule

## Environment Variables Required

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/govai
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-proj-...
SAM_API_KEY=your-sam-api-key
SENDGRID_API_KEY=your-sendgrid-key
JWT_SECRET=your-secret-key
```

## Next Steps

1. Run database migrations to create embeddings table
2. Enable pgvector extension
3. Start Celery workers
4. Monitor task execution logs
5. Test semantic search in dashboard
