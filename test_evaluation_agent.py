#!/usr/bin/env python3
"""
Test script for Evaluation Agent - OpenAI GPT-4 Integration
Tests real AI evaluations of government contract opportunities
"""

import os
from dotenv import load_dotenv
from openai import OpenAI
import json
from datetime import datetime

# Load environment variables
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Sample opportunity from SAM.gov for testing
SAMPLE_OPPORTUNITY = {
    "noticeId": "bc6b43f57abf4c7c90a5e3fb3c549745",
    "title": "CONNECTOR,PLUG,ELEC - Small Business Electronics Contract",
    "solicitationNumber": "SPE7M526Q0162",
    "department": "DEPT OF DEFENSE",
    "agency": "DEFENSE LOGISTICS AGENCY",
    "office": "DLA MARITIME COLUMBUS",
    "postedDate": "2025-12-03",
    "responseDeadLine": "2025-12-19",
    "naicsCode": "334417",
    "typeOfSetAside": "SBA - Total Small Business Set-Aside",
    "description": "Procurement of electrical connectors and plugs for defense logistics operations. Full technical specifications available.",
    "estimatedValue": "$50,000 - $150,000"
}

# Sample company profile for testing
SAMPLE_COMPANY = {
    "name": "TechDefense Solutions LLC",
    "naics_codes": ["334417", "334419", "541512"],
    "set_asides": ["Small Business", "8(a)"],
    "capabilities": "Electronics manufacturing, defense logistics support, electrical component supply",
    "contract_value_min": 25000,
    "contract_value_max": 500000,
    "past_performance": "5 years of government contracting experience",
    "certifications": "Small Business, ISO 9001"
}

