import json
from datetime import datetime

import structlog
from cryptography.fernet import Fernet

from src.config import get_settings
from src.database import get_db_session
from src.models.content import GeneratedClip, MomentStatus
from src.models.distribution import (
    Account,
    AccountStatus,
    PlatformType,
    PostJob,
    PostStatus,
)
from src.distribution.scheduler import PostScheduler

logger = structlog.get_logger()


def add_account(
    client_id: int,
    platform: str,
    username: str,
    credentials: dict,
) -> int:
    """Add a new social media account for a client.

    Encrypts credentials before storing.

    Args:
        client_id: Client this account belongs to.
        platform: Platform name (tiktok, instagram, youtube, twitter).
        username: Account username.
        credentials: Dict of platform-specific credentials (access_token, etc.).

    Returns:
        The new Account record ID.
    """
    settings = get_settings()
    fernet = Fernet(settings.encryption_key.encode())

    # Encrypt credentials
    credentials_json = json.dumps(credentials)
    encrypted = fernet.encrypt(credentials_json.encode()).decode()

    platform_type = PlatformType(platform)

    with get_db_session() as session:
        account = Account(
            client_id=client_id,
            platform=platform_type,
            username=username,
            credentials_encrypted=encrypted,
            status=AccountStatus.ACTIVE,
        )
        session.add(account)
        session.flush()
        account_id = account.id

    logger.info(
        "account_added",
        account_id=account_id,
        client_id=client_id,
        platform=platform,
        username=username,
    )

    return account_id


def schedule_daily_posts(client_id: int, target_date: datetime) -> int:
    """Schedule all ready clips for posting across accounts.

    Gets unposted clips sorted by viral score and distributes
    them across active accounts for the target date.

    Returns:
        Number of jobs scheduled.
    """
    scheduler = PostScheduler()

    with get_db_session() as session:
        # Get ready clips that haven't been posted
        ready_clips = (
            session.query(GeneratedClip)
            .join(GeneratedClip.moment)
            .filter(
                GeneratedClip.client_id == client_id,
                GeneratedClip.quality_check_passed.is_(True),
                GeneratedClip.moment.has(status=MomentStatus.READY),
            )
            .order_by(GeneratedClip.moment.has().desc())  # By viral score
            .limit(100)
            .all()
        )

        if not ready_clips:
            logger.info("no_ready_clips", client_id=client_id)
            return 0

        jobs = scheduler.schedule_clips_for_day(
            session, client_id, ready_clips, target_date
        )

        return len(jobs)


def get_account_health(client_id: int) -> list[dict]:
    """Get health status of all accounts for a client."""
    with get_db_session() as session:
        accounts = (
            session.query(Account)
            .filter_by(client_id=client_id)
            .order_by(Account.platform, Account.username)
            .all()
        )

        result = []
        for account in accounts:
            # Count recent post stats
            total_posts = (
                session.query(PostJob)
                .filter_by(account_id=account.id)
                .count()
            )
            failed_posts = (
                session.query(PostJob)
                .filter_by(account_id=account.id, status=PostStatus.FAILED)
                .count()
            )

            result.append({
                "id": account.id,
                "platform": account.platform.value,
                "username": account.username,
                "status": account.status.value,
                "last_posted_at": (
                    account.last_posted_at.isoformat()
                    if account.last_posted_at
                    else None
                ),
                "total_posts": total_posts,
                "failed_posts": failed_posts,
            })

        return result


def pause_account(account_id: int) -> None:
    """Pause posting for an account (sets status to warned)."""
    with get_db_session() as session:
        account = session.query(Account).get(account_id)
        if account is None:
            raise ValueError(f"Account {account_id} not found")

        account.status = AccountStatus.WARNED
        logger.info("account_paused", account_id=account_id)


def resume_account(account_id: int) -> None:
    """Resume posting for a paused account."""
    with get_db_session() as session:
        account = session.query(Account).get(account_id)
        if account is None:
            raise ValueError(f"Account {account_id} not found")

        if account.status == AccountStatus.BANNED:
            raise ValueError("Cannot resume a banned account")

        account.status = AccountStatus.ACTIVE
        logger.info("account_resumed", account_id=account_id)
