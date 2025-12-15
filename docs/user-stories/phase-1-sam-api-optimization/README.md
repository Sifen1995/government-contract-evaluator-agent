# Phase 1: SAM.gov API Optimization

## Goal
Minimize SAM.gov API usage to avoid rate limiting and reduce unnecessary calls.

## Current State
- 1 API call per NAICS code (5 NAICS = 5 calls)
- Runs every 15 minutes = 480 calls/day
- Hits rate limit frequently
- No tracking of last fetch time

## Target State
- Single consolidated API call with all NAICS codes
- Runs 2x daily (sufficient for government contracts)
- Incremental fetching (only new opportunities)
- Full audit trail of discovery runs

## Stories

| Story | File | Priority | Estimate |
|-------|------|----------|----------|
| 1.1 Consolidated API Fetching | [story-1.1-consolidated-fetching.md](./story-1.1-consolidated-fetching.md) | HIGH | 2 hours |
| 1.2 Opportunity Deduplication | [story-1.2-deduplication.md](./story-1.2-deduplication.md) | HIGH | 1 hour |
| 1.3 Discovery Run Tracking | [story-1.3-discovery-tracking.md](./story-1.3-discovery-tracking.md) | MEDIUM | 1 hour |
| 1.4 Cron Schedule Update | [story-1.4-cron-update.md](./story-1.4-cron-update.md) | HIGH | 30 min |

## Success Metrics
- SAM.gov API calls reduced from ~480/day to ~2-10/day
- Zero rate limit errors
- All opportunities still discovered within 12 hours of posting
