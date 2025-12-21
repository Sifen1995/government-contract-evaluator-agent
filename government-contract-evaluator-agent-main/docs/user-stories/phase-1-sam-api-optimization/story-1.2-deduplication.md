# Story 1.2: Opportunity Deduplication

## User Story
```
AS the system
I WANT to skip opportunities already in the database
SO THAT I don't waste processing on duplicates
```

## Background
Currently, the system processes every opportunity returned by SAM.gov, even if it's already in the database. This wastes processing time and can lead to duplicate entries or unnecessary database writes.

## Acceptance Criteria

### AC1: Check Before Insert
- [ ] Check if opportunity exists by `notice_id` before inserting
- [ ] Use efficient batch lookup (single query for all notice_ids)
- [ ] Skip opportunities that already exist and haven't changed

### AC2: Update Changed Opportunities
- [ ] Compare key fields to detect changes: title, description, response_deadline, status
- [ ] Update existing record if data has changed
- [ ] Track `updated_at` timestamp for auditing

### AC3: Opportunity Status Tracking
- [ ] Add `status` field to opportunities table
- [ ] Status values: `new`, `active`, `closed`, `expired`, `cancelled`
- [ ] Mark opportunities as `closed` when deadline passes
- [ ] Mark as `cancelled` if removed from SAM.gov

### AC4: Metrics Tracking
- [ ] Count and log: new opportunities, updated opportunities, unchanged (skipped)
- [ ] Return metrics from discovery function for monitoring

## Technical Design

### Database Migration

```sql
-- Add status column
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_notice_id ON opportunities(notice_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);

-- Update existing records
UPDATE opportunities SET status = 'active' WHERE status IS NULL;
```

### Changes to `opportunity_service.py`

```python
def upsert_opportunities_batch(
    db: Session,
    opportunities_data: List[Dict]
) -> Dict[str, int]:
    """
    Insert new opportunities and update existing ones.

    Returns:
        Dict with counts: {'new': X, 'updated': Y, 'unchanged': Z}
    """
    notice_ids = [opp['notice_id'] for opp in opportunities_data]

    # Batch lookup existing opportunities
    existing = db.query(Opportunity).filter(
        Opportunity.notice_id.in_(notice_ids)
    ).all()
    existing_map = {opp.notice_id: opp for opp in existing}

    new_count = 0
    updated_count = 0
    unchanged_count = 0

    for opp_data in opportunities_data:
        notice_id = opp_data['notice_id']

        if notice_id in existing_map:
            existing_opp = existing_map[notice_id]
            if has_changed(existing_opp, opp_data):
                update_opportunity(existing_opp, opp_data)
                updated_count += 1
            else:
                unchanged_count += 1
        else:
            create_opportunity(db, opp_data)
            new_count += 1

    db.commit()
    return {'new': new_count, 'updated': updated_count, 'unchanged': unchanged_count}


def has_changed(existing: Opportunity, new_data: Dict) -> bool:
    """Check if opportunity data has changed."""
    fields_to_check = ['title', 'description', 'response_deadline', 'award_amount']
    for field in fields_to_check:
        if getattr(existing, field) != new_data.get(field):
            return True
    return False
```

### Changes to `discover_opportunities.py`

```python
def discover_opportunities():
    # ... fetch from SAM.gov ...

    # Batch upsert with deduplication
    result = opportunity_service.upsert_opportunities_batch(db, raw_opportunities)

    logger.info(
        f"Discovery completed: {result['new']} new, "
        f"{result['updated']} updated, {result['unchanged']} unchanged"
    )
```

## Testing

### Unit Tests
- [ ] Test new opportunity insertion
- [ ] Test existing opportunity detection
- [ ] Test change detection logic
- [ ] Test batch lookup performance

### Integration Tests
- [ ] Run discovery twice, verify no duplicates
- [ ] Modify opportunity in SAM.gov mock, verify update detected

## Definition of Done
- [ ] Database migration created and applied
- [ ] Code implemented and reviewed
- [ ] Unit tests passing
- [ ] Deployed to EC2
- [ ] Verified no duplicate opportunities in production
