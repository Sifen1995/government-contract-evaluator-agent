"""
SAM.gov API integration service for discovering government contract opportunities
"""
from typing import List, Dict, Optional
import httpx
from datetime import datetime, timedelta
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class SAMGovService:
    """Service for interacting with SAM.gov API"""

    BASE_URL = "https://api.sam.gov/opportunities/v2/search"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.SAM_API_KEY
        if not self.api_key:
            logger.warning("SAM.gov API key not configured. Using public access (limited rate).")

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
        params = {
            "api_key": self.api_key,
            "limit": min(limit, 100),
            "offset": offset,
            "postedFrom": (posted_from or (datetime.utcnow() - timedelta(days=7))).strftime("%m/%d/%Y"),
            "postedTo": (posted_to or datetime.utcnow()).strftime("%m/%d/%Y"),
        }

        # Add NAICS filter
        if naics_codes:
            params["ncode"] = ",".join(naics_codes[:10])  # Max 10 NAICS codes

        # Add set-aside filter
        if set_aside:
            params["typeOfSetAside"] = set_aside

        # Active opportunities only
        if active:
            params["active"] = "true"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

                opportunities = data.get("opportunitiesData", [])
                total_count = data.get("totalRecords", 0)

                logger.info(f"Fetched {len(opportunities)} opportunities from SAM.gov (total: {total_count})")

                return {
                    "opportunities": opportunities,
                    "total_count": total_count,
                    "offset": offset,
                    "limit": limit
                }

        except httpx.HTTPStatusError as e:
            logger.error(f"SAM.gov API HTTP error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"SAM.gov API error: {e.response.status_code}")
        except httpx.RequestError as e:
            logger.error(f"SAM.gov API request error: {str(e)}")
            raise Exception(f"SAM.gov API request failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error fetching from SAM.gov: {str(e)}")
            raise

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
