"""CLI entry point for the viral clipper pipeline.

Usage:
    python -m src.cli process-url <client_id> <url>
    python -m src.cli process-file <client_id> <file_path>
    python -m src.cli schedule <client_id>
    python -m src.cli status <client_id>
"""
import argparse
import sys
from datetime import datetime, timezone

import structlog

from src.config import get_settings
from src.database import init_db

logger = structlog.get_logger()


def process_url(client_id: int, url: str) -> None:
    """Process a video URL through the full pipeline."""
    from src.services.ingestion_service import add_source_from_url

    source_id = add_source_from_url(client_id, url)
    print(f"Source {source_id} created. Processing pipeline started.")
    print("Tasks queued: download -> transcribe -> detect moments -> generate clips")
    print(f"Monitor progress with: python -m src.cli status {client_id}")


def process_file(client_id: int, file_path: str) -> None:
    """Process a local video file through the pipeline."""
    from pathlib import Path

    path = Path(file_path)
    if not path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    from src.services.ingestion_service import add_source_from_file

    source_id = add_source_from_file(
        client_id=client_id,
        file_path=str(path.absolute()),
        title=path.stem,
        duration_seconds=0,  # Will be detected during transcription
    )
    print(f"Source {source_id} created from file. Transcription queued.")


def schedule_posts(client_id: int) -> None:
    """Schedule ready clips for posting today."""
    from src.services.distribution_service import schedule_daily_posts

    today = datetime.now(timezone.utc)
    count = schedule_daily_posts(client_id, today)
    print(f"Scheduled {count} posting jobs for today.")


def show_status(client_id: int) -> None:
    """Show pipeline status for a client."""
    from src.services.clipping_service import get_clip_stats
    from src.services.distribution_service import get_account_health
    from src.services.ingestion_service import get_client_sources

    sources = get_client_sources(client_id)
    stats = get_clip_stats(client_id)
    accounts = get_account_health(client_id)

    print(f"\n=== Client {client_id} Status ===\n")

    print(f"Sources: {len(sources)}")
    for s in sources[:10]:
        print(f"  [{s['status']}] {s['title']} ({s['duration_seconds']:.0f}s)")

    print(f"\nClips:")
    print(f"  Total:      {stats['total']}")
    print(f"  Ready:      {stats['ready']}")
    print(f"  Posted:     {stats['posted']}")
    print(f"  Generating: {stats['generating']}")
    print(f"  Failed:     {stats['failed']}")

    print(f"\nAccounts: {len(accounts)}")
    for a in accounts:
        print(
            f"  [{a['status']}] {a['platform']}: @{a['username']} "
            f"(posts: {a['total_posts']}, failed: {a['failed_posts']})"
        )


def main():
    parser = argparse.ArgumentParser(description="Viral Clipper CLI")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # process-url
    url_parser = subparsers.add_parser("process-url", help="Process a video URL")
    url_parser.add_argument("client_id", type=int)
    url_parser.add_argument("url", type=str)

    # process-file
    file_parser = subparsers.add_parser("process-file", help="Process a local file")
    file_parser.add_argument("client_id", type=int)
    file_parser.add_argument("file_path", type=str)

    # schedule
    sched_parser = subparsers.add_parser("schedule", help="Schedule posts for today")
    sched_parser.add_argument("client_id", type=int)

    # status
    status_parser = subparsers.add_parser("status", help="Show client status")
    status_parser.add_argument("client_id", type=int)

    # serve
    serve_parser = subparsers.add_parser("serve", help="Start the web dashboard")
    serve_parser.add_argument("--host", default="127.0.0.1", help="Host to bind")
    serve_parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    serve_parser.add_argument("--reload", action="store_true", help="Auto-reload on changes")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Serve doesn't need the database
    if args.command == "serve":
        import uvicorn

        uvicorn.run(
            "src.dashboard.app:create_app",
            factory=True,
            host=args.host,
            port=args.port,
            reload=args.reload,
        )
        return

    # Initialize database
    settings = get_settings()
    init_db(str(settings.database_url))

    if args.command == "process-url":
        process_url(args.client_id, args.url)
    elif args.command == "process-file":
        process_file(args.client_id, args.file_path)
    elif args.command == "schedule":
        schedule_posts(args.client_id)
    elif args.command == "status":
        show_status(args.client_id)


if __name__ == "__main__":
    main()
