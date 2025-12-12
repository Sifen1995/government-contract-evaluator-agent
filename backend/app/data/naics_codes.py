"""
NAICS Codes commonly used in government contracting.
Source: North American Industry Classification System
"""

NAICS_CODES = [
    # Information Technology
    {"code": "541511", "title": "Custom Computer Programming Services"},
    {"code": "541512", "title": "Computer Systems Design Services"},
    {"code": "541513", "title": "Computer Facilities Management Services"},
    {"code": "541519", "title": "Other Computer Related Services"},
    {"code": "518210", "title": "Data Processing, Hosting, and Related Services"},
    {"code": "541690", "title": "Other Scientific and Technical Consulting Services"},

    # Professional Services
    {"code": "541611", "title": "Administrative Management and General Management Consulting Services"},
    {"code": "541612", "title": "Human Resources Consulting Services"},
    {"code": "541613", "title": "Marketing Consulting Services"},
    {"code": "541614", "title": "Process, Physical Distribution, and Logistics Consulting Services"},
    {"code": "541618", "title": "Other Management Consulting Services"},
    {"code": "541620", "title": "Environmental Consulting Services"},
    {"code": "541330", "title": "Engineering Services"},
    {"code": "541310", "title": "Architectural Services"},
    {"code": "541350", "title": "Building Inspection Services"},

    # Security and Investigation
    {"code": "561621", "title": "Security Systems Services"},
    {"code": "561612", "title": "Security Guards and Patrol Services"},
    {"code": "561611", "title": "Investigation Services"},

    # Administrative and Support Services
    {"code": "561110", "title": "Office Administrative Services"},
    {"code": "561210", "title": "Facilities Support Services"},
    {"code": "561320", "title": "Temporary Help Services"},
    {"code": "561439", "title": "Other Business Service Centers"},
    {"code": "561990", "title": "All Other Support Services"},

    # Research and Development
    {"code": "541711", "title": "Research and Development in Biotechnology"},
    {"code": "541712", "title": "Research and Development in the Physical, Engineering, and Life Sciences"},
    {"code": "541720", "title": "Research and Development in the Social Sciences and Humanities"},

    # Construction
    {"code": "236220", "title": "Commercial and Institutional Building Construction"},
    {"code": "237310", "title": "Highway, Street, and Bridge Construction"},
    {"code": "237990", "title": "Other Heavy and Civil Engineering Construction"},
    {"code": "238210", "title": "Electrical Contractors and Other Wiring Installation Contractors"},
    {"code": "238220", "title": "Plumbing, Heating, and Air-Conditioning Contractors"},
    {"code": "238990", "title": "All Other Specialty Trade Contractors"},

    # Manufacturing
    {"code": "332994", "title": "Small Arms, Ordnance, and Ordnance Accessories Manufacturing"},
    {"code": "336411", "title": "Aircraft Manufacturing"},
    {"code": "336412", "title": "Aircraft Engine and Engine Parts Manufacturing"},
    {"code": "336414", "title": "Guided Missile and Space Vehicle Manufacturing"},
    {"code": "334111", "title": "Electronic Computer Manufacturing"},
    {"code": "334290", "title": "Other Communications Equipment Manufacturing"},
    {"code": "334511", "title": "Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing"},

    # Healthcare
    {"code": "621111", "title": "Offices of Physicians"},
    {"code": "621511", "title": "Medical Laboratories"},
    {"code": "621999", "title": "All Other Miscellaneous Ambulatory Health Care Services"},
    {"code": "623990", "title": "Other Residential Care Facilities"},

    # Education and Training
    {"code": "611430", "title": "Professional and Management Development Training"},
    {"code": "611420", "title": "Computer Training"},
    {"code": "611699", "title": "All Other Miscellaneous Schools and Instruction"},

    # Transportation and Logistics
    {"code": "484110", "title": "General Freight Trucking, Local"},
    {"code": "484121", "title": "General Freight Trucking, Long-Distance, Truckload"},
    {"code": "488510", "title": "Freight Transportation Arrangement"},
    {"code": "493110", "title": "General Warehousing and Storage"},

    # Telecommunications
    {"code": "517311", "title": "Wired Telecommunications Carriers"},
    {"code": "517312", "title": "Wireless Telecommunications Carriers"},
    {"code": "517919", "title": "All Other Telecommunications"},

    # Janitorial and Maintenance
    {"code": "561720", "title": "Janitorial Services"},
    {"code": "561730", "title": "Landscaping Services"},
    {"code": "811310", "title": "Commercial and Industrial Machinery and Equipment Repair and Maintenance"},

    # Food Services
    {"code": "722310", "title": "Food Service Contractors"},
    {"code": "722320", "title": "Caterers"},

    # Printing and Publishing
    {"code": "323111", "title": "Commercial Printing"},
    {"code": "511210", "title": "Software Publishers"},

    # Legal Services
    {"code": "541110", "title": "Offices of Lawyers"},
    {"code": "541199", "title": "All Other Legal Services"},

    # Accounting and Bookkeeping
    {"code": "541211", "title": "Offices of Certified Public Accountants"},
    {"code": "541213", "title": "Tax Preparation Services"},
    {"code": "541219", "title": "Other Accounting Services"},

    # Advertising and Marketing
    {"code": "541810", "title": "Advertising Agencies"},
    {"code": "541820", "title": "Public Relations Agencies"},
    {"code": "541830", "title": "Media Buying Agencies"},
    {"code": "541840", "title": "Media Representatives"},
    {"code": "541850", "title": "Outdoor Advertising"},
    {"code": "541860", "title": "Direct Mail Advertising"},
    {"code": "541870", "title": "Advertising Material Distribution Services"},
    {"code": "541890", "title": "Other Services Related to Advertising"},

    # Photography and Video
    {"code": "541921", "title": "Photography Studios, Portrait"},
    {"code": "541922", "title": "Commercial Photography"},

    # Translation and Interpretation
    {"code": "541930", "title": "Translation and Interpretation Services"},

    # Veterinary Services
    {"code": "541940", "title": "Veterinary Services"},
]

