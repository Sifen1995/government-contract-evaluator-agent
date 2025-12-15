# GovAI User Stories - Opportunity Discovery Optimization

This directory contains detailed user stories for optimizing the opportunity discovery and evaluation system.

## Overview

The goal is to minimize API costs, reduce redundant processing, and improve user experience by redesigning how opportunities are fetched, evaluated, and matched to companies.

## Phases

| Phase | Directory | Status | Priority |
|-------|-----------|--------|----------|
| Phase 1 | [phase-1-sam-api-optimization](./phase-1-sam-api-optimization/) | Not Started | HIGH |
| Phase 2 | [phase-2-intelligent-evaluation](./phase-2-intelligent-evaluation/) | Not Started | HIGH |
| Phase 3 | [phase-3-smart-matching](./phase-3-smart-matching/) | Not Started | MEDIUM |
| Phase 4 | [phase-4-user-triggered-discovery](./phase-4-user-triggered-discovery/) | Not Started | LOW |

## Current Problems

1. **Inefficient API Usage**: Makes 1 API call per NAICS code every 15 minutes
2. **Redundant Evaluations**: Same opportunity evaluated multiple times (once per company)
3. **No Caching**: Processes same opportunities repeatedly
4. **Over-polling**: 15-minute intervals unnecessary for government contracts

## Cost Comparison

| Metric | Current | Optimized |
|--------|---------|-----------|
| SAM.gov API calls/day | ~480 | ~2-10 |
| GPT-4 evaluations/opportunity | N (per company) | 1 (generic) |
| GPT-4 cost/month (100 opps, 10 companies) | ~$30-60 | ~$3-6 |

## Implementation Order

1. Phase 1 - Fix SAM.gov API usage (stops rate limiting)
2. Phase 2.1 - Add pre-filtering (reduces GPT-4 costs)
3. Phase 3.1 - Rule-based matching (better UX, no AI cost)
4. Phase 2.2-2.3 - Optimize AI evaluation
5. Phase 4 - User-triggered features
