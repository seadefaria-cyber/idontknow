import pytest

from src.clipper.captioner import (
    _build_events,
    _build_header,
    _format_timestamp,
    _group_words_into_lines,
    generate_ass_captions,
)


class TestFormatTimestamp:
    def test_zero(self):
        assert _format_timestamp(0) == "0:00:00.00"

    def test_negative_clamps_to_zero(self):
        assert _format_timestamp(-5.0) == "0:00:00.00"

    def test_fractional_seconds(self):
        assert _format_timestamp(1.5) == "0:00:01.50"

    def test_minutes(self):
        assert _format_timestamp(65.25) == "0:01:05.25"

    def test_hours(self):
        # Note: floating-point arithmetic causes 3661.99 % 1 ≈ 0.989..., so centiseconds = 98
        assert _format_timestamp(3661.99) == "1:01:01.98"

    def test_large_value(self):
        assert _format_timestamp(36000.0) == "10:00:00.00"

    @pytest.mark.parametrize(
        "seconds,expected",
        [
            (0.01, "0:00:00.01"),
            (0.99, "0:00:00.99"),
            (59.99, "0:00:59.99"),
            (3599.99, "0:59:59.98"),
        ],
    )
    def test_parametrized_edge_cases(self, seconds, expected):
        assert _format_timestamp(seconds) == expected


class TestGroupWordsIntoLines:
    def test_empty(self):
        assert _group_words_into_lines([]) == []

    def test_single_word(self):
        words = [{"word": "Hello", "start": 0, "end": 0.5}]
        result = _group_words_into_lines(words)
        assert len(result) == 1
        assert len(result[0]) == 1

    def test_exact_max_words(self):
        words = [{"word": f"w{i}", "start": i, "end": i + 0.5} for i in range(5)]
        result = _group_words_into_lines(words, max_words_per_line=5)
        assert len(result) == 1
        assert len(result[0]) == 5

    def test_overflow_creates_new_line(self):
        words = [{"word": f"w{i}", "start": i, "end": i + 0.5} for i in range(6)]
        result = _group_words_into_lines(words, max_words_per_line=5)
        assert len(result) == 2
        assert len(result[0]) == 5
        assert len(result[1]) == 1

    def test_custom_max_words(self):
        words = [{"word": f"w{i}", "start": i, "end": i + 0.5} for i in range(7)]
        result = _group_words_into_lines(words, max_words_per_line=3)
        assert len(result) == 3
        assert len(result[0]) == 3
        assert len(result[1]) == 3
        assert len(result[2]) == 1


class TestBuildHeader:
    def test_contains_script_info(self):
        header = _build_header()
        assert "[Script Info]" in header
        assert "PlayResX: 1080" in header
        assert "PlayResY: 1920" in header

    def test_contains_styles(self):
        header = _build_header()
        assert "[V4+ Styles]" in header
        assert "Montserrat Bold" in header
        assert "Style: Default," in header
        assert "Style: Highlight," in header


class TestBuildEvents:
    def test_empty_words(self):
        assert _build_events([], 0.0) == ""

    def test_with_offset(self):
        words = [{"word": "hello", "start": 10.0, "end": 10.5}]
        events = _build_events(words, clip_start_time=10.0)
        assert "0:00:00.00" in events

    def test_highlight_tags(self):
        words = [
            {"word": "hello", "start": 0.0, "end": 0.5},
            {"word": "world", "start": 0.6, "end": 1.0},
        ]
        events = _build_events(words, clip_start_time=0.0)
        assert "\\c&H0000FFFF&" in events  # Yellow highlight tag


class TestGenerateAssCaptions:
    def test_creates_file(self, tmp_path, sample_words):
        output = tmp_path / "test.ass"
        result = generate_ass_captions(sample_words, output)
        assert result == output
        assert output.exists()
        content = output.read_text()
        assert "[Script Info]" in content
        assert "[Events]" in content
        assert "Dialogue:" in content

    def test_empty_words_creates_file(self, tmp_path):
        output = tmp_path / "empty.ass"
        generate_ass_captions([], output)
        assert output.exists()
        content = output.read_text()
        assert "[Script Info]" in content
        assert "Dialogue:" not in content
