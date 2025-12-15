# Story 1.1: Consolidated API Fetching

## User Story
```
AS the system
I WANT to fetch all opportunities in a single API call per discovery run
SO THAT I minimize SAM.gov API usage and avoid rate limits
```

## Background
The SAM.gov API supports querying multiple NAICS codes in a single request using comma-separated values. Currently, we make separate API calls for each NAICS code, which is inefficient and leads to rate limiting.

## Acceptance Criteria

### AC1: Single API Call for All NAICS
- [ ] Collect all unique NAICS codes from all companies
- [ ] Make ONE API call with comma-separated NAICS codes: `?ncode=541511,541512,541519`
- [ ] Handle API response with mixed NAICS opportunities

### AC2: Incremental Fetching
- [ ] Track the timestamp of the last successful fetch
- [ ] Use `postedFrom` parameter to only fetch opportunities posted AFTER last fetch
- [ ] On first run (no previous fetch), fetch last 30 days

### AC3: Pagination Handling
- [ ] Handle paginated responses (SAM.gov returns max 1000 per request)
- [ ] Continue fetching until all opportunities retrieved
- [ ] Track total API calls made per discovery run

### AC4: Error Handling
- [ ] Gracefully handle rate limit errors (429)
- [ ] Implement exponential backoff for retries
- [ ] Log errors without crashing the job
- [ ] Continue with partial results if some pages fail

## Technical Design

### Changes to `sam_gov_service.py`

```python
async def search_opportunities_batch(
    self,
    naics_codes: List[str],
    posted_from: Optional[datetime] = None,
    posted_to: Optional[datetime] = None,
    limit: int = 1000
) -> Dict:
    """
    Fetch opportunities for multiple NAICS codes in a single API call.

    Args:
        naics_codes: List of NAICS codes to search
        posted_from: Only fetch opportunities posted after this date
        posted_to: Only fetch opportunities posted before this date
        limit: Maximum opportunities to fetch

    Returns:
        Dict with opportunities list and metadata
    """
    # Join NAICS codes with commas
    ncode_param = ",".join(naics_codes)

    params = {
        "api_key": self.api_key,
        "limit": min(limit, 1000),  # API max is 1000
        "offset": 0,
        "ncode": ncode_param,
    }

    if posted_from:
        params["postedFrom"] = posted_from.strftime("%m/%d/%Y")
    if posted_to:
        params["postedTo"] = posted_to.strftime("%m/%d/%Y")

    # Fetch with pagination...
```

### Changes to `discover_opportunities.py`

```python
def discover_opportunities():
    # Get last successful fetch time
    last_run = get_last_successful_discovery_run(db)
    posted_from = last_run.completed_at if last_run else (datetime.now() - timedelta(days=30))

    # Get all unique NAICS codes
    all_naics = get_all_company_naics_codes(db)

    # Single API call for all NAICS
    result = await sam_gov_service.search_opportunities_batch(
        naics_codes=all_naics,
        posted_from=posted_from
    )

    # Process opportunities...
```

## Database Changes

None required for this story (discovery tracking is in Story 1.3).

## Testing

### Unit Tests
- [ ] Test NAICS code concatenation
- [ ] Test date parameter formatting
- [ ] Test pagination logic
- [ ] Test error handling for 429 responses

### Integration Tests
- [ ] Test actual SAM.gov API call with multiple NAICS
- [ ] Verify opportunities returned match requested NAICS codes

## Definition of Done
- [ ] Code implemented and reviewed
- [ ] Unit tests passing
- [ ] Integration test passing
- [ ] Deployed to EC2
- [ ] Verified in production logs
