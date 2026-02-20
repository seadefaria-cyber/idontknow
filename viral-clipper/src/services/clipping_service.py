import structlog
from sqlalchemy.orm import joinedload, selectinload

from src.database import get_db_session
from src.models.content import ClipMoment, GeneratedClip, MomentStatus

logger = structlog.get_logger()


def get_client_clips(client_id: int, limit: int = 100) -> list[dict]:
    """Get clips for a client with eager-loaded relationships.

    Uses joinedload/selectinload to avoid N+1 queries.
    """
    with get_db_session() as session:
        moments = (
            session.query(ClipMoment)
            .options(
                joinedload(ClipMoment.source),
                selectinload(ClipMoment.generated_clips),
            )
            .filter_by(client_id=client_id)
            .order_by(ClipMoment.viral_score.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": m.id,
                "source_title": m.source.title if m.source else "Unknown",
                "start_time": m.start_time,
                "end_time": m.end_time,
                "duration": m.end_time - m.start_time,
                "viral_score": m.viral_score,
                "hook_text": m.hook_text,
                "status": m.status.value,
                "clips": [
                    {
                        "id": c.id,
                        "file_path": c.file_path,
                        "quality_passed": c.quality_check_passed,
                    }
                    for c in m.generated_clips
                ],
            }
            for m in moments
        ]


def get_clip_stats(client_id: int) -> dict:
    """Get clip statistics for a client."""
    with get_db_session() as session:
        total = (
            session.query(ClipMoment)
            .filter_by(client_id=client_id)
            .count()
        )
        ready = (
            session.query(ClipMoment)
            .filter_by(client_id=client_id, status=MomentStatus.READY)
            .count()
        )
        posted = (
            session.query(ClipMoment)
            .filter_by(client_id=client_id, status=MomentStatus.POSTED)
            .count()
        )
        failed = (
            session.query(ClipMoment)
            .filter_by(client_id=client_id, status=MomentStatus.FAILED)
            .count()
        )
        generating = (
            session.query(ClipMoment)
            .filter_by(client_id=client_id, status=MomentStatus.GENERATING)
            .count()
        )

        return {
            "total": total,
            "ready": ready,
            "posted": posted,
            "failed": failed,
            "generating": generating,
        }


def regenerate_clip(moment_id: int) -> None:
    """Re-generate a clip from a moment (e.g., after fixing issues).

    Resets moment status and enqueues clip generation.
    """
    with get_db_session() as session:
        moment = session.query(ClipMoment).get(moment_id)
        if moment is None:
            raise ValueError(f"Moment {moment_id} not found")

        moment.status = MomentStatus.DETECTED

    from src.tasks.clipper_tasks import generate_clip

    generate_clip.send(moment_id)

    logger.info("clip_regeneration_queued", moment_id=moment_id)
