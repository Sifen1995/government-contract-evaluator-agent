# backend/app/services/providers/dc_ocp_provider.py

import httpx
from typing import List, Dict
from app.services.providers.base import OpportunityProvider


class DCOCPProvider(OpportunityProvider):
    source_name = "dc_ocp"

    BASE_URL = "https://contracts.ocp.dc.gov/api/solicitations"

    async def fetch(self) -> List[Dict]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(self.BASE_URL)
            resp.raise_for_status()
            return resp.json()

    def normalize(self, raw: Dict) -> Dict:
        return {
            "source": self.source_name,
            "source_id": raw["id"],
            "title": raw["title"],
            "issuing_agency": raw["agency"],
            "response_deadline": raw.get("dueDate"),
            "source_url": raw.get("url"),
            "raw_data": raw,
        }
