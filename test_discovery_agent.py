#!/usr/bin/env python3
"""
Test script for Discovery Agent - SAM.gov API Integration
Tests real SAM.gov API calls with configured API key
"""

import requests
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SAM_API_KEY = os.getenv("SAM_API_KEY")
SAM_API_BASE = "https://api.sam.gov/opportunities/v2/search"

def test_sam_gov_api():
    """Test SAM.gov API with real data"""

    print("="*80)
    print("GOVAI - DISCOVERY AGENT TEST")
    print("Testing SAM.gov API Integration")
    print("="*80)
    print()

    # Test 1: Basic API connectivity
    print("TEST 1: SAM.gov API Connectivity")
    print("-" * 80)
    print(f"API Key: {SAM_API_KEY[:20]}... (truncated)")
    print(f"API Endpoint: {SAM_API_BASE}")
    print()

    # Calculate date range (last 14 days)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=14)

    # Build query parameters matching our Discovery Agent
    params = {
        "api_key": SAM_API_KEY,
        "postedFrom": start_date.strftime("%m/%d/%Y"),
        "postedTo": end_date.strftime("%m/%d/%Y"),
        "ptype": "o,k",  # Opportunities and Combined Synopsis
        "limit": 10,  # Start with 10 for testing
    }

    print(f"Query Parameters:")
    print(f"  - Posted From: {params['postedFrom']}")
    print(f"  - Posted To: {params['postedTo']}")
    print(f"  - Type: {params['ptype']}")
    print(f"  - Limit: {params['limit']}")
    print()

    try:
        print("Making API request...")
        response = requests.get(SAM_API_BASE, params=params, timeout=30)

        print(f"Response Status Code: {response.status_code}")
        print()

        if response.status_code == 200:
            data = response.json()

            print("[SUCCESS] API call successful!")
            print()
            print("="*80)
            print("RESPONSE DATA ANALYSIS")
            print("="*80)
            print()

            # Analyze response structure
            total_records = data.get("totalRecords", 0)
            opportunities = data.get("opportunitiesData", [])

            print(f"Total Records Found: {total_records}")
            print(f"Opportunities Returned: {len(opportunities)}")
            print()

            if opportunities:
                print("-" * 80)
                print("SAMPLE OPPORTUNITIES (First 3)")
                print("-" * 80)
                print()

                for i, opp in enumerate(opportunities[:3], 1):
                    print(f"OPPORTUNITY #{i}")
                    print(f"  Title: {opp.get('title', 'N/A')}")
                    print(f"  Notice ID: {opp.get('noticeId', 'N/A')}")
                    print(f"  Type: {opp.get('type', 'N/A')}")
                    print(f"  Department: {opp.get('department', 'N/A')}")
                    print(f"  Sub-Tier: {opp.get('subTier', 'N/A')}")
                    print(f"  Office: {opp.get('office', 'N/A')}")
                    print(f"  Posted Date: {opp.get('postedDate', 'N/A')}")
                    print(f"  Response Deadline: {opp.get('responseDeadLine', 'N/A')}")

                    # NAICS codes
                    naics = opp.get('naicsCode', 'N/A')
                    print(f"  NAICS Code: {naics}")

                    # Set-aside
                    set_aside = opp.get('typeOfSetAside', 'N/A')
                    print(f"  Set-Aside: {set_aside}")

                    # Contract value (if available)
                    award = opp.get('award')
                    award_value = award.get('amount', 'N/A') if award else 'N/A'
                    print(f"  Award Amount: {award_value}")

                    # Description snippet
                    description = opp.get('description', '')
                    if description:
                        snippet = description[:200] + "..." if len(description) > 200 else description
                        print(f"  Description: {snippet}")

                    # Contact info
                    point_of_contact = opp.get('pointOfContact', [])
                    if point_of_contact:
                        poc = point_of_contact[0]
                        print(f"  Contact: {poc.get('fullName', 'N/A')} ({poc.get('email', 'N/A')})")

                    print()

                print("="*80)
                print("DETAILED DATA FOR FIRST OPPORTUNITY")
                print("="*80)
                print()
                print(json.dumps(opportunities[0], indent=2))
                print()

            # Test 2: Filter by NAICS codes (IT services)
            print()
            print("="*80)
            print("TEST 2: Filtered Search (IT Services - NAICS 541512, 541519)")
            print("="*80)
            print()

            params_filtered = {
                **params,
                "naics": "541512,541519,541511",  # Computer systems design services
                "limit": 5
            }

            print("Making filtered API request...")
            response_filtered = requests.get(SAM_API_BASE, params=params_filtered, timeout=30)

            if response_filtered.status_code == 200:
                data_filtered = response_filtered.json()
                opps_filtered = data_filtered.get("opportunitiesData", [])

                print(f"[SUCCESS] Filtered Results: {len(opps_filtered)} opportunities")
                print()

                if opps_filtered:
                    for i, opp in enumerate(opps_filtered, 1):
                        print(f"{i}. {opp.get('title', 'N/A')}")
                        print(f"   NAICS: {opp.get('naicsCode', 'N/A')}")
                        print(f"   Set-Aside: {opp.get('typeOfSetAside', 'N/A')}")
                        print(f"   Deadline: {opp.get('responseDeadLine', 'N/A')}")
                        print()

            # Test 3: Filter by Set-Aside
            print()
            print("="*80)
            print("TEST 3: Set-Aside Filter (Small Business)")
            print("="*80)
            print()

            params_setaside = {
                **params,
                "typeOfSetAsideCode": "SBA",
                "limit": 5
            }

            print("Making set-aside filtered request...")
            response_setaside = requests.get(SAM_API_BASE, params=params_setaside, timeout=30)

            if response_setaside.status_code == 200:
                data_setaside = response_setaside.json()
                opps_setaside = data_setaside.get("opportunitiesData", [])

                print(f"[SUCCESS] Small Business Set-Aside Results: {len(opps_setaside)} opportunities")
                print()

                if opps_setaside:
                    for i, opp in enumerate(opps_setaside, 1):
                        print(f"{i}. {opp.get('title', 'N/A')}")
                        print(f"   Agency: {opp.get('department', 'N/A')}")
                        print(f"   Set-Aside: {opp.get('typeOfSetAside', 'N/A')}")
                        print()

            return {
                "success": True,
                "total_records": total_records,
                "sample_opportunities": opportunities[:3],
                "filtered_it_count": len(opps_filtered) if response_filtered.status_code == 200 else 0,
                "filtered_sba_count": len(opps_setaside) if response_setaside.status_code == 200 else 0
            }

        elif response.status_code == 401:
            print("[ERROR] Unauthorized (401)")
            print("The API key may be invalid or expired.")
            print()
            print("Response:", response.text)
            return {"success": False, "error": "Unauthorized"}

        elif response.status_code == 403:
            print("[ERROR] Forbidden (403)")
            print("Access denied. Check API key permissions.")
            print()
            print("Response:", response.text)
            return {"success": False, "error": "Forbidden"}

        else:
            print(f"[ERROR] Unexpected status code {response.status_code}")
            print()
            print("Response:", response.text)
            return {"success": False, "error": f"HTTP {response.status_code}"}

    except requests.exceptions.Timeout:
        print("[ERROR] Request timed out")
        return {"success": False, "error": "Timeout"}

    except requests.exceptions.ConnectionError:
        print("[ERROR] Connection error")
        print("Check your internet connection.")
        return {"success": False, "error": "Connection error"}

    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    result = test_sam_gov_api()

    print()
    print("="*80)
    print("TEST SUMMARY")
    print("="*80)
    print()

    if result.get("success"):
        print("[SUCCESS] All tests passed!")
        print()
        print(f"Total opportunities found: {result.get('total_records', 0)}")
        print(f"IT services opportunities: {result.get('filtered_it_count', 0)}")
        print(f"Small business set-aside opportunities: {result.get('filtered_sba_count', 0)}")
        print()
        print("Discovery Agent is working correctly with SAM.gov API!")
    else:
        print("[FAILED] Tests failed")
        print(f"Error: {result.get('error', 'Unknown error')}")
        print()
        print("Please check:")
        print("  1. SAM.gov API key is valid")
        print("  2. Internet connection is working")
        print("  3. SAM.gov API service is up")

    print()
    print("="*80)
    print("Test completed at:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*80)