# Group NAICS codes by category for easier selection
NAICS_CATEGORIES = {
    "Information Technology": [
        "541511", "541512", "541513", "541519", "518210", "541690"
    ],
    "Professional Services": [
        "541611", "541612", "541613", "541614", "541618", "541620",
        "541330", "541310", "541350"
    ],
    "Security & Investigation": [
        "561621", "561612", "561611"
    ],
    "Administrative & Support": [
        "561110", "561210", "561320", "561439", "561990"
    ],
    "Research & Development": [
        "541711", "541712", "541720"
    ],
    "Construction": [
        "236220", "237310", "237990", "238210", "238220", "238990"
    ],
    "Manufacturing": [
        "332994", "336411", "336412", "336414", "334111", "334290", "334511"
    ],
    "Healthcare": [
        "621111", "621511", "621999", "623990"
    ],
    "Education & Training": [
        "611430", "611420", "611699"
    ],
    "Transportation & Logistics": [
        "484110", "484121", "488510", "493110"
    ],
    "Telecommunications": [
        "517311", "517312", "517919"
    ],
    "Janitorial & Maintenance": [
        "561720", "561730", "811310"
    ],
    "Food Services": [
        "722310", "722320"
    ],
    "Printing & Publishing": [
        "323111", "511210"
    ],
    "Legal Services": [
        "541110", "541199"
    ],
    "Accounting & Bookkeeping": [
        "541211", "541213", "541219"
    ],
    "Advertising & Marketing": [
        "541810", "541820", "541830", "541840", "541850", "541860", "541870", "541890"
    ],
    "Photography & Video": [
        "541921", "541922"
    ],
    "Translation & Interpretation": [
        "541930"
    ],
    "Veterinary Services": [
        "541940"
    ],
}


def get_naics_by_code(code: str):
    """Get NAICS details by code."""
    for naics in NAICS_CODES:
        if naics["code"] == code:
            return naics
    return None


def search_naics(query: str):
    """Search NAICS codes by title or code."""
    query = query.lower()
    results = []
    for naics in NAICS_CODES:
        if query in naics["code"] or query in naics["title"].lower():
            results.append(naics)
    return results
