from typing import List
from sqlalchemy.orm import Session
from app.models.award import Award


class AwardUpsertResult:
    def __init__(self, new: int, updated: int):
        self.new = new
        self.updated = updated


class AwardService:

    def upsert_awards_batch(self, db: Session, awards: List[Award]) -> AwardUpsertResult:
        new = 0
        updated = 0

        for award in awards:
            existing = db.query(Award).filter(
                Award.award_id == award.award_id
            ).first()

            if existing:
                for key, value in award.__dict__.items():
                    if not key.startswith("_"):
                        setattr(existing, key, value)
                updated += 1
            else:
                db.add(award)
                new += 1

        db.commit()
        return AwardUpsertResult(new=new, updated=updated)


award_service = AwardService()
