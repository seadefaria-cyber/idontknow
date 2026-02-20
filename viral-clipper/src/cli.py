"""CLI entry point for the viral clipper pipeline.

Usage:
    python -m src.cli init-db
    python -m src.cli process-folder ./media/ --output ./output/
    python -m src.cli add-account
    python -m src.cli list-accounts
    python -m src.cli login-account --platform instagram --username myuser
    python -m src.cli test-account --platform instagram --username myuser
    python -m src.cli clip-and-post ./media/ [--dry-run]
    python -m src.cli post-worker
"""
import argparse
import getpass
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import structlog

from src.config import get_settings
from src.database import create_tables, get_db_session, init_db

logger = structlog.get_logger()


# ---------------------------------------------------------------------------
# Phase 1: init-db
# ---------------------------------------------------------------------------

def cmd_init_db(args) -> None:
    """Create database tables."""
    settings = get_settings()
    init_db(settings.database_url)
    create_tables()

    # Create a default client if none exists
    from src.models.client import Client
    with get_db_session() as session:
        if session.query(Client).count() == 0:
            client = Client(name="default")
            session.add(client)
            session.flush()
            print(f"Created default client (id={client.id}).")

    print(f"Database initialized at: {settings.database_url}")
    print("Tables created: clients, sources, clip_moments, generated_clips, accounts, post_jobs")


# ---------------------------------------------------------------------------
# Phase 2: process-folder
# ---------------------------------------------------------------------------

def cmd_process_folder(args) -> None:
    """Process all video files in a folder through the clipping pipeline."""
    settings = get_settings()

    input_dir = Path(args.folder)
    output_dir = Path(args.output)

    if not input_dir.is_dir():
        print(f"ERROR: Not a directory: {input_dir}")
        sys.exit(1)

    # Find video files
    video_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
    video_files = sorted(
        f for f in input_dir.iterdir()
        if f.suffix.lower() in video_extensions and not f.name.startswith(".")
    )

    if not video_files:
        print(f"No video files found in {input_dir}")
        sys.exit(1)

    print(f"Found {len(video_files)} video(s) in {input_dir}")
    output_dir.mkdir(parents=True, exist_ok=True)

    from src.services.pipeline_service import PipelineService
    pipeline = PipelineService(settings)

    for i, video_path in enumerate(video_files, 1):
        print(f"\n{'='*60}")
        print(f"[{i}/{len(video_files)}] Processing: {video_path.name}")
        print(f"{'='*60}")

        video_output_dir = output_dir / video_path.stem
        video_output_dir.mkdir(parents=True, exist_ok=True)

        try:
            clips = pipeline.process_video(video_path, video_output_dir)
            print(f"  -> Generated {len(clips)} clip(s) in {video_output_dir}")
        except Exception as e:
            print(f"  ERROR: {e}")
            logger.exception("video_processing_failed", video=str(video_path))

    print(f"\nDone! All clips saved to: {output_dir}")


# ---------------------------------------------------------------------------
# Phase 4: Account management
# ---------------------------------------------------------------------------

