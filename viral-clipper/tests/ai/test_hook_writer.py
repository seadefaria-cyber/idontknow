from unittest.mock import MagicMock
import json

import pytest

from src.ai.hook_writer import HookWriter


class TestExtractExcerpt:
    def _make_writer(self, settings):
        writer = HookWriter.__new__(HookWriter)
        writer.settings = settings
        writer.client = MagicMock()
        return writer

    def test_exact_range(self, settings):
        writer = self._make_writer(settings)
        transcript = {
            "segments": [
                {"start": 0.0, "end": 4.9, "text": "First"},
                {"start": 5.0, "end": 10.0, "text": "Second"},
                {"start": 10.1, "end": 15.0, "text": "Third"},
            ]
        }
        result = writer._extract_excerpt(transcript, 5.0, 10.0)
        assert "First" not in result
        assert "Second" in result
        assert "Third" not in result

    def test_partial_overlap(self, settings):
        writer = self._make_writer(settings)
        transcript = {
            "segments": [
                {"start": 0.0, "end": 5.0, "text": "First"},
                {"start": 5.0, "end": 10.0, "text": "Second"},
            ]
        }
        result = writer._extract_excerpt(transcript, 3.0, 7.0)
        assert "First" in result
        assert "Second" in result

    def test_no_match(self, settings):
        writer = self._make_writer(settings)
        transcript = {
            "segments": [{"start": 0.0, "end": 5.0, "text": "Only"}]
        }
        result = writer._extract_excerpt(transcript, 10.0, 15.0)
        assert result == ""

    def test_empty_segments(self, settings):
        writer = self._make_writer(settings)
        result = writer._extract_excerpt({"segments": []}, 0.0, 5.0)
        assert result == ""


class TestGenerateHooks:
    def test_successful_generation(self, settings):
        writer = HookWriter.__new__(HookWriter)
        writer.settings = settings
        writer.client = MagicMock()

        response_data = {
            "hooks": [
                {
                    "hook_text": "You won't believe this",
                    "post_caption": "Amazing content #viral",
                    "hook_style": "bold_claim",
                }
            ]
        }
        mock_response = MagicMock()
        mock_response.content = [MagicMock(text=json.dumps(response_data))]
        writer.client.messages.create.return_value = mock_response

        transcript = {"segments": [{"start": 0, "end": 30, "text": "test content"}]}
        result = writer.generate_hooks(0.0, 30.0, transcript)
        assert len(result) == 1
        assert result[0].hook_text == "You won't believe this"
