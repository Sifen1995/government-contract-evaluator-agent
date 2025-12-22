# backend/app/services/providers/dc_independent_provider.py
"""
DC Independent Agencies Procurement Portal integration.
Source: https://contracts.ocp.dc.gov/agencies

This provider fetches opportunities from independent DC government agencies
that publish through the OCP portal but are listed separately.

Note: Like DC OCP, this requires Playwright for full functionality.
"""

import logging
from typing import List, Dict, Optional
from datetime import datetime

from app.services.providers.dc_ocp_provider import DCOCPProvider, PLAYWRIGHT_AVAILABLE

logger = logging.getLogger(__name__)

# Try to import Playwright
try:
    from playwright.async_api import async_playwright
except ImportError:
    pass


class DCIndependentProvider:
    """
    Provider for DC Independent Agencies procurement opportunities.

    Independent agencies include entities like:
    - DC Housing Authority
    - DC Water
    - Washington Metropolitan Area Transit Authority (WMATA)
    - DC Lottery
    - And others

    These agencies post opportunities through the OCP portal but are
    managed separately.
    """

    source_name = "dc_independent"

    BASE_URL = "https://contracts.ocp.dc.gov"
    AGENCIES_URL = "https://contracts.ocp.dc.gov/agencies"

    # Known independent agencies
    KNOWN_AGENCIES = [
        "DC Housing Authority",
        "DC Water and Sewer Authority",
        "Washington Metropolitan Area Transit Authority",
        "DC Lottery and Gaming",
        "University of the District of Columbia",
        "DC Housing Finance Agency",
        "DC Retirement Board",
        "DC Public Charter School Board",
    ]

    @classmethod
    async def fetch_agencies(cls) -> List[Dict]:
        """
        Fetch list of independent DC agencies.

        Returns:
            List of agency records
        """
        return await DCOCPProvider.fetch_agencies()

    @classmethod
    async def fetch_solicitations_by_agency(
        cls,
        agency: str,
        limit: int = 50
    ) -> List[Dict]:
        """
        Fetch solicitations for a specific independent agency.

        Args:
            agency: Agency name or ID
            limit: Maximum results

        Returns:
            List of solicitation records for the agency
        """
        if not PLAYWRIGHT_AVAILABLE:
            logger.warning(
                "Playwright not available for DC Independent Agencies. "
                "Install with: pip install playwright && playwright install chromium"
            )
            return [{
                "source": cls.source_name,
                "agency": agency,
                "title": f"[{agency} - Browser Access Required]",
                "source_url": cls.AGENCIES_URL,
                "access_note": "Playwright required for automated access",
            }]

        solicitations = []

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()

                # Navigate to agencies page
                await page.goto(cls.AGENCIES_URL, wait_until="networkidle", timeout=60000)

                # Find and click on the specific agency
                agency_link = await page.query_selector(f"a:has-text('{agency}')")

                if agency_link:
                    await agency_link.click()
                    await page.wait_for_load_state("networkidle")

                    # Wait for solicitations to load
                    try:
                        await page.wait_for_selector("table", timeout=10000)

                        rows = await page.query_selector_all("table tbody tr")

                        for row in rows[:limit]:
                            try:
                                cells = await row.query_selector_all("td")

                                if len(cells) >= 2:
                                    solicitation = {
                                        "source": cls.source_name,
                                        "agency": agency,
                                        "issuing_agency": agency,
                                        "title": await cells[0].inner_text(),
                                        "due_date": await cells[-1].inner_text() if cells else None,
                                    }

                                    link = await cells[0].query_selector("a")
                                    if link:
                                        href = await link.get_attribute("href")
                                        solicitation["source_url"] = f"{cls.BASE_URL}{href}" if href and href.startswith("/") else href
                                        solicitation["source_id"] = f"{agency}-{href.split('/')[-1]}" if href else None

                                    solicitations.append(solicitation)

                            except Exception as e:
                                logger.warning(f"Error parsing row for {agency}: {e}")

                    except Exception as e:
                        logger.info(f"No table found for {agency}: {e}")

                await browser.close()

        except Exception as e:
            logger.error(f"Error fetching {agency} solicitations: {e}")

        return solicitations or [{
            "source": cls.source_name,
            "agency": agency,
            "title": f"[{agency} - No Active Solicitations or Access Issue]",
            "source_url": cls.AGENCIES_URL,
        }]

    @classmethod
    async def fetch_all_solicitations(cls, limit_per_agency: int = 20) -> List[Dict]:
        """
        Fetch solicitations from all independent agencies.

        Args:
            limit_per_agency: Maximum results per agency

        Returns:
            Combined list of solicitations from all agencies
        """
        all_solicitations = []

        # Get list of agencies
        agencies = await cls.fetch_agencies()

        if not agencies or (len(agencies) == 1 and agencies[0].get("note")):
            # Playwright not available, use known agencies as placeholders
            for agency_name in cls.KNOWN_AGENCIES:
                all_solicitations.append({
                    "source": cls.source_name,
                    "agency": agency_name,
                    "issuing_agency": agency_name,
                    "title": f"[{agency_name} - Visit Portal]",
                    "source_url": cls.AGENCIES_URL,
                    "access_note": "Playwright required for automated access",
                })
            return all_solicitations

        # Fetch from each agency
        for agency_info in agencies:
            agency_name = agency_info.get("agency")
            if agency_name:
                solicitations = await cls.fetch_solicitations_by_agency(
                    agency_name,
                    limit=limit_per_agency
                )
                all_solicitations.extend(solicitations)

        logger.info(f"Fetched {len(all_solicitations)} total solicitations from DC Independent Agencies")
        return all_solicitations

    @classmethod
    def normalize(cls, raw: Dict) -> Dict:
        """
        Normalize DC Independent data into Opportunity model format.

        Args:
            raw: Raw data

        Returns:
            Normalized opportunity dict
        """
        due_date = None
        if raw.get("due_date"):
            try:
                due_date = datetime.strptime(raw["due_date"], "%m/%d/%Y")
            except:
                pass

        return {
            "source": cls.source_name,
            "source_id": raw.get("source_id", f"dc-ind-{hash(raw.get('title', '')) % 100000}"),
            "title": raw.get("title"),
            "agency": raw.get("agency"),
            "issuing_agency": raw.get("issuing_agency") or raw.get("agency"),
            "response_deadline": due_date,
            "source_url": raw.get("source_url", cls.AGENCIES_URL),
            "notice_type": "Solicitation",
            "raw_data": raw,
        }


# Convenience functions
async def fetch_solicitations(**kwargs) -> List[Dict]:
    """Fetch DC Independent Agencies solicitations."""
    return await DCIndependentProvider.fetch_all_solicitations(**kwargs)


async def fetch_agencies() -> List[Dict]:
    """Fetch list of DC Independent Agencies."""
    return await DCIndependentProvider.fetch_agencies()
