"""
SAM.gov API integration service for discovering government contract opportunities
"""
from typing import List, Dict, Optional, Tuple
import httpx
from datetime import datetime, timedelta, timezone
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Default cache duration in minutes
DEFAULT_CACHE_MINUTES = 15


class SAMGovService:
    """Service for interacting with SAM.gov API"""

    BASE_URL = "https://api.sam.gov/opportunities/v2/search"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SAM_API_KEY
        if not self.api_key:
            logger.warning("SAM.gov API key not configured. Using public access (limited rate).")

    def check_cache_freshness(
        self,
        db,
        naics_codes: List[str],
        cache_minutes: int = DEFAULT_CACHE_MINUTES
    ) -> Tuple[bool, Optional[datetime], int]:
        """
        Check if we have fresh opportunity data for the given NAICS codes.

        Args:
            db: Database session
            naics_codes: List of NAICS codes to check
            cache_minutes: How many minutes before data is considered stale

        Returns:
            Tuple of (is_fresh, last_sync_time, opportunity_count)
        """
        from sqlalchemy import func
        from app.models.opportunity import Opportunity

        if not naics_codes:
            return False, None, 0

        # Get the most recent update time for opportunities with these NAICS codes
        result = db.query(
            func.max(Opportunity.updated_at).label("last_sync"),
            func.count(Opportunity.id).label("count")
        ).filter(
            Opportunity.naics_code.in_(naics_codes),
            Opportunity.status == "active"
        ).first()

        last_sync = result.last_sync if result else None
        count = result.count if result else 0

        if not last_sync:
            logger.info(f"No cached opportunities found for NAICS codes: {naics_codes}")
            return False, None, 0

        # Check if data is still fresh
        # Handle timezone-aware vs naive datetimes
        cache_cutoff = datetime.utcnow() - timedelta(minutes=cache_minutes)

        # Make last_sync timezone-naive for comparison if needed
        last_sync_naive = last_sync.replace(tzinfo=None) if last_sync.tzinfo else last_sync
        is_fresh = last_sync_naive > cache_cutoff

        if is_fresh:
            logger.info(
                f"Cache HIT: {count} opportunities for NAICS {naics_codes} "
                f"(last sync: {last_sync_naive.strftime('%Y-%m-%d %H:%M:%S')})"
            )
        else:
            minutes_old = (datetime.utcnow() - last_sync_naive).total_seconds() / 60
            logger.info(
                f"Cache STALE: Data for NAICS {naics_codes} is {minutes_old:.1f} minutes old"
            )

        return is_fresh, last_sync, count

    async def search_opportunities_smart(
        self,
        db,
        naics_codes: Optional[List[str]] = None,
        force_refresh: bool = False,
        cache_minutes: int = DEFAULT_CACHE_MINUTES,
        **kwargs
    ) -> Dict:
        """
        Smart search that checks cache before calling SAM.gov API.

        Args:
            db: Database session
            naics_codes: List of NAICS codes to filter by
            force_refresh: If True, bypass cache and always call SAM.gov
            cache_minutes: How many minutes before data is considered stale
            **kwargs: Additional arguments passed to search_opportunities

        Returns:
            Dict with 'opportunities', 'total_count', 'from_cache', 'last_sync'
        """
        from app.models.opportunity import Opportunity

        # Check cache freshness (unless force refresh)
        if not force_refresh and naics_codes:
            is_fresh, last_sync, count = self.check_cache_freshness(db, naics_codes, cache_minutes)

            if is_fresh and count > 0:
                # Return cached data from database
                logger.info(f"Using cached opportunities from database ({count} records)")

                # Fetch opportunities from DB
                opportunities = db.query(Opportunity).filter(
                    Opportunity.naics_code.in_(naics_codes),
                    Opportunity.status == "active"
                ).all()

                return {
                    "opportunities": [],  # Empty - no new raw data to process
                    "total_count": count,
                    "from_cache": True,
                    "last_sync": last_sync,
                    "cached_opportunities": opportunities
                }

        # Cache miss or force refresh - call SAM.gov API
        logger.info(f"Cache MISS or force_refresh={force_refresh}: Calling SAM.gov API")
        result = await self.search_opportunities(naics_codes=naics_codes, **kwargs)
        result["from_cache"] = False
        result["last_sync"] = datetime.utcnow()
        result["cached_opportunities"] = None

        return result

    async def search_opportunities(
        self,
        naics_codes: Optional[List[str]] = None,
        set_aside: Optional[str] = None,
        posted_from: Optional[datetime] = None,
        posted_to: Optional[datetime] = None,
        active: bool = True,
        limit: int = 100,
        offset: int = 0
    ) -> Dict:
        """
        Search for opportunities on SAM.gov

        Args:
            naics_codes: List of NAICS codes to filter by
            set_aside: Set-aside type (e.g., "SBA", "8AN", "WOSB")
            posted_from: Start date for posted opportunities
            posted_to: End date for posted opportunities
            active: Whether to only return active opportunities
            limit: Maximum number of results (max 100)
            offset: Pagination offset

        Returns:
            Dict with 'opportunities' list and 'total_count'
        """
        all_opportunities = []
        total_count = 0
        api_calls = 0

        # SAM.gov API doesn't support multiple NAICS codes in one request
        # Make separate requests for each NAICS code
        codes_to_search = naics_codes[:10] if naics_codes else [None]

        for naics_code in codes_to_search:
            params = {
                "api_key": self.api_key,
                "limit": min(limit, 100),
                "offset": offset,
                "postedFrom": (posted_from or (datetime.utcnow() - timedelta(days=30))).strftime("%m/%d/%Y"),
                "postedTo": (posted_to or datetime.utcnow()).strftime("%m/%d/%Y"),
            }

            # Add single NAICS filter
            if naics_code:
                params["ncode"] = naics_code

            # Add set-aside filter
            if set_aside:
                params["typeOfSetAside"] = set_aside

            # Note: active=true filter often returns 0 results, so we skip it
            # and filter by response_deadline instead

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    logger.info(f"Fetching opportunities for NAICS {naics_code} from SAM.gov...")
                    response = await client.get(self.BASE_URL, params=params)
                    api_calls += 1
                    response.raise_for_status()
                    data = response.json()

                    opportunities = data.get("opportunitiesData", [])
                    count = data.get("totalRecords", 0)

                    logger.info(f"Fetched {len(opportunities)} opportunities for NAICS {naics_code} (total: {count})")

                    all_opportunities.extend(opportunities)
                    total_count += count

            except httpx.HTTPStatusError as e:
                logger.error(f"SAM.gov API HTTP error for NAICS {naics_code}: {e.response.status_code} - {e.response.text}")
                api_calls += 1
                continue
            except httpx.RequestError as e:
                logger.error(f"SAM.gov API request error for NAICS {naics_code}: {str(e)}")
                continue
            except Exception as e:
                logger.error(f"Unexpected error fetching NAICS {naics_code} from SAM.gov: {str(e)}")
                continue

        # Deduplicate by notice_id
        seen = set()
        unique_opportunities = []
        for opp in all_opportunities:
            notice_id = opp.get("noticeId")
            if notice_id and notice_id not in seen:
                seen.add(notice_id)
                unique_opportunities.append(opp)

        logger.info(f"Total unique opportunities fetched: {len(unique_opportunities)}")

        return {
            "opportunities": unique_opportunities,
            "total_count": len(unique_opportunities),
            "offset": offset,
            "limit": limit,
            "api_calls": api_calls
        }

    async def search_opportunities_batch(
        self,
        naics_codes: List[str],
        posted_from: Optional[datetime] = None,
        posted_to: Optional[datetime] = None,
        limit: int = 1000
    ) -> Dict:
        """
        Fetch opportunities for multiple NAICS codes efficiently.

        This is the optimized method for discovery runs - makes one call
        per NAICS code but handles pagination and deduplication.

        Args:
            naics_codes: List of NAICS codes to search
            posted_from: Only fetch opportunities posted after this date
            posted_to: Only fetch opportunities posted before this date (default: now)
            limit: Maximum total opportunities to fetch

        Returns:
            Dict with opportunities list, total count, and API call count
        """
        all_opportunities = []
        api_calls = 0
        errors = []

        # Default date range
        if not posted_from:
            posted_from = datetime.now(timezone.utc) - timedelta(days=30)
        if not posted_to:
            posted_to = datetime.now(timezone.utc)

        # Make datetimes timezone-naive for strftime
        if posted_from.tzinfo:
            posted_from = posted_from.replace(tzinfo=None)
        if posted_to.tzinfo:
            posted_to = posted_to.replace(tzinfo=None)

        logger.info(
            f"Batch search: {len(naics_codes)} NAICS codes, "
            f"date range {posted_from.strftime('%Y-%m-%d')} to {posted_to.strftime('%Y-%m-%d')}"
        )

        for naics_code in naics_codes:
            if len(all_opportunities) >= limit:
                logger.info(f"Reached limit of {limit} opportunities")
                break

            params = {
                "api_key": self.api_key,
                "limit": min(100, limit - len(all_opportunities)),
                "offset": 0,
                "postedFrom": posted_from.strftime("%m/%d/%Y"),
                "postedTo": posted_to.strftime("%m/%d/%Y"),
                "ncode": naics_code
            }

            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    logger.info(f"Fetching NAICS {naics_code}...")
                    response = await client.get(self.BASE_URL, params=params)
                    api_calls += 1
                    response.raise_for_status()
                    data = response.json()

                    opportunities = data.get("opportunitiesData", [])
                    logger.info(f"NAICS {naics_code}: {len(opportunities)} opportunities")
                    all_opportunities.extend(opportunities)

            except httpx.HTTPStatusError as e:
                api_calls += 1
                error_msg = f"NAICS {naics_code}: HTTP {e.response.status_code}"
                logger.error(f"SAM.gov API error: {error_msg}")
                errors.append(error_msg)

                # Check if rate limited
                if e.response.status_code == 429:
                    logger.warning("Rate limited - stopping batch search")
                    break

            except Exception as e:
                error_msg = f"NAICS {naics_code}: {str(e)}"
                logger.error(f"Error: {error_msg}")
                errors.append(error_msg)

        # Deduplicate
        seen = set()
        unique = []
        for opp in all_opportunities:
            notice_id = opp.get("noticeId")
            if notice_id and notice_id not in seen:
                seen.add(notice_id)
                unique.append(opp)

        logger.info(f"Batch complete: {len(unique)} unique opportunities from {api_calls} API calls")

        return {
            "opportunities": unique,
            "total_count": len(unique),
            "api_calls": api_calls,
            "errors": errors if errors else None
        }

    def parse_opportunity(self, raw_data: Dict) -> Dict:
        """
        Parse SAM.gov opportunity data into our internal format

        Args:
            raw_data: Raw opportunity data from SAM.gov API

        Returns:
            Dict with parsed opportunity data
        """
        try:
            # Extract basic information
            notice_id = raw_data.get("noticeId", "")
            title = raw_data.get("title", "")
            description = raw_data.get("description", "") or raw_data.get("additionalInfoText", "")

            # Department and office information
            department = raw_data.get("department", "")
            sub_tier = raw_data.get("subTier", "")
            office = raw_data.get("office", "")

            # Classification
            naics_code = raw_data.get("naicsCode", "")
            naics_description = raw_data.get("classificationCode", "")
            psc_code = raw_data.get("productServiceCode", "")
            set_aside = raw_data.get("typeOfSetAside", "")

            # Financial information
            award_amount = None
            if "award" in raw_data and raw_data["award"].get("amount"):
                try:
                    award_amount = float(raw_data["award"]["amount"])
                except (ValueError, TypeError):
                    pass

            # Dates
            posted_date = self._parse_date(raw_data.get("postedDate"))
            response_deadline = self._parse_date(raw_data.get("responseDeadLine"))
            archive_date = self._parse_date(raw_data.get("archiveDate"))

            # Location
            pop = raw_data.get("placeOfPerformance", {})
            pop_city = pop.get("city", {}).get("name", "") if isinstance(pop.get("city"), dict) else pop.get("city", "")
            pop_state = pop.get("state", {}).get("code", "") if isinstance(pop.get("state"), dict) else pop.get("state", "")
            pop_zip = pop.get("zip", "")
            pop_country = pop.get("country", {}).get("code", "") if isinstance(pop.get("country"), dict) else "USA"

            # Contact information
            contact = raw_data.get("pointOfContact", [{}])[0] if raw_data.get("pointOfContact") else {}
            primary_contact_name = contact.get("fullName", "")
            primary_contact_email = contact.get("email", "")
            primary_contact_phone = contact.get("phone", "")

            # Links
            link = raw_data.get("uiLink", "")

            # Extract attachment links
            attachment_links = []
            for attachment in raw_data.get("attachments", []):
                if attachment.get("link"):
                    attachment_links.append({
                        "name": attachment.get("name", ""),
                        "url": attachment.get("link", "")
                    })

            # Type and other fields
            opportunity_type = raw_data.get("type", "")
            solicitation_number = raw_data.get("solicitationNumber", "")
            award_number = raw_data.get("award", {}).get("number", "")

            return {
                "notice_id": notice_id,
                "solicitation_number": solicitation_number,
                "title": title,
                "description": description,
                "department": department,
                "sub_tier": sub_tier,
                "office": office,
                "naics_code": naics_code,
                "naics_description": naics_description,
                "psc_code": psc_code,
                "set_aside": set_aside,
                "contract_value": award_amount,
                "posted_date": posted_date,
                "response_deadline": response_deadline,
                "archive_date": archive_date,
                "place_of_performance_city": pop_city,
                "place_of_performance_state": pop_state,
                "place_of_performance_zip": pop_zip,
                "place_of_performance_country": pop_country,
                "primary_contact_name": primary_contact_name,
                "primary_contact_email": primary_contact_email,
                "primary_contact_phone": primary_contact_phone,
                "link": link,
                "attachment_links": attachment_links,
                "type": opportunity_type,
                "award_number": award_number,
                "award_amount": award_amount,
                "raw_data": raw_data,
                "is_active": True,
                "last_synced_at": datetime.utcnow()
            }

        except Exception as e:
            logger.error(f"Error parsing opportunity {raw_data.get('noticeId', 'unknown')}: {str(e)}")
            # Return minimal data so we don't lose the opportunity
            return {
                "notice_id": raw_data.get("noticeId", ""),
                "title": raw_data.get("title", "Unknown"),
                "raw_data": raw_data,
                "is_active": True,
                "last_synced_at": datetime.utcnow()
            }

    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse SAM.gov date string to datetime"""
        if not date_str:
            return None

        # SAM.gov typically uses format: "YYYY-MM-DDTHH:MM:SS-05:00" or "MM/DD/YYYY"
        try:
            # Try ISO format first
            if "T" in date_str:
                return datetime.fromisoformat(date_str.replace("Z", "+00:00").split(".")[0])
            # Try MM/DD/YYYY format
            elif "/" in date_str:
                return datetime.strptime(date_str, "%m/%d/%Y")
            # Try YYYY-MM-DD format
            elif "-" in date_str and len(date_str) == 10:
                return datetime.strptime(date_str, "%Y-%m-%d")
        except Exception as e:
            logger.warning(f"Could not parse date '{date_str}': {str(e)}")

        return None

    def map_set_aside_to_sam(self, set_aside: str) -> Optional[str]:
        """
        Map our internal set-aside names to SAM.gov API codes

        Args:
            set_aside: Our internal set-aside name (e.g., "8(a)")

        Returns:
            SAM.gov set-aside code (e.g., "8AN")
        """
        mapping = {
            "8(a)": "8AN",
            "WOSB": "WOSB",
            "EDWOSB": "EDWOSB",
            "SDVOSB": "SDVOSB",
            "VOSB": "VOSB",
            "HUBZone": "HUBZ",
            "Small Business": "SBA"
        }
        return mapping.get(set_aside)


# Singleton instance
sam_gov_service = SAMGovService()
