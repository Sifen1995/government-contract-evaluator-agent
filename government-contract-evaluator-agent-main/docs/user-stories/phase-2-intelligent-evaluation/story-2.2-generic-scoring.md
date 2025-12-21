# Story 2.2: Generic Opportunity Scoring

## User Story
```
AS the system
I WANT to evaluate each opportunity ONCE with generic criteria
SO THAT I don't pay for redundant per-company evaluations
```

## Background
Currently, the same opportunity gets evaluated separately for each company with matching NAICS codes. This is wasteful because most of the analysis (complexity, clarity, competition level) is the same regardless of which company is evaluating.

**New approach:**
1. Generic evaluation: Analyze the opportunity itself (ONCE)
2. Company matching: Calculate fit scores using rules (NO AI needed)

## Acceptance Criteria

### AC1: Generic Evaluation Fields
- [ ] Add `generic_evaluation` JSONB column to opportunities table
- [ ] Add `evaluation_status` column: `pending`, `evaluated`, `skipped`, `failed`
- [ ] Store evaluation timestamp

### AC2: Generic Evaluation Content
The AI should analyze:
- [ ] **Complexity Score (1-100)**: How complex is this contract to fulfill?
- [ ] **Competition Level**: LOW / MEDIUM / HIGH / VERY_HIGH
- [ ] **Requirement Clarity (1-100)**: How clear are the requirements?
- [ ] **Key Requirements**: List of main requirements extracted
- [ ] **Red Flags**: Any concerns or risks identified
- [ ] **Suggested Capabilities**: What capabilities are needed to bid?

### AC3: Evaluation Prompt Redesign
- [ ] Create new prompt focused on opportunity analysis (not company fit)
- [ ] Remove company-specific context from prompt
- [ ] Output structured JSON

### AC4: Batch Evaluation
- [ ] Evaluate multiple opportunities in sequence
- [ ] Handle API errors gracefully (retry, skip)
- [ ] Track evaluation progress

## Technical Design

### Database Migration

```sql
-- Add generic evaluation columns to opportunities
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS evaluation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS generic_evaluation JSONB,
ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMP;

-- Index for finding unevaluated opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_eval_status
ON opportunities(evaluation_status);
```

### Updated Evaluation Prompt

```python
GENERIC_EVALUATION_PROMPT = """
You are a government contracting analyst. Analyze this opportunity and provide a structured assessment.

## Opportunity Details
- Title: {title}
- Agency: {agency}
- NAICS Code: {naics_code}
- Set-Aside: {set_aside_type}
- Estimated Value: {award_amount}
- Response Deadline: {response_deadline}
- Description: {description}

## Your Analysis

Provide your assessment in the following JSON format:

{{
    "complexity_score": <1-100, where 100 is most complex>,
    "complexity_reasoning": "<brief explanation>",

    "competition_level": "<LOW|MEDIUM|HIGH|VERY_HIGH>",
    "competition_reasoning": "<brief explanation>",

    "requirement_clarity_score": <1-100, where 100 is most clear>,
    "clarity_issues": ["<issue 1>", "<issue 2>"],

    "key_requirements": [
        "<requirement 1>",
        "<requirement 2>",
        "<requirement 3>"
    ],

    "suggested_capabilities": [
        "<capability 1>",
        "<capability 2>"
    ],

    "red_flags": [
        "<concern 1>",
        "<concern 2>"
    ],

    "opportunity_summary": "<2-3 sentence summary of what this contract is about>"
}}

Respond ONLY with the JSON object, no other text.
"""
```

### New Evaluation Service Method

```python
async def evaluate_opportunity_generic(
    self,
    opportunity: Opportunity
) -> Dict:
    """
    Evaluate an opportunity with generic criteria (not company-specific).
    This evaluation is done ONCE per opportunity.
    """
    prompt = GENERIC_EVALUATION_PROMPT.format(
        title=opportunity.title,
        agency=opportunity.agency,
        naics_code=opportunity.naics_code,
        set_aside_type=opportunity.set_aside_type or "None",
        award_amount=f"${opportunity.award_amount:,.0f}" if opportunity.award_amount else "Not specified",
        response_deadline=opportunity.response_deadline.strftime("%Y-%m-%d") if opportunity.response_deadline else "Not specified",
        description=opportunity.description[:2000] if opportunity.description else "No description"
    )

    response = await self.client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=1000,
        temperature=0.3
    )

    return json.loads(response.choices[0].message.content)
```

### New Script: `evaluate_pending.py`

```python
#!/usr/bin/env python3
"""
Evaluate pending opportunities with generic AI analysis.
Run after discovery to evaluate new opportunities.
"""

def evaluate_pending_opportunities(limit: int = 50):
    """Evaluate opportunities that haven't been evaluated yet."""
    db = SessionLocal()

    try:
        # Get pending opportunities
        pending = db.query(Opportunity).filter(
            Opportunity.evaluation_status == 'pending'
        ).order_by(
            Opportunity.response_deadline.asc()  # Prioritize soon deadlines
        ).limit(limit).all()

        logger.info(f"Found {len(pending)} pending opportunities to evaluate")

        evaluated = 0
        failed = 0

        for opp in pending:
            try:
                # Run generic evaluation
                result = asyncio.run(
                    ai_evaluator_service.evaluate_opportunity_generic(opp)
                )

                # Store result
                opp.generic_evaluation = result
                opp.evaluation_status = 'evaluated'
                opp.evaluated_at = datetime.utcnow()
                db.commit()

                evaluated += 1
                logger.info(f"Evaluated {opp.notice_id}: complexity={result.get('complexity_score')}")

            except Exception as e:
                logger.error(f"Failed to evaluate {opp.notice_id}: {e}")
                opp.evaluation_status = 'failed'
                db.commit()
                failed += 1

        logger.info(f"Evaluation complete: {evaluated} evaluated, {failed} failed")
        return {'evaluated': evaluated, 'failed': failed}

    finally:
        db.close()
```

### Evaluations Table Changes

The existing `evaluations` table remains for **company-specific** deep analysis (Story 2.4).
Generic evaluation is stored directly on the opportunity.

```
opportunities table:
├── generic_evaluation (JSONB) - One-time AI analysis
├── evaluation_status - Track if evaluated
└── evaluated_at - When evaluated

evaluations table (existing):
├── company_id - Which company requested deep analysis
├── opportunity_id
├── recommendation (BID/NO_BID/RESEARCH)
├── fit_score - Company-specific fit
└── ... (detailed analysis)
```

## API Changes

### Update Opportunity Response Schema

```python
class OpportunityResponse(BaseModel):
    id: UUID
    title: str
    # ... existing fields ...

    # New generic evaluation fields
    evaluation_status: str
    generic_evaluation: Optional[Dict] = None
    evaluated_at: Optional[datetime] = None
```

## Testing

### Unit Tests
- [ ] Test prompt formatting
- [ ] Test JSON response parsing
- [ ] Test error handling

### Integration Tests
- [ ] Evaluate sample opportunity
- [ ] Verify JSON structure is valid
- [ ] Verify evaluation is stored correctly

## Definition of Done
- [ ] Database migration applied
- [ ] Generic evaluation prompt created
- [ ] evaluate_pending.py script working
- [ ] API returns generic_evaluation
- [ ] Deployed and verified
