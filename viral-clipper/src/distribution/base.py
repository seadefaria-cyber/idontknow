from datetime import datetime
from pathlib import Path
from typing import Protocol, TypedDict

from src.models.distribution import Account


class PostResult(TypedDict):
    """Result from a platform posting operation."""

    platform_post_id: str
    posted_at: datetime
    post_url: str


class PlatformPoster(Protocol):
    """Interface that all platform posters must implement."""

    def post_video(
        self,
        video_path: Path,
        caption: str,
        account: Account,
    ) -> PostResult:
        """Post a video to the platform.

        Args:
            video_path: Path to the video file.
            caption: Post caption with hashtags.
            account: Account to post from.

        Returns:
            PostResult with platform post ID and URL.
        """
        ...

    def check_rate_limits(self, account: Account) -> bool:
        """Check if the account can post right now.

        Returns:
            True if the account is within rate limits.
        """
        ...
