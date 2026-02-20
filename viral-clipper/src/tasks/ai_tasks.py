import dramatiq
import structlog

from src.config import get_settings
from src.database import get_db_session
from src.ai.moment_detector import MomentDetector
from src.exceptions import AIDetectionError
from src.models.client import Source, SourceStatus
from src.models.content import ClipMoment, MomentStatus

logger = structlog.get_logger()


@dramatiq.actor(max_retries=2, min_backoff=30_000, max_backoff=300_000)
def detect_moments(source_id: int, max_moments: int = 10) -> None:
    """Detect viral moments in a transcribed source using Claude.

    Creates ClipMoment records for each detected moment.
    On success, enqueues clip generation for each moment.
    """
    settings = get_settings()
    detector = MomentDetector(settings)

    with get_db_session() as session:
        source = session.query(Source).get(source_id)
        if source is None:
            logger.error("source_not_found", source_id=source_id)
            return

        if source.status != SourceStatus.READY:
            logger.warning(
                "source_not_ready",
                source_id=source_id,
                status=source.status.value,
            )
            return

        if not source.transcript_json:
            logger.error("source_has_no_transcript", source_id=source_id)
            return

        try:
            moments = detector.detect_moments(
                transcript=source.transcript_json,
                max_moments=max_moments,
            )

            for moment in moments:
                clip_moment = ClipMoment(
                    source_id=source.id,
                    client_id=source.client_id,
                    start_time=moment.start_time,
                    end_time=moment.end_time,
                    viral_score=moment.viral_score,
                    hook_text=moment.hook_text,
                    caption_text=moment.caption_text,
                    reasoning=moment.reasoning,
                    status=MomentStatus.DETECTED,
                )
                session.add(clip_moment)

            session.flush()  # Get IDs for the new moments

            logger.info(
                "moments_saved",
                source_id=source_id,
                count=len(moments),
            )

            # Enqueue clip generation for each moment
            from src.tasks.clipper_tasks import generate_clip

            detected_moments = (
                session.query(ClipMoment)
                .filter_by(source_id=source_id, status=MomentStatus.DETECTED)
                .all()
            )

            for cm in detected_moments:
                generate_clip.send(cm.id)

        except AIDetectionError as e:
            logger.error(
                "moment_detection_failed",
                source_id=source_id,
                error=str(e),
            )
