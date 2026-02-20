from src.models.client import Client, Source, SourceStatus
from src.models.content import ClipMoment, MomentStatus


class TestGetClipStats:
    def test_empty(self, mock_db_session):
        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        from src.services.clipping_service import get_clip_stats

        result = get_clip_stats(client.id)
        assert result["total"] == 0
        assert result["ready"] == 0
        assert result["posted"] == 0

    def test_counts_by_status(self, mock_db_session):
        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        source = Source(
            client_id=client.id,
            file_path="/tmp/test.mp4",
            title="Source",
            duration_seconds=300.0,
            status=SourceStatus.READY,
        )
        mock_db_session.add(source)
        mock_db_session.flush()

        statuses = [MomentStatus.READY, MomentStatus.READY, MomentStatus.FAILED, MomentStatus.POSTED]
        for i, status in enumerate(statuses):
            moment = ClipMoment(
                source_id=source.id,
                client_id=client.id,
                start_time=i * 30.0,
                end_time=(i + 1) * 30.0,
                viral_score=80,
                hook_text=f"Hook {i}",
                caption_text=f"Cap {i}",
                reasoning=f"Reason {i}",
                status=status,
            )
            mock_db_session.add(moment)

        mock_db_session.flush()

        from src.services.clipping_service import get_clip_stats

        result = get_clip_stats(client.id)
        assert result["total"] == 4
        assert result["ready"] == 2
        assert result["posted"] == 1
        assert result["failed"] == 1
