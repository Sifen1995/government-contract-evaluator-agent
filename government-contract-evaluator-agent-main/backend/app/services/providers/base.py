# backend/app/services/providers/base.py

from abc import ABC, abstractmethod
from typing import List, Dict


class OpportunityProvider(ABC):

    source_name: str

    @abstractmethod
    async def fetch(self) -> List[Dict]:
        """Fetch raw data from external source"""
        pass

    @abstractmethod
    def normalize(self, raw: Dict) -> Dict:
        """Convert raw data into Opportunity-compatible dict"""
        pass
