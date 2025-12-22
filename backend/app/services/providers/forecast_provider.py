# backend/app/services/providers/procurement_forecast_provider.py

import httpx
from bs4 import BeautifulSoup
from typing import List, Dict
from datetime import datetime
from app.services.providers.base import OpportunityProvider


class ProcurementForecastProvider(OpportunityProvider):
    source_name = "procurement_forecast"

    BASE_URL = "https://www.acquisition.gov/procurement-forecasts"

    async def fetch(self) -> List[Dict]:
        async with httpx.AsyncClient() as client:
            html = (await client.get(self.BASE_URL)).text

        soup = BeautifulSoup(html, "html.parser")
        rows = soup.select("table tbody tr")

        data = []
        for row in rows:
            cols = row.find_all("td")
            data.append({
                "agency": cols[0].text.strip(),
                "title": cols[1].text.strip(),
                "naics": cols[2].text.strip(),
                "value": cols[3].text.strip(),
            })
        return data

    def normalize(self, raw: Dict) -> Dict:
        return {
            "source": self.source_name,
            "source_id": f"{raw['agency']}-{raw['title']}",
            "title": raw["title"],
            "issuing_agency": raw["agency"],
            "naics_code": raw["naics"],
            "estimated_value_text": raw["value"],
            "is_forecast": True,
            "source_type": "forecast",
            "raw_data": raw,
        }
