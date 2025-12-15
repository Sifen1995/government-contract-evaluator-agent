# Phase 2: Intelligent Evaluation

## Goal
Reduce OpenAI API costs by pre-filtering opportunities and evaluating each opportunity only once (not per-company).

## Current State
- Every opportunity is evaluated with GPT-4 for EVERY company with matching NAICS
- 10 companies × 100 opportunities = 1000 GPT-4 calls
- Cost: ~$30-60/month for moderate usage
- No pre-filtering of obviously irrelevant opportunities

## Target State
- Pre-filter opportunities using free rule-based checks
- Evaluate each opportunity ONCE with generic criteria
- Company-specific matching computed without AI
- Optional "deep analysis" for specific opportunity+company pairs

## Stories

| Story | File | Priority | Estimate |
|-------|------|----------|----------|
| 2.1 Rule-Based Pre-Filtering | [story-2.1-pre-filtering.md](./story-2.1-pre-filtering.md) | HIGH | 2 hours |
| 2.2 Generic Opportunity Scoring | [story-2.2-generic-scoring.md](./story-2.2-generic-scoring.md) | HIGH | 3 hours |
| 2.3 Lazy Evaluation | [story-2.3-lazy-evaluation.md](./story-2.3-lazy-evaluation.md) | MEDIUM | 2 hours |
| 2.4 Deep Analysis (On-Demand) | [story-2.4-deep-analysis.md](./story-2.4-deep-analysis.md) | LOW | 2 hours |

## Success Metrics
- GPT-4 API calls reduced by 80-90%
- Cost reduced from ~$30-60/month to ~$3-6/month
- User experience unchanged or improved
