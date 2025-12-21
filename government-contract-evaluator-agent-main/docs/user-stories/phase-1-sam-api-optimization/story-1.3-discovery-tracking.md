# Story 1.3: Discovery Run Tracking

## User Story
```
AS a system administrator
I WANT to track each discovery run with detailed metrics
SO THAT I can monitor system health and debug issues
```

## Background
Currently, discovery runs are only logged to files. We need structured tracking in the database to:
- Know when the last successful run occurred (for incremental fetching)
- Monitor API usage over time
- Debug failed runs
- Display status in admin dashboard

## Acceptance Criteria

### AC1: Discovery Run Table
- [ ] Create `discovery_runs` table to track each run
- [ ] Store start time, end time, duration
- [ ] Store NAICS codes searched
- [ ] Store results: opportunities found, new, updated, unchanged
- [ ] Store API calls made

### AC2: Run Status Tracking
- [ ] Status values: `running`, `completed`, `failed`, `partial`
- [ ] `partial` = completed but with some errors (e.g., some pages failed)
- [ ] Store error message if failed

### AC3: Query Last Successful Run
- [ ] Function to get last successful run
- [ ] Return `completed_at` timestamp for incremental fetching
- [ ] Handle case where no previous runs exist

### AC4: Cleanup Old Runs
- [ ] Retain last 90 days of run history
- [ ] Add to cleanup cron job

## Technical Design

### Database Migration

```sql
CREATE TABLE discovery_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    -- Values: 'running', 'completed', 'failed', 'partial'

    -- Search parameters
    naics_codes TEXT[],
    posted_from DATE,
    posted_to DATE,

    -- Results
    api_calls_made INTEGER DEFAULT 0,
    opportunities_found INTEGER DEFAULT 0,
    opportunities_new INTEGER DEFAULT 0,
    opportunities_updated INTEGER DEFAULT 0,
    opportunities_unchanged INTEGER DEFAULT 0,
    evaluations_created INTEGER DEFAULT 0,

    -- Errors
    error_message TEXT,
    error_details JSONB,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookup of last successful run
CREATE INDEX idx_discovery_runs_status_completed
ON discovery_runs(status, completed_at DESC);
```

### New Model: `discovery_run.py`

```python
from sqlalchemy import Column, String, Integer, DateTime, ARRAY, DECIMAL, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import uuid

class DiscoveryRun(Base):
    __tablename__ = "discovery_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime)
    duration_seconds = Column(DECIMAL(10, 2))
    status = Column(String(20), nullable=False, default='running')

    naics_codes = Column(ARRAY(String))
    posted_from = Column(DateTime)
    posted_to = Column(DateTime)

    api_calls_made = Column(Integer, default=0)
    opportunities_found = Column(Integer, default=0)
    opportunities_new = Column(Integer, default=0)
    opportunities_updated = Column(Integer, default=0)
    opportunities_unchanged = Column(Integer, default=0)
    evaluations_created = Column(Integer, default=0)

    error_message = Column(String)
    error_details = Column(JSON)
```

### New Service: `discovery_service.py`

```python
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.discovery_run import DiscoveryRun

class DiscoveryService:
    def start_run(self, db: Session, naics_codes: List[str]) -> DiscoveryRun:
        """Create a new discovery run record."""
        run = DiscoveryRun(
            started_at=datetime.utcnow(),
            status='running',
            naics_codes=naics_codes
        )
        db.add(run)
        db.commit()
        return run

    def complete_run(
        self,
        db: Session,
        run: DiscoveryRun,
        results: Dict
    ) -> DiscoveryRun:
        """Mark run as completed with results."""
        run.completed_at = datetime.utcnow()
        run.duration_seconds = (run.completed_at - run.started_at).total_seconds()
        run.status = 'completed'
        run.opportunities_found = results.get('found', 0)
        run.opportunities_new = results.get('new', 0)
        run.opportunities_updated = results.get('updated', 0)
        run.opportunities_unchanged = results.get('unchanged', 0)
        run.api_calls_made = results.get('api_calls', 0)
        db.commit()
        return run

    def fail_run(
        self,
        db: Session,
        run: DiscoveryRun,
        error: str,
        details: Dict = None
    ) -> DiscoveryRun:
        """Mark run as failed."""
        run.completed_at = datetime.utcnow()
        run.duration_seconds = (run.completed_at - run.started_at).total_seconds()
        run.status = 'failed'
        run.error_message = error
        run.error_details = details
        db.commit()
        return run

    def get_last_successful_run(self, db: Session) -> Optional[DiscoveryRun]:
        """Get the most recent successful discovery run."""
        return db.query(DiscoveryRun).filter(
            DiscoveryRun.status == 'completed'
        ).order_by(
            DiscoveryRun.completed_at.desc()
        ).first()

    def cleanup_old_runs(self, db: Session, days: int = 90):
        """Delete runs older than specified days."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        db.query(DiscoveryRun).filter(
            DiscoveryRun.created_at < cutoff
        ).delete()
        db.commit()

discovery_service = DiscoveryService()
```

### Changes to `discover_opportunities.py`

```python
from app.services.discovery import discovery_service

def discover_opportunities():
    db = SessionLocal()
    run = None

    try:
        # Get all NAICS codes
        all_naics = get_all_company_naics_codes(db)

        # Start tracking this run
        run = discovery_service.start_run(db, all_naics)

        # Get last successful run for incremental fetch
        last_run = discovery_service.get_last_successful_run(db)
        posted_from = last_run.completed_at if last_run else None

        # ... perform discovery ...

        # Mark as completed
        discovery_service.complete_run(db, run, {
            'found': total_found,
            'new': new_count,
            'updated': updated_count,
            'unchanged': unchanged_count,
            'api_calls': api_calls
        })

    except Exception as e:
        if run:
            discovery_service.fail_run(db, run, str(e))
        raise
    finally:
        db.close()
```

## Testing

### Unit Tests
- [ ] Test run creation
- [ ] Test run completion
- [ ] Test run failure
- [ ] Test get_last_successful_run
- [ ] Test cleanup_old_runs

## Definition of Done
- [ ] Database migration created and applied
- [ ] Model and service implemented
- [ ] discover_opportunities.py updated
- [ ] Unit tests passing
- [ ] Deployed and verified in production
