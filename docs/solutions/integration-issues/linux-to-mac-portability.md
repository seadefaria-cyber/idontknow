---
title: Adapt viral-clipper AI video pipeline to run on macOS with zero external services
date: 2026-02-16
category: integration-issues
tags:
  - macOS compatibility
  - database abstraction
  - SQLite migration
  - FFmpeg configuration
  - local-first architecture
  - synchronous execution
  - CLI workflow
  - browser automation
component: viral-clipper
severity: high
symptoms:
  - PostgreSQL connection required, fails on Mac without database server
  - Redis URL mandatory in configuration, no local fallback
  - FFmpeg font path hardcoded to Linux filesystem
  - WhisperX defaults require GPU (CUDA), incompatible with Mac
  - No synchronous execution mode for local testing
  - No CLI commands for account management or database initialization
  - No browser automation for social media posting
  - Task queue (Dramatiq) assumed always available
root_cause: Codebase designed exclusively for Linux production environment with PostgreSQL + Redis + GPU
resolution_type: multi-file refactor with new modules
---

# Linux-to-Mac Portability: Making viral-clipper Run Locally

## Problem

The viral-clipper AI video pipeline was built for a Linux server environment and required PostgreSQL, Redis, CUDA GPU, and Linux-specific font paths. None of these are available on a standard Mac development setup. The pipeline needed to run locally with **zero external services**.

## Root Cause

Eight separate platform-specific assumptions throughout the codebase:

1. **`config.py`** — `PostgresDsn` type enforced PostgreSQL-only; Redis URL was mandatory
2. **`database.py`** — Connection pooling settings only valid for PostgreSQL
3. **`models/client.py`** — Used `JSONB` (PostgreSQL-only column type)
4. **`models/content.py`** — Used `postgresql_where` partial index
5. **`models/distribution.py`** — Used `postgresql_where` partial index
6. **`clipper/ffmpeg_ops.py`** — Hardcoded Linux font path: `/usr/share/fonts/truetype/montserrat/Montserrat-Bold.ttf`
7. **WhisperX defaults** — `cuda` device, `float16` compute, `large-v3` model (all GPU-only)
8. **No sync mode** — All processing assumed Redis/Dramatiq task queue

## Solution Steps

### 1. SQLite Support in `database.py`

Added SQLite detection with appropriate settings (no connection pooling, WAL mode, foreign keys):

```python
is_sqlite = database_url.startswith("sqlite")

if is_sqlite:
    _engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
```

Also added `create_tables()` to create all ORM tables directly (no Alembic needed for local dev).

### 2. Mac-Aware Config Defaults in `config.py`

- Changed `database_url` from `PostgresDsn` to `str` with default `sqlite:///./data/clipper.db`
- Made `redis_url` `Optional[str]` defaulting to `None`
- Removed `min_length` validators on `encryption_key` and `claude_api_key` (allow empty for partial use)
- Added auto-detecting font path:

```python
def _detect_mac_font() -> str:
    mac_font_paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for font_path in mac_font_paths:
        if Path(font_path).exists():
            return font_path
    return "/System/Library/Fonts/Helvetica.ttc"
```

- WhisperX defaults changed: `base` model, `cpu` device, `int8` compute, 1 concurrent transcription

### 3. Fixed PostgreSQL-Specific ORM Features

- `models/client.py`: `JSONB` → `JSON` (SQLAlchemy generic type)
- `models/content.py`: Removed `postgresql_where` from partial index on `viral_score`
- `models/distribution.py`: Removed `postgresql_where` from partial index on `scheduled_at`; added `cookie_path` field for Playwright sessions

### 4. Fixed Hardcoded Font Path in `ffmpeg_ops.py`

```python
# Before (line 113):
f":fontfile=/usr/share/fonts/truetype/montserrat/Montserrat-Bold.ttf"

# After:
safe_font = self.settings.font_path.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
f":fontfile='{safe_font}'"
```

### 5. New Synchronous Pipeline (`services/pipeline_service.py`)

Full orchestrator that runs without Redis:

```
video file → WhisperX transcribe → Claude detect moments → Claude generate hooks
  → FFmpeg extract clips → FFmpeg burn ASS captions → FFmpeg add hook overlay
  → FFmpeg crop to 9:16 → output/video_name/clip_001.mp4
```

### 6. New CLI Commands (`cli.py`)

