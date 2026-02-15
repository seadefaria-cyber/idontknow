import random
from datetime import datetime, timedelta, timezone

import structlog
from sqlalchemy.orm import Session

from src.models.content import GeneratedClip
from src.models.distribution import Account, AccountStatus, PostJob, PostStatus

logger = structlog.get_logger()

# Posting configuration
POSTS_PER_ACCOUNT_PER_DAY = 2
POSTING_WINDOW_MINUTES = 30  # Randomize within this window
MIN_HOURS_BETWEEN_POSTS = 10


class PostScheduler:
    """Manages the posting queue across all accounts.

    Handles:
    - Staggered posting times across accounts
    - Randomized timing within windows (anti-detection)
    - Rate limit respect per account
    - Retry scheduling for failed posts
    """

    def schedule_clips_for_day(
        self,
        session: Session,
        client_id: int,
        clips: list[GeneratedClip],
        target_date: datetime,
    ) -> list[PostJob]:
        """Schedule clips across all active accounts for a given day.

        Distributes clips evenly across accounts, with staggered posting
        times and randomized offsets for anti-detection.

        Args:
            session: Database session.
            client_id: Client whose accounts to use.
            clips: Clips to schedule for posting.
            target_date: The day to schedule for.

        Returns:
            List of created PostJob records.
        """
        active_accounts = (
            session.query(Account)
            .filter_by(client_id=client_id, status=AccountStatus.ACTIVE)
            .all()
        )

        if not active_accounts:
            logger.warning("no_active_accounts", client_id=client_id)
            return []

        # Calculate posting slots
        slots = self._generate_time_slots(
            accounts=active_accounts,
            target_date=target_date,
        )

        jobs = []
        clip_index = 0

        for account, scheduled_time in slots:
            if clip_index >= len(clips):
                break

            clip = clips[clip_index]
            clip_index += 1

            job = PostJob(
                clip_id=clip.id,
                account_id=account.id,
                scheduled_at=scheduled_time,
                status=PostStatus.QUEUED,
                post_caption=clip.moment.caption_text if clip.moment else "",
                hashtags="",
            )
            session.add(job)
            jobs.append(job)

        logger.info(
            "clips_scheduled",
            client_id=client_id,
            job_count=len(jobs),
            account_count=len(active_accounts),
            target_date=target_date.isoformat(),
        )

        return jobs

    def get_due_jobs(self, session: Session) -> list[PostJob]:
        """Get all jobs that are due to be posted now."""
        now = datetime.now(timezone.utc)
        return (
            session.query(PostJob)
            .filter(
                PostJob.status == PostStatus.QUEUED,
                PostJob.scheduled_at <= now,
            )
            .order_by(PostJob.scheduled_at)
            .limit(50)
            .all()
        )

    def schedule_retry(
        self,
        session: Session,
        job: PostJob,
        retry_count: int,
    ) -> PostJob | None:
        """Schedule a retry for a failed post with exponential backoff.

        Max 3 retries. Backoff: 5min, 15min, 45min.
        """
        max_retries = 3
        if retry_count >= max_retries:
            logger.warning(
                "max_retries_exceeded",
                job_id=job.id,
                account_id=job.account_id,
            )
            return None

        backoff_minutes = 5 * (3 ** retry_count)  # 5, 15, 45
        retry_time = datetime.now(timezone.utc) + timedelta(minutes=backoff_minutes)

        retry_job = PostJob(
            clip_id=job.clip_id,
            account_id=job.account_id,
            scheduled_at=retry_time,
            status=PostStatus.QUEUED,
            post_caption=job.post_caption,
            hashtags=job.hashtags,
        )
        session.add(retry_job)

        logger.info(
            "retry_scheduled",
            original_job_id=job.id,
            retry_at=retry_time.isoformat(),
            retry_count=retry_count + 1,
        )

        return retry_job

    def _generate_time_slots(
        self,
        accounts: list[Account],
        target_date: datetime,
    ) -> list[tuple[Account, datetime]]:
        """Generate staggered posting time slots across accounts.

        Each account gets 2 slots per day, spread across 24 hours.
        Exact times are randomized within a 30-minute window.
        """
        slots = []
        num_accounts = len(accounts)

        if num_accounts == 0:
            return []

        # Spread base times evenly across 24 hours
        total_slots = num_accounts * POSTS_PER_ACCOUNT_PER_DAY
        interval_hours = 24.0 / total_slots

        for i, account in enumerate(accounts):
            for post_num in range(POSTS_PER_ACCOUNT_PER_DAY):
                slot_index = i * POSTS_PER_ACCOUNT_PER_DAY + post_num
                base_hour = slot_index * interval_hours

                # Add random offset within window
                random_offset = random.uniform(0, POSTING_WINDOW_MINUTES)

                scheduled = target_date.replace(
                    hour=0, minute=0, second=0, microsecond=0,
                    tzinfo=timezone.utc,
                ) + timedelta(hours=base_hour, minutes=random_offset)

                slots.append((account, scheduled))

        return slots
