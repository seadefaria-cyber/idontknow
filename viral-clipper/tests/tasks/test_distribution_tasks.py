from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from src.models.client import Client
from src.models.distribution import Account, AccountStatus, PlatformType, PostJob, PostStatus
from src.models.content import ClipMoment, GeneratedClip, MomentStatus
from src.models.client import Source, SourceStatus


class TestPostToPlatform:
    @patch("src.tasks.distribution_tasks.get_settings")
    def test_not_found(self, mock_settings, mock_db_session, settings):
        mock_settings.return_value = settings

        from src.tasks.distribution_tasks import post_to_platform

        # Should not raise, just log and return
        post_to_platform(9999)

    @patch("src.tasks.distribution_tasks.get_settings")
    def test_account_not_active_fails_job(self, mock_settings, mock_db_session, settings):
        mock_settings.return_value = settings

        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        source = Source(
            client_id=client.id,
            file_path="/tmp/test.mp4",
            title="Test",
            duration_seconds=300.0,
            status=SourceStatus.READY,
        )
        mock_db_session.add(source)
        mock_db_session.flush()

        moment = ClipMoment(
            source_id=source.id,
            client_id=client.id,
            start_time=10.0,
            end_time=40.0,
            viral_score=85,
            hook_text="Hook",
            caption_text="Caption",
            reasoning="Reason",
            status=MomentStatus.READY,
        )
        mock_db_session.add(moment)
        mock_db_session.flush()

        clip = GeneratedClip(
            moment_id=moment.id,
            client_id=client.id,
            file_path="/tmp/clip.mp4",
            duration=30.0,
            caption_style="word_highlight",
            hook_type="text_overlay",
            quality_check_passed=True,
        )
        mock_db_session.add(clip)
        mock_db_session.flush()

        account = Account(
            client_id=client.id,
            platform=PlatformType.TIKTOK,
            username="suspended_user",
            credentials_encrypted="enc",
            status=AccountStatus.SUSPENDED,
        )
        mock_db_session.add(account)
        mock_db_session.flush()

        job = PostJob(
            clip_id=clip.id,
            account_id=account.id,
            scheduled_at=datetime.now(timezone.utc),
            status=PostStatus.QUEUED,
            post_caption="Test",
            hashtags="#test",
        )
        mock_db_session.add(job)
        mock_db_session.flush()

        from src.tasks.distribution_tasks import post_to_platform

        post_to_platform(job.id)

        mock_db_session.refresh(job)
        assert job.status == PostStatus.FAILED
        assert "status" in job.error_message.lower()
