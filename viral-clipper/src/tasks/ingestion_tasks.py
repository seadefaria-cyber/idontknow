from pathlib import Path

import dramatiq
import structlog

from src.config import get_settings
from src.database import get_db_session
from src.exceptions import DownloadError, TranscriptionError
from src.ingestion.downloader import ContentDownloader
from src.ingestion.transcriber import WhisperXTranscriber
from src.models.client import Source, SourceStatus

logger = structlog.get_logger()

# Shared transcriber instance (lazy-loads model on first use)
_transcriber: WhisperXTranscriber | None = None


def _get_transcriber() -> WhisperXTranscriber:
    global _transcriber
    if _transcriber is None:
        _transcriber = WhisperXTranscriber(get_settings())
    return _transcriber


@dramatiq.actor(max_retries=2, min_backoff=30_000, max_backoff=300_000)
def download_source(source_id: int) -> None:
    """Download a source video from its URL.

    Updates the Source record with file path and status.
    On success, enqueues transcription.
    """
    settings = get_settings()
    downloader = ContentDownloader(settings)

    with get_db_session() as session:
        source = session.query(Source).get(source_id)
        if source is None:
            logger.error("source_not_found", source_id=source_id)
            return

        if not source.url:
            logger.error("source_has_no_url", source_id=source_id)
            return

        try:
            filepath = downloader.download(source.url, source.client_id)
            source.file_path = str(filepath)
            source.status = SourceStatus.TRANSCRIBING

            # Get video info for duration
            info = downloader.get_video_info(source.url)
            source.duration_seconds = info.get("duration", 0)
            if not source.title:
                source.title = info.get("title", "Untitled")

        except DownloadError as e:
            logger.error("download_failed", source_id=source_id, error=str(e))
            source.status = SourceStatus.FAILED
            return

    # Enqueue transcription after successful download
    transcribe_source.send(source_id)


@dramatiq.actor(max_retries=1, min_backoff=60_000, max_backoff=600_000)
def transcribe_source(source_id: int) -> None:
    """Transcribe a downloaded source video using WhisperX.

    Updates the Source record with transcript JSON.
    On success, enqueues moment detection.
    """
    transcriber = _get_transcriber()

    with get_db_session() as session:
        source = session.query(Source).get(source_id)
        if source is None:
            logger.error("source_not_found", source_id=source_id)
            return

        if source.status != SourceStatus.TRANSCRIBING:
            logger.warning(
                "source_not_in_transcribing_state",
                source_id=source_id,
                status=source.status.value,
            )
            return

        try:
            video_path = Path(source.file_path)
            if not video_path.exists():
                raise TranscriptionError(f"Video file not found: {video_path}")

            transcript = transcriber.transcribe(video_path)
            source.transcript_json = transcript
            source.status = SourceStatus.READY

            logger.info(
                "transcription_saved",
                source_id=source_id,
                segments=len(transcript.get("segments", [])),
            )

        except TranscriptionError as e:
            logger.error("transcription_failed", source_id=source_id, error=str(e))
            source.status = SourceStatus.FAILED
            return

    # Enqueue moment detection
    from src.tasks.ai_tasks import detect_moments

    detect_moments.send(source_id)
