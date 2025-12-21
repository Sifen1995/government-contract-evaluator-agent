# backend/app/services/providers/dc_independent_provider.py
from app.services.providers.dc_ocp_provider import DCOCPProvider

class DCIndependentProvider(DCOCPProvider):
    source_name = "dc_independent"
