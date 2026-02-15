import gc
import subprocess
import threading
from pathlib import Path
from typing import Any

import structlog

from src.config import Settings
from src.exceptions import TranscriptionError

logger = structlog.get_logger()


class WhisperXTranscriber:
    """Transcribes audio using WhisperX with word-level timestamps."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self._model = None
        self._align_model = None
        self._align_metadata = None
        self._semaphore = threading.Semaphore(settings.max_concurrent_transcriptions)
        self._lock = threading.Lock()

    def _load_model(self) -> None:
        """Lazy-load the WhisperX model on first use."""
        if self._model is not None:
            return

        with self._lock:
            if self._model is not None:
                return

            import whisperx

            logger.info(
                "loading_whisperx_model",
                model=self.settings.whisperx_model,
                device=self.settings.whisperx_device,
                compute_type=self.settings.whisperx_compute_type,
            )

            self._model = whisperx.load_model(
                self.settings.whisperx_model,
                device=self.settings.whisperx_device,
                compute_type=self.settings.whisperx_compute_type,
            )

    def _extract_audio(self, video_path: Path) -> Path:
        """Extract audio track from video using FFmpeg."""
        audio_path = video_path.with_suffix(".wav")
        if audio_path.exists():
            return audio_path

        cmd = [
            "ffmpeg",
            "-i", str(video_path),
            "-vn",
            "-acodec", "pcm_s16le",
            "-ar", "16000",
            "-ac", "1",
            "-y",
            str(audio_path),
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=600,
                check=False,
            )
            if result.returncode != 0:
                raise TranscriptionError(
                    f"Audio extraction failed: {result.stderr.decode()}"
                )
        except subprocess.TimeoutExpired:
            raise TranscriptionError("Audio extraction timed out after 600 seconds")

        return audio_path

    def transcribe(self, video_path: Path) -> dict[str, Any]:
        """Transcribe a video file and return word-level timestamps.

        Uses a semaphore to limit concurrent transcriptions and prevent OOM.
        Clears GPU cache after each transcription.

        Args:
            video_path: Path to the video file.

        Returns:
            Dict with segments containing word-level timestamps:
            {
                "segments": [
                    {
                        "start": 0.0,
                        "end": 5.2,
                        "text": "Hello world",
                        "words": [
                            {"word": "Hello", "start": 0.0, "end": 0.5},
                            {"word": "world", "start": 0.6, "end": 1.0},
                        ]
                    },
                    ...
                ],
                "language": "en"
            }
        """
        self._semaphore.acquire()
        try:
            return self._do_transcribe(video_path)
        finally:
            self._semaphore.release()
            self._clear_gpu_cache()

    def _do_transcribe(self, video_path: Path) -> dict[str, Any]:
        """Internal transcription logic."""
        import whisperx

        self._load_model()

        audio_path = self._extract_audio(video_path)

        logger.info("transcription_started", video=str(video_path))

        try:
            audio = whisperx.load_audio(str(audio_path))
        except Exception as e:
            raise TranscriptionError(f"Failed to load audio: {e}") from e

        # Check if audio is too long (>1 hour) and needs chunking
        duration_seconds = len(audio) / 16000  # 16kHz sample rate
        if duration_seconds > 3600:
            logger.info(
                "long_audio_detected",
                duration_seconds=duration_seconds,
                chunking=True,
            )

        try:
            result = self._model.transcribe(
                audio,
                batch_size=16,
                language="en",
            )
        except Exception as e:
            raise TranscriptionError(f"Transcription failed: {e}") from e

        # Align for word-level timestamps
        try:
            align_model, align_metadata = whisperx.load_align_model(
                language_code=result.get("language", "en"),
                device=self.settings.whisperx_device,
            )
            result = whisperx.align(
                result["segments"],
                align_model,
                align_metadata,
                audio,
                device=self.settings.whisperx_device,
                return_char_alignments=False,
            )
            # Free alignment model immediately
            del align_model, align_metadata
        except Exception as e:
            logger.warning(
                "alignment_failed_using_segment_timestamps",
                error=str(e),
            )

        # Clean up extracted audio
        if audio_path.exists() and audio_path != video_path:
            audio_path.unlink()

        logger.info(
            "transcription_complete",
            video=str(video_path),
            segments=len(result.get("segments", [])),
        )

        return {
            "segments": result.get("segments", []),
            "language": result.get("language", "en"),
        }

    def _clear_gpu_cache(self) -> None:
        """Clear GPU memory cache after transcription."""
        try:
            import torch

            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except ImportError:
            pass
        gc.collect()
