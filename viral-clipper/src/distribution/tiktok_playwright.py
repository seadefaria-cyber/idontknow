"""TikTok posting via Playwright browser automation.

This is the browser-based fallback for TikTok posting (the API-based poster
is in tiktok.py but requires API audit approval). Browser automation works
immediately with any account.
"""
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


class TikTokPlaywrightPoster(PlaywrightBase):
    """Posts videos to TikTok via browser automation."""

    UPLOAD_URL = "https://www.tiktok.com/upload"

    def __init__(self, settings: Settings):
        super().__init__(settings)

    def post_video(
        self,
        video_path: Path,
        caption: str,
        account: Account,
        sound_name: str | None = None,
    ) -> PostResult:
        """Upload and post a video to TikTok.

        Flow: Navigate to upload → select file → add caption → post
        """
        if not video_path.exists():
            raise PostingError(
                f"Video file not found: {video_path}",
                platform="tiktok",
                account_id=account.id,
            )

        if not account.cookie_path:
            raise PostingError(
                "No saved session. Run login-account first.",
                platform="tiktok",
                account_id=account.id,
            )

        with sync_playwright() as p:
            browser, context = self.create_context_with_session(p, account.cookie_path)
            page = context.new_page()

            try:
                # Go to TikTok upload page
                page.goto(self.UPLOAD_URL, wait_until="domcontentloaded")
                self.random_delay(3, 5)

                # Check if redirected to login
                if "login" in page.url.lower():
                    raise PostingError(
                        "Session expired — redirected to login page",
                        platform="tiktok",
                        account_id=account.id,
                    )

                # Wait for upload area to appear
                # TikTok upload page has an iframe for the upload widget
                try:
                    # Try finding the file input directly
                    file_input = page.locator('input[type="file"]').first
                    file_input.set_input_files(str(video_path))
                except Exception:
                    # Sometimes the upload is inside an iframe
                    iframe = page.frame_locator("iframe").first
                    file_input = iframe.locator('input[type="file"]').first
                    file_input.set_input_files(str(video_path))

                # Wait for video to upload and process
                print("    Uploading video to TikTok...")
                self.random_delay(5, 10)

                # Wait for upload to complete (look for the caption editor)
                page.wait_for_timeout(10000)

                # Add caption
                if caption:
                    try:
                        # TikTok caption editor
                        caption_editor = page.locator('[data-text="true"]').first
                        caption_editor.click()
                        self.random_delay(0.5, 1)

                        # Clear existing text and type new caption
                        page.keyboard.press("Control+a")
                        page.keyboard.press("Backspace")
                        self.random_delay(0.3, 0.5)

                        # Type caption (TikTok has character limits)
                        truncated = caption[:2200]  # TikTok max
                        page.keyboard.type(truncated, delay=30)
                    except Exception as e:
                        logger.warning("tiktok_caption_failed", error=str(e))

                self.random_delay(2, 4)

                # Add sound if specified
                if sound_name:
                    self._search_and_add_sound(page, sound_name)
                    self.random_delay(2, 3)

                # Click Post button
                try:
                    page.click('button:has-text("Post")', timeout=10000)
                except Exception:
                    try:
                        page.click('[data-e2e="upload-btn"]', timeout=5000)
                    except Exception:
                        # Try any button that looks like a post/publish button
                        page.click('button[type="submit"]', timeout=5000)

                # Wait for posting to complete
                self.random_delay(5, 10)

                # Check for success indicators
                try:
                    page.wait_for_selector(
                        'text=Your video has been uploaded',
                        timeout=30000,
                    )
                except Exception:
                    try:
                        page.wait_for_selector(
                            'text=uploaded',
                            timeout=10000,
                        )
                    except Exception:
                        logger.warning("tiktok_could_not_confirm_success")

                # Save session
                self.save_session(context, account.cookie_path)

                return PostResult(
                    platform_post_id=f"tt_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                    posted_at=datetime.now(timezone.utc),
                    post_url=f"https://www.tiktok.com/@{account.username}",
                )

            except PostingError:
                raise
            except Exception as e:
                self.screenshot_on_error(page, f"tiktok_{account.username}")
                raise PostingError(
                    f"TikTok posting failed: {e}",
                    platform="tiktok",
                    account_id=account.id,
                ) from e
            finally:
                browser.close()

    def _search_and_add_sound(self, page, sound_name: str) -> None:
        """Search for and select a sound on TikTok's upload page.

        Clicks the music/sound icon, searches for the sound by name,
        and selects the first matching result.
        """
        try:
            # Look for the sound/music button on the upload page
            sound_btn = page.locator('[class*="sound"], [class*="music"], [aria-label*="sound"], [aria-label*="music"]').first
            sound_btn.click(timeout=5000)
            self.random_delay(1, 2)

            # Search for the sound
            search_input = page.locator('input[placeholder*="search" i], input[type="search"]').first
            search_input.fill(sound_name)
            self.random_delay(1, 2)

            # Press Enter to search
            page.keyboard.press("Enter")
            self.random_delay(2, 3)

            # Click the first search result
            first_result = page.locator('[class*="sound-item"], [class*="music-item"], [class*="search-result"]').first
            first_result.click(timeout=5000)
            self.random_delay(1, 2)

            # Confirm/use the sound
            use_btn = page.locator('button:has-text("Use"), button:has-text("Add"), button:has-text("Select")').first
            use_btn.click(timeout=5000)
            self.random_delay(1, 2)

            logger.info("tiktok_sound_added", sound_name=sound_name)

        except Exception as e:
            # Sound tagging is best-effort — don't fail the whole post
            logger.warning("tiktok_sound_add_failed", sound_name=sound_name, error=str(e))
            print(f"    Warning: Could not add sound '{sound_name}': {e}")

    def check_rate_limits(self, account: Account) -> bool:
        """Check if the account can post right now."""
        if account.last_posted_at is None:
            return True
        now = datetime.now(timezone.utc)
        hours_since_last = (now - account.last_posted_at).total_seconds() / 3600
        return hours_since_last >= 1.0
