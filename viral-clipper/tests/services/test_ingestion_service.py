from unittest.mock import MagicMock, patch

import pytest

from src.models.client import Client, Source, SourceStatus


class TestAddSourceFromUrl:
    @patch("src.tasks.ingestion_tasks.download_source")
    def test_creates_and_enqueues(self, mock_task, mock_db_session):
        mock_task.send = MagicMock()

        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        from src.services.ingestion_service import add_source_from_url

        source_id = add_source_from_url(client.id, "https://youtube.com/watch?v=abc", "My Video")

        source = mock_db_session.query(Source).filter_by(id=source_id).first()
        assert source is not None
        assert source.url == "https://youtube.com/watch?v=abc"
        assert source.status == SourceStatus.PENDING

    def test_client_not_found(self, mock_db_session):
        from src.services.ingestion_service import add_source_from_url

        with pytest.raises(ValueError, match="not found"):
            add_source_from_url(999, "https://youtube.com/watch?v=abc")


class TestGetClientSources:
    def test_returns_sources(self, mock_db_session):
        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        source = Source(
            client_id=client.id,
            url="https://youtube.com/watch?v=test",
            file_path="/tmp/test.mp4",
            title="Test Video",
            duration_seconds=60.0,
            status=SourceStatus.READY,
        )
        mock_db_session.add(source)
        mock_db_session.flush()

        from src.services.ingestion_service import get_client_sources

        result = get_client_sources(client.id)
        assert len(result) == 1
        assert result[0]["title"] == "Test Video"
        assert result[0]["status"] == "ready"
