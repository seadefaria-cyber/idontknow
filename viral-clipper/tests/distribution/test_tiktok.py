import json
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest
from cryptography.fernet import Fernet

from src.distribution.tiktok import TikTokPoster


class TestCheckRateLimits:
    def _make_poster(self, settings):
        return TikTokPoster(settings)

    def test_never_posted(self, settings):
        poster = self._make_poster(settings)
        account = MagicMock()
        account.last_posted_at = None
        assert poster.check_rate_limits(account) is True

    def test_recent_post_blocked(self, settings):
        poster = self._make_poster(settings)
        account = MagicMock()
        account.last_posted_at = datetime.now(timezone.utc) - timedelta(minutes=30)
        assert poster.check_rate_limits(account) is False

    def test_old_post_allowed(self, settings):
        poster = self._make_poster(settings)
        account = MagicMock()
        account.last_posted_at = datetime.now(timezone.utc) - timedelta(hours=2)
        assert poster.check_rate_limits(account) is True

    def test_exactly_one_hour(self, settings):
        poster = self._make_poster(settings)
        account = MagicMock()
        account.last_posted_at = datetime.now(timezone.utc) - timedelta(hours=1)
        assert poster.check_rate_limits(account) is True


class TestDecryptCredentials:
    def test_round_trip(self, settings, fernet_key):
        poster = TikTokPoster(settings)
        fernet = Fernet(fernet_key.encode())

        original = {"access_token": "tok_abc123", "refresh_token": "ref_xyz"}
        encrypted = fernet.encrypt(json.dumps(original).encode()).decode()

        account = MagicMock()
        account.credentials_encrypted = encrypted

        result = poster._decrypt_credentials(account)
        assert result == original

    def test_decrypt_preserves_all_fields(self, settings, fernet_key):
        poster = TikTokPoster(settings)
        fernet = Fernet(fernet_key.encode())

        original = {"access_token": "tok", "extra_field": "value", "number": 42}
        encrypted = fernet.encrypt(json.dumps(original).encode()).decode()

        account = MagicMock()
        account.credentials_encrypted = encrypted

        result = poster._decrypt_credentials(account)
        assert result["extra_field"] == "value"
        assert result["number"] == 42
