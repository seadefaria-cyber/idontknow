from src.tasks.clipper_tasks import _extract_words_for_range


class TestExtractWordsForRange:
    def test_full_range(self, sample_transcript):
        words = _extract_words_for_range(sample_transcript, 0.0, 10.0)
        assert len(words) == 10  # All words from both segments

    def test_partial_range(self, sample_transcript):
        words = _extract_words_for_range(sample_transcript, 0.0, 1.0)
        # Words with end >= 0.0 and start <= 1.0
        assert len(words) >= 3

    def test_boundary(self, sample_transcript):
        # Exact boundary of a word
        words = _extract_words_for_range(sample_transcript, 0.3, 0.5)
        assert len(words) >= 1

    def test_no_match(self, sample_transcript):
        words = _extract_words_for_range(sample_transcript, 100.0, 200.0)
        assert words == []

    def test_empty_transcript(self):
        words = _extract_words_for_range({}, 0.0, 10.0)
        assert words == []

    def test_transcript_no_words(self):
        transcript = {"segments": [{"start": 0, "end": 5, "text": "hello"}]}
        words = _extract_words_for_range(transcript, 0.0, 5.0)
        assert words == []
