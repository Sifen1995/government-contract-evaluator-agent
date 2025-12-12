"""
Sample data seeding script for GovAI
Run this to populate the database with test data
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash, generate_token
from app.models.user import User
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.models.evaluation import Evaluation


def generate_uuid():
    return str(uuid.uuid4())


def seed_data():
    """Seed the database with sample data"""
    db = SessionLocal()

    try:
        print("=" * 60)
        print("SEEDING SAMPLE DATA")
        print("=" * 60)

        # Create sample company
        print("\n[1/4] Creating sample company...")
        company = Company(
            id=generate_uuid(),
            name="TechGov Solutions LLC",
            legal_structure="LLC",
            address_street="123 Innovation Drive",
            address_city="Arlington",
            address_state="VA",
            address_zip="22201",
            uei="ABCD12345678",
            naics_codes=["541512", "541511", "541519", "518210"],  # IT & Software related
            set_asides=["Small Business", "8(a)"],
            capabilities="TechGov Solutions is a leading provider of IT services to federal agencies. We specialize in cloud migration, cybersecurity, software development, and data analytics. Our team has over 50 years of combined experience working with DoD, DHS, and civilian agencies.",
            contract_value_min=Decimal("50000.00"),
            contract_value_max=Decimal("5000000.00"),
            geographic_preferences=["VA", "MD", "DC", "Nationwide"]
        )
        db.add(company)
        db.flush()
        print(f"   Created company: {company.name} (ID: {company.id})")

        # Create sample user
        print("\n[2/4] Creating sample user...")
        verification_token = generate_token()
        user = User(
            id=generate_uuid(),
            email="testuser@techgov.com",
            password_hash=get_password_hash("Test123!@#"),
            email_verified=True,  # Pre-verified for testing
            first_name="John",
            last_name="Doe",
            company_id=company.id,
            email_frequency="daily"
        )
        db.add(user)
        db.flush()
        print(f"   Created user: {user.email} (ID: {user.id})")
        print(f"   Password: Test123!@#")

        # Create sample opportunities
        print("\n[3/4] Creating sample opportunities...")
        opportunities = [
            {
                "notice_id": "SAM-2024-001",
                "solicitation_number": "W911NF-24-R-0001",
                "title": "Cloud Migration Services for Army Research Laboratory",
                "description": "The Army Research Laboratory requires cloud migration services to move legacy systems to AWS GovCloud. The contractor shall provide planning, migration, and support services.",
                "department": "Department of Defense",
                "sub_tier": "Department of the Army",
                "office": "Army Contracting Command",
                "naics_code": "541512",
                "naics_description": "Computer Systems Design Services",
                "set_aside": "Small Business",
                "contract_value_min": Decimal("500000.00"),
                "contract_value_max": Decimal("2000000.00"),
                "posted_date": datetime.utcnow() - timedelta(days=5),
                "response_deadline": datetime.utcnow() + timedelta(days=25),
                "place_of_performance_state": "MD",
                "place_of_performance_city": "Adelphi",
                "primary_contact_email": "contracts@arl.army.mil",
                "link": "https://sam.gov/opp/12345",
                "type": "Solicitation",
                "is_active": True
            },
            {
                "notice_id": "SAM-2024-002",
                "solicitation_number": "70CDCR24R00000012",
                "title": "Cybersecurity Assessment and Monitoring Services",
                "description": "DHS CISA requires comprehensive cybersecurity assessment services including vulnerability scanning, penetration testing, and continuous monitoring.",
                "department": "Department of Homeland Security",
                "sub_tier": "Cybersecurity and Infrastructure Security Agency",
                "office": "CISA Contracting",
                "naics_code": "541512",
                "naics_description": "Computer Systems Design Services",
                "set_aside": "8(a)",
                "contract_value_min": Decimal("1000000.00"),
                "contract_value_max": Decimal("5000000.00"),
                "posted_date": datetime.utcnow() - timedelta(days=3),
                "response_deadline": datetime.utcnow() + timedelta(days=30),
                "place_of_performance_state": "DC",
                "place_of_performance_city": "Washington",
                "primary_contact_email": "acquisitions@cisa.dhs.gov",
                "link": "https://sam.gov/opp/23456",
                "type": "Solicitation",
                "is_active": True
            },
            {
                "notice_id": "SAM-2024-003",
                "solicitation_number": "N00024-24-R-5555",
                "title": "Navy Enterprise Software Development Support",
                "description": "NAVSEA requires agile software development services to support fleet management systems. The contractor shall provide full-stack developers and DevSecOps engineers.",
                "department": "Department of Defense",
                "sub_tier": "Department of the Navy",
                "office": "Naval Sea Systems Command",
                "naics_code": "541511",
                "naics_description": "Custom Computer Programming Services",
                "set_aside": "Small Business",
                "contract_value_min": Decimal("750000.00"),
                "contract_value_max": Decimal("3000000.00"),
                "posted_date": datetime.utcnow() - timedelta(days=7),
                "response_deadline": datetime.utcnow() + timedelta(days=14),
                "place_of_performance_state": "VA",
                "place_of_performance_city": "Norfolk",
                "primary_contact_email": "contracts@navsea.navy.mil",
                "link": "https://sam.gov/opp/34567",
                "type": "Solicitation",
                "is_active": True
            },
            {
                "notice_id": "SAM-2024-004",
                "solicitation_number": "GSA-24-MAS-001",
                "title": "IT Schedule 70 - Data Analytics Platform",
                "description": "GSA seeks a data analytics platform with AI/ML capabilities for government-wide deployment.",
                "department": "General Services Administration",
                "sub_tier": "Federal Acquisition Service",
                "office": "IT Category",
                "naics_code": "518210",
                "naics_description": "Data Processing, Hosting, and Related Services",
                "set_aside": None,
                "contract_value_min": Decimal("100000.00"),
                "contract_value_max": Decimal("500000.00"),
                "posted_date": datetime.utcnow() - timedelta(days=10),
                "response_deadline": datetime.utcnow() + timedelta(days=45),
                "place_of_performance_state": "DC",
                "place_of_performance_city": "Washington",
                "primary_contact_email": "itcategory@gsa.gov",
                "link": "https://sam.gov/opp/45678",
                "type": "Solicitation",
                "is_active": True
            },
            {
                "notice_id": "SAM-2024-005",
                "solicitation_number": "FA8771-24-R-0010",
                "title": "Air Force Network Infrastructure Upgrade",
                "description": "Air Force requires network infrastructure modernization including SD-WAN implementation.",
                "department": "Department of Defense",
                "sub_tier": "Department of the Air Force",
                "office": "Air Force Materiel Command",
                "naics_code": "541512",
                "naics_description": "Computer Systems Design Services",
                "set_aside": "Small Business",
                "contract_value_min": Decimal("2000000.00"),
                "contract_value_max": Decimal("8000000.00"),
                "posted_date": datetime.utcnow() - timedelta(days=2),
                "response_deadline": datetime.utcnow() + timedelta(days=35),
                "place_of_performance_state": "OH",
                "place_of_performance_city": "Wright-Patterson AFB",
                "primary_contact_email": "contracts@wpafb.af.mil",
                "link": "https://sam.gov/opp/56789",
                "type": "Solicitation",
                "is_active": True
            }
        ]

        created_opportunities = []
        for opp_data in opportunities:
            opp = Opportunity(id=generate_uuid(), **opp_data)
            db.add(opp)
            created_opportunities.append(opp)
            print(f"   Created opportunity: {opp.notice_id} - {opp.title[:50]}...")

        db.flush()

        # Create sample evaluations
        print("\n[4/4] Creating sample evaluations...")
        evaluations_data = [
            {
                "opportunity": created_opportunities[0],
                "fit_score": Decimal("85.50"),
                "win_probability": Decimal("72.00"),
                "recommendation": "BID",
                "strengths": ["Strong cloud experience", "Active Secret clearances", "Prior Army experience"],
                "weaknesses": ["Limited AWS GovCloud specific experience"],
                "key_requirements": ["AWS migration", "FedRAMP compliance", "Secret clearance"],
                "reasoning": "Strong fit based on company capabilities and NAICS alignment. Cloud migration expertise aligns well with requirements.",
                "naics_match": 2,
                "set_aside_match": 1,
                "geographic_match": 1,
                "contract_value_match": 1
            },
            {
                "opportunity": created_opportunities[1],
                "fit_score": Decimal("92.00"),
                "win_probability": Decimal("78.50"),
                "recommendation": "BID",
                "strengths": ["8(a) certified", "Cybersecurity focus", "DHS past performance"],
                "weaknesses": [],
                "key_requirements": ["Penetration testing", "FISMA compliance", "24/7 monitoring"],
                "reasoning": "Excellent fit. 8(a) set-aside matches company certification. Cybersecurity capabilities align perfectly.",
                "naics_match": 2,
                "set_aside_match": 1,
                "geographic_match": 1,
                "contract_value_match": 1
            },
            {
                "opportunity": created_opportunities[2],
                "fit_score": Decimal("78.00"),
                "win_probability": Decimal("65.00"),
                "recommendation": "BID",
                "strengths": ["Software development expertise", "Located in VA"],
                "weaknesses": ["Limited Navy-specific experience"],
                "key_requirements": ["Agile development", "DevSecOps", "Full-stack developers"],
                "reasoning": "Good fit based on software development capabilities. Geographic preference matches.",
                "naics_match": 2,
                "set_aside_match": 1,
                "geographic_match": 1,
                "contract_value_match": 1
            },
            {
                "opportunity": created_opportunities[3],
                "fit_score": Decimal("55.00"),
                "win_probability": Decimal("35.00"),
                "recommendation": "RESEARCH",
                "strengths": ["Data analytics experience"],
                "weaknesses": ["No set-aside advantage", "Highly competitive open competition"],
                "key_requirements": ["AI/ML platform", "Government-wide deployment", "FedRAMP"],
                "reasoning": "Moderate fit. No set-aside limits competitive advantage. Consider teaming arrangement.",
                "naics_match": 2,
                "set_aside_match": 0,
                "geographic_match": 1,
                "contract_value_match": 1
            },
            {
                "opportunity": created_opportunities[4],
                "fit_score": Decimal("42.00"),
                "win_probability": Decimal("25.00"),
                "recommendation": "NO_BID",
                "strengths": ["IT systems design experience"],
                "weaknesses": ["Contract value exceeds preferred range", "Limited network infrastructure experience", "Location outside preference"],
                "key_requirements": ["SD-WAN", "Network modernization", "Air Force clearances"],
                "reasoning": "Poor fit. Contract value significantly exceeds company's preferred range. Limited relevant past performance.",
                "naics_match": 2,
                "set_aside_match": 1,
                "geographic_match": 0,
                "contract_value_match": 0
            }
        ]

        for eval_data in evaluations_data:
            opp = eval_data.pop("opportunity")
            evaluation = Evaluation(
                id=generate_uuid(),
                opportunity_id=opp.id,
                company_id=company.id,
                model_version="gpt-4",
                tokens_used=1500,
                evaluation_time_seconds=Decimal("2.5"),
                **eval_data
            )
            db.add(evaluation)
            print(f"   Created evaluation for {opp.notice_id}: {evaluation.recommendation} ({evaluation.fit_score}% fit)")

        db.commit()

        print("\n" + "=" * 60)
        print("SAMPLE DATA SEEDED SUCCESSFULLY!")
        print("=" * 60)
        print(f"\nTest Credentials:")
        print(f"   Email: testuser@techgov.com")
        print(f"   Password: Test123!@#")
        print(f"\nCreated:")
        print(f"   - 1 Company: TechGov Solutions LLC")
        print(f"   - 1 User: testuser@techgov.com")
        print(f"   - 5 Opportunities")
        print(f"   - 5 Evaluations (2 BID, 1 RESEARCH, 2 NO_BID)")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\nERROR: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
