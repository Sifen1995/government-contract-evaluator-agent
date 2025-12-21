"""
API Test Script for GovAI
Tests all major endpoints and captures output
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

# Test credentials
TEST_EMAIL = "testuser@techgov.com"
TEST_PASSWORD = "Test123!@#"

# Output file
OUTPUT_FILE = "test_output.txt"


def write_output(content: str, also_print: bool = True):
    """Write content to output file and optionally print"""
    with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
        f.write(content + "\n")
    if also_print:
        print(content)


def pretty_json(data: dict) -> str:
    """Format JSON for display"""
    return json.dumps(data, indent=2, default=str)


def test_health():
    """Test health endpoints"""
    write_output("\n" + "=" * 60)
    write_output("HEALTH CHECK ENDPOINTS")
    write_output("=" * 60)

    # Root endpoint
    write_output("\n[GET /]")
    try:
        response = requests.get(f"{BASE_URL}/")
        write_output(f"Status: {response.status_code}")
        write_output(f"Response: {pretty_json(response.json())}")
    except Exception as e:
        write_output(f"Error: {str(e)}")

    # Health endpoint
    write_output("\n[GET /health]")
    try:
        response = requests.get(f"{BASE_URL}/health")
        write_output(f"Status: {response.status_code}")
        write_output(f"Response: {pretty_json(response.json())}")
    except Exception as e:
        write_output(f"Error: {str(e)}")

    # Detailed health
    write_output("\n[GET /health/detailed]")
    try:
        response = requests.get(f"{BASE_URL}/health/detailed")
        write_output(f"Status: {response.status_code}")
        write_output(f"Response: {pretty_json(response.json())}")
    except Exception as e:
        write_output(f"Error: {str(e)}")


def test_registration():
    """Test user registration (will show email in console)"""
    write_output("\n" + "=" * 60)
    write_output("USER REGISTRATION TEST")
    write_output("=" * 60)

    new_user = {
        "email": f"newuser_{datetime.now().strftime('%H%M%S')}@example.com",
        "password": "NewPass123!",
        "first_name": "Jane",
        "last_name": "Smith"
    }

    write_output(f"\n[POST /api/v1/auth/register]")
    write_output(f"Request Body: {pretty_json(new_user)}")
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json=new_user
        )
        write_output(f"Status: {response.status_code}")
        write_output(f"Response: {pretty_json(response.json())}")
    except Exception as e:
        write_output(f"Error: {str(e)}")


def test_login():
    """Test login and return token"""
    write_output("\n" + "=" * 60)
    write_output("USER LOGIN TEST")
    write_output("=" * 60)

    credentials = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }

    write_output(f"\n[POST /api/v1/auth/login]")
    write_output(f"Request Body: {pretty_json(credentials)}")
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json=credentials
        )
        write_output(f"Status: {response.status_code}")
        data = response.json()
        write_output(f"Response: {pretty_json(data)}")

        if response.status_code == 200:
            return data.get("access_token")
    except Exception as e:
        write_output(f"Error: {str(e)}")

    return None


def test_authenticated_endpoints(token: str):
    """Test endpoints that require authentication"""
    headers = {"Authorization": f"Bearer {token}"}

    # Get current user
    write_output("\n" + "=" * 60)
    write_output("AUTHENTICATED ENDPOINTS")
    write_output("=" * 60)

    write_output("\n[GET /api/v1/auth/me]")
    try:
        response = requests.get(f"{API_URL}/auth/me", headers=headers)
        write_output(f"Status: {response.status_code}")
        write_output(f"Response: {pretty_json(response.json())}")
    except Exception as e:
        write_output(f"Error: {str(e)}")

    # Get company profile
    write_output("\n[GET /api/v1/company]")
    try:
        response = requests.get(f"{API_URL}/company", headers=headers)
        write_output(f"Status: {response.status_code}")
        write_output(f"Response: {pretty_json(response.json())}")
    except Exception as e:
        write_output(f"Error: {str(e)}")

    # Get opportunities
    write_output("\n[GET /api/v1/opportunities]")
    try:
        response = requests.get(f"{API_URL}/opportunities", headers=headers)
        write_output(f"Status: {response.status_code}")
        data = response.json()
        write_output(f"Total: {data.get('total', 0)} opportunities")
        for opp in data.get('opportunities', [])[:3]:
            write_output(f"  - {opp.get('notice_id')}: {opp.get('title', '')[:50]}...")
    except Exception as e:
        write_output(f"Error: {str(e)}")

    # Get evaluations
    write_output("\n[GET /api/v1/evaluations]")
    try:
        response = requests.get(f"{API_URL}/evaluations", headers=headers)
        write_output(f"Status: {response.status_code}")
        data = response.json()
        write_output(f"Total: {data.get('total', 0)} evaluations")
        for eval_item in data.get('evaluations', []):
            opp = eval_item.get('opportunity', {})
            write_output(f"  - {opp.get('notice_id')}: {eval_item.get('recommendation')} (Fit: {eval_item.get('fit_score')}%)")
    except Exception as e:
        write_output(f"Error: {str(e)}")

    # Get stats
    write_output("\n[GET /api/v1/stats]")
    try:
        response = requests.get(f"{API_URL}/stats", headers=headers)
        write_output(f"Status: {response.status_code}")
        write_output(f"Response: {pretty_json(response.json())}")
    except Exception as e:
        write_output(f"Error: {str(e)}")

    # Get pipeline
    write_output("\n[GET /api/v1/pipeline]")
    try:
        response = requests.get(f"{API_URL}/pipeline", headers=headers)
        write_output(f"Status: {response.status_code}")
        data = response.json()
        write_output(f"Total in pipeline: {data.get('total', 0)}")
    except Exception as e:
        write_output(f"Error: {str(e)}")

    # Get reference data
    write_output("\n[GET /api/v1/reference/naics]")
    try:
        response = requests.get(f"{API_URL}/reference/naics", headers=headers)
        write_output(f"Status: {response.status_code}")
        data = response.json()
        write_output(f"Available NAICS codes: {len(data)} (showing first 5)")
        for code in list(data.items())[:5]:
            write_output(f"  - {code[0]}: {code[1][:50]}...")
    except Exception as e:
        write_output(f"Error: {str(e)}")


def test_forgot_password():
    """Test forgot password (will show email in console)"""
    write_output("\n" + "=" * 60)
    write_output("FORGOT PASSWORD TEST (Console Email)")
    write_output("=" * 60)

    write_output(f"\n[POST /api/v1/auth/forgot-password]")
    try:
        response = requests.post(
            f"{API_URL}/auth/forgot-password",
            json={"email": TEST_EMAIL}
        )
        write_output(f"Status: {response.status_code}")
        write_output(f"Response: {pretty_json(response.json())}")
    except Exception as e:
        write_output(f"Error: {str(e)}")


def main():
    """Run all tests"""
    # Clear output file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("=" * 60 + "\n")
        f.write(f"GovAI API TEST OUTPUT\n")
        f.write(f"Timestamp: {datetime.now().isoformat()}\n")
        f.write("=" * 60 + "\n")

    print(f"Running API tests... Output will be saved to {OUTPUT_FILE}")
    print("-" * 60)

    # Run tests
    test_health()

    # Test registration (will send verification email to console)
    test_registration()

    # Login with pre-verified test user
    token = test_login()

    if token:
        test_authenticated_endpoints(token)
    else:
        write_output("\nSkipping authenticated tests - login failed")

    # Test forgot password (will send email to console)
    test_forgot_password()

    write_output("\n" + "=" * 60)
    write_output("TESTS COMPLETED")
    write_output("=" * 60)

    print(f"\nOutput saved to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
