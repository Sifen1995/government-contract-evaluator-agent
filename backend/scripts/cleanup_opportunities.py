#!/usr/bin/env python3
"""
Mark expired opportunities as inactive
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime
from app.core.database import SessionLocal
from app.models.opportunity import Opportunity


def run():
    db = SessionLocal()
    try:
        expired = db.query(Opportunity).filter(
            Opportunity.response_deadline < datetime.utcnow(),
            Opportunity.status == "active"
        ).all()

        for opp in expired:
            opp.status = "expired"

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()
