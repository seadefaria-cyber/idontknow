from src.exceptions import (
    FFmpegError,
    PostingError,
    ViralClipperError,
    TranscriptionError,
    AIDetectionError,
    DownloadError,
    URLValidationError,
    QualityCheckError,
    StorageError,
)


class TestExceptionHierarchy:
    def test_all_inherit_from_base(self):
        for cls in [
            FFmpegError,
            TranscriptionError,
            AIDetectionError,
            DownloadError,
            URLValidationError,
            PostingError,
            QualityCheckError,
            StorageError,
        ]:
            assert issubclass(cls, ViralClipperError)

    def test_base_is_exception(self):
        assert issubclass(ViralClipperError, Exception)

    def test_can_catch_with_base(self):
        try:
            raise FFmpegError("test")
        except ViralClipperError:
            pass  # Should be caught


class TestFFmpegError:
    def test_attrs(self):
        err = FFmpegError(
            "Failed",
            command=["ffmpeg", "-i", "test.mp4"],
            stderr="error output",
            returncode=1,
        )
        assert str(err) == "Failed"
        assert err.command == ["ffmpeg", "-i", "test.mp4"]
        assert err.stderr == "error output"
        assert err.returncode == 1

    def test_defaults(self):
        err = FFmpegError("Simple error")
        assert err.command is None
        assert err.stderr is None
        assert err.returncode is None


class TestPostingError:
    def test_attrs(self):
        err = PostingError("Upload failed", platform="tiktok", account_id=42)
        assert str(err) == "Upload failed"
        assert err.platform == "tiktok"
        assert err.account_id == 42
