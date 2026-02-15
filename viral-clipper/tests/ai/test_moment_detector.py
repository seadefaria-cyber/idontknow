import json
from unittest.mock import MagicMock

import pytest

from src.ai.moment_detector import MomentDetector, ViralMoment


def _make_moment(start, end, score, hook="test hook"):
    return ViralMoment(
        start_time=start,
        end_time=end,
        hook_text=hook,
        caption_text="test caption",
        viral_score=score,
        reasoning="test reasoning",
    )


class TestDeduplicateMoments:
    def _make_detector(self, settings):
        detector = MomentDetector.__new__(MomentDetector)
        detector.settings = settings
        detector.client = MagicMock()
        return detector

    def test_empty(self, settings):
        detector = self._make_detector(settings)
        assert detector._deduplicate_moments([]) == []

    def test_no_overlap(self, settings):
        detector = self._make_detector(settings)
        moments = [
            _make_moment(0, 10, 80),
            _make_moment(20, 30, 70),
        ]
        result = detector._deduplicate_moments(moments)
        assert len(result) == 2

    def test_full_overlap_keeps_higher_score(self, settings):
        detector = self._make_detector(settings)
        moments = [
            _make_moment(0, 10, 60),
            _make_moment(0, 10, 90),
        ]
        result = detector._deduplicate_moments(moments)
        assert len(result) == 1
        assert result[0].viral_score == 90

    def test_more_than_50_percent_overlap_deduplicates(self, settings):
        detector = self._make_detector(settings)
        moments = [
            _make_moment(0, 10, 80),
            _make_moment(4, 14, 70),  # 6s overlap out of 10s = 60%
        ]
        result = detector._deduplicate_moments(moments)
        assert len(result) == 1
        assert result[0].viral_score == 80

    def test_less_than_50_percent_overlap_keeps_both(self, settings):
        detector = self._make_detector(settings)
        moments = [
            _make_moment(0, 10, 80),
            _make_moment(6, 16, 70),  # 4s overlap out of 10s = 40%
        ]
        result = detector._deduplicate_moments(moments)
        assert len(result) == 2


class TestFormatTranscript:
    def _make_detector(self, settings):
        detector = MomentDetector.__new__(MomentDetector)
        detector.settings = settings
        detector.client = MagicMock()
        return detector

    def test_empty_transcript(self, settings):
        detector = self._make_detector(settings)
        assert detector._format_transcript({"segments": []}) == ""

    def test_empty_dict(self, settings):
        detector = self._make_detector(settings)
        assert detector._format_transcript({}) == ""

    def test_single_segment(self, settings):
        detector = self._make_detector(settings)
        transcript = {
            "segments": [{"start": 0.0, "end": 5.0, "text": "Hello world"}]
        }
        result = detector._format_transcript(transcript)
        assert result == "[0.0s - 5.0s] Hello world"

    def test_multi_segment(self, settings):
        detector = self._make_detector(settings)
        result = detector._format_transcript(
            {
                "segments": [
                    {"start": 0.0, "end": 5.0, "text": "First"},
                    {"start": 5.0, "end": 10.0, "text": "Second"},
                ]
            }
        )
        lines = result.split("\n")
        assert len(lines) == 2

    def test_strips_whitespace(self, settings):
        detector = self._make_detector(settings)
        result = detector._format_transcript(
            {"segments": [{"start": 0.0, "end": 1.0, "text": "  padded  "}]}
        )
        assert "padded" in result
        assert "  padded  " not in result


class TestDetectMoments:
    def test_sorted_output(self, settings):
        detector = MomentDetector.__new__(MomentDetector)
        detector.settings = settings
        detector.client = MagicMock()

        response_data = {
            "moments": [
                {
                    "start_time": 0,
                    "end_time": 30,
                    "hook_text": "low",
                    "caption_text": "cap",
                    "viral_score": 50,
                    "reasoning": "r",
                },
                {
                    "start_time": 30,
                    "end_time": 60,
                    "hook_text": "high",
                    "caption_text": "cap",
                    "viral_score": 90,
                    "reasoning": "r",
                },
            ]
        }
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=json.dumps(response_data))]
        detector.client.messages.create.return_value = mock_response

        result = detector.detect_moments({"segments": [{"start": 0, "end": 60, "text": "test"}]})
        assert result[0].viral_score == 90
        assert result[1].viral_score == 50

    def test_api_error_raises(self, settings):
        import anthropic

        detector = MomentDetector.__new__(MomentDetector)
        detector.settings = settings
        detector.client = MagicMock()
        detector.client.messages.create.side_effect = anthropic.APIError(
            message="fail", request=MagicMock(), body=None
        )

        from src.exceptions import AIDetectionError

        with pytest.raises(AIDetectionError, match="Claude API error"):
            detector.detect_moments({"segments": [{"start": 0, "end": 5, "text": "test"}]})

    def test_invalid_json_raises(self, settings):
        detector = MomentDetector.__new__(MomentDetector)
        detector.settings = settings
        detector.client = MagicMock()

        mock_response = MagicMock()
        mock_response.content = [MagicMock(text="not json at all")]
        detector.client.messages.create.return_value = mock_response

        from src.exceptions import AIDetectionError

        with pytest.raises(AIDetectionError, match="Moment detection failed"):
            detector.detect_moments({"segments": [{"start": 0, "end": 5, "text": "test"}]})
