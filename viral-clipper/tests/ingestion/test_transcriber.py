import subprocess
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.exceptions import TranscriptionError


class TestExtractAudio:
    def _make_transcriber(self, settings):
        from src.ingestion.transcriber import WhisperXTranscriber

        return WhisperXTranscriber(settings)

    @patch("src.ingestion.transcriber.subprocess.run")
    def test_success(self, mock_run, settings, tmp_path):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"", stderr=b"")
        transcriber = self._make_transcriber(settings)

        video = tmp_path / "test.mp4"
        video.write_bytes(b"fake")

        result = transcriber._extract_audio(video)
        assert result == video.with_suffix(".wav")
        mock_run.assert_called_once()

    def test_already_extracted(self, settings, tmp_path):
        transcriber = self._make_transcriber(settings)

        video = tmp_path / "test.mp4"
        video.write_bytes(b"fake")
        wav = tmp_path / "test.wav"
        wav.write_bytes(b"existing audio")

        result = transcriber._extract_audio(video)
        assert result == wav

    @patch("src.ingestion.transcriber.subprocess.run")
    def test_ffmpeg_failure(self, mock_run, settings, tmp_path):
        mock_run.return_value = MagicMock(
            returncode=1, stdout=b"", stderr=b"ffmpeg error"
        )
        transcriber = self._make_transcriber(settings)

        video = tmp_path / "test.mp4"
        video.write_bytes(b"fake")

        with pytest.raises(TranscriptionError, match="Audio extraction failed"):
            transcriber._extract_audio(video)

    @patch("src.ingestion.transcriber.subprocess.run")
    def test_timeout(self, mock_run, settings, tmp_path):
        mock_run.side_effect = subprocess.TimeoutExpired(cmd=["ffmpeg"], timeout=600)
        transcriber = self._make_transcriber(settings)

        video = tmp_path / "test.mp4"
        video.write_bytes(b"fake")

        with pytest.raises(TranscriptionError, match="timed out"):
            transcriber._extract_audio(video)
