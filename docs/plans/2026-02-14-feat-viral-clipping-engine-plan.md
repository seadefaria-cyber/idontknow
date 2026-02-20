---
title: "feat: Viral Clipping Engine"
type: feat
status: active
date: 2026-02-14
deepened: 2026-02-14
brainstorm: docs/brainstorms/2026-02-14-fan-page-video-engine-brainstorm.md
---

# Viral Clipping Engine

## Enhancement Summary

**Deepened on:** 2026-02-14
**Agents used:** Performance Oracle, Security Sentinel, Architecture Strategist, Code Simplicity Reviewer, Python Code Reviewer, Technical Deep-dive Researcher, Spec Flow Analyzer

### Key Improvements

1. **Revised build strategy**: Start with TikTok-only, single-client MVP to ship in 3-4 weeks instead of 8-12. Full system built incrementally.
2. **Corrected cost estimates**: Claude API alone could reach $1,125/mo at full scale without optimization. Added batching, caching, and model tiering to stay under $300/mo.
3. **Parallel processing architecture**: Sequential processing takes 20+ hours for 62 videos. Parallel worker pools bring this to 2-3 hours.
4. **Security-first foundation**: Identified 15 security vulnerabilities including command injection, no auth, SSRF, and hardcoded credentials. Security must be addressed before writing feature code.
5. **Type-safe Python patterns**: SQLAlchemy 2.0 Mapped types, Pydantic models, Enums for statuses, Protocol-based interfaces for testability.
6. **Storage management**: Without cleanup, system generates 3.7TB/month. Added archival strategy.
7. **28 spec gaps identified**: Account creation legality, content uniqueness math, platform TOS compliance, ban cascade prevention, and more.

### Critical Risks Discovered

- **Claude API costs are 20-50x higher than estimated** without optimization (batching, caching, model tiering)
- **Sequential processing is impossible at scale** — 62 clips/day takes 20+ hours sequentially
- **No authentication on dashboard** means anyone with the URL can access all client data and credentials
- **FFmpeg shell=True enables command injection** — must use list format for all subprocess calls
- **3.7TB/month storage growth** with no cleanup strategy will crash the system in days
- **Account creation at scale may violate platform TOS** — legal review needed before launch

---

## Overview

Build a fully automated viral clipping engine for a fan page agency. The system ingests long-form content (interviews, podcasts, live streams, concerts), uses AI to identify viral-worthy moments, auto-clips them into short-form vertical videos with burned-in captions and scroll-stopping hooks, then auto-posts across 30 fan page accounts per client on TikTok, Instagram, YouTube Shorts, and X.

**Scale:** 1,860 unique clips per month per client. ~62 per day.

## Problem Statement

Running a clipping agency manually requires editing each video by hand — finding moments, trimming clips, adding captions, writing hooks, posting to accounts. At 1,860 clips/month per client across 30 accounts and 4 platforms, this is impossible to do manually. The system must automate the entire pipeline end-to-end while producing clips that match the quality of top clipping channels.

## Proposed Solution

A Python-based system built incrementally. Start with a TikTok-only MVP for 1 client, then expand to all platforms and multi-client.

### Build Strategy (Revised)

```
MVP (Weeks 1-4):   Core pipeline + TikTok posting for 1 client
Expand (Weeks 5-8): Add Instagram, YouTube, X posting + multi-client
Polish (Weeks 9-12): Dashboard, analytics, trend monitoring, learning loop
```

**Rationale**: The original 4-phase plan front-loads too much complexity. The simplicity review found 45-50% of planned features aren't needed for launch. Ship the core pipeline first, prove it works, then layer on complexity based on real needs.

## Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Language** | Python 3.11+ | Best ecosystem for video/AI/automation |
| **Video Processing** | FFmpeg (subprocess, list format — never shell=True) | Industry standard, fast, free |
| **Transcription** | WhisperX (local) | Best word-level timestamps via forced alignment, 60-70x real-time on GPU |
| **AI Brain** | Claude API (Anthropic) — Sonnet for bulk work, Opus for complex analysis | Best at nuanced content analysis. Use structured outputs (beta) for guaranteed JSON |
| **Task Queue** | Dramatiq + Redis | 52% higher throughput than Celery, simpler API |
| **Web Framework** | FastAPI + Jinja2 templates | Fast API for backend, simple HTML templates for dashboard |
| **Database** | PostgreSQL (SQLAlchemy 2.0 with Mapped types) | Multi-client, concurrent jobs, JSONB for transcripts |
| **File Storage** | Local (processing) + S3-compatible (archive) | 7-day local retention, auto-archive to S3 |
| **Captions** | ASS subtitle format | Full styling: Montserrat bold, white text + black stroke, yellow highlights for emphasis |
| **Profanity Detection** | WhisperX word timestamps + profanity wordlist | Precise word-level muting with 50ms buffer |
| **Browser Automation** | Playwright | Fallback for platforms without official posting APIs |
| **Proxy** | Bright Data residential rotating | Anti-detection for multi-account posting |
| **Config** | Pydantic Settings | Type-safe configuration with validation |
| **Secrets** | Environment variables + encrypted DB fields (Fernet) | Never hardcode credentials |

### Research Insights: Tech Choices

