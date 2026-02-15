import pytest

from src.models.client import Client
from src.models.distribution import Account, AccountStatus, PlatformType


class TestPauseAccount:
    def test_pause(self, mock_db_session):
        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        account = Account(
            client_id=client.id,
            platform=PlatformType.TIKTOK,
            username="testuser",
            credentials_encrypted="enc",
            status=AccountStatus.ACTIVE,
        )
        mock_db_session.add(account)
        mock_db_session.flush()

        from src.services.distribution_service import pause_account

        pause_account(account.id)
        mock_db_session.refresh(account)
        assert account.status == AccountStatus.WARNED


class TestResumeAccount:
    def test_resume_success(self, mock_db_session):
        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        account = Account(
            client_id=client.id,
            platform=PlatformType.TIKTOK,
            username="testuser",
            credentials_encrypted="enc",
            status=AccountStatus.WARNED,
        )
        mock_db_session.add(account)
        mock_db_session.flush()

        from src.services.distribution_service import resume_account

        resume_account(account.id)
        mock_db_session.refresh(account)
        assert account.status == AccountStatus.ACTIVE

    def test_resume_banned_raises(self, mock_db_session):
        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        account = Account(
            client_id=client.id,
            platform=PlatformType.TIKTOK,
            username="banned_user",
            credentials_encrypted="enc",
            status=AccountStatus.BANNED,
        )
        mock_db_session.add(account)
        mock_db_session.flush()

        from src.services.distribution_service import resume_account

        with pytest.raises(ValueError, match="banned"):
            resume_account(account.id)

    def test_not_found(self, mock_db_session):
        from src.services.distribution_service import resume_account

        with pytest.raises(ValueError, match="not found"):
            resume_account(9999)
