"""
Discovery service for tracking and managing opportunity discovery runs.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from app.models.discovery_run import DiscoveryRun
import logging

logger = logging.getLogger(__name__)


class DiscoveryService:
    """Service for managing discovery run tracking."""

    def start_run(
        self,
        db: Session,
        naics_codes: List[str],
        posted_from: Optional[datetime] = None,
        posted_to: Optional[datetime] = None
    ) -> DiscoveryRun:
        """
        Create a new discovery run record.

        Args:
            db: Database session
            naics_codes: NAICS codes being searched
            posted_from: Start date for opportunity search
            posted_to: End date for opportunity search

        Returns:
            New DiscoveryRun instance
        """
        run = DiscoveryRun(
            started_at=datetime.utcnow(),
            status='running',
            naics_codes=naics_codes,
            posted_from=posted_from.date() if posted_from else None,
            posted_to=posted_to.date() if posted_to else None
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        logger.info(f"Started discovery run {run.id}")
        return run

    def complete_run(
        self,
        db: Session,
        run: DiscoveryRun,
        results: Dict
    ) -> DiscoveryRun:
        """
        Mark a discovery run as completed with results.

        Args:
            db: Database session
            run: DiscoveryRun instance to update
            results: Dict containing result counts

        Returns:
            Updated DiscoveryRun instance
        """
        run.completed_at = datetime.utcnow()
        run.duration_seconds = (run.completed_at - run.started_at).total_seconds()
        run.status = 'completed'
        run.api_calls_made = results.get('api_calls', 0)
        run.opportunities_found = results.get('found', 0)
        run.opportunities_new = results.get('new', 0)
        run.opportunities_updated = results.get('updated', 0)
        run.opportunities_unchanged = results.get('unchanged', 0)
        run.evaluations_created = results.get('evaluations', 0)
        db.commit()
        logger.info(
            f"Completed discovery run {run.id}: "
            f"found={run.opportunities_found}, new={run.opportunities_new}, "
            f"updated={run.opportunities_updated}"
        )
        return run

    def fail_run(
        self,
        db: Session,
        run: DiscoveryRun,
        error: str,
        details: Optional[Dict] = None
    ) -> DiscoveryRun:
        """
        Mark a discovery run as failed.

        Args:
            db: Database session
            run: DiscoveryRun instance to update
            error: Error message
            details: Optional error details dict

        Returns:
            Updated DiscoveryRun instance
        """
        run.completed_at = datetime.utcnow()
        run.duration_seconds = (run.completed_at - run.started_at).total_seconds()
        run.status = 'failed'
        run.error_message = error
        run.error_details = details
        db.commit()
        logger.error(f"Failed discovery run {run.id}: {error}")
        return run

    def partial_run(
        self,
        db: Session,
        run: DiscoveryRun,
        results: Dict,
        error: str
    ) -> DiscoveryRun:
        """
        Mark a discovery run as partially completed (some errors but some success).

        Args:
            db: Database session
            run: DiscoveryRun instance to update
            results: Dict containing partial result counts
            error: Error message describing what failed

        Returns:
            Updated DiscoveryRun instance
        """
        run.completed_at = datetime.utcnow()
        run.duration_seconds = (run.completed_at - run.started_at).total_seconds()
        run.status = 'partial'
        run.api_calls_made = results.get('api_calls', 0)
        run.opportunities_found = results.get('found', 0)
        run.opportunities_new = results.get('new', 0)
        run.opportunities_updated = results.get('updated', 0)
        run.opportunities_unchanged = results.get('unchanged', 0)
        run.error_message = error
        db.commit()
        logger.warning(f"Partial discovery run {run.id}: {error}")
        return run

    def get_last_successful_run(self, db: Session) -> Optional[DiscoveryRun]:
        """
        Get the most recent successful discovery run.

        Args:
            db: Database session

        Returns:
            Most recent completed DiscoveryRun or None
        """
        return db.query(DiscoveryRun).filter(
            DiscoveryRun.status == 'completed'
        ).order_by(
            DiscoveryRun.completed_at.desc()
        ).first()

    def get_last_run(self, db: Session) -> Optional[DiscoveryRun]:
        """
        Get the most recent discovery run (any status).

        Args:
            db: Database session

        Returns:
            Most recent DiscoveryRun or None
        """
        return db.query(DiscoveryRun).order_by(
            DiscoveryRun.started_at.desc()
        ).first()

    def cleanup_old_runs(self, db: Session, days: int = 90) -> int:
        """
        Delete discovery runs older than specified days.

        Args:
            db: Database session
            days: Number of days to retain

        Returns:
            Number of runs deleted
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        deleted = db.query(DiscoveryRun).filter(
            DiscoveryRun.created_at < cutoff
        ).delete()
        db.commit()
        logger.info(f"Cleaned up {deleted} old discovery runs")
        return deleted

    def get_run_stats(self, db: Session, days: int = 7) -> Dict:
        """
        Get discovery run statistics for the past N days.

        Args:
            db: Database session
            days: Number of days to look back

        Returns:
            Dict with statistics
        """
        from sqlalchemy import func

        cutoff = datetime.utcnow() - timedelta(days=days)

        runs = db.query(DiscoveryRun).filter(
            DiscoveryRun.created_at >= cutoff
        ).all()

        total_runs = len(runs)
        successful = sum(1 for r in runs if r.status == 'completed')
        failed = sum(1 for r in runs if r.status == 'failed')
        partial = sum(1 for r in runs if r.status == 'partial')
        total_found = sum(r.opportunities_found or 0 for r in runs)
        total_new = sum(r.opportunities_new or 0 for r in runs)
        total_api_calls = sum(r.api_calls_made or 0 for r in runs)

        return {
            'period_days': days,
            'total_runs': total_runs,
            'successful': successful,
            'failed': failed,
            'partial': partial,
            'total_opportunities_found': total_found,
            'total_new_opportunities': total_new,
            'total_api_calls': total_api_calls,
            'avg_opportunities_per_run': total_found / total_runs if total_runs > 0 else 0
        }


# Singleton instance
discovery_service = DiscoveryService()