**WhisperX vs faster-whisper**: WhisperX is the correct choice. It provides word-level timestamps via wav2vec2 alignment (essential for caption sync) and speaker diarization (essential for multi-speaker content). faster-whisper is 4x faster but lacks these features.

**Claude Structured Outputs**: Anthropic released structured outputs in November 2025 (`anthropic-beta: structured-outputs-2025-11-13`). Use Pydantic models with `client.beta.messages.parse()` for guaranteed valid JSON from moment detection and hook writing. Eliminates retry logic for malformed responses.

**NVENC GPU Encoding**: FFmpeg with NVIDIA NVENC provides 73-82% better price/performance vs CPU encoding. Use `-c:v h264_nvenc -preset p4 -tune hq` when GPU is available. This is critical for processing 62+ clips/day.

## Technical Approach

### Architecture

```
                    +------------------+
                    |  Client Dashboard|
                    |  (FastAPI + HTML) |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Service Layer   |
                    | (orchestration)  |
                    +--------+---------+
                             |
                    +--------v---------+
                    |   PostgreSQL DB   |
                    |  (clients, clips, |
                    |   accounts, jobs) |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
    +---------v--+  +--------v---+  +-------v--------+
    | Ingestion  |  |  AI Brain  |  | Distribution   |
    | Service    |  | (Claude)   |  | Service        |
    +-----+------+  +-----+------+  +-------+--------+
          |               |                 |
    +-----v------+  +-----v------+  +-------v--------+
    | WhisperX   |  | Clip Plan  |  | Platform APIs  |
    | Transcribe |  | Generator  |  | + Playwright   |
    +-----+------+  +-----+------+  +-------+--------+
          |               |                 |
    +-----v------+  +-----v------+  +-------v--------+
    | FFmpeg     |  | Hook/Caption| | Proxy Rotation |
    | Pipeline   |  | Writer     |  | (Bright Data)  |
    +------------+  +------------+  +----------------+
```

All services communicate through PostgreSQL and Dramatiq task queue. One Python application with different entry points (web server, task workers). **New**: Added a service layer between dashboard and domain modules to prevent layering violations.

### Architecture Insights

**Monolith is correct**: The architecture review confirmed a Python monolith is the right choice for initial scale. Don't consider microservices until scaling beyond 50 clients or needing to scale transcription independently.

**Service layer needed**: Without it, dashboard routes will import FFmpeg operations directly (presentation → infrastructure violation). Introduce `src/services/` with high-level orchestration functions that tasks and routes both call.

**Circuit breakers for external deps**: The system has 9 critical external dependencies (FFmpeg, WhisperX, Claude API, 4 platform APIs, proxies, PostgreSQL). Any one failing halts the pipeline. Implement circuit breaker pattern with fallbacks.

**Pipeline pattern**: Formalize the clip generation as an explicit pipeline class. This enables per-client customization, A/B testing, and debugging (re-run from specific stage).

### Implementation Phases

---

#### Phase 1: Core Clipping Pipeline (Weeks 1-2)

**Goal:** Feed in a YouTube URL or video file, get back finished clips with captions.

**This is the foundation. Nothing else works without this.**

##### 1.1 Project Setup

```
viral-clipper/
├── src/
│   ├── __init__.py
│   ├── config.py              # Pydantic Settings (type-safe, validated)
│   ├── exceptions.py          # Custom exception hierarchy
│   ├── models/                # Split by domain
│   │   ├── __init__.py
│   │   ├── client.py          # Client, Source models
│   │   ├── content.py         # ClipMoment, GeneratedClip models
│   │   └── distribution.py    # Account, PostJob models
│   ├── services/              # Service layer (orchestration)
│   │   ├── __init__.py
│   │   ├── ingestion_service.py
│   │   ├── clipping_service.py
│   │   └── distribution_service.py
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── downloader.py      # yt-dlp with URL allowlist (SSRF protection)
│   │   └── transcriber.py     # WhisperX with memory management
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── moment_detector.py # Claude structured outputs for moments
│   │   ├── hook_writer.py     # Generate hooks and captions
│   │   └── prompts.py         # All AI prompts (centralized)
│   ├── clipper/
│   │   ├── __init__.py
│   │   ├── ffmpeg_ops.py      # FFmpeg service class (list format, no shell=True)
│   │   ├── captioner.py       # ASS subtitle generation
│   │   ├── cropper.py         # Vertical crop (center crop for MVP, face detection later)
│   │   └── profanity.py       # Detect and mute profanity
│   ├── distribution/
│   │   ├── __init__.py
│   │   ├── base.py            # PlatformPoster protocol (shared interface)
│   │   ├── scheduler.py       # Post scheduling logic
│   │   ├── tiktok.py          # TikTok posting (MVP platform)
│   │   ├── instagram.py       # Instagram Reels posting
│   │   ├── youtube.py         # YouTube Shorts posting
│   │   └── twitter.py         # X/Twitter posting
│   ├── dashboard/
│   │   ├── __init__.py
│   │   ├── app.py             # FastAPI app with auth middleware
│   │   ├── auth.py            # Authentication (required before any feature code)
│   │   ├── routes.py          # API routes with authorization checks
│   │   └── templates/         # Jinja2 HTML templates (auto-escaping ON)
│   └── tasks/                 # Split by domain (avoid God Task)
│       ├── __init__.py
│       ├── ingestion_tasks.py
│       ├── ai_tasks.py
│       ├── clipper_tasks.py
│       └── distribution_tasks.py
├── tests/
├── migrations/                # Alembic DB migrations
├── requirements.txt           # Pin ALL versions
├── .env.example               # Template (never commit .env)
├── .gitignore                 # Include .env, credentials, storage/
└── docker-compose.yml         # PostgreSQL + Redis
```

