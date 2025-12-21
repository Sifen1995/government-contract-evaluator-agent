from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.award import Award
from app.schemas.award import AwardOut

router = APIRouter(prefix="/awards", tags=["Awards"])

@router.get("/", response_model=List[AwardOut])
def list_awards(
    db: Session = Depends(get_db),

    agency: Optional[str] = Query(None),
    naics: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
):
    """
    List awards with filters for analytics & benchmarking.
    """

    query = db.query(Award)

    if agency:
        query = query.filter(Award.agency.ilike(f"%{agency}%"))

    if naics:
        query = query.filter(Award.naics == naics)

    if vendor:
        query = query.filter(Award.vendor.ilike(f"%{vendor}%"))

    if min_amount is not None:
        query = query.filter(Award.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(Award.amount <= max_amount)

    return query.order_by(Award.award_date.desc()).limit(500).all()


@router.get("/stats")
def award_stats(
       db: Session = Depends(get_db),
     ):
       """
       Aggregated award statistics for analytics dashboards.
       """

    # ---- BASIC METRICS ----
       total_awards = db.query(func.count(Award.id)).scalar() or 0

       total_value = (
       db.query(func.coalesce(func.sum(Award.amount), 0))
       .scalar()
        )

       avg_award_value = (
       db.query(func.coalesce(func.avg(Award.amount), 0))
       .scalar()
       )

    # ---- TOP AGENCIES ----
       top_agencies = (
       db.query(
            Award.agency,
            func.count(Award.id).label("count")
        )
       .filter(Award.agency.isnot(None))
       .group_by(Award.agency)
       .order_by(func.count(Award.id).desc())
       .limit(10)
       .all()
    )

    # ---- TOP VENDORS ----
       top_vendors = (
       db.query(
            Award.vendor,
            func.count(Award.id).label("count")
        )
       .filter(Award.vendor.isnot(None))
       .group_by(Award.vendor)
       .order_by(func.count(Award.id).desc())
       .limit(10)
       .all()
     )

    # ---- NAICS DISTRIBUTION ----
       naics_breakdown = (
       db.query(
            Award.naics,
            func.count(Award.id).label("count")
        )
       .filter(Award.naics.isnot(None))
       .group_by(Award.naics)
       .order_by(func.count(Award.id).desc())
       .limit(10)
       .all()
     )

       return {
        "total_awards": total_awards,
        "total_award_value": float(total_value),
        "avg_award_value": float(avg_award_value),
        "top_agencies": [
            {"agency": agency, "count": count}
            for agency, count in top_agencies
        ],
        "top_vendors": [
            {"vendor": vendor, "count": count}
            for vendor, count in top_vendors
        ],
        "naics_breakdown": [
            {"naics": naics, "count": count}
            for naics, count in naics_breakdown
        ],
    }

