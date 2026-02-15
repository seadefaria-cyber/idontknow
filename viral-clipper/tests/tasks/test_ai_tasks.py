from unittest.mock import MagicMock, patch

from src.ai.moment_detector import ViralMoment
from src.models.client import Client, Source, SourceStatus
from src.models.content import ClipMoment, MomentStatus


class TestDetectMomentsTask:
    @patch("src.tasks.clipper_tasks.generate_clip")
    @patch("src.tasks.ai_tasks.MomentDetector")
    @patch("src.tasks.ai_tasks.get_settings")
    def test_creates_clip_moments(self, mock_settings, mock_detector_class, mock_gen_clip, mock_db_session, settings):
        mock_settings.return_value = settings
        mock_gen_clip.send = MagicMock()

        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        source = Source(
            client_id=client.id,
            file_path="/tmp/test.mp4",
            title="Test",
            duration_seconds=300.0,
            status=SourceStatus.READY,
            transcript_json={"segments": [{"start": 0, "end": 300, "text": "test"}]},
        )
        mock_db_session.add(source)
        mock_db_session.flush()

        mock_detector = MagicMock()
        mock_detector.detect_moments.return_value = [
            ViralMoment(
                start_time=10.0,
                end_time=40.0,
                hook_text="Amazing",
                caption_text="Great #viral",
                viral_score=90,
                reasoning="Very engaging",
            )
        ]
        mock_detector_class.return_value = mock_detector

        from src.tasks.ai_tasks import detect_moments

        detect_moments(source.id)

        moments = mock_db_session.query(ClipMoment).filter_by(source_id=source.id).all()
        assert len(moments) == 1
        assert moments[0].viral_score == 90

    @patch("src.tasks.ai_tasks.get_settings")
    def test_source_not_ready_returns(self, mock_settings, mock_db_session, settings):
        mock_settings.return_value = settings

        client = Client(name="Test")
        mock_db_session.add(client)
        mock_db_session.flush()

        source = Source(
            client_id=client.id,
            file_path="/tmp/test.mp4",
            title="Test",
            duration_seconds=300.0,
            status=SourceStatus.PENDING,
        )
        mock_db_session.add(source)
        mock_db_session.flush()

        from src.tasks.ai_tasks import detect_moments

        # Should not raise, just return
        detect_moments(source.id)

        moments = mock_db_session.query(ClipMoment).all()
        assert len(moments) == 0
