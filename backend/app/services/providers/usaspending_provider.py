# backend/app/services/providers/usaspending_provider.py
"""
USA Spending API integration for prime awards and subawards.
Source: https://www.usaspending.gov/
API Docs: https://api.usaspending.gov/
"""

import httpx
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class USASpendingProvider:
    """Provider for USA Spending prime awards and subawards."""

    source_name = "usaspending"

    # API endpoints
    PRIME_AWARDS_URL = "https://api.usaspending.gov/api/v2/search/spending_by_award/"
    SUBAWARDS_URL = "https://api.usaspending.gov/api/v2/subawards/"
    AWARD_DETAILS_URL = "https://api.usaspending.gov/api/v2/awards/"

    # Award type codes
    CONTRACT_CODES = ["A", "B", "C", "D"]  # Contracts
    GRANT_CODES = ["02", "03", "04", "05"]  # Grants

    @classmethod
    async def fetch_prime_awards(
        cls,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        naics_codes: Optional[List[str]] = None,
        agencies: Optional[List[str]] = None,
        limit: int = 100,
        page: int = 1
    ) -> List[Dict]:
        """
        Fetch prime contract awards from USA Spending.

        Args:
            start_date: Start of date range (default: 90 days ago)
            end_date: End of date range (default: today)
            naics_codes: Filter by NAICS codes
            agencies: Filter by agency names
            limit: Results per page (max 100)
            page: Page number

        Returns:
            List of raw award records
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=90)
        if not end_date:
            end_date = datetime.utcnow()

        filters = {
            "time_period": [{
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d")
            }],
            "award_type_codes": cls.CONTRACT_CODES
        }

        if naics_codes:
            filters["naics_codes"] = naics_codes

        if agencies:
            filters["agencies"] = [{"type": "awarding", "name": a} for a in agencies]

        payload = {
            "filters": filters,
            "fields": [
                "Award ID",
                "Recipient Name",
                "Recipient UEI",
                "Award Amount",
                "Total Outlays",
                "Awarding Agency",
                "Awarding Sub Agency",
                "Funding Agency",
                "Start Date",
                "End Date",
                "NAICS Code",
                "PSC Code",
                "Award Type",
                "Description",
                "Place of Performance City",
                "Place of Performance State",
            ],
            "limit": min(limit, 100),
            "page": page,
            "sort": "Award Amount",
            "order": "desc"
        }

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                logger.info(f"Fetching USA Spending awards (page {page})...")
                resp = await client.post(cls.PRIME_AWARDS_URL, json=payload)
                resp.raise_for_status()
                data = resp.json()

                results = data.get("results", [])
                logger.info(f"Fetched {len(results)} prime awards")
                return results

        except httpx.HTTPStatusError as e:
            logger.error(f"USA Spending API error: {e.response.status_code} - {e.response.text[:200]}")
            raise
        except Exception as e:
            logger.error(f"Error fetching USA Spending awards: {e}")
            raise

    @classmethod
    async def fetch_subawards(
        cls,
        prime_award_id: str,
        limit: int = 100,
        page: int = 1
    ) -> List[Dict]:
        """
        Fetch subawards for a prime award.

        Args:
            prime_award_id: The prime award's generated_internal_id
            limit: Results per page
            page: Page number

        Returns:
            List of subaward records
        """
        payload = {
            "award_id": prime_award_id,
            "limit": limit,
            "page": page
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(cls.SUBAWARDS_URL, json=payload)
                resp.raise_for_status()
                data = resp.json()
                return data.get("results", [])

        except Exception as e:
            logger.error(f"Error fetching subawards for {prime_award_id}: {e}")
            return []

    @classmethod
    async def fetch_all_pages(
        cls,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        naics_codes: Optional[List[str]] = None,
        max_results: int = 1000
    ) -> List[Dict]:
        """
        Fetch multiple pages of awards.

        Args:
            start_date: Start of date range
            end_date: End of date range
            naics_codes: Filter by NAICS codes
            max_results: Maximum total results to fetch

        Returns:
            List of all fetched award records
        """
        all_results = []
        page = 1
        limit = 100

        while len(all_results) < max_results:
            results = await cls.fetch_prime_awards(
                start_date=start_date,
                end_date=end_date,
                naics_codes=naics_codes,
                limit=limit,
                page=page
            )

            if not results:
                break

            all_results.extend(results)

            if len(results) < limit:
                break

            page += 1

        return all_results[:max_results]

    @classmethod
    def parse_award(cls, raw: Dict) -> Dict:
        """
        Parse raw USA Spending data into our Award model format.

        Args:
            raw: Raw award data from API

        Returns:
            Normalized award dict
        """
        return {
            "source": cls.source_name,
            "source_id": raw.get("Award ID") or raw.get("generated_internal_id"),
            "awarding_agency": raw.get("Awarding Agency") or raw.get("awarding_agency"),
            "funding_agency": raw.get("Funding Agency") or raw.get("funding_agency"),
            "vendor": raw.get("Recipient Name") or raw.get("recipient_name"),
            "vendor_uei": raw.get("Recipient UEI") or raw.get("recipient_uei"),
            "vendor_duns": raw.get("Recipient DUNS"),
            "naics": raw.get("NAICS Code") or raw.get("naics_code"),
            "psc_code": raw.get("PSC Code") or raw.get("psc_code"),
            "amount": cls._parse_amount(raw.get("Award Amount") or raw.get("total_obligation")),
            "base_amount": cls._parse_amount(raw.get("Base and Exercised Options Value")),
            "potential_amount": cls._parse_amount(raw.get("Base and All Options Value")),
            "award_type": raw.get("Award Type") or raw.get("award_type"),
            "award_date": cls._parse_date(raw.get("Start Date") or raw.get("period_of_performance_start_date")),
            "start_date": cls._parse_date(raw.get("Start Date")),
            "end_date": cls._parse_date(raw.get("End Date")),
            "description": raw.get("Description"),
            "pop_city": raw.get("Place of Performance City"),
            "pop_state": raw.get("Place of Performance State"),
            "raw_data": raw,
        }

    @classmethod
    def _parse_date(cls, date_str) -> Optional[datetime]:
        """Parse date string to datetime."""
        if not date_str:
            return None
        try:
            if isinstance(date_str, datetime):
                return date_str
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except:
            try:
                return datetime.strptime(date_str, "%Y-%m-%d")
            except:
                return None

    @classmethod
    def _parse_amount(cls, value) -> Optional[Decimal]:
        """Parse amount to Decimal."""
        if value is None:
            return None
        try:
            return Decimal(str(value))
        except:
            return None


# Convenience function for discovery scripts
async def fetch_awards(start_date: Optional[datetime] = None, **kwargs) -> List[Dict]:
    """Fetch awards from USA Spending."""
    return await USASpendingProvider.fetch_all_pages(start_date=start_date, **kwargs)
