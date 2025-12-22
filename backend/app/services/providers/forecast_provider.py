# backend/app/services/providers/forecast_provider.py
"""
Federal Procurement Forecasts integration.
Source: https://www.acquisition.gov/procurement-forecasts

Note: Federal procurement forecasts are published by individual agencies on their
own websites. This provider aggregates the list of agency forecast sources and
attempts to parse structured data where available.
"""

import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from datetime import datetime
import logging
import re

logger = logging.getLogger(__name__)


class ProcurementForecastProvider:
    """
    Provider for federal agency procurement forecasts.

    The acquisition.gov page links to individual agency forecast pages.
    Each agency publishes their own forecasts in different formats.
    """

    source_name = "procurement_forecast"

    # Main acquisition.gov forecasts page
    FORECASTS_INDEX_URL = "https://www.acquisition.gov/procurement-forecasts"

    # Known agency forecast URLs with structured data potential
    AGENCY_FORECAST_URLS = {
        "USAID": "https://www.usaid.gov/business-forecast",
        "Commerce": "https://www.commerce.gov/oam/vendors/procurement-forecasts",
        "Energy": "https://www.energy.gov/osdbu/acquisition-forecast",
        "State": "https://www.state.gov/Procurement-Forecast",
        "Treasury": "https://sbecs.treas.gov/Forecast",
        "GSA": "https://www.gsa.gov/small-business/forecast-of-contracting-opportunities",
        "NASA": "https://www.hq.nasa.gov/office/procurement/forecast/",
    }

    @classmethod
    async def fetch_agency_list(cls) -> List[Dict]:
        """
        Fetch the list of agency forecast links from acquisition.gov.

        Returns:
            List of dicts with agency name and forecast URL
        """
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                resp = await client.get(cls.FORECASTS_INDEX_URL)
                resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")

            # Find the main table with agency links
            agencies = []
            table = soup.find("table")

            if table:
                rows = table.find_all("tr")
                for row in rows[1:]:  # Skip header
                    cells = row.find_all("td")
                    if len(cells) >= 2:
                        agency_cell = cells[0]
                        forecast_cell = cells[1]

                        agency_name = agency_cell.get_text(strip=True)
                        forecast_link = forecast_cell.find("a")

                        if forecast_link and forecast_link.get("href"):
                            agencies.append({
                                "agency": agency_name,
                                "forecast_url": forecast_link.get("href"),
                                "source": cls.source_name
                            })

            logger.info(f"Found {len(agencies)} agency forecast links")
            return agencies

        except Exception as e:
            logger.error(f"Error fetching agency forecast list: {e}")
            return []

    @classmethod
    async def fetch_forecasts_from_agency(cls, agency: str, url: str) -> List[Dict]:
        """
        Attempt to fetch forecasts from an individual agency page.

        Note: Each agency has a different page structure. This method attempts
        to parse common patterns but may not work for all agencies.

        Args:
            agency: Agency name
            url: Agency forecast page URL

        Returns:
            List of parsed forecast opportunities
        """
        forecasts = []

        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                resp = await client.get(url)

                # Some agencies block scraping
                if resp.status_code == 403:
                    logger.warning(f"{agency} blocks automated access: {resp.status_code}")
                    return [{
                        "source": cls.source_name,
                        "agency": agency,
                        "title": f"[{agency} Forecast - Manual Access Required]",
                        "source_url": url,
                        "is_forecast": True,
                        "access_note": "This agency requires manual browser access",
                    }]

                resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "html.parser")

            # Try to find tables with forecast data
            tables = soup.find_all("table")

            for table in tables:
                rows = table.find_all("tr")
                if len(rows) > 1:
                    # Get headers
                    header_row = rows[0]
                    headers = [th.get_text(strip=True).lower() for th in header_row.find_all(["th", "td"])]

                    # Parse data rows
                    for row in rows[1:]:
                        cells = row.find_all("td")
                        if len(cells) >= 2:
                            row_data = {headers[i] if i < len(headers) else f"col_{i}": cells[i].get_text(strip=True)
                                       for i in range(len(cells))}

                            forecast = cls._parse_forecast_row(agency, url, row_data, headers)
                            if forecast:
                                forecasts.append(forecast)

            logger.info(f"Parsed {len(forecasts)} forecasts from {agency}")

        except httpx.RequestError as e:
            logger.error(f"Error fetching {agency} forecasts: {e}")
        except Exception as e:
            logger.error(f"Error parsing {agency} forecasts: {e}")

        # If no structured data found, return a placeholder
        if not forecasts:
            forecasts.append({
                "source": cls.source_name,
                "agency": agency,
                "title": f"[{agency} Forecast - Visit Site for Details]",
                "source_url": url,
                "is_forecast": True,
                "access_note": "Forecast data available on agency website",
            })

        return forecasts

    @classmethod
    def _parse_forecast_row(cls, agency: str, source_url: str, row_data: Dict, headers: List[str]) -> Optional[Dict]:
        """
        Parse a table row into a forecast record.

        Args:
            agency: Agency name
            source_url: Source URL
            row_data: Dict of column values
            headers: Column headers

        Returns:
            Parsed forecast dict or None
        """
        # Look for common field names
        title = None
        naics = None
        value = None
        estimated_date = None
        description = None

        for key, val in row_data.items():
            key_lower = key.lower()
            if any(x in key_lower for x in ["title", "description", "requirement", "name"]):
                title = val if len(val) > len(title or "") else title
            elif any(x in key_lower for x in ["naics", "code"]):
                naics = val[:6] if val else None
            elif any(x in key_lower for x in ["value", "amount", "estimate", "dollar"]):
                value = val
            elif any(x in key_lower for x in ["date", "award", "quarter", "fy"]):
                estimated_date = val
            elif "description" in key_lower or "scope" in key_lower:
                description = val

        if not title:
            return None

        return {
            "source": cls.source_name,
            "source_id": f"{agency}-{hash(title) % 100000}",
            "title": title,
            "description": description,
            "agency": agency,
            "issuing_agency": agency,
            "naics_code": naics,
            "estimated_value_text": value,
            "estimated_award_date": estimated_date,
            "source_url": source_url,
            "is_forecast": True,
            "raw_data": row_data,
        }

    @classmethod
    async def fetch_all_forecasts(cls, agencies: Optional[List[str]] = None) -> List[Dict]:
        """
        Fetch forecasts from all (or specified) agencies.

        Args:
            agencies: List of agency names to fetch. If None, fetches from all known agencies.

        Returns:
            List of all parsed forecasts
        """
        all_forecasts = []

        # Get agency list
        agency_list = await cls.fetch_agency_list()

        # Filter if specific agencies requested
        if agencies:
            agency_list = [a for a in agency_list if a["agency"] in agencies]

        # Fetch from each agency
        for agency_info in agency_list:
            agency = agency_info["agency"]
            url = agency_info["forecast_url"]

            forecasts = await cls.fetch_forecasts_from_agency(agency, url)
            all_forecasts.extend(forecasts)

        logger.info(f"Total forecasts collected: {len(all_forecasts)}")
        return all_forecasts

    @classmethod
    def normalize(cls, raw: Dict) -> Dict:
        """
        Normalize raw forecast data into Opportunity model format.

        Args:
            raw: Raw forecast data

        Returns:
            Normalized opportunity dict
        """
        return {
            "source": cls.source_name,
            "source_id": raw.get("source_id", f"forecast-{hash(str(raw)) % 100000}"),
            "title": raw.get("title", "Unknown Forecast"),
            "description": raw.get("description"),
            "agency": raw.get("agency"),
            "issuing_agency": raw.get("issuing_agency"),
            "naics_code": raw.get("naics_code"),
            "estimated_value_text": raw.get("estimated_value_text"),
            "source_url": raw.get("source_url"),
            "is_forecast": True,
            "notice_type": "Forecast",
            "raw_data": raw,
        }


# Convenience function
async def fetch_forecasts(agencies: Optional[List[str]] = None) -> List[Dict]:
    """Fetch procurement forecasts."""
    return await ProcurementForecastProvider.fetch_all_forecasts(agencies=agencies)
