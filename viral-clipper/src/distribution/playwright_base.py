"""Base class for Playwright browser automation.

Handles browser lifecycle, cookie persistence, random delays, and screenshots.
"""
import json
import random
import time
from datetime import datetime
from pathlib import Path

import structlog
from playwright.sync_api import Browser, BrowserContext, Page, sync_playwright

from src.config import Settings

logger = structlog.get_logger()


class PlaywrightBase:
    """Base browser automation with session management."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.headless = settings.playwright_headless

    def manual_login(self, url: str, account_id: int, platform: str) -> Path:
        """Open browser for manual login, wait for user, save cookies.

        Returns the path to the saved cookie file.
        """
        cookie_path = self.settings.get_cookies_path() / f"{platform}_{account_id}.json"

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=False)  # Always headful for manual login
            context = browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent=self._get_user_agent(),
            )
            page = context.new_page()
            page.goto(url, wait_until="domcontentloaded")

            # Wait for user to complete login
            input("\n>>> Press Enter after you've logged in and see the main page... ")

            # Save cookies
            cookies = context.cookies()
            cookie_path.write_text(json.dumps(cookies, indent=2))

            # Also save storage state (includes localStorage)
            state_path = cookie_path.with_suffix(".state.json")
            context.storage_state(path=str(state_path))

            browser.close()

        logger.info("session_saved", platform=platform, account_id=account_id)
        return cookie_path

    def test_session(self, cookie_path: str, check_url: str) -> bool:
        """Test if a saved session is still valid."""
        cookie_file = Path(cookie_path)
        if not cookie_file.exists():
            return False

        state_path = cookie_file.with_suffix(".state.json")

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            if state_path.exists():
                context = browser.new_context(
                    storage_state=str(state_path),
                    user_agent=self._get_user_agent(),
                )
            else:
                context = browser.new_context(user_agent=self._get_user_agent())
                cookies = json.loads(cookie_file.read_text())
                context.add_cookies(cookies)

            page = context.new_page()

            try:
                page.goto(check_url, wait_until="domcontentloaded", timeout=15000)
                time.sleep(2)

                # Check if we got redirected to login page
                current_url = page.url.lower()
                is_login_page = any(kw in current_url for kw in ["login", "signin", "accounts/login"])
                return not is_login_page

            except Exception as e:
                logger.warning("session_test_failed", error=str(e))
                return False
            finally:
                browser.close()

    def create_context_with_session(
        self,
        playwright_instance,
        cookie_path: str,
    ) -> tuple[Browser, BrowserContext]:
        """Create a browser context loaded with saved session cookies."""
        cookie_file = Path(cookie_path)
        state_path = cookie_file.with_suffix(".state.json")

        browser = playwright_instance.chromium.launch(headless=self.headless)

        if state_path.exists():
            context = browser.new_context(
                storage_state=str(state_path),
                viewport={"width": 1280, "height": 720},
                user_agent=self._get_user_agent(),
            )
        else:
            context = browser.new_context(
                viewport={"width": 1280, "height": 720},
                user_agent=self._get_user_agent(),
            )
            if cookie_file.exists():
                cookies = json.loads(cookie_file.read_text())
                context.add_cookies(cookies)

        return browser, context

    def save_session(self, context: BrowserContext, cookie_path: str) -> None:
        """Save current session state back to disk."""
        cookie_file = Path(cookie_path)
        state_path = cookie_file.with_suffix(".state.json")

        cookies = context.cookies()
        cookie_file.write_text(json.dumps(cookies, indent=2))
        context.storage_state(path=str(state_path))

    def random_delay(self, min_seconds: float = 1.0, max_seconds: float = 3.0) -> None:
        """Sleep for a random duration (anti-detection)."""
        delay = random.uniform(min_seconds, max_seconds)
        time.sleep(delay)

    def human_type(self, page: Page, selector: str, text: str) -> None:
        """Type text with random delays between characters (human-like)."""
        page.click(selector)
        self.random_delay(0.3, 0.8)
        for char in text:
            page.keyboard.type(char, delay=random.randint(50, 150))

    def screenshot_on_error(self, page: Page, name: str) -> Path:
        """Take a debug screenshot on error."""
        screenshots_dir = self.settings.get_screenshots_path()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = screenshots_dir / f"{name}_{timestamp}.png"
        page.screenshot(path=str(path))
        logger.info("screenshot_saved", path=str(path))
        return path

    def _get_user_agent(self) -> str:
        """Get a realistic Chrome user agent string."""
        return (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/121.0.0.0 Safari/537.36"
        )
