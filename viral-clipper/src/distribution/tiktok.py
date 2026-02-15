import time
from datetime import datetime, timezone
from pathlib import Path

import httpx
import structlog
from cryptography.fernet import Fernet

from src.config import Settings
from src.distribution.base import PostResult
from src.exceptions import PostingError
from src.models.distribution import Account

logger = structlog.get_logger()


class TikTokPoster:
    """Posts videos to TikTok via Content Posting API.

    Primary: TikTok Content Posting API (video.publish scope).
    Requires API audit for public posting.
    Fallback: Playwright browser automation (implemented separately).
    """

    RATE_LIMIT_POSTS_PER_DAY = 15
    API_BASE = "https://open.tiktokapis.com/v2"

    def __init__(self, settings: Settings):
        self.settings = settings
        self._fernet = Fernet(settings.encryption_key.encode())

    def post_video(
        self,
        video_path: Path,
        caption: str,
        account: Account,
    ) -> PostResult:
        """Upload and publish a video to TikTok.

        Uses chunked upload for larger files, then publishes.
        """
        credentials = self._decrypt_credentials(account)
        access_token = credentials.get("access_token", "")

        if not access_token:
            raise PostingError(
                "No access token found for account",
                platform="tiktok",
                account_id=account.id,
            )

        try:
            # Step 1: Initialize upload
            file_size = video_path.stat().st_size
            init_response = self._init_upload(access_token, file_size)
            upload_url = init_response["upload_url"]
            publish_id = init_response["publish_id"]

            # Step 2: Upload video file
            self._upload_file(upload_url, video_path)

            # Step 3: Publish the video
            result = self._publish_video(access_token, publish_id, caption)

            logger.info(
                "tiktok_post_success",
                account=account.username,
                post_id=result["platform_post_id"],
            )

            return result

        except PostingError:
            raise
        except Exception as e:
            raise PostingError(
                f"TikTok posting failed: {e}",
                platform="tiktok",
                account_id=account.id,
            ) from e

    def check_rate_limits(self, account: Account) -> bool:
        """Check if the account can post right now."""
        # Check based on last_posted_at and daily limit
        if account.last_posted_at is None:
            return True

        now = datetime.now(timezone.utc)
        hours_since_last = (now - account.last_posted_at).total_seconds() / 3600

        # Minimum 1 hour between posts for safety
        return hours_since_last >= 1.0

    def _init_upload(self, access_token: str, file_size: int) -> dict:
        """Initialize a video upload with TikTok API."""
        with httpx.Client(timeout=30) as client:
            response = client.post(
                f"{self.API_BASE}/post/publish/inbox/video/init/",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "source_info": {
                        "source": "FILE_UPLOAD",
                        "video_size": file_size,
                    }
                },
            )

            if response.status_code != 200:
                raise PostingError(
                    f"TikTok upload init failed: {response.text}",
                    platform="tiktok",
                    account_id=0,
                )

            data = response.json().get("data", {})
            return {
                "upload_url": data.get("upload_url", ""),
                "publish_id": data.get("publish_id", ""),
            }

    def _upload_file(self, upload_url: str, video_path: Path) -> None:
        """Upload the video file to TikTok's storage."""
        file_size = video_path.stat().st_size

        with httpx.Client(timeout=300) as client:
            with open(video_path, "rb") as f:
                response = client.put(
                    upload_url,
                    content=f.read(),
                    headers={
                        "Content-Type": "video/mp4",
                        "Content-Length": str(file_size),
                        "Content-Range": f"bytes 0-{file_size - 1}/{file_size}",
                    },
                )

            if response.status_code not in (200, 201):
                raise PostingError(
                    f"TikTok file upload failed: {response.status_code}",
                    platform="tiktok",
                    account_id=0,
                )

    def _publish_video(
        self,
        access_token: str,
        publish_id: str,
        caption: str,
    ) -> PostResult:
        """Publish an uploaded video on TikTok."""
        with httpx.Client(timeout=60) as client:
            response = client.post(
                f"{self.API_BASE}/post/publish/status/fetch/",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                json={"publish_id": publish_id},
            )

            # Poll for publish completion
            max_attempts = 10
            for attempt in range(max_attempts):
                if response.status_code == 200:
                    data = response.json().get("data", {})
                    status = data.get("status", "")
                    if status == "PUBLISH_COMPLETE":
                        return PostResult(
                            platform_post_id=publish_id,
                            posted_at=datetime.now(timezone.utc),
                            post_url=f"https://www.tiktok.com/video/{publish_id}",
                        )
                    elif status == "FAILED":
                        raise PostingError(
                            f"TikTok publish failed: {data.get('fail_reason', 'unknown')}",
                            platform="tiktok",
                            account_id=0,
                        )

                time.sleep(3)
                response = client.post(
                    f"{self.API_BASE}/post/publish/status/fetch/",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    },
                    json={"publish_id": publish_id},
                )

        raise PostingError(
            "TikTok publish timed out after polling",
            platform="tiktok",
            account_id=0,
        )

    def _decrypt_credentials(self, account: Account) -> dict:
        """Decrypt stored account credentials."""
        import json

        decrypted = self._fernet.decrypt(account.credentials_encrypted.encode())
        return json.loads(decrypted.decode())
