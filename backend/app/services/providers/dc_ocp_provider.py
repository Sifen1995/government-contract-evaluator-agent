# backend/app/services/providers/dc_ocp_provider.py
"""
DC Office of Contracting and Procurement (OCP) integration.
Source: https://contracts.ocp.dc.gov/

This provider attempts to use the DC OCP REST API to fetch solicitations.
Note: The API is behind Cloudflare protection and may require Playwright fallback.

API Endpoints:
- GET /api/solicitations/agencies - List of agencies
- POST /api/solicitations/search - Search solicitations
- POST /api/contracts/search - Search contracts
"""

import httpx
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Try to import Playwright for fallback
try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


class DCOCPProvider:
    """
    Provider for DC Office of Contracting and Procurement solicitations.

    Uses the DC OCP REST API:
    - GET /api/solicitations/agencies - List of agencies
    - POST /api/solicitations/search - Search solicitations
    - GET /api/contracts/search - Search contracts
    """

    source_name = "dc_ocp"

    BASE_URL = "https://contracts.ocp.dc.gov"
    API_BASE = "https://contracts.ocp.dc.gov/api"

    # API endpoints
    AGENCIES_URL = f"{API_BASE}/solicitations/agencies"
    SEARCH_URL = f"{API_BASE}/solicitations/search"
    CONTRACTS_SEARCH_URL = f"{API_BASE}/contracts/search"

    @classmethod
    async def fetch_agencies(cls) -> List[Dict]:
        """
        Fetch list of DC agencies from the OCP API.

        Returns:
            List of agency cluster records
        """
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(cls.AGENCIES_URL)
                resp.raise_for_status()
                data = resp.json()

                # Flatten the nested structure
                agencies = []
                for cluster in data:
                    cluster_name = cluster.get("displayName", "")
                    for agency in cluster.get("agencies", []):
                        agencies.append({
                            "id": agency.get("id"),
                            "name": agency.get("displayName"),
                            "abbreviation": agency.get("abbreviation"),
                            "cluster": cluster_name,
                            "site_link": agency.get("siteLink"),
                            "status": agency.get("status"),
                        })

                logger.info(f"Fetched {len(agencies)} DC agencies")
                return agencies

        except Exception as e:
            logger.error(f"Error fetching DC agencies: {e}")
            return []

    @classmethod
    async def fetch_solicitations(
        cls,
        is_open: bool = True,
        agency_ids: Optional[List[str]] = None,
        keyword: Optional[str] = None,
        page_size: int = 100,
        page: int = 1
    ) -> List[Dict]:
        """
        Fetch solicitations from DC OCP.

        Args:
            is_open: Filter for open (active) solicitations
            agency_ids: Filter by agency IDs
            keyword: Search keyword
            page_size: Results per page
            page: Page number

        Returns:
            List of solicitation records
        """
        payload = {
            "isOpen": is_open,
            "pageSize": page_size,
            "pageNumber": page,
        }

        if agency_ids:
            payload["agencyIds"] = agency_ids

        if keyword:
            payload["searchText"] = keyword

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                logger.info(f"Fetching DC OCP solicitations (page {page})...")
                resp = await client.post(cls.SEARCH_URL, json=payload)
                resp.raise_for_status()
                data = resp.json()

                results = data.get("results", [])
                logger.info(f"Fetched {len(results)} DC OCP solicitations")

                return results

        except httpx.HTTPStatusError as e:
            logger.error(f"DC OCP API error: {e.response.status_code}")
            return []
        except Exception as e:
            logger.error(f"Error fetching DC OCP solicitations: {e}")
            return []

    @classmethod
    async def fetch_solicitations_playwright(cls, limit: int = 50) -> List[Dict]:
        """
        Fetch solicitations using Playwright (fallback for Cloudflare-protected API).

        Args:
            limit: Maximum results to fetch

        Returns:
            List of solicitation records
        """
        if not PLAYWRIGHT_AVAILABLE:
            logger.warning("Playwright not available for DC OCP fallback")
            return [{
                "source": cls.source_name,
                "title": "[DC OCP - Playwright Required]",
                "description": "Install Playwright: pip install playwright && playwright install chromium",
                "source_url": cls.BASE_URL,
            }]

        solicitations = []

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()

                # Intercept API responses
                api_results = []

                async def handle_response(response):
                    if "/api/solicitations/search" in response.url:
                        try:
                            data = await response.json()
                            if data.get("results"):
                                api_results.extend(data["results"])
                        except:
                            pass

                page.on("response", handle_response)

                # Navigate and trigger search
                await page.goto(f"{cls.BASE_URL}/solicitations/search", wait_until="networkidle", timeout=60000)
                await page.wait_for_timeout(3000)

                # Click on Open Solicitations to trigger API call
                open_btn = await page.query_selector('text=Open Solicitations')
                if open_btn:
                    await open_btn.click()
                    await page.wait_for_timeout(5000)

                await browser.close()

                solicitations = api_results[:limit]
                logger.info(f"Fetched {len(solicitations)} DC OCP solicitations via Playwright")

        except Exception as e:
            logger.error(f"Playwright fetch error: {e}")

        return solicitations

    @classmethod
    async def fetch_all_solicitations(
        cls,
        is_open: bool = True,
        max_results: int = 500
    ) -> List[Dict]:
        """
        Fetch all solicitations, trying REST API first then Playwright fallback.

        Args:
            is_open: Filter for open solicitations
            max_results: Maximum total results

        Returns:
            List of all fetched solicitations
        """
        # Try REST API first
        all_results = []
        page = 1
        page_size = 100

        while len(all_results) < max_results:
            results = await cls.fetch_solicitations(
                is_open=is_open,
                page_size=page_size,
                page=page
            )

            if not results:
                break

            all_results.extend(results)

            if len(results) < page_size:
                break

            page += 1

        # If API failed (Cloudflare), try Playwright fallback
        if not all_results and PLAYWRIGHT_AVAILABLE:
            logger.info("API returned no results, trying Playwright fallback...")
            all_results = await cls.fetch_solicitations_playwright(limit=max_results)

        return all_results[:max_results]

    @classmethod
    async def fetch_contracts(
        cls,
        keyword: Optional[str] = None,
        agency_ids: Optional[List[str]] = None,
        page_size: int = 100,
        page: int = 1
    ) -> List[Dict]:
        """
        Fetch contracts from DC OCP.

        Args:
            keyword: Search keyword
            agency_ids: Filter by agency IDs
            page_size: Results per page
            page: Page number

        Returns:
            List of contract records
        """
        payload = {
            "pageSize": page_size,
            "pageNumber": page,
        }

        if agency_ids:
            payload["agencyIds"] = agency_ids

        if keyword:
            payload["searchText"] = keyword

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(cls.CONTRACTS_SEARCH_URL, json=payload)
                resp.raise_for_status()
                data = resp.json()

                return data.get("results", [])

        except Exception as e:
            logger.error(f"Error fetching DC OCP contracts: {e}")
            return []

    @classmethod
    def normalize(cls, raw: Dict) -> Dict:
        """
        Normalize DC OCP solicitation data into Opportunity model format.

        Args:
            raw: Raw DC OCP API response

        Returns:
            Normalized opportunity dict
        """
        # Parse dates
        due_date = None
        posted_date = None

        if raw.get("closeDate"):
            try:
                due_date = datetime.fromisoformat(raw["closeDate"].replace("Z", "+00:00"))
            except:
                pass

        if raw.get("openDate"):
            try:
                posted_date = datetime.fromisoformat(raw["openDate"].replace("Z", "+00:00"))
            except:
                pass

        # Extract agency info
        agency = raw.get("agency", {})
        agency_name = agency.get("displayName") if isinstance(agency, dict) else str(agency)

        return {
            "source": cls.source_name,
            "source_id": raw.get("solicitationId") or raw.get("id"),
            "solicitation_number": raw.get("solicitationNumber"),
            "title": raw.get("title") or raw.get("description"),
            "description": raw.get("description"),
            "agency": agency_name,
            "issuing_agency": agency_name,
            "posted_date": posted_date,
            "response_deadline": due_date,
            "set_aside_type": raw.get("setAside"),
            "source_url": f"{cls.BASE_URL}/solicitations/detail/{raw.get('solicitationId') or raw.get('id')}",
            "status": "active" if raw.get("isOpen") else "closed",
            "notice_type": raw.get("solicitationType") or "Solicitation",
            "contact_email": raw.get("contractSpecialistEmail"),
            "contact_name": raw.get("contractSpecialist"),
            "raw_data": raw,
        }


# Convenience functions
async def fetch_solicitations(**kwargs) -> List[Dict]:
    """Fetch DC OCP solicitations."""
    return await DCOCPProvider.fetch_all_solicitations(**kwargs)


async def fetch_agencies() -> List[Dict]:
    """Fetch DC agencies."""
    return await DCOCPProvider.fetch_agencies()


async def fetch_contracts(**kwargs) -> List[Dict]:
    """Fetch DC OCP contracts."""
    return await DCOCPProvider.fetch_contracts(**kwargs)


# For backward compatibility
PLAYWRIGHT_AVAILABLE = True  # Not needed anymore, using REST API
