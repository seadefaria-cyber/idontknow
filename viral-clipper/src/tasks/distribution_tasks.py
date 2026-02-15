from datetime import datetime, timezone

import dramatiq
import structlog

from src.config import get_settings
from src.database import get_db_session
from src.distribution.scheduler import PostScheduler
from src.distribution.tiktok import TikTokPoster
from src.exceptions import PostingError
from src.models.distribution import (
    Account,
    AccountStatus,
    PlatformType,
    PostJob,
    PostStatus,
)

logger = structlog.get_logger()


@dramatiq.actor(max_retries=0)
def process_posting_queue() -> None:
    """Process all due posting jobs.

    Called periodically by the scheduler. Picks up queued jobs
    that are past their scheduled time and dispatches them.
    """
    scheduler = PostScheduler()

    with get_db_session() as session:
        due_jobs = scheduler.get_due_jobs(session)

        if not due_jobs:
            return

        logger.info("processing_due_jobs", count=len(due_jobs))

        for job in due_jobs:
            post_to_platform.send(job.id)


@dramatiq.actor(max_retries=0)
def post_to_platform(job_id: int) -> None:
    """Post a single clip to its target platform.

    Handles rate limit checking, posting, and retry scheduling.
    """
    settings = get_settings()

    with get_db_session() as session:
        job = session.query(PostJob).get(job_id)
        if job is None:
            logger.error("job_not_found", job_id=job_id)
            return

        if job.status != PostStatus.QUEUED:
            logger.warning(
                "job_not_queued",
                job_id=job_id,
                status=job.status.value,
            )
            return

        account = session.query(Account).get(job.account_id)
        if account is None:
            logger.error("account_not_found", account_id=job.account_id)
            job.status = PostStatus.FAILED
            job.error_message = "Account not found"
            return

        if account.status != AccountStatus.ACTIVE:
            logger.warning(
                "account_not_active",
                account_id=account.id,
                status=account.status.value,
            )
            job.status = PostStatus.FAILED
            job.error_message = f"Account status: {account.status.value}"
            return

        # Get the poster for this platform
        poster = _get_poster(account.platform, settings)
        if poster is None:
            job.status = PostStatus.FAILED
            job.error_message = f"No poster for platform: {account.platform.value}"
            return

        # Check rate limits
        if not poster.check_rate_limits(account):
            logger.info(
                "rate_limited",
                account_id=account.id,
                platform=account.platform.value,
            )
            # Reschedule for later
            scheduler = PostScheduler()
            scheduler.schedule_retry(session, job, retry_count=0)
            return

        # Post the video
        job.status = PostStatus.POSTING
        session.flush()

        try:
            from pathlib import Path

            clip = job.clip
            if clip is None:
                raise PostingError(
                    "Clip not found for job",
                    platform=account.platform.value,
                    account_id=account.id,
                )

            video_path = Path(clip.file_path)
            caption = f"{job.post_caption}\n\n{job.hashtags}".strip()

            result = poster.post_video(video_path, caption, account)

            job.status = PostStatus.POSTED
            job.posted_at = result["posted_at"]
            job.platform_post_id = result["platform_post_id"]
            account.last_posted_at = datetime.now(timezone.utc)

            logger.info(
                "post_success",
                job_id=job_id,
                platform=account.platform.value,
                account=account.username,
                post_id=result["platform_post_id"],
            )

        except PostingError as e:
            logger.error(
                "post_failed",
                job_id=job_id,
                platform=account.platform.value,
                error=str(e),
            )
            job.status = PostStatus.FAILED
            job.error_message = str(e)

            # Schedule retry
            scheduler = PostScheduler()
            scheduler.schedule_retry(session, job, retry_count=1)


def _get_poster(platform: PlatformType, settings):
    """Get the poster implementation for a platform."""
    if platform == PlatformType.TIKTOK:
        return TikTokPoster(settings)
    # Other platforms added in weeks 5-8
    logger.warning("unsupported_platform", platform=platform.value)
    return None