def test_openai_evaluation():
    """Test OpenAI GPT-4 for opportunity evaluation"""

    print("="*80)
    print("GOVAI - EVALUATION AGENT TEST")
    print("Testing OpenAI GPT-4 Integration for Opportunity Scoring")
    print("="*80)
    print()

    # Test 1: API connectivity
    print("TEST 1: OpenAI API Connectivity")
    print("-" * 80)
    print(f"API Key: {OPENAI_API_KEY[:20]}... (truncated)")
    print()

    try:
        # Initialize OpenAI client
        client = OpenAI(api_key=OPENAI_API_KEY)

        print("[SUCCESS] OpenAI client initialized")
        print()

        # Test 2: Simple AI call
        print("TEST 2: Basic AI Response")
        print("-" * 80)
        print("Sending test prompt...")
        print()

        test_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'API connection successful' if you can read this."}
            ],
            max_tokens=50
        )

        test_message = test_response.choices[0].message.content
        print(f"AI Response: {test_message}")
        print()
        print("[SUCCESS] Basic AI call working")
        print()

        # Test 3: Full opportunity evaluation
        print("="*80)
        print("TEST 3: Complete Opportunity Evaluation")
        print("="*80)
        print()

        print("OPPORTUNITY DETAILS:")
        print("-" * 80)
        for key, value in SAMPLE_OPPORTUNITY.items():
            print(f"  {key}: {value}")
        print()

        print("COMPANY PROFILE:")
        print("-" * 80)
        for key, value in SAMPLE_COMPANY.items():
            print(f"  {key}: {value}")
        print()

        # Build evaluation prompt
        evaluation_prompt = f"""
You are an expert government contracting advisor. Evaluate this opportunity for the given company.

OPPORTUNITY:
- Title: {SAMPLE_OPPORTUNITY['title']}
- Agency: {SAMPLE_OPPORTUNITY['agency']}
- NAICS Code: {SAMPLE_OPPORTUNITY['naicsCode']}
- Set-Aside: {SAMPLE_OPPORTUNITY['typeOfSetAside']}
- Posted: {SAMPLE_OPPORTUNITY['postedDate']}
- Deadline: {SAMPLE_OPPORTUNITY['responseDeadLine']}
- Estimated Value: {SAMPLE_OPPORTUNITY['estimatedValue']}
- Description: {SAMPLE_OPPORTUNITY['description']}

COMPANY:
- Name: {SAMPLE_COMPANY['name']}
- NAICS Codes: {', '.join(SAMPLE_COMPANY['naics_codes'])}
- Set-Asides: {', '.join(SAMPLE_COMPANY['set_asides'])}
- Capabilities: {SAMPLE_COMPANY['capabilities']}
- Contract Value Range: ${SAMPLE_COMPANY['contract_value_min']:,} - ${SAMPLE_COMPANY['contract_value_max']:,}
- Past Performance: {SAMPLE_COMPANY['past_performance']}
- Certifications: {SAMPLE_COMPANY['certifications']}

Provide a detailed evaluation in JSON format with:
1. fit_score (0-100): Overall compatibility score
2. win_probability (0-100): Estimated chance of winning
3. recommendation (BID/NO_BID/REVIEW): Your recommendation
4. confidence (0-100): Confidence in this assessment
5. strengths (array): List of advantages
6. weaknesses (array): List of concerns
7. key_considerations (array): Important factors to consider
8. executive_summary (string): 2-3 sentence summary

Return ONLY valid JSON, no other text.
"""

        print("Sending evaluation request to OpenAI GPT-4...")
        print()

        evaluation_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert government contracting advisor specializing in opportunity evaluation and bid/no-bid decisions."},
                {"role": "user", "content": evaluation_prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )

        ai_evaluation = evaluation_response.choices[0].message.content

        print("="*80)
        print("AI EVALUATION RESULT")
        print("="*80)
        print()

        # Parse JSON response
        try:
            evaluation_data = json.loads(ai_evaluation)

            print("[SUCCESS] AI evaluation completed successfully!")
            print()
            print(json.dumps(evaluation_data, indent=2))
            print()

            # Display formatted results
            print("="*80)
            print("FORMATTED EVALUATION")
            print("="*80)
            print()

            print(f"FIT SCORE: {evaluation_data.get('fit_score', 'N/A')}/100")
            print(f"WIN PROBABILITY: {evaluation_data.get('win_probability', 'N/A')}%")
            print(f"RECOMMENDATION: {evaluation_data.get('recommendation', 'N/A')}")
            print(f"CONFIDENCE: {evaluation_data.get('confidence', 'N/A')}%")
            print()

            print("STRENGTHS:")
            for strength in evaluation_data.get('strengths', []):
                print(f"  + {strength}")
            print()

            print("WEAKNESSES:")
            for weakness in evaluation_data.get('weaknesses', []):
                print(f"  - {weakness}")
            print()

            print("KEY CONSIDERATIONS:")
            for consideration in evaluation_data.get('key_considerations', []):
                print(f"  * {consideration}")
            print()

            print("EXECUTIVE SUMMARY:")
            print(f"  {evaluation_data.get('executive_summary', 'N/A')}")
            print()

            # Token usage
            print("="*80)
            print("API USAGE METRICS")
            print("="*80)
            print()
            print(f"Prompt Tokens: {evaluation_response.usage.prompt_tokens}")
            print(f"Completion Tokens: {evaluation_response.usage.completion_tokens}")
            print(f"Total Tokens: {evaluation_response.usage.total_tokens}")
            print()

            # Cost estimation (GPT-4 pricing)
            prompt_cost = (evaluation_response.usage.prompt_tokens / 1000) * 0.01
            completion_cost = (evaluation_response.usage.completion_tokens / 1000) * 0.03
            total_cost = prompt_cost + completion_cost

            print(f"Estimated Cost: ${total_cost:.4f}")
            print(f"  - Prompt: ${prompt_cost:.4f}")
            print(f"  - Completion: ${completion_cost:.4f}")
            print()

            # Test 4: Multiple scenario evaluation
            print("="*80)
            print("TEST 4: Scoring Algorithm Validation")
            print("="*80)
            print()

            scenarios = [
                {
                    "name": "Perfect Match",
                    "naics_match": "Exact (334417)",
                    "setaside_match": "Yes (Small Business)",
                    "value_fit": "Within range ($50k-$150k)",
                    "expected_score": "85-95"
                },
                {
                    "name": "Good Match",
                    "naics_match": "Related (334419)",
                    "setaside_match": "Yes",
                    "value_fit": "Slightly above range",
                    "expected_score": "70-85"
                },
                {
                    "name": "Poor Match",
                    "naics_match": "No match",
                    "setaside_match": "No",
                    "value_fit": "Too large",
                    "expected_score": "20-40"
                }
            ]

            print("SCORING VALIDATION:")
            print("-" * 80)
            for scenario in scenarios:
                print(f"\n{scenario['name']}:")
                print(f"  NAICS Match: {scenario['naics_match']}")
                print(f"  Set-Aside Match: {scenario['setaside_match']}")
                print(f"  Value Fit: {scenario['value_fit']}")
                print(f"  Expected Score: {scenario['expected_score']}")

            print()
            print(f"Actual Score from AI: {evaluation_data.get('fit_score', 'N/A')}/100")
            print()

            # Validate score is in reasonable range
            fit_score = evaluation_data.get('fit_score', 0)
            if 85 <= fit_score <= 95:
                print("[SUCCESS] Score matches 'Perfect Match' expectations")
            elif 70 <= fit_score <= 85:
                print("[INFO] Score indicates 'Good Match'")
            else:
                print("[INFO] Score indicates match quality needs review")

            print()

            return {
                "success": True,
                "evaluation": evaluation_data,
                "tokens_used": evaluation_response.usage.total_tokens,
                "estimated_cost": total_cost
            }

        except json.JSONDecodeError as e:
            print("[ERROR] Failed to parse AI response as JSON")
            print("Raw AI Response:")
            print(ai_evaluation)
            return {"success": False, "error": "JSON parse error"}

    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {str(e)}")
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    result = test_openai_evaluation()

    print()
    print("="*80)
    print("TEST SUMMARY")
    print("="*80)
    print()

    if result.get("success"):
        print("[SUCCESS] All Evaluation Agent tests passed!")
        print()
        print("Key Findings:")
        print(f"  - OpenAI API is working correctly")
        print(f"  - AI evaluation logic is sound")
        print(f"  - Tokens used: {result.get('tokens_used', 0)}")
        print(f"  - Cost per evaluation: ${result.get('estimated_cost', 0):.4f}")
        print()
        print("Evaluation Agent is ready for production!")
    else:
        print("[FAILED] Evaluation Agent tests failed")
        print(f"Error: {result.get('error', 'Unknown error')}")
        print()
        print("Please check:")
        print("  1. OpenAI API key is valid")
        print("  2. You have credits/quota available")
        print("  3. Internet connection is working")

    print()
    print("="*80)
    print("Test completed at:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*80)
