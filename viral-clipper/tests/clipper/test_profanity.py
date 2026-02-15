from unittest.mock import MagicMock

from src.clipper.profanity import ProfanityFilter


def _make_filter():
    """Create a ProfanityFilter with a mocked FFmpegService."""
    mock_ffmpeg = MagicMock()
    return ProfanityFilter(mock_ffmpeg)


class TestDetectProfanity:
    def test_clean_text(self):
        pf = _make_filter()
        words = [
            {"word": "hello", "start": 0.0, "end": 0.5},
            {"word": "world", "start": 0.6, "end": 1.0},
        ]
        assert pf.detect_profanity(words) == []

    def test_detects_profanity(self):
        pf = _make_filter()
        words = [
            {"word": "this", "start": 0.0, "end": 0.3},
            {"word": "shit", "start": 0.4, "end": 0.7},
            {"word": "works", "start": 0.8, "end": 1.1},
        ]
        result = pf.detect_profanity(words)
        assert len(result) == 1
        assert result[0][0] == pytest.approx(0.35, abs=0.01)
        assert result[0][1] == pytest.approx(0.75, abs=0.01)

    def test_strips_punctuation(self):
        pf = _make_filter()
        words = [{"word": "shit!", "start": 1.0, "end": 1.5}]
        result = pf.detect_profanity(words)
        assert len(result) == 1

    def test_case_insensitive(self):
        pf = _make_filter()
        words = [{"word": "FUCK", "start": 2.0, "end": 2.5}]
        result = pf.detect_profanity(words)
        assert len(result) == 1

    def test_buffer_clamps_to_zero(self):
        pf = _make_filter()
        words = [{"word": "damn", "start": 0.01, "end": 0.3}]
        result = pf.detect_profanity(words)
        assert len(result) == 1
        assert result[0][0] == 0  # Clamped to 0

    def test_multiple_profanities(self):
        pf = _make_filter()
        words = [
            {"word": "fuck", "start": 1.0, "end": 1.3},
            {"word": "this", "start": 2.0, "end": 2.3},
            {"word": "shit", "start": 3.0, "end": 3.3},
        ]
        result = pf.detect_profanity(words)
        assert len(result) == 2

    def test_empty_words(self):
        pf = _make_filter()
        assert pf.detect_profanity([]) == []


import pytest


class TestMergeSegments:
    def test_empty(self):
        pf = _make_filter()
        assert pf._merge_segments([]) == []

    def test_single_segment(self):
        pf = _make_filter()
        result = pf._merge_segments([(1.0, 2.0)])
        assert result == [(1.0, 2.0)]

    def test_overlapping_merge(self):
        pf = _make_filter()
        result = pf._merge_segments([(1.0, 2.0), (1.5, 3.0)])
        assert result == [(1.0, 3.0)]

    def test_adjacent_no_merge(self):
        pf = _make_filter()
        result = pf._merge_segments([(1.0, 2.0), (2.5, 3.0)])
        assert result == [(1.0, 2.0), (2.5, 3.0)]

    def test_contained_segment(self):
        pf = _make_filter()
        result = pf._merge_segments([(1.0, 5.0), (2.0, 3.0)])
        assert result == [(1.0, 5.0)]

    def test_unsorted_input(self):
        pf = _make_filter()
        result = pf._merge_segments([(3.0, 4.0), (1.0, 2.0)])
        assert result == [(1.0, 2.0), (3.0, 4.0)]

    def test_touching_segments_merge(self):
        pf = _make_filter()
        result = pf._merge_segments([(1.0, 2.0), (2.0, 3.0)])
        assert result == [(1.0, 3.0)]
