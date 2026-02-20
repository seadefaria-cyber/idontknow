"""X/Twitter posting via Playwright browser automation."""
from datetime import datetime, timezone
from pathlib import Path

import structlog
from playwright.sync_api import sync_playwright

from src.config import Settings
from src.distribution.base import PostResult
from src.distribution.playwright_base import PlaywrightBase
from src.exceptions import PostingError
from src.models.distribution import Account

logger = structlog.get_logger()


class TwitterPoster(PlaywrightBase):
    """Posts videos to X/Twitter via browser automation."""

    def __init__(self, settings: Settings):
        super().__init__(settings)

    def post_video(
        self,
        video_path: Path,
        caption: str,
        account: Account,
    ) -> PostResult:
        """Upload and post a video to X/Twitter.

        Flow: Navigate to compose → attach video → add text → post
        """
        if not video_path.exists():
            raise PostingError(
                f"Video file not found: {video_path}",
                platform="twitter",
                account_id=account.id,
            )

        if not account.cookie_path:
            raise PostingError(
                "No saved session. Run login-account first.",
                platform="twitter",
                account_id=account.id,
            )

        with sync_playwright() as p:
            browser, context = self.create_context_with_session(p, account.cookie_path)
            page = context.new_page()

            try:
                # Go to Twitter home
                page.goto("https://twitter.com/home", wait_until="domcontentloaded")
                self.random_delay(2, 4)

                # Check for login redirect
                if "login" in page.url.lower():
                    raise PostingError(
                        "Session expired — redirected to login page",
                        platform="twitter",
                        account_id=account.id,
                    )

                # Click the compose tweet area
                try:
                    compose = page.locator('[data-testid="tweetTextarea_0"]')
                    compose.click(timeout=5000)
                except Exception:
                    # Try clicking the tweet button to open composer
                    try:
                        page.click('[data-testid="SideNav_NewTweet_Button"]', timeout=3000)
                        self.random_delay(1, 2)
                        compose = page.locator('[data-testid="tweetTextarea_0"]')
                        compose.click(timeout=5000)
                    except Exception:
                        raise PostingError(
                            "Could not find compose area",
                            platform="twitter",
                            account_id=account.id,
                        )

                # Type caption/text
                if caption:
                    truncated = caption[:280]  # Twitter character limit
                    page.keyboard.type(truncated, delay=50)
                    self.random_delay(0.5, 1)

                # Attach video file
                file_input = page.locator('input[data-testid="fileInput"]')
                file_input.set_input_files(str(video_path))

                # Wait for video to upload
                print("    Uploading video to X/Twitter...")
                self.random_delay(5, 10)

                # Wait for the upload progress to finish
                # Twitter shows a progress bar during upload
                try:
                    page.wait_for_selector(
                        '[data-testid="attachments"]',
                        timeout=60000,
                    )
                except Exception:
                    logger.warning("twitter_attachment_wait_timeout")

                self.random_delay(2, 3)

                # Click the Post/Tweet button
                try:
                    page.click('[data-testid="tweetButtonInline"]', timeout=5000)
                except Exception:
                    try:
                        page.click('[data-testid="tweetButton"]', timeout=5000)
                    except Exception:
                        page.click('button:has-text("Post")', timeout=5000)

                # Wait for post to complete
                self.random_delay(3, 5)

                # Save session
                self.save_session(context, account.cookie_path)

                return PostResult(
                    platform_post_id=f"tw_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    posted_at=datetime.now(timezone.utc),
                    post_url=f"https://twitter.com/{account.username}",
                )

            except PostingError:
                raise
            except Exception as e:
                self.screenshot_on_error(page, f"twitter_{account.username}")
                raise PostingError(
                    f"X/Twitter posting failed: {e}",
                    platform="twitter",
                    account_id=account.id,
                ) from e
            finally:
                browser.close()

    def check_rate_limits(self, account: Account) -> bool:
        """Check if the account can post right now."""
        if account.last_posted_at is None:
            return True
        now = datetime.now(timezone.utc)
        hours_since_last = (now - account.last_posted_at).total_seconds() / 3600
        return hours_since_last >= 0.25  # Twitter allows more frequent posting
