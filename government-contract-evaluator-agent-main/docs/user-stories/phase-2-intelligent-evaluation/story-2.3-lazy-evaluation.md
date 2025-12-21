# Story 2.3: Lazy Evaluation

## User Story
```
AS a user
I WANT opportunities to be evaluated when I view them
SO THAT the system only processes what I care about
```

## Background
Not all opportunities will be viewed by users. Evaluating everything upfront wastes API costs. Instead, we can:
1. Show opportunities immediately (unevaluated)
2. Trigger evaluation when user views details
3. Cache result for subsequent views

## Acceptance Criteria

### AC1: Show Unevaluated Opportunities
- [ ] List page shows opportunities regardless of evaluation status
- [ ] Display "Pending Analysis" badge for unevaluated opportunities
- [ ] Sort evaluated opportunities higher (optional)

### AC2: Trigger Evaluation on View
- [ ] When user opens opportunity detail page
- [ ] If `evaluation_status == 'pending'`, trigger evaluation
- [ ] Show loading spinner while evaluating
- [ ] Display results when complete

### AC3: Evaluation Endpoint
- [ ] POST `/api/v1/opportunities/{id}/evaluate`
- [ ] Returns evaluation result
- [ ] Idempotent (returns cached result if already evaluated)

### AC4: Background Priority Evaluation
- [ ] Separate job evaluates high-priority opportunities
- [ ] Priority = deadline < 14 days AND evaluation_status == 'pending'
- [ ] Runs daily after discovery

## Technical Design

### New API Endpoint

```python
@router.post("/{opportunity_id}/evaluate")
async def evaluate_opportunity(
    opportunity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger evaluation for a specific opportunity.
    Returns cached result if already evaluated.
    """
    opportunity = db.query(Opportunity).filter(
        Opportunity.id == opportunity_id
    ).first()

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Return cached result if available
    if opportunity.evaluation_status == 'evaluated' and opportunity.generic_evaluation:
        return {
            "status": "cached",
            "evaluation": opportunity.generic_evaluation,
            "evaluated_at": opportunity.evaluated_at
        }

    # Trigger evaluation
    try:
        result = await ai_evaluator_service.evaluate_opportunity_generic(opportunity)

        opportunity.generic_evaluation = result
        opportunity.evaluation_status = 'evaluated'
        opportunity.evaluated_at = datetime.utcnow()
        db.commit()

        return {
            "status": "evaluated",
            "evaluation": result,
            "evaluated_at": opportunity.evaluated_at
        }

    except Exception as e:
        logger.error(f"Evaluation failed for {opportunity_id}: {e}")
        raise HTTPException(status_code=500, detail="Evaluation failed")
```

### Frontend Changes

```typescript
// OpportunityDetailPage.tsx
const OpportunityDetail = ({ opportunityId }) => {
  const [opportunity, setOpportunity] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    loadOpportunity();
  }, [opportunityId]);

  const loadOpportunity = async () => {
    const data = await api.getOpportunity(opportunityId);
    setOpportunity(data);

    // Trigger evaluation if pending
    if (data.evaluation_status === 'pending') {
      triggerEvaluation();
    }
  };

  const triggerEvaluation = async () => {
    setEvaluating(true);
    try {
      const result = await api.evaluateOpportunity(opportunityId);
      setOpportunity(prev => ({
        ...prev,
        evaluation_status: 'evaluated',
        generic_evaluation: result.evaluation
      }));
    } catch (error) {
      console.error('Evaluation failed:', error);
    } finally {
      setEvaluating(false);
    }
  };

  if (evaluating) {
    return <EvaluationLoadingSpinner />;
  }

  return (
    <div>
      {/* Opportunity details */}
      {opportunity.evaluation_status === 'evaluated' ? (
        <EvaluationResults evaluation={opportunity.generic_evaluation} />
      ) : (
        <PendingAnalysisBadge />
      )}
    </div>
  );
};
```

### Loading Component

```typescript
const EvaluationLoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-8">
    <Spinner className="w-8 h-8 mb-4" />
    <p className="text-gray-600">Analyzing opportunity with AI...</p>
    <p className="text-sm text-gray-400">This usually takes 5-10 seconds</p>
  </div>
);
```

### Priority Background Evaluation

```python
# evaluate_priority.py
def evaluate_priority_opportunities():
    """Evaluate high-priority opportunities in background."""
    db = SessionLocal()

    try:
        # High priority = deadline within 14 days
        cutoff = datetime.utcnow() + timedelta(days=14)

        priority = db.query(Opportunity).filter(
            Opportunity.evaluation_status == 'pending',
            Opportunity.response_deadline <= cutoff,
            Opportunity.response_deadline > datetime.utcnow()  # Not expired
        ).order_by(
            Opportunity.response_deadline.asc()
        ).limit(20).all()

        logger.info(f"Found {len(priority)} priority opportunities")

        for opp in priority:
            # Evaluate...
```

## Testing

### Unit Tests
- [ ] Test endpoint returns cached result
- [ ] Test endpoint triggers new evaluation
- [ ] Test error handling

### Integration Tests
- [ ] Load opportunity page, verify evaluation triggered
- [ ] Reload page, verify cached result used
- [ ] Test loading state display

## Definition of Done
- [ ] API endpoint implemented
- [ ] Frontend loading state
- [ ] Priority evaluation script
- [ ] Tests passing
- [ ] Deployed and verified
