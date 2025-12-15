# Story 2.4: Deep Analysis (On-Demand)

## User Story
```
AS a user
I WANT detailed AI analysis of why an opportunity fits MY company
SO THAT I can make informed bid/no-bid decisions
```

## Background
The generic evaluation (Story 2.2) analyzes the opportunity itself. For users who want a company-specific recommendation, we offer "Deep Analysis" - a detailed GPT-4 analysis comparing the opportunity against the user's company profile.

This is the only place where per-company AI evaluation happens, and it's triggered manually by the user.

## Acceptance Criteria

### AC1: Deep Analysis Button
- [ ] "Request Deep Analysis" button on opportunity detail page
- [ ] Only shown for evaluated opportunities
- [ ] Disabled if already analyzed for this company

### AC2: Company-Specific Analysis
Analysis includes:
- [ ] **Recommendation**: BID / NO_BID / NEEDS_REVIEW
- [ ] **Fit Score (1-100)**: How well company matches requirements
- [ ] **Win Probability (1-100)**: Estimated chance of winning
- [ ] **Strengths**: Why company should bid (3-5 points)
- [ ] **Weaknesses**: Gaps or risks (3-5 points)
- [ ] **Missing Capabilities**: What company lacks
- [ ] **Suggested Actions**: Next steps if pursuing

### AC3: Cache Results
- [ ] Store in existing `evaluations` table
- [ ] Return cached result if exists
- [ ] Show when analysis was performed

### AC4: Usage Tracking
- [ ] Track deep analysis requests per user
- [ ] Consider rate limiting (e.g., 10/day for free tier)
- [ ] Log for cost monitoring

## Technical Design

### API Endpoint

```python
@router.post("/{opportunity_id}/deep-analysis")
async def request_deep_analysis(
    opportunity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Request company-specific deep analysis for an opportunity.
    """
    # Get opportunity
    opportunity = db.query(Opportunity).filter(
        Opportunity.id == opportunity_id
    ).first()

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Get user's company
    company = db.query(Company).filter(
        Company.user_id == current_user.id
    ).first()

    if not company:
        raise HTTPException(status_code=400, detail="Complete company profile first")

    # Check for existing evaluation
    existing = db.query(Evaluation).filter(
        Evaluation.opportunity_id == opportunity_id,
        Evaluation.company_id == company.id
    ).first()

    if existing:
        return {
            "status": "cached",
            "evaluation": evaluation_to_dict(existing),
            "created_at": existing.created_at
        }

    # Perform deep analysis
    result = await ai_evaluator_service.deep_analysis(opportunity, company)

    # Save evaluation
    evaluation = Evaluation(
        opportunity_id=opportunity_id,
        company_id=company.id,
        recommendation=result['recommendation'],
        fit_score=result['fit_score'],
        win_probability=result['win_probability'],
        strengths=result['strengths'],
        weaknesses=result['weaknesses'],
        analysis=result['analysis'],
        reasoning=result['reasoning']
    )
    db.add(evaluation)
    db.commit()

    return {
        "status": "analyzed",
        "evaluation": evaluation_to_dict(evaluation),
        "created_at": evaluation.created_at
    }
```

### Deep Analysis Prompt

```python
DEEP_ANALYSIS_PROMPT = """
You are a government contracting expert. Analyze how well this company matches this opportunity.

## Opportunity
- Title: {opp_title}
- Agency: {opp_agency}
- NAICS: {opp_naics}
- Set-Aside: {opp_set_aside}
- Value: {opp_value}
- Deadline: {opp_deadline}
- Description: {opp_description}
- Key Requirements: {opp_requirements}

## Company Profile
- Name: {company_name}
- NAICS Codes: {company_naics}
- Certifications: {company_certs}
- Geographic Preferences: {company_geo}
- Contract Value Range: {company_value_range}
- Capabilities: {company_capabilities}

## Your Analysis

Provide a detailed assessment in JSON format:

{{
    "recommendation": "<BID|NO_BID|NEEDS_REVIEW>",
    "fit_score": <1-100>,
    "win_probability": <1-100>,

    "strengths": [
        "<strength 1 - why company should bid>",
        "<strength 2>",
        "<strength 3>"
    ],

    "weaknesses": [
        "<weakness 1 - gap or risk>",
        "<weakness 2>",
        "<weakness 3>"
    ],

    "missing_capabilities": [
        "<capability company lacks>"
    ],

    "suggested_actions": [
        "<action 1 if pursuing>",
        "<action 2>"
    ],

    "reasoning": "<2-3 paragraph explanation of your recommendation>"
}}

Consider:
- NAICS code alignment
- Certification requirements
- Geographic fit
- Contract size fit
- Capability gaps
- Competition level
- Past performance requirements

Respond ONLY with the JSON object.
"""
```

### Frontend Component

```typescript
const DeepAnalysisSection = ({ opportunity, companyId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.requestDeepAnalysis(opportunity.id);
      setAnalysis(result.evaluation);
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (analysis) {
    return <DeepAnalysisResults analysis={analysis} />;
  }

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-semibold mb-2">Company-Specific Analysis</h3>
      <p className="text-sm text-gray-600 mb-4">
        Get a detailed AI analysis of how this opportunity fits your company's
        capabilities and certifications.
      </p>

      {loading ? (
        <div className="flex items-center">
          <Spinner className="w-4 h-4 mr-2" />
          <span>Analyzing fit for your company...</span>
        </div>
      ) : (
        <Button onClick={requestAnalysis}>
          Request Deep Analysis
        </Button>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

const DeepAnalysisResults = ({ analysis }) => (
  <div className="space-y-4">
    {/* Recommendation Badge */}
    <div className="flex items-center gap-4">
      <RecommendationBadge recommendation={analysis.recommendation} />
      <div>
        <span className="text-sm text-gray-500">Fit Score</span>
        <span className="font-bold ml-2">{analysis.fit_score}/100</span>
      </div>
      <div>
        <span className="text-sm text-gray-500">Win Probability</span>
        <span className="font-bold ml-2">{analysis.win_probability}%</span>
      </div>
    </div>

    {/* Strengths */}
    <div>
      <h4 className="font-semibold text-green-700">Strengths</h4>
      <ul className="list-disc pl-5">
        {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>

    {/* Weaknesses */}
    <div>
      <h4 className="font-semibold text-red-700">Weaknesses</h4>
      <ul className="list-disc pl-5">
        {analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>

    {/* Reasoning */}
    <div>
      <h4 className="font-semibold">Analysis</h4>
      <p className="text-gray-700">{analysis.reasoning}</p>
    </div>
  </div>
);
```

## Testing

### Unit Tests
- [ ] Test prompt formatting
- [ ] Test response parsing
- [ ] Test caching logic

### Integration Tests
- [ ] Request analysis, verify result
- [ ] Request again, verify cached

## Definition of Done
- [ ] API endpoint implemented
- [ ] Prompt designed and tested
- [ ] Frontend UI complete
- [ ] Caching working
- [ ] Deployed and verified
