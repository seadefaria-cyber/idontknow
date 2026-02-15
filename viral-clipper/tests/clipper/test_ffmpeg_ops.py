import subprocess
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from src.clipper.ffmpeg_ops import FFmpegService
from src.exceptions import FFmpegError


class TestGetEncoderArgs:
    def test_nvenc_off(self, settings):
        settings.use_nvenc = False
        ffmpeg = FFmpegService(settings)
        args = ffmpeg._get_encoder_args()
        assert "-c:v" in args
        assert "libx264" in args
        assert "-crf" in args

    def test_nvenc_on(self, settings):
        settings.use_nvenc = True
        ffmpeg = FFmpegService(settings)
        args = ffmpeg._get_encoder_args()
        assert "h264_nvenc" in args
        assert "-preset" in args
        assert "p4" in args


class TestRun:
    @patch("src.clipper.ffmpeg_ops.subprocess.run")
    def test_success(self, mock_run, settings):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"ok", stderr=b"")
        ffmpeg = FFmpegService(settings)
        result = ffmpeg._run(["ffmpeg", "-version"])
        assert result.returncode == 0

    @patch("src.clipper.ffmpeg_ops.subprocess.run")
    def test_nonzero_exit_raises(self, mock_run, settings):
        mock_run.return_value = MagicMock(
            returncode=1, stdout=b"", stderr=b"error occurred"
        )
        ffmpeg = FFmpegService(settings)
        with pytest.raises(FFmpegError, match="exit code 1"):
            ffmpeg._run(["ffmpeg", "-invalid"])

    @patch("src.clipper.ffmpeg_ops.subprocess.run")
    def test_timeout_raises(self, mock_run, settings):
        mock_run.side_effect = subprocess.TimeoutExpired(cmd=["ffmpeg"], timeout=300)
        ffmpeg = FFmpegService(settings)
        with pytest.raises(FFmpegError, match="timed out"):
            ffmpeg._run(["ffmpeg", "-slow"])


class TestExtractClip:
    @patch("src.clipper.ffmpeg_ops.subprocess.run")
    def test_command_args(self, mock_run, settings, tmp_path):
        mock_run.return_value = MagicMock(returncode=0, stdout=b"", stderr=b"")
        ffmpeg = FFmpegService(settings)
        source = tmp_path / "source.mp4"
        output = tmp_path / "clip.mp4"

        ffmpeg.extract_clip(source, output, 10.0, 40.0)

        cmd = mock_run.call_args[0][0]
        assert "ffmpeg" in cmd[0]
        assert "-ss" in cmd
        assert "10.0" in cmd
        assert "-to" in cmd
        assert "40.0" in cmd


class TestValidateClip:
    def test_missing_file(self, settings, tmp_path):
        ffmpeg = FFmpegService(settings)
        result = ffmpeg.validate_clip(tmp_path / "nonexistent.mp4")
        assert result["passed"] is False
        assert "does not exist" in result["issues"][0]

    def test_empty_file(self, settings, tmp_path):
        empty = tmp_path / "empty.mp4"
        empty.write_bytes(b"")
        ffmpeg = FFmpegService(settings)
        result = ffmpeg.validate_clip(empty)
        assert result["passed"] is False
        assert "empty" in result["issues"][0]

    @patch("src.clipper.ffmpeg_ops.subprocess.run")
    def test_valid_clip(self, mock_run, settings, tmp_path):
        video_file = tmp_path / "valid.mp4"
        video_file.write_bytes(b"\x00" * 1024)

        import json

        probe_output = json.dumps(
            {
                "format": {"duration": "45.0"},
                "streams": [
                    {"codec_type": "video", "width": 1080, "height": 1920},
                    {"codec_type": "audio"},
                ],
            }
        )
        mock_run.return_value = MagicMock(
            returncode=0, stdout=probe_output.encode(), stderr=b""
        )
        ffmpeg = FFmpegService(settings)
        result = ffmpeg.validate_clip(video_file)
        assert result["passed"] is True
        assert result["issues"] == []

    @patch("src.clipper.ffmpeg_ops.subprocess.run")
    def test_wrong_resolution(self, mock_run, settings, tmp_path):
        video_file = tmp_path / "wrong_res.mp4"
        video_file.write_bytes(b"\x00" * 1024)

        import json

        probe_output = json.dumps(
            {
                "format": {"duration": "45.0"},
                "streams": [
                    {"codec_type": "video", "width": 1920, "height": 1080},
                    {"codec_type": "audio"},
                ],
            }
        )
        mock_run.return_value = MagicMock(
            returncode=0, stdout=probe_output.encode(), stderr=b""
        )
        ffmpeg = FFmpegService(settings)
        result = ffmpeg.validate_clip(video_file)
        assert result["passed"] is False
        assert any("1080x1920" in i for i in result["issues"])

    @patch("src.clipper.ffmpeg_ops.subprocess.run")
    def test_too_short(self, mock_run, settings, tmp_path):
        video_file = tmp_path / "short.mp4"
        video_file.write_bytes(b"\x00" * 1024)

        import json

        probe_output = json.dumps(
            {
                "format": {"duration": "10.0"},
                "streams": [
                    {"codec_type": "video", "width": 1080, "height": 1920},
                    {"codec_type": "audio"},
                ],
            }
        )
        mock_run.return_value = MagicMock(
            returncode=0, stdout=probe_output.encode(), stderr=b""
        )
        ffmpeg = FFmpegService(settings)
        result = ffmpeg.validate_clip(video_file)
        assert result["passed"] is False
        assert any("15-120s" in i for i in result["issues"])
