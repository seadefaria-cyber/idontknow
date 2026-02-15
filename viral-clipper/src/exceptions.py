from typing import Optional


class ViralClipperError(Exception):
    """Base exception for all viral clipper errors."""


class FFmpegError(ViralClipperError):
    """FFmpeg operation failed."""

    def __init__(
        self,
        message: str,
        command: Optional[list[str]] = None,
        stderr: Optional[str] = None,
        returncode: Optional[int] = None,
    ):
        super().__init__(message)
        self.command = command
        self.stderr = stderr
        self.returncode = returncode


class TranscriptionError(ViralClipperError):
    """WhisperX transcription failed."""


class AIDetectionError(ViralClipperError):
    """AI moment detection or hook generation failed."""


class DownloadError(ViralClipperError):
    """Video download failed."""


class URLValidationError(ViralClipperError):
    """URL failed validation (SSRF protection)."""


class PostingError(ViralClipperError):
    """Platform posting failed."""

    def __init__(self, message: str, platform: str, account_id: int):
        super().__init__(message)
        self.platform = platform
        self.account_id = account_id


class QualityCheckError(ViralClipperError):
    """Generated clip failed quality validation."""


class StorageError(ViralClipperError):
    """File storage operation failed."""
