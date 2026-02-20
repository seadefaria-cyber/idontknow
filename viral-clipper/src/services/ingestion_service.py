import structlog

from src.database import get_db_session
from src.models.client import Client, Source, SourceStatus

logger = structlog.get_logger()


def add_source_from_url(client_id: int, url: str, title: str = "") -> int:
    """Add a new source video from a URL and kick off processing.

    Creates the Source record, then enqueues download + transcription.

    Args:
        client_id: Client this source belongs to.
        url: Video URL (YouTube, TikTok, etc.).
        title: Optional title (will be extracted from URL if empty).

    Returns:
        The new Source record ID.
    """
    with get_db_session() as session:
        client = session.query(Client).get(client_id)
        if client is None:
            raise ValueError(f"Client {client_id} not found")

        source = Source(
            client_id=client_id,
            url=url,
            title=title or "Untitled",
            file_path="",
            duration_seconds=0,
            status=SourceStatus.PENDING,
        )
        session.add(source)
        session.flush()
        source_id = source.id

    # Enqueue download task
    from src.tasks.ingestion_tasks import download_source

    download_source.send(source_id)

    logger.info(
        "source_added",
        source_id=source_id,
        client_id=client_id,
        url=url,
    )

    return source_id


def add_source_from_file(
    client_id: int,
    file_path: str,
    title: str,
    duration_seconds: float,
) -> int:
    """Add a source video from a local file path.

    Skips download, goes directly to transcription.

    Args:
        client_id: Client this source belongs to.
        file_path: Path to the video file on disk.
        title: Video title.
        duration_seconds: Video duration.

    Returns:
        The new Source record ID.
    """
    with get_db_session() as session:
        client = session.query(Client).get(client_id)
        if client is None:
            raise ValueError(f"Client {client_id} not found")

        source = Source(
            client_id=client_id,
            file_path=file_path,
            title=title,
            duration_seconds=duration_seconds,
            status=SourceStatus.TRANSCRIBING,
        )
        session.add(source)
        session.flush()
        source_id = source.id

    # Skip download, go directly to transcription
    from src.tasks.ingestion_tasks import transcribe_source

    transcribe_source.send(source_id)

    logger.info(
        "source_file_added",
        source_id=source_id,
        client_id=client_id,
        file_path=file_path,
    )

    return source_id


def get_client_sources(client_id: int) -> list[dict]:
    """Get all sources for a client with their status."""
    with get_db_session() as session:
        sources = (
            session.query(Source)
            .filter_by(client_id=client_id)
            .order_by(Source.created_at.desc())
            .all()
        )
        return [
            {
                "id": s.id,
                "title": s.title,
                "url": s.url,
                "status": s.status.value,
                "duration_seconds": s.duration_seconds,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "has_transcript": s.transcript_json is not None,
            }
            for s in sources
        ]
