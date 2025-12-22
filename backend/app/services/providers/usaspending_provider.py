# backend/app/services/providers/usaspending_provider.py

import httpx
from typing import List, Dict
from datetime import datetime
from app.services.providers.base import OpportunityProvider


class USASpendingProvider(OpportunityProvider):
    source_name = "usaspending"

    BASE_URL = "https://api.usaspending.gov/api/v2/search/spending_by_award/"

    async def fetch(self) -> List[Dict]:
        payload = {
            "filters": {
                "award_type_codes": ["A", "B", "C", "D"]
            },
            "limit": 100,
            "page": 1
        }

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self.BASE_URL, json=payload)
            resp.raise_for_status()
            return resp.json().get("results", [])

    def normalize(self, raw: Dict) -> Dict:
        return {
            "source_id": raw.get("award_id"),
            "awarding_agency": raw.get("awarding_agency_name"),
            "funding_agency": raw.get("funding_agency_name"),
            "vendor": raw.get("recipient_name"),
            "vendor_uei": raw.get("recipient_unique_id"),
            "naics": raw.get("naics_code"),
            "amount": raw.get("total_obligation"),
            "award_type": raw.get("award_type"),
            "award_date": self._parse_date(raw.get("period_of_performance_start_date")),
            "raw_data": raw,
        }

    def _parse_date(self, date_str):
        return datetime.fromisoformat(date_str) if date_str else None
