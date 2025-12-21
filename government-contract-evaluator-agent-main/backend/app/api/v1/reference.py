from fastapi import APIRouter, Query
from typing import List, Dict, Any
from app.data.naics_codes import NAICS_CODES, NAICS_CATEGORIES, search_naics
from app.data.reference_data import (
    SET_ASIDE_TYPES,
    LEGAL_STRUCTURES,
    CONTRACT_VALUE_RANGES,
    US_STATES
)

router = APIRouter()


@router.get("/naics", response_model=List[Dict[str, str]])
def get_naics_codes(
    search: str = Query(None, description="Search query for NAICS codes"),
    category: str = Query(None, description="Filter by category")
):
    """
    Get NAICS codes.

    - Returns all NAICS codes
    - Optionally filter by search query
    - Optionally filter by category
    """
    if search:
        return search_naics(search)

    if category and category in NAICS_CATEGORIES:
        codes = NAICS_CATEGORIES[category]
        return [naics for naics in NAICS_CODES if naics["code"] in codes]

    return NAICS_CODES


@router.get("/naics/categories", response_model=Dict[str, List[str]])
def get_naics_categories():
    """
    Get NAICS code categories.

    - Returns grouped NAICS codes by category
    """
    return NAICS_CATEGORIES


@router.get("/set-asides", response_model=List[Dict[str, str]])
def get_set_aside_types():
    """
    Get available set-aside types.

    - Returns all set-aside certifications
    """
    return SET_ASIDE_TYPES


@router.get("/legal-structures", response_model=List[str])
def get_legal_structures():
    """
    Get available legal structures.

    - Returns list of legal structure options
    """
    return LEGAL_STRUCTURES


@router.get("/contract-ranges", response_model=List[Dict[str, Any]])
def get_contract_value_ranges():
    """
    Get contract value ranges.

    - Returns predefined contract value ranges
    """
    return CONTRACT_VALUE_RANGES


@router.get("/states", response_model=List[Dict[str, str]])
def get_us_states():
    """
    Get US states and territories.

    - Returns all US states and territories
    """
    return US_STATES


@router.get("/all")
def get_all_reference_data():
    """
    Get all reference data in one call.

    - Returns object with all reference data
    - Useful for frontend initialization
    """
    return {
        "naics_codes": NAICS_CODES,
        "naics_categories": NAICS_CATEGORIES,
        "set_asides": SET_ASIDE_TYPES,
        "legal_structures": LEGAL_STRUCTURES,
        "contract_ranges": CONTRACT_VALUE_RANGES,
        "states": US_STATES,
    }