- `init-db` — Create SQLite database + tables + default client
- `process-folder` — Process all videos in a directory
- `add-account` — Interactive account creation with encrypted credentials
- `list-accounts` — Show accounts grouped by platform
- `login-account` — Open browser for manual login, save session cookies
- `test-account` — Verify saved session is still valid
- `clip-and-post` — Process videos + distribute to accounts (with `--dry-run`)
- `post-worker` — Execute scheduled posts with staggered timing

### 7. Playwright Browser Automation

Four new files for posting via browser:

- `distribution/playwright_base.py` — Cookie persistence, random delays, manual login flow, screenshot on error
- `distribution/instagram.py` — Upload via file input, caption, share
- `distribution/tiktok_playwright.py` — Upload page automation
- `distribution/twitter.py` — Compose tweet + attach video

### 8. Mac Setup Script (`scripts/setup_mac.sh`)

One-command setup: installs FFmpeg, Python deps, WhisperX (CPU), Playwright Chromium, creates dirs, generates encryption key, initializes database.

## Files Changed

| File | Change |
|------|--------|
| `src/config.py` | SQLite default, optional Redis, auto font detection, CPU WhisperX |
| `src/database.py` | SQLite support, WAL mode, `create_tables()` |
| `src/models/client.py` | `JSONB` → `JSON` |
| `src/models/content.py` | Removed `postgresql_where` |
| `src/models/distribution.py` | Removed `postgresql_where`, added `cookie_path` |
| `src/clipper/ffmpeg_ops.py` | Dynamic font path from settings |
| `src/cli.py` | 8 new commands for local workflow |
| `.env.example` | Mac-friendly defaults |
| `requirements.txt` | Added Playwright, made PostgreSQL/Redis optional |

## New Files Created

| File | Purpose |
|------|---------|
| `src/services/pipeline_service.py` | Synchronous orchestrator (no Redis) |
| `src/distribution/playwright_base.py` | Browser automation base class |
| `src/distribution/instagram.py` | Instagram poster |
| `src/distribution/tiktok_playwright.py` | TikTok poster |
| `src/distribution/twitter.py` | X/Twitter poster |
| `scripts/setup_mac.sh` | Mac install script |

## Prevention Strategies

### Avoid Platform-Specific Dependencies

- **Use SQLAlchemy generic types** (`JSON`, not `JSONB`) unless the PostgreSQL feature is specifically needed
- **Never hardcode filesystem paths** — use config settings or runtime detection
- **Default to CPU** for ML model settings; let GPU users opt in via config
- **Make external services optional** — the pipeline should be able to run synchronously without Redis/RabbitMQ/etc

### Portable Code Checklist

- [ ] Database column types: use cross-DB SQLAlchemy types
- [ ] Index definitions: no `postgresql_where` or dialect-specific options
- [ ] File paths: detect OS or use config, never hardcode
- [ ] ML defaults: CPU-compatible out of the box
- [ ] External services: optional with sensible local fallbacks
- [ ] Font paths: auto-detect per platform

### Test Cases That Would Catch This Early

```python
def test_config_loads_without_env():
    """Settings should load with defaults (no .env file needed)."""
    settings = Settings(claude_api_key="test", encryption_key="test")
    assert settings.database_url.startswith("sqlite")

def test_database_init_sqlite():
    """SQLite database should initialize without errors."""
    init_db("sqlite:///./test.db")
    create_tables()

def test_font_path_exists():
    """Auto-detected font path should point to a real file."""
    settings = Settings()
    assert Path(settings.font_path).exists()
```

## Related Documentation

- `docs/brainstorms/2026-02-14-fan-page-video-engine-brainstorm.md` — Original vision
- `docs/plans/2026-02-14-feat-viral-clipping-engine-plan.md` — Technical spec (937 lines)
- First entry in `docs/solutions/` — establishes the pattern for future solution docs

## Verification

```bash
# Setup
cd viral-clipper
./scripts/setup_mac.sh

# Initialize database
python -m src.cli init-db

# Process videos
python -m src.cli process-folder ./nettspend-media/ --output ./output/

# Manage accounts
python -m src.cli add-account
python -m src.cli login-account --platform instagram --username nettspend.clips1

# Distribute
python -m src.cli clip-and-post ./nettspend-media/ --dry-run
python -m src.cli clip-and-post ./nettspend-media/
python -m src.cli post-worker
```