def cmd_add_account(args) -> None:
    """Interactively add a social media account."""
    settings = get_settings()

    if not settings.encryption_key:
        print("ERROR: ENCRYPTION_KEY not set in .env")
        print("Generate one: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"")
        sys.exit(1)

    init_db(settings.database_url)

    print("=== Add Social Media Account ===\n")
    print("Platforms: instagram, tiktok, twitter")
    platform = input("Platform: ").strip().lower()
    if platform not in ("instagram", "tiktok", "twitter", "youtube"):
        print(f"ERROR: Unknown platform '{platform}'")
        sys.exit(1)

    username = input("Username (e.g., @nettspend.clips1): ").strip().lstrip("@")
    password = getpass.getpass("Password (stored encrypted): ")

    credentials = {"username": username, "password": password}

    from src.services.distribution_service import add_account
    account_id = add_account(
        client_id=1,
        platform=platform,
        username=username,
        credentials=credentials,
    )

    print(f"\nAccount added (id={account_id}): {platform}/@{username}")
    print(f"Next: python -m src.cli login-account --platform {platform} --username {username}")


def cmd_list_accounts(args) -> None:
    """List all accounts grouped by platform."""
    settings = get_settings()
    init_db(settings.database_url)

    from src.models.distribution import Account
    with get_db_session() as session:
        accounts = session.query(Account).order_by(Account.platform, Account.username).all()

        if not accounts:
            print("No accounts configured. Add one with: python -m src.cli add-account")
            return

        current_platform = None
        for acct in accounts:
            if acct.platform.value != current_platform:
                current_platform = acct.platform.value
                print(f"\n  {current_platform.upper()}")
                print(f"  {'─'*40}")
            cookie_status = "session saved" if acct.cookie_path else "no session"
            print(f"    @{acct.username} [{acct.status.value}] ({cookie_status})")

    print()


def cmd_login_account(args) -> None:
    """Open browser for manual login and save session cookies."""
    settings = get_settings()
    init_db(settings.database_url)

    from src.models.distribution import Account
    with get_db_session() as session:
        acct = (
            session.query(Account)
            .filter_by(platform=args.platform, username=args.username)
            .first()
        )
        if not acct:
            print(f"ERROR: Account not found: {args.platform}/@{args.username}")
            print("Add it first: python -m src.cli add-account")
            sys.exit(1)
        account_id = acct.id

    from src.distribution.playwright_base import PlaywrightBase
    poster = PlaywrightBase(settings)

    platform_urls = {
        "instagram": "https://www.instagram.com/accounts/login/",
        "tiktok": "https://www.tiktok.com/login",
        "twitter": "https://twitter.com/i/flow/login",
    }

    login_url = platform_urls.get(args.platform, "https://www.google.com")

    print(f"Opening {args.platform} login page in browser...")
    print("Log in manually, complete any CAPTCHA/2FA, then press Enter here when done.")

    cookie_path = poster.manual_login(
        url=login_url,
        account_id=account_id,
        platform=args.platform,
    )

    # Save cookie path to account
    with get_db_session() as session:
        acct = session.query(Account).get(account_id)
        acct.cookie_path = str(cookie_path)

    print(f"Session saved to: {cookie_path}")
    print("Future posts will use this session (no login needed).")


def cmd_test_account(args) -> None:
    """Test that an account session is still valid."""
    settings = get_settings()
    init_db(settings.database_url)

    from src.models.distribution import Account
    with get_db_session() as session:
        acct = (
            session.query(Account)
            .filter_by(platform=args.platform, username=args.username)
            .first()
        )
        if not acct:
            print(f"ERROR: Account not found: {args.platform}/@{args.username}")
            sys.exit(1)

        if not acct.cookie_path:
            print("ERROR: No saved session. Run login-account first.")
            sys.exit(1)

        cookie_path = acct.cookie_path

    from src.distribution.playwright_base import PlaywrightBase
    poster = PlaywrightBase(settings)

    platform_check_urls = {
        "instagram": "https://www.instagram.com/",
        "tiktok": "https://www.tiktok.com/foryou",
        "twitter": "https://twitter.com/home",
    }

    check_url = platform_check_urls.get(args.platform, "https://www.google.com")

    print(f"Testing {args.platform}/@{args.username} session...")
    ok = poster.test_session(cookie_path=cookie_path, check_url=check_url)

    if ok:
        print("Session is valid!")
    else:
        print("Session expired or invalid. Re-login with:")
        print(f"  python -m src.cli login-account --platform {args.platform} --username {args.username}")


# ---------------------------------------------------------------------------
# Phase 5: clip-and-post, post-worker
# ---------------------------------------------------------------------------

def cmd_clip_and_post(args) -> None:
    """Process folder, assign clips to accounts, schedule posts."""
    settings = get_settings()

    init_db(settings.database_url)

    input_dir = Path(args.folder)
    output_dir = Path(args.output)
    dry_run = args.dry_run

    if not input_dir.is_dir():
        print(f"ERROR: Not a directory: {input_dir}")
        sys.exit(1)

    # Step 1: Process videos into clips
    video_extensions = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
    video_files = sorted(
        f for f in input_dir.iterdir()
        if f.suffix.lower() in video_extensions and not f.name.startswith(".")
    )

    if not video_files:
        print(f"No video files found in {input_dir}")
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    from src.services.pipeline_service import PipelineService
    pipeline = PipelineService(settings)

    all_clips = []
    for i, video_path in enumerate(video_files, 1):
        print(f"\n[{i}/{len(video_files)}] Processing: {video_path.name}")
        video_output_dir = output_dir / video_path.stem
        video_output_dir.mkdir(parents=True, exist_ok=True)
        try:
            clips = pipeline.process_video(video_path, video_output_dir)
            all_clips.extend(clips)
            print(f"  -> {len(clips)} clip(s)")
        except Exception as e:
            print(f"  ERROR: {e}")

    if not all_clips:
        print("No clips generated. Nothing to post.")
        return

    # Step 2: Get active accounts
    import random
    from src.models.distribution import Account, AccountStatus
    with get_db_session() as session:
        accounts = (
            session.query(Account)
            .filter_by(status=AccountStatus.ACTIVE)
            .all()
        )
        if not accounts:
            print("\nNo active accounts. Add some with: python -m src.cli add-account")
            return

        account_data = [
            {"id": a.id, "platform": a.platform.value, "username": a.username}
            for a in accounts
        ]

    # Step 3: Assign clips to accounts (round-robin with staggered timing)
    assignments = []
    for i, clip_path in enumerate(all_clips):
        acct = account_data[i % len(account_data)]
        delay_minutes = random.randint(15, 45) * (i // len(account_data))
        assignments.append({
            "clip_path": str(clip_path),
            "account_id": acct["id"],
            "platform": acct["platform"],
            "username": acct["username"],
            "delay_minutes": delay_minutes,
        })

    # Step 4: Preview or schedule
    print(f"\n{'='*60}")
    print(f"Distribution Plan: {len(all_clips)} clips -> {len(account_data)} accounts")
    print(f"{'='*60}")

    for a in assignments:
        delay_str = f"+{a['delay_minutes']}min" if a["delay_minutes"] > 0 else "now"
        print(f"  {Path(a['clip_path']).name} -> {a['platform']}/@{a['username']} ({delay_str})")

    if dry_run:
        print("\n[DRY RUN] No posts scheduled. Remove --dry-run to post for real.")
        return

    # Save assignments as post jobs
    from src.models.distribution import PostJob, PostStatus
    now = datetime.now(timezone.utc)

    with get_db_session() as session:
        for a in assignments:
            job = PostJob(
                clip_id=0,
                account_id=a["account_id"],
                scheduled_at=now + timedelta(minutes=a["delay_minutes"]),
                status=PostStatus.QUEUED,
                post_caption="",
                hashtags="",
                error_message=a["clip_path"],  # Store clip path here for the worker
            )
            session.add(job)

    print(f"\nScheduled {len(assignments)} posts. Run the post worker:")
    print("  python -m src.cli post-worker")


def cmd_post_worker(args) -> None:
    """Pick up scheduled posts and execute them with delays."""
    import time

    settings = get_settings()
    init_db(settings.database_url)

    from src.models.distribution import Account, PostJob, PostStatus

    print("Post worker started. Watching for scheduled posts...")
    print("Press Ctrl+C to stop.\n")

    try:
        while True:
            now = datetime.now(timezone.utc)

            with get_db_session() as session:
                due_jobs = (
                    session.query(PostJob)
                    .filter(
                        PostJob.status == PostStatus.QUEUED,
                        PostJob.scheduled_at <= now,
                    )
                    .order_by(PostJob.scheduled_at)
                    .limit(5)
                    .all()
                )

                if not due_jobs:
                    pending = session.query(PostJob).filter_by(status=PostStatus.QUEUED).count()
                    if pending == 0:
                        print("No more scheduled posts. Worker exiting.")
                        return
                    time.sleep(30)
                    continue

                for job in due_jobs:
                    account = session.query(Account).get(job.account_id)
                    clip_path = job.error_message  # Stored clip path
                    platform = account.platform.value

                    print(f"Posting: {Path(clip_path).name} -> {platform}/@{account.username}")
                    job.status = PostStatus.POSTING

                    try:
                        if platform == "instagram":
                            from src.distribution.instagram import InstagramPoster
                            poster = InstagramPoster(settings)
                        elif platform == "tiktok":
                            from src.distribution.tiktok_playwright import TikTokPlaywrightPoster
                            poster = TikTokPlaywrightPoster(settings)
                        elif platform == "twitter":
                            from src.distribution.twitter import TwitterPoster
                            poster = TwitterPoster(settings)
                        else:
                            print(f"  Unsupported platform: {platform}")
                            job.status = PostStatus.FAILED
                            job.error_message = f"Unsupported platform: {platform}"
                            continue

                        result = poster.post_video(
                            video_path=Path(clip_path),
                            caption=job.post_caption,
                            account=account,
                        )

                        job.status = PostStatus.POSTED
                        job.posted_at = datetime.now(timezone.utc)
                        job.platform_post_id = result.get("platform_post_id", "")
                        job.error_message = None
                        account.last_posted_at = datetime.now(timezone.utc)
                        print(f"  Posted successfully!")

                    except Exception as e:
                        job.status = PostStatus.FAILED
                        job.error_message = str(e)
                        print(f"  FAILED: {e}")

            time.sleep(10)
    except KeyboardInterrupt:
        print("\nWorker stopped.")


# ---------------------------------------------------------------------------
# Legacy commands
# ---------------------------------------------------------------------------

def cmd_process_url(args) -> None:
    """Process a video URL through the full pipeline."""
    settings = get_settings()
    init_db(settings.database_url)

    from src.services.ingestion_service import add_source_from_url
    source_id = add_source_from_url(args.client_id, args.url)
    print(f"Source {source_id} created. Processing pipeline started.")


def cmd_process_file(args) -> None:
    """Process a local video file through the pipeline."""
    settings = get_settings()
    init_db(settings.database_url)

    path = Path(args.file_path)
    if not path.exists():
        print(f"Error: File not found: {args.file_path}")
        sys.exit(1)

    from src.services.ingestion_service import add_source_from_file
    source_id = add_source_from_file(
        client_id=args.client_id,
        file_path=str(path.absolute()),
        title=path.stem,
        duration_seconds=0,
    )
    print(f"Source {source_id} created from file.")


def cmd_status(args) -> None:
    """Show pipeline status."""
    settings = get_settings()
    init_db(settings.database_url)

    from src.services.clipping_service import get_clip_stats
    from src.services.distribution_service import get_account_health
    from src.services.ingestion_service import get_client_sources

    sources = get_client_sources(args.client_id)
    stats = get_clip_stats(args.client_id)
    accounts = get_account_health(args.client_id)

    print(f"\n=== Client {args.client_id} Status ===\n")
    print(f"Sources: {len(sources)}")
    for s in sources[:10]:
        print(f"  [{s['status']}] {s['title']} ({s['duration_seconds']:.0f}s)")

    print(f"\nClips: {stats['total']} total, {stats['ready']} ready, {stats['posted']} posted")

    print(f"\nAccounts: {len(accounts)}")
    for a in accounts:
        print(f"  [{a['status']}] {a['platform']}: @{a['username']}")


def cmd_serve(args) -> None:
    """Start the web dashboard."""
    import uvicorn
    uvicorn.run(
        "src.dashboard.app:create_app",
        factory=True,
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


# ---------------------------------------------------------------------------
# Main parser
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Viral Clipper — AI-powered video clipping pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # init-db
    subparsers.add_parser("init-db", help="Create database tables")

    # process-folder
    pf = subparsers.add_parser("process-folder", help="Process all videos in a folder")
    pf.add_argument("folder", type=str, help="Input folder with video files")
    pf.add_argument("--output", "-o", default="./output", help="Output directory for clips")

    # add-account
    subparsers.add_parser("add-account", help="Add a social media account (interactive)")

    # list-accounts
    subparsers.add_parser("list-accounts", help="List all configured accounts")

    # login-account
    la = subparsers.add_parser("login-account", help="Login to account in browser, save session")
    la.add_argument("--platform", required=True, help="Platform (instagram, tiktok, twitter)")
    la.add_argument("--username", required=True, help="Account username")

    # test-account
    ta = subparsers.add_parser("test-account", help="Test if account session is still valid")
    ta.add_argument("--platform", required=True, help="Platform (instagram, tiktok, twitter)")
    ta.add_argument("--username", required=True, help="Account username")

    # clip-and-post
    cap = subparsers.add_parser("clip-and-post", help="Process videos and distribute to accounts")
    cap.add_argument("folder", type=str, help="Input folder with video files")
    cap.add_argument("--output", "-o", default="./output", help="Output directory for clips")
    cap.add_argument("--dry-run", action="store_true", help="Preview distribution without posting")

    # post-worker
    subparsers.add_parser("post-worker", help="Run the posting worker (executes scheduled posts)")

    # Legacy commands
    url_parser = subparsers.add_parser("process-url", help="Process a video URL")
    url_parser.add_argument("client_id", type=int)
    url_parser.add_argument("url", type=str)

    file_parser = subparsers.add_parser("process-file", help="Process a local file")
    file_parser.add_argument("client_id", type=int)
    file_parser.add_argument("file_path", type=str)

    status_parser = subparsers.add_parser("status", help="Show client status")
    status_parser.add_argument("client_id", type=int)

    serve_parser = subparsers.add_parser("serve", help="Start the web dashboard")
    serve_parser.add_argument("--host", default="127.0.0.1")
    serve_parser.add_argument("--port", type=int, default=8000)
    serve_parser.add_argument("--reload", action="store_true")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    commands = {
        "init-db": cmd_init_db,
        "process-folder": cmd_process_folder,
        "add-account": cmd_add_account,
        "list-accounts": cmd_list_accounts,
        "login-account": cmd_login_account,
        "test-account": cmd_test_account,
        "clip-and-post": cmd_clip_and_post,
        "post-worker": cmd_post_worker,
        "process-url": cmd_process_url,
        "process-file": cmd_process_file,
        "status": cmd_status,
        "serve": cmd_serve,
    }

    handler = commands.get(args.command)
    if handler:
        handler(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
