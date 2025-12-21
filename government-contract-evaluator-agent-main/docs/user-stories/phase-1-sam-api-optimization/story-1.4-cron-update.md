# Story 1.4: Cron Schedule Update

## User Story
```
AS the system
I WANT to run discovery twice daily instead of every 15 minutes
SO THAT I stay within SAM.gov API rate limits
```

## Background
Government contract opportunities typically have response deadlines weeks or months in the future. Polling every 15 minutes is excessive and wastes API quota. Twice daily (morning and evening) is sufficient to ensure users see new opportunities within 12 hours of posting.

## Acceptance Criteria

### AC1: Update Discovery Schedule
- [ ] Change from `*/15 * * * *` (every 15 min) to `0 6,18 * * *` (6 AM and 6 PM UTC)
- [ ] Verify cron syntax is correct
- [ ] Update crontab on EC2 server

### AC2: Stagger Evaluation Job
- [ ] Run evaluation job 30 minutes after discovery: `30 6,18 * * *`
- [ ] Ensures new opportunities are in DB before evaluation starts

### AC3: Update Documentation
- [ ] Update CLAUDE.md with new schedule
- [ ] Update any deployment scripts that set up cron

### AC4: Add Manual Trigger Capability
- [ ] Keep the manual discovery endpoint working
- [ ] Rate limit manual triggers to 1 per hour per user
- [ ] Log manual triggers separately from scheduled runs

## Technical Design

### Updated Crontab

```bash
# GovAI Cron Jobs - Optimized Schedule
# =====================================

# Environment variables
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin
GOVAI_DIR=/opt/govai/backend
VENV_PYTHON=/opt/govai/venv/bin/python
LOG_DIR=/var/log/govai

# Discover new opportunities from SAM.gov (6 AM and 6 PM UTC)
0 6,18 * * * cd $GOVAI_DIR && $VENV_PYTHON scripts/discover_opportunities.py >> $LOG_DIR/discovery.log 2>&1

# Evaluate pending opportunities (30 min after discovery)
30 6,18 * * * cd $GOVAI_DIR && $VENV_PYTHON scripts/evaluate_pending.py >> $LOG_DIR/evaluation.log 2>&1

# Compute match scores for new opportunities (1 hour after discovery)
0 7,19 * * * cd $GOVAI_DIR && $VENV_PYTHON scripts/compute_match_scores.py >> $LOG_DIR/matching.log 2>&1

# Send daily digest emails at 8 AM UTC
0 8 * * * cd $GOVAI_DIR && $VENV_PYTHON scripts/send_daily_digest.py >> $LOG_DIR/email.log 2>&1

# Send deadline reminders at 9 AM UTC
0 9 * * * cd $GOVAI_DIR && $VENV_PYTHON scripts/send_deadline_reminders.py >> $LOG_DIR/email.log 2>&1

# Clean up old opportunities and discovery runs at 2 AM UTC daily
0 2 * * * cd $GOVAI_DIR && $VENV_PYTHON scripts/cleanup_opportunities.py >> $LOG_DIR/cleanup.log 2>&1

# Rotate logs weekly (keep 4 weeks)
0 0 * * 0 find $LOG_DIR -name "*.log" -mtime +28 -delete
```

### Timeline Visualization

```
UTC Time    Job
--------    ---
02:00       Cleanup old data
06:00       Discovery Run #1
06:30       Evaluate new opportunities
07:00       Compute match scores
08:00       Send daily digest emails
09:00       Send deadline reminders
18:00       Discovery Run #2
18:30       Evaluate new opportunities
19:00       Compute match scores
```

### Deployment Commands

```bash
# SSH to server
ssh ubuntu@ec2-35-173-103-83.compute-1.amazonaws.com

# Backup current crontab
crontab -l > /opt/govai/crontab-backup-$(date +%Y%m%d).txt

# Install new crontab
crontab /opt/govai/backend/scripts/govai-crontab

# Verify
crontab -l
```

## Impact Analysis

| Metric | Before | After |
|--------|--------|-------|
| Discovery runs/day | 96 | 2 |
| SAM.gov API calls/day | ~480 | ~2-10 |
| Max time to see new opportunity | 15 min | 12 hours |
| Rate limit risk | HIGH | LOW |

## Rollback Plan

If issues arise, restore the more frequent schedule:
```bash
# Restore frequent polling (not recommended long-term)
echo "*/15 * * * * cd /opt/govai/backend && /opt/govai/venv/bin/python scripts/discover_opportunities.py >> /var/log/govai/discovery.log 2>&1" | crontab -
```

## Testing

### Manual Testing
- [ ] Install new crontab on EC2
- [ ] Wait for next scheduled run
- [ ] Verify discovery runs at expected times
- [ ] Check logs for successful completion

### Monitoring
- [ ] Set up CloudWatch alarm if discovery hasn't run in 24 hours
- [ ] Alert if discovery run fails

## Definition of Done
- [ ] New crontab file created
- [ ] Deployed to EC2
- [ ] Verified next scheduled run executes successfully
- [ ] Documentation updated