**Key changes from original**:
- `models.py` split into 3 files by domain (prevents coupling)
- `tasks.py` split into 4 files by domain (prevents God Task anti-pattern)
- Added `services/` layer for orchestration
- Added `exceptions.py` for custom exception hierarchy
- Added `auth.py` for dashboard authentication
- Added `base.py` protocol for platform posters
- Added `.env.example` and `.gitignore` for secrets

##### 1.2 Content Ingestion

- **downloader.py**: Use `yt-dlp` to download videos from YouTube, TikTok, Instagram, X, or any URL. Extract best quality video + audio. Store in `storage/{client_id}/sources/`.
- **transcriber.py**: Run WhisperX on the audio track. Get word-level timestamps with speaker diarization. Store transcript as JSON in database. This is the raw material the AI Brain works with.

**Key detail:** WhisperX `large-v3` model for accuracy. Run on GPU if available, CPU fallback. A 1-hour video takes ~5-10 minutes to transcribe on a decent GPU, ~30-60 minutes on CPU.

**Security: SSRF Protection (Required)**

The downloader accepts user-provided URLs, which enables SSRF attacks. Implement a URL allowlist:

```python
ALLOWED_DOMAINS = ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com', 'twitter.com', 'x.com']

def validate_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != 'https':
        raise ValueError("Only HTTPS URLs allowed")
    domain = parsed.netloc.lower().replace('www.', '')
    if not any(domain.endswith(d) for d in ALLOWED_DOMAINS):
        raise ValueError(f"Domain not allowed: {domain}")
    # Also block internal IP ranges (169.254.x.x, 10.x.x.x, etc.)
    return url
```

**Performance: Memory Management (Required)**

WhisperX loads a 3GB+ model into GPU memory. Without management, concurrent transcriptions crash the system:

```python
class WhisperXTranscriber:
    def __init__(self, max_concurrent=2):  # Limit based on GPU memory
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def transcribe(self, audio_path):
        async with self.semaphore:
            result = self.model.transcribe(audio_path)
            torch.cuda.empty_cache()  # Clear cache after each job
            return result
```

For videos over 1 hour: split audio into 30-minute chunks, process sequentially to avoid OOM.

##### 1.3 AI Viral Moment Detection

- **moment_detector.py**: Send the transcript (with timestamps) to Claude. Prompt asks Claude to identify the top N clip-worthy moments, scoring each by:
  - Emotional intensity (0-10)
  - Controversy/hot-take potential (0-10)
  - Story completeness (does it have a setup + payoff?)
  - Hook potential (how strong is the opening?)
  - Estimated viral score (0-100)
- Returns: list of `{start_time, end_time, hook_text, caption, viral_score, reasoning}`
- **For content-limited clients:** Prompt asks Claude to generate multiple variations of each moment (different start/end points, different hooks, different framing).

**Performance: Cost Optimization (Critical)**

The original estimate of $20-50/mo for Claude API is severely wrong. At 62 videos/day with full transcripts:
- Input: ~62 x 40k tokens = 2.5M tokens/day
- At Opus pricing ($15/M input): **$37.50/day = $1,125/month**

**Mitigation strategies (must implement):**
1. **Use Sonnet for bulk work** ($3/M instead of $15/M) — 80% cost reduction
2. **Batch transcripts**: Send 5-10 transcripts per API call instead of 1
3. **Cache results**: Redis cache with 30-day TTL keyed on transcript hash
4. **Sliding window**: Don't send entire 2-hour transcripts. Use 8k-token windows with overlap
5. **Target: $150-300/month** with all optimizations applied

**Use Claude Structured Outputs:**

```python
from pydantic import BaseModel, Field

class ViralMoment(BaseModel):
    start_time: float
    end_time: float
    hook_text: str
    caption_text: str
    viral_score: int = Field(ge=0, le=100)
    reasoning: str

class MomentAnalysis(BaseModel):
    moments: list[ViralMoment]

response = client.beta.messages.parse(
    model="claude-sonnet-4-5",
    max_tokens=4000,
    messages=[{"role": "user", "content": prompt}],
    response_format=MomentAnalysis
)
# Guaranteed valid JSON matching schema — no parsing errors
```

##### 1.4 Clip Generation

- **ffmpeg_ops.py**: Core video operations via FFmpeg subprocess calls.

**Security: All FFmpeg calls MUST use list format (never shell=True):**

```python
# WRONG — command injection vulnerability
subprocess.run(f"ffmpeg -ss {start} -to {end} -i {filename} output.mp4", shell=True)

# CORRECT — safe parameterized call
subprocess.run([
    "ffmpeg", "-ss", str(start), "-to", str(end),
    "-i", str(source_path), "-c", "copy",
    "-y", str(output_path)
], check=True, capture_output=True, timeout=300)
```

