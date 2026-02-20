from unittest.mock import MagicMock, patch
from pathlib import Path

from src.models.client import Client, Source, SourceStatus


class TestDownloadSource:
    @patch("src.tasks.ingestion_tasks.transcribe_source")
    @patch("src.tasks.ingestion_tasks.ContentDownloader")
    @patch("src.tasks.ingestion_tasks.get_settings")
    def test_happy_path(self, mock_settings, mock_dl_class, mock_transcribe, mock_db_session, settings, tmp_path):
        mock_settings.return_value = settings
        mock_transcribe.send = MagicMock()

        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        source = Source(
            client_id=client.id,
            url="https://youtube.com/watch?v=test",
            file_path="",
            title="",
            duration_seconds=0,
            status=SourceStatus.PENDING,
        )
        mock_db_session.add(source)
        mock_db_session.flush()

        mock_downloader = MagicMock()
        mock_downloader.download.return_value = tmp_path / "downloaded.mp4"
        mock_downloader.get_video_info.return_value = {"duration": 120, "title": "Test Video"}
        mock_dl_class.return_value = mock_downloader

        from src.tasks.ingestion_tasks import download_source

        download_source(source.id)

        mock_db_session.refresh(source)
        assert source.status == SourceStatus.TRANSCRIBING
        assert source.title == "Test Video"

    @patch("src.tasks.ingestion_tasks.get_settings")
    def test_not_found(self, mock_settings, mock_db_session, settings):
        mock_settings.return_value = settings

        from src.tasks.ingestion_tasks import download_source

        # Should not raise, just log and return
        download_source(999)

    @patch("src.tasks.ingestion_tasks.ContentDownloader")
    @patch("src.tasks.ingestion_tasks.get_settings")
    def test_error_sets_failed(self, mock_settings, mock_dl_class, mock_db_session, settings):
        mock_settings.return_value = settings

        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        source = Source(
            client_id=client.id,
            url="https://youtube.com/watch?v=test",
            file_path="",
            title="Test",
            duration_seconds=0,
            status=SourceStatus.PENDING,
        )
        mock_db_session.add(source)
        mock_db_session.flush()

        from src.exceptions import DownloadError

        mock_downloader = MagicMock()
        mock_downloader.download.side_effect = DownloadError("Download failed")
        mock_dl_class.return_value = mock_downloader

        from src.tasks.ingestion_tasks import download_source

        download_source(source.id)

        mock_db_session.refresh(source)
        assert source.status == SourceStatus.FAILED
