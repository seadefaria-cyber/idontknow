"""Instagram posting via Playwright browser automation."""
import json
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


class InstagramPoster(PlaywrightBase):
    """Posts videos to Instagram via browser automation."""

    def __init__(self, settings: Settings):
        super().__init__(settings)

    def post_video(
        self,
        video_path: Path,
        caption: str,
        account: Account,
    ) -> PostResult:
        """Upload and post a video to Instagram.

        Flow: Navigate to create → select file → add caption → share
        """
        if not video_path.exists():
            raise PostingError(
                f"Video file not found: {video_path}",
                platform="instagram",
                account_id=account.id,
            )

        if not account.cookie_path:
            raise PostingError(
                "No saved session. Run login-account first.",
                platform="instagram",
                account_id=account.id,
            )

        with sync_playwright() as p:
            browser, context = self.create_context_with_session(p, account.cookie_path)
            page = context.new_page()

            try:
                # Go to Instagram
                page.goto("https://www.instagram.com/", wait_until="domcontentloaded")
                self.random_delay(2, 4)

                # Dismiss any notification popups
                try:
                    page.click("text=Not Now", timeout=3000)
                except Exception:
                    pass

                # Click the create/new post button (+ icon)
                # Instagram's create button is in the sidebar
                try:
                    page.click('[aria-label="New post"]', timeout=5000)
                except Exception:
                    try:
                        page.click('svg[aria-label="New post"]', timeout=3000)
                    except Exception:
                        # Try the navigation bar create button
                        page.click('[href="/create/select/"]', timeout=3000)

                self.random_delay(1, 2)

                # Handle the file input - Instagram uses a hidden file input
                file_input = page.locator('input[type="file"]')
                file_input.set_input_files(str(video_path))
                self.random_delay(2, 4)

                # Wait for video to process
                # Click through aspect ratio selection if shown
                try:
                    page.click('text=OK', timeout=3000)
                except Exception:
                    pass

                # Click Next
                self.random_delay(1, 2)
                try:
                    page.click('text=Next', timeout=10000)
                except Exception:
                    page.click('[role="button"]:has-text("Next")', timeout=5000)

                self.random_delay(1, 2)

                # Click Next again (past filters/editing)
                try:
                    page.click('text=Next', timeout=5000)
                except Exception:
                    pass

                self.random_delay(1, 2)

                # Add caption
                if caption:
                    try:
                        caption_area = page.locator('[aria-label="Write a caption..."]')
                        caption_area.click()
                        caption_area.fill(caption)
                    except Exception:
                        try:
                            caption_area = page.locator('[contenteditable="true"]').first
                            caption_area.click()
                            caption_area.fill(caption)
                        except Exception:
                            logger.warning("caption_input_failed")

                self.random_delay(1, 2)

                # Click Share
                try:
                    page.click('text=Share', timeout=5000)
                except Exception:
                    page.click('[role="button"]:has-text("Share")', timeout=5000)

                # Wait for upload to complete
                self.random_delay(5, 10)

                # Check for success
                try:
                    page.wait_for_selector('text=Your reel has been shared', timeout=30000)
                except Exception:
                    try:
                        page.wait_for_selector('text=Post shared', timeout=10000)
                    except Exception:
                        logger.warning("could_not_confirm_post_success")

                # Save session after successful post
                self.save_session(context, account.cookie_path)

                return PostResult(
                    platform_post_id=f"ig_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    posted_at=datetime.now(timezone.utc),
                    post_url=f"https://www.instagram.com/{account.username}/",
                )

            except PostingError:
                raise
            except Exception as e:
                self.screenshot_on_error(page, f"instagram_{account.username}")
                raise PostingError(
                    f"Instagram posting failed: {e}",
                    platform="instagram",
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
        return hours_since_last >= 1.0