Operations:
  - Extract clip at timestamps
  - Scale to 9:16 vertical: center crop for MVP (face detection added later)
  - Burn in ASS subtitles: `ffmpeg -i clip.mp4 -vf "ass=captions.ass" output.mp4`
  - Mute profanity via volume filter at precise timestamps
  - Add text hook overlay: render text on first 2-3 seconds
  - Quality validation: check duration, resolution (1080x1920), audio levels, no black frames
  - **Use NVENC when GPU available**: `-c:v h264_nvenc -preset p4 -tune hq` for 73-82% faster encoding

**Performance: Parallel Processing (Required)**

Sequential FFmpeg processing of 62 clips = 31+ hours. Must parallelize:

```python
from concurrent.futures import ProcessPoolExecutor

def process_clip_batch(clip_jobs, max_workers=10):
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(run_ffmpeg_clip, job) for job in clip_jobs]
        return [f.result() for f in futures]
```

- **captioner.py**: Generate ASS subtitle files from WhisperX word timestamps.

**Research: Best Performing Caption Style (2026)**
  - **Font**: Montserrat Bold (most popular on TikTok, geometric, friendly)
  - **Color**: White text (#FFFFFF) with black stroke (3px outline) for contrast
  - **Emphasis**: Yellow highlight (#00FFFF in ASS BGR format) on current word
  - **Style**: Word-by-word highlight animation — current word is bold + colored
  - **Position**: Center-bottom, above platform UI elements
  - **Impact**: Videos with captions see 12-15% higher completion rates

Start with ONE style. Add alternatives only if A/B testing shows improvement.

- **cropper.py**: Vertical cropping.
  - **MVP**: Simple center crop to 9:16. This works for 80%+ of content.
  - **Later**: Add MediaPipe face detection with frame skipping (every 10th frame, interpolate positions). Without frame skipping, face detection alone takes 23-93 hours for 1,860 clips.

- **profanity.py**: Detect and mute profanity:
  - Cross-reference WhisperX word timestamps against profanity wordlist
  - For each match: get exact start/end timestamp with 50ms buffer
  - Apply FFmpeg volume=0 filter at those precise timestamps
  - Verify surrounding words are not affected

##### 1.5 Database Models

**Use SQLAlchemy 2.0 patterns with full type hints, Enums for statuses, and Pydantic for JSON fields:**

```python
# models/client.py (SQLAlchemy 2.0)
from enum import Enum
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

class SourceStatus(str, Enum):
    PENDING = "pending"
    TRANSCRIBING = "transcribing"
    READY = "ready"
    FAILED = "failed"

class Client(Base):
    __tablename__ = "clients"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=func.now())
    sources: Mapped[list["Source"]] = relationship(back_populates="client")

class Source(Base):
    __tablename__ = "sources"
    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    url: Mapped[Optional[str]]
    file_path: Mapped[str]
    title: Mapped[str]
    duration_seconds: Mapped[float]
    transcript_json: Mapped[Optional[dict]] = mapped_column(JSONB)
    status: Mapped[SourceStatus] = mapped_column(
        SQLEnum(SourceStatus, native_enum=False),
        default=SourceStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(default=func.now())

# models/content.py
class MomentStatus(str, Enum):
    DETECTED = "detected"
    GENERATING = "generating"
    READY = "ready"
    POSTED = "posted"
    FAILED = "failed"

class ClipMoment(Base):
    __tablename__ = "clip_moments"
    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    start_time: Mapped[float]
    end_time: Mapped[float]
    viral_score: Mapped[int]
    hook_text: Mapped[str]
    caption_text: Mapped[str]
    reasoning: Mapped[str]
    status: Mapped[MomentStatus] = mapped_column(
        SQLEnum(MomentStatus, native_enum=False),
        default=MomentStatus.DETECTED
    )

class GeneratedClip(Base):
    __tablename__ = "generated_clips"
    id: Mapped[int] = mapped_column(primary_key=True)
    moment_id: Mapped[int] = mapped_column(ForeignKey("clip_moments.id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    file_path: Mapped[str]
    duration: Mapped[float]
    resolution: Mapped[str] = mapped_column(default="1080x1920")
    caption_style: Mapped[str]
    hook_type: Mapped[str]
    variation_number: Mapped[int] = mapped_column(default=1)
    quality_check_passed: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

# models/distribution.py
class PlatformType(str, Enum):
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    TWITTER = "twitter"

class AccountStatus(str, Enum):
    ACTIVE = "active"
    WARNED = "warned"
    SUSPENDED = "suspended"
    BANNED = "banned"

class PostStatus(str, Enum):
    QUEUED = "queued"
    POSTING = "posting"
    POSTED = "posted"
    FAILED = "failed"

class Account(Base):
    __tablename__ = "accounts"
    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    platform: Mapped[PlatformType] = mapped_column(SQLEnum(PlatformType, native_enum=False))
    username: Mapped[str]
    credentials_encrypted: Mapped[str]  # Fernet-encrypted, never plaintext
    status: Mapped[AccountStatus] = mapped_column(default=AccountStatus.ACTIVE)
    last_posted_at: Mapped[Optional[datetime]]

class PostJob(Base):
    __tablename__ = "post_jobs"
    id: Mapped[int] = mapped_column(primary_key=True)
    clip_id: Mapped[int] = mapped_column(ForeignKey("generated_clips.id"))
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"))
    scheduled_at: Mapped[datetime]
    posted_at: Mapped[Optional[datetime]]
    platform_post_id: Mapped[Optional[str]]
    status: Mapped[PostStatus] = mapped_column(default=PostStatus.QUEUED)
    error_message: Mapped[Optional[str]]
    post_caption: Mapped[str]
    hashtags: Mapped[str]
```

**Required database indexes:**
```sql
CREATE INDEX idx_clips_client_status ON clip_moments(client_id, status);
CREATE INDEX idx_clips_viral_score ON clip_moments(viral_score DESC) WHERE status = 'detected';
CREATE INDEX idx_posts_scheduled ON post_jobs(scheduled_at) WHERE status = 'queued';
CREATE INDEX idx_sources_client_status ON sources(client_id, status);
CREATE INDEX idx_clips_client_created ON generated_clips(client_id, created_at DESC);
```

**Required: eager loading for dashboard queries:**
```python
# Avoid N+1 queries (would cause 55+ second page loads at scale)
clips = (
    session.query(ClipMoment)
    .options(
        joinedload(ClipMoment.source),
        selectinload(ClipMoment.generated_clips)
    )
    .filter_by(client_id=client_id)
    .limit(100)  # Always paginate
    .all()
)
```

##### 1.6 Configuration & Security Foundation

**Must be done BEFORE any feature code:**

```python
# config.py — Type-safe configuration
from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")

    database_url: PostgresDsn
    claude_api_key: str = Field(min_length=10)
    redis_url: str = "redis://localhost:6379/0"
    storage_base_path: Path = Path("/tmp/viral-clipper")
    whisperx_model: str = "large-v3"
    max_concurrent_transcriptions: int = Field(default=2, ge=1, le=10)
    encryption_key: str = Field(min_length=32)  # For Fernet credential encryption
    dashboard_secret_key: str = Field(min_length=32)  # For session cookies

settings = Settings()
```

```python
# exceptions.py — Custom exception hierarchy
class ViralClipperError(Exception):
    """Base exception."""

class FFmpegError(ViralClipperError):
    def __init__(self, message, command=None, stderr=None):
        super().__init__(message)
        self.command = command
        self.stderr = stderr

class TranscriptionError(ViralClipperError): pass
class AIDetectionError(ViralClipperError): pass
class PostingError(ViralClipperError):
    def __init__(self, message, platform, account_id):
        super().__init__(message)
        self.platform = platform
        self.account_id = account_id
```

**Security checklist (do first):**
- [x] `.gitignore` includes `.env`, `storage/`, `*.key`, `credentials*`
- [x] `.env.example` with placeholder values (never real secrets)
- [x] Fernet encryption for all stored credentials
- [ ] Dashboard authentication (session-based, HTTPS in production)
- [ ] CSRF protection on all state-changing endpoints
- [ ] Content Security Policy headers
- [ ] File upload validation (MIME type check via magic bytes, size limits, safe filenames)
- [x] All FFmpeg calls use list format (never `shell=True`)
- [x] URL allowlist for yt-dlp downloads (SSRF protection)
- [ ] Log redaction for credentials and proxy URLs

---

#### Phase 2: Distribution System (Weeks 3-4)

**Goal:** Auto-post clips to TikTok accounts on schedule. Other platforms added in weeks 5-8.

##### 2.1 Platform Posting

**Start with TikTok only (MVP). Add other platforms once TikTok posting is proven.**

All platform posters implement a shared interface:

```python
# distribution/base.py
from typing import Protocol

class PostResult(TypedDict):
    platform_post_id: str
    posted_at: datetime
    post_url: str

class PlatformPoster(Protocol):
    def post_video(self, video_path: Path, caption: str, account: Account) -> PostResult: ...
    def check_rate_limits(self, account: Account) -> bool: ...
```

**TikTok** (10 accounts per client):
- Primary: TikTok Content Posting API (`video.publish` scope)
- Requires API audit for public posting. Unaudited: limited to 5 users/24hr, private only
- Limit: ~15 posts/day/creator account via API
- Fallback: Playwright browser automation if API isn't approved
- Chunked upload for videos > small size

**Instagram Reels** (10 accounts per client) — Add in weeks 5-6:
- Primary: Meta Content Publishing API for Reels
- Requires Business/Creator account + Facebook Page
- Upload via `POST /{ig-user-id}/media` with `media_type=REELS`
- Fallback: Playwright automation

**YouTube Shorts** (5 accounts per client) — Add in weeks 5-6:
- YouTube Data API v3, `videos.insert` endpoint
- Upload video <=60 seconds, YouTube auto-classifies as Short
- Add `#Shorts` to title/description
- Quota: ~1,600 units per upload. Default: 10,000 units/day = ~6 uploads/day
- Need to request quota increase for higher volume

**X/Twitter** (5 accounts per client) — Add in weeks 7-8:
- X API v2 + media upload v1.1 (chunked upload)
- Tweepy library for Python
- Requires Basic plan ($100/mo) for posting

##### 2.2 Scheduling Engine

- **scheduler.py**: Manages the posting queue:
  - Each account posts every 12 hours (2x/day)
  - Stagger posting times across accounts (don't post all 30 at once)
  - Randomize exact posting time within a 30-minute window (anti-detection)
  - Respect platform rate limits per account
  - Retry failed posts with exponential backoff (max 3 retries)
  - Track last_posted_at per account to prevent double-posting
  - Timezone-aware scheduling

##### 2.3 Anti-Detection

- **Rotating residential proxies**: Each account gets a sticky IP session (same IP for duration of a posting session, different IP next time)
- **Browser fingerprinting** (for Playwright-based posting): Use different browser profiles per account
- **Human-like timing**: Random delays between actions (2-8 seconds between clicks)
- **Staggered posting**: Spread posts across 24 hours, not all at once
- **Account warming**: New accounts post less frequently at first, ramp up over 2-4 weeks
- **Proxy provider**: Bright Data residential ($10-15/GB) or similar. Budget ~$50-100/mo for 30 accounts.
- **Account differentiation**: Different bios, profile pics, username patterns across the 10 TikTok accounts to avoid appearing as a coordinated network

##### 2.4 Storage Management (Required)

Without cleanup, the system generates ~3.7TB/month:
- Source videos: ~124GB/day (62 x 2GB average)
- Generated clips: ~55GB/month (1,860 x 30MB)

```python
class StorageManager:
    retention_days_local = 7      # Keep on fast SSD for 7 days
    retention_days_archive = 365  # Keep on S3 for 1 year

    async def daily_cleanup(self):
        # Archive sources older than 7 days to S3
        # Delete posted clips older than 30 days
        # Update DB with archive locations
```

**Local storage need**: ~200GB (7 days of processing)
**S3 archive cost**: ~$23/month per TB

---

#### Phase 3: AI Brain + Dashboard (Weeks 5-8)

**Goal:** Intelligent content planning and a web UI for managing everything.

##### 3.1 AI Content Strategy Engine

- **Daily clip plan generation**: Each morning, AI reviews:
  - Available unclipped source material per client
  - Which moments haven't been used yet
  - What performed well recently (if analytics available)
  - Current trending formats/sounds (if trend monitoring available)
  - Per-client strategy rules
- Generates a plan: 62 clips for the day, assigned to specific accounts and time slots
- Uses Claude API with structured output for reliable parsing

- **Hook writing**: For each clip, AI generates:
  - Text hook overlay (e.g., "He said THIS about Drake...")
  - Post caption (platform-specific, engagement-optimized)
  - Hashtags (relevant + trending)
  - Decision: use text hook, natural start, or both

- **Variation generation**: When source material is limited:
  - Different text hooks for the same moment
  - Different clip boundaries (start 2 seconds earlier, end 3 seconds later)
  - Different caption styles
  - Different framing/context in the post caption

##### 3.2 Client Dashboard

Simple web UI built with FastAPI + Jinja2 templates (HTML/CSS/JS).

**Authentication required**: Session-based auth with secure cookies. No unauthenticated access.

**MVP Pages (start here):**
1. **Content Upload** — Upload files or paste URLs for auto-download
2. **Clip Queue** — Upcoming clips, posted clips, failed clips (with status)

**Full Pages (add as needed):**
3. **Client List** — Overview of all artist clients, status, clip counts
4. **Client Detail** — Source material, clip library, accounts, strategy
5. **Account Manager** — All 30 accounts, status, health indicators
6. **Strategy Settings** — Per-client rules (themes, content guidelines, posting frequency)
7. **Calendar View** — What's posting when across all accounts

**Key features:**
- File upload with drag-and-drop (validate MIME type via magic bytes, max 10GB)
- URL paste for auto-download (YouTube, TikTok, etc.)
- Clip preview (play before it posts)
- Quick strategy adjustment (change posting frequency, pause an account)
- Error alerts (failed posts, banned accounts, DMCA notices)

**Security for dashboard:**
- Auto-escaping ON for all Jinja2 templates (XSS prevention)
- CSRF tokens on all forms
- Content Security Policy headers
- Authorization checks on every endpoint (prevent IDOR)

---

#### Phase 4: Intelligence Layer (Weeks 9-12)

**Goal:** The system gets smarter over time.

**Note from simplicity review**: This phase is optimization, not core functionality. Only build after Phases 1-3 are proven and running. Can be deferred indefinitely if system is producing quality clips without it.

##### 4.1 Performance Analytics

- Scrape/API-pull engagement metrics per posted clip:
  - Views, likes, comments, shares, saves
  - Use platform APIs where available, Playwright scraping where not
- Store metrics in database, update daily
- Per-client dashboards showing:
  - Top performing clips
  - Best posting times
  - Engagement trends over time
  - Account growth rates

##### 4.2 Learning Feedback Loop

- Feed performance data back to the AI Brain:
  - "These 10 clips got the most views. These 10 got the least. What patterns do you see?"
  - Adjust viral scoring based on what actually performs
  - Refine hook styles, caption approaches, clip length preferences
- Store AI analysis as strategy insights in the database
- Over time, the system should produce increasingly better clips per client

**Architecture note**: This creates a circular dependency (AI → Clipper → Distribution → Analytics → AI). Use shared domain events to decouple, not direct imports.

##### 4.3 Trend Monitoring

- Monitor trending content across platforms:
  - TikTok: Trending sounds, hashtags, effects via scraping or API
  - Instagram: Trending Reels audio, hashtags
  - YouTube: Trending Shorts topics
  - X: Trending topics, hashtags
- Feed trends to AI Brain for incorporation into clip plans
- Alert user when a trend is relevant to one of their clients

---

## Open Questions Requiring Resolution

The spec flow analysis identified 28 gaps. These are the most critical, grouped by when they must be answered:

### Before Writing Code

1. **Account creation legality**: How are the 30 accounts per client created? Does the system auto-create (possible TOS violation and identity fraud risk), or does the user provide them? This fundamentally affects architecture.

2. **Platform TOS compliance**: Running 10 coordinated accounts on TikTok may trigger "coordinated inauthentic behavior" policies. What's the legal/technical mitigation?

3. **Content uniqueness math**: A 30-minute source yields ~360 possible non-overlapping 5-second clips. How do you get to 1,860? The variation engine is load-bearing — define "unique" precisely.

### Before Phase 2

4. **Account differentiation**: How are 10 TikTok accounts for the same artist differentiated? Different bios, profile pics, content angles?

5. **Account warmup protocol**: New accounts start at what frequency? 1/day for week 1, ramping to 2/day?

6. **Ban cascade prevention**: If all 10 TikTok accounts get banned simultaneously, what's the emergency response?

### Before Phase 3

7. **User's actual daily role**: If the system is fully automated, what does the user DO each day? This affects dashboard design.

8. **Content ingestion frequency**: Manual upload only, or auto-monitor artist YouTube channels?

9. **Error notification**: How is the user notified of failures? Email? In-app only?

---

## Acceptance Criteria

### Functional Requirements

- [ ] System accepts video files (mp4, mov, webm) and URLs (YouTube, TikTok, Instagram, X) as input
- [ ] WhisperX transcribes audio with word-level timestamps
- [ ] AI identifies clip-worthy moments and scores them by viral potential
- [ ] FFmpeg generates 9:16 vertical clips with burned-in captions
- [ ] AI writes text hooks, post captions, and hashtags per clip
- [ ] Profanity is detected and muted without affecting surrounding audio
- [ ] System auto-posts to TikTok, Instagram Reels, YouTube Shorts, and X
- [ ] Posts are scheduled every 12 hours per account with staggered timing
- [ ] Dashboard allows client management, content upload, and strategy configuration
- [ ] System supports multiple artist clients with isolated data
- [ ] All 1,860 monthly clips per client are verifiably unique

### Non-Functional Requirements

- [ ] Process a 1-hour video (transcribe + detect + generate clips) in under 30 minutes (requires parallel workers)
- [ ] Handle 30 account postings per client without rate limit failures
- [ ] Dashboard loads in under 2 seconds (requires eager loading + pagination)
- [ ] Anti-detection measures prevent account bans (< 5% ban rate)
- [ ] System runs on a single machine (Mac or Linux server) to start
- [ ] Monthly Claude API cost under $300 for first client (with batching + caching + Sonnet)

### Quality Gates

- [ ] Every generated clip passes quality checks (resolution, duration, audio, no blank frames)
- [ ] Captions are accurately timed to speech (< 200ms offset)
- [ ] Hooks are present on every clip (text overlay or natural compelling start)
- [ ] No profanity in first 3 seconds of any clip
- [ ] Post captions are platform-appropriate (length, hashtag count, tone)
- [ ] All FFmpeg calls use list format (no shell=True)
- [ ] Dashboard requires authentication
- [ ] No credentials stored in plaintext anywhere
- [ ] File uploads validated by MIME type (not just extension)

## Dependencies & Prerequisites

| Dependency | Type | Status | Notes |
|-----------|------|--------|-------|
| Python 3.11+ | Runtime | Available | Already installed or easy to install |
| FFmpeg | System | Must install | `brew install ffmpeg` on Mac. With NVENC for GPU encoding |
| PostgreSQL | Database | Must set up | Docker or local install |
| Redis | Queue broker | Must set up | Docker or local install |
| WhisperX | ML model | Must install | Requires PyTorch + CUDA (GPU) or CPU fallback |
| Claude API key | External API | Must obtain | Anthropic API account + credits |
| TikTok Developer account | External API | Must apply | Audit required for public posting |
| Meta Developer account | External API | Must apply | For Instagram Reels API (Phase 2) |
| Google Cloud project | External API | Must set up | For YouTube Data API (Phase 2) |
| X Developer account | External API | Must apply | Basic plan ($100/mo) for posting (Phase 2) |
| Bright Data account | External service | Must set up | Residential proxy for anti-detection |
| yt-dlp | Python package | Must install | Video downloading |
| python-magic | Python package | Must install | MIME type validation for uploads |
| cryptography | Python package | Must install | Fernet encryption for credentials |
| pydantic-settings | Python package | Must install | Type-safe configuration |
| structlog | Python package | Must install | Structured logging |

## Risk Analysis & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Platform API access denied | High | Medium | Playwright browser automation as fallback for every platform |
| Accounts get banned | High | Medium | Anti-detection measures, account warming, proxy rotation, replaceable accounts |
| Account ban cascade (all at once) | Critical | Low | Emergency stop, different IPs per account, posting pattern variation, standby accounts |
| Claude API costs spike | High | High | **Use Sonnet not Opus, batch requests, cache results, sliding window transcripts** |
| WhisperX transcription errors | Medium | Low | Post-processing cleanup, manual review for first few clients |
| Video processing too slow | High | Medium | **Parallel FFmpeg workers (ProcessPoolExecutor), NVENC GPU encoding** |
| Storage fills up | High | Medium | **Auto-archive to S3 after 7 days, cleanup cron job** |
| TikTok daily post cap (15/day) | Medium | High | Spread across 10 accounts (2/day each = within limits) |
| YouTube quota limits (10k/day) | Medium | High | Request quota increase, spread uploads across 5 channels |
| DMCA takedowns | Low | Medium | Accept as cost of business. Auto-replace taken-down clips. |
| FFmpeg command injection | Critical | Low | **All subprocess calls use list format, never shell=True** |
| Credential leak | Critical | Low | **Fernet encryption, .gitignore, env vars, log redaction** |
| Dashboard unauthorized access | High | Medium | **Session-based auth, CSRF, CSP headers** |
| Platform TOS legal action | High | Low | **Legal review before launch. Differentiate accounts. Human-like behavior** |

## Resource Requirements

**Hardware (to start):**
- Mac or Linux machine with **32GB+ RAM** (16GB insufficient for concurrent WhisperX + FFmpeg)
- **GPU strongly recommended**: NVIDIA RTX 3060+ (12GB+ VRAM) for WhisperX + NVENC encoding
- 1TB NVMe SSD (7-day local retention) + S3 for archive
- Gigabit network connection for uploads

**Monthly costs (first client, with optimizations):**
- Claude API: ~$150-300 (Sonnet for bulk, batching, caching)
- Residential proxies: ~$50-100 (Bright Data)
- X API Basic plan: $100/mo (defer until Phase 2 week 7-8)
- S3 archive storage: ~$23/month per TB
- **MVP Total (TikTok-only, weeks 1-4): ~$200-400/mo**
- **Full Total (all platforms): ~$325-525/mo**

**Note**: Original estimate of $175-260/mo was too low. Claude API alone could be $1,125/mo without optimization. The costs above assume aggressive batching, caching, and using Sonnet instead of Opus for most tasks.

**Scaling costs per additional client:** ~$150-300/mo additional

## Future Considerations

- **AI video generation**: Plug in Runway/Kling for AI-enhanced clips (artistic intros, visual effects)
- **Multi-language support**: WhisperX supports 99+ languages — can clip non-English content
- **White-label dashboard**: Clients get their own login to view analytics
- **Mobile app**: Push notifications for performance milestones
- **A/B testing**: Post same moment with different hooks, measure which performs better
- **Auto content sourcing**: System crawls for new long-form content automatically
- **Face detection cropping**: MediaPipe face tracking for smart vertical crop (post-MVP)
- **Multiple caption styles**: A/B test word-by-word vs karaoke vs full sentence (post-MVP)

## References & Research

### Internal References

- Brainstorm: `docs/brainstorms/2026-02-14-fan-page-video-engine-brainstorm.md`

### External References

- [WhisperX - Word-level timestamps](https://github.com/m-bain/whisperX)
- [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [Meta Content Publishing API](https://developers.facebook.com/docs/marketing-api)
- [YouTube Data API v3 - Upload](https://developers.google.com/youtube/v3/guides/uploading_a_video)
- [X Developer Platform - Media Upload](https://developer.x.com/en/docs/tutorials/uploading-media)
- [FFmpeg Filters Documentation](https://ffmpeg.org/ffmpeg-filters.html)
- [Dramatiq Task Queue](https://dramatiq.io/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Bright Data Residential Proxies](https://brightdata.com/)
- [ASS Subtitle Format](https://fileformats.fandom.com/wiki/SubStation_Alpha)
- [Claude Structured Outputs (Nov 2025)](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [MediaPipe Face Detection (Python)](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/python)
- [NVIDIA NVENC FFmpeg Integration](https://docs.nvidia.com/video-technologies/video-codec-sdk/13.0/ffmpeg-with-nvidia-gpu/index.html)
- [8 Best Fonts for TikTok Subtitles (2026)](https://sendshort.ai/guides/tiktok-font/)
- [TikTok Caption Best Practices (2026)](https://www.opus.pro/blog/tiktok-caption-subtitle-best-practices)

### Quality Reference Accounts

- [@730.archive](https://www.tiktok.com/@730.archive)
- [@bradleymartyn](https://www.tiktok.com/@bradleymartyn)
- [@nelkboys](https://www.tiktok.com/@nelkboys)
- [@loganpaul](https://www.tiktok.com/@loganpaul)
- [@dsavagevault](https://www.tiktok.com/@dsavagevault)
- [@lexagatesangels](https://www.tiktok.com/@lexagatesangels)
