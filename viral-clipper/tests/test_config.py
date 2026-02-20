import pytest


class TestSettings:
    def test_valid_creation(self, settings):
        assert settings.storage_base_path.exists()

    def test_max_concurrent_transcriptions_bounds(self, tmp_path, fernet_key, monkeypatch):
        monkeypatch.setenv("DATABASE_URL", "postgresql://test:test@localhost/test")
        monkeypatch.setenv("CLAUDE_API_KEY", "sk-ant-test-key-for-testing-1234567890")
        monkeypatch.setenv("ENCRYPTION_KEY", fernet_key)
        monkeypatch.setenv("DASHBOARD_SECRET_KEY", "a" * 32)
        monkeypatch.setenv("STORAGE_BASE_PATH", str(tmp_path / "s"))
        monkeypatch.setenv("MAX_CONCURRENT_TRANSCRIPTIONS", "99")

        from pydantic import ValidationError
        from src.config import Settings

        with pytest.raises(ValidationError):
            Settings()

    def test_storage_path_created(self, settings):
        assert settings.storage_base_path.exists()
        assert settings.storage_base_path.is_dir()

    def test_get_client_storage_path(self, settings):
        path = settings.get_client_storage_path(42)
        assert path.exists()
        assert "42" in str(path)
