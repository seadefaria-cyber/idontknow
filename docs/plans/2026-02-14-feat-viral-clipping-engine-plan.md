---
title: "feat: Viral Clipping Engine"
type: feat
status: active
date: 2026-02-14
brainstorm: docs/brainstorms/2026-02-14-fan-page-video-engine-brainstorm.md
---

# Viral Clipping Engine

## Overview

Build a fully automated viral clipping engine for a fan page agency. The system ingests long-form content (interviews, podcasts, live streams, concerts), uses AI to identify viral-worthy moments, auto-clips them into short-form vertical videos with burned-in captions and scroll-stopping hooks, then auto-posts across 30 fan page accounts per client on TikTok, Instagram, YouTube Shorts, and X.

**Scale:** 1,860 unique clips per month per client. ~62 per day.

## Problem Statement

Running a clipping agency manually requires editing each video by hand — finding moments, trimming clips, adding captions, writing hooks, posting to accounts. At 1,860 clips/month per client across 30 accounts and 4 platforms, this is impossible to do manually. The system must automate the entire pipeline end-to-end while producing clips that match the quality of top clipping channels.

## Proposed Solution

A Python-based system with 8 components built in 4 phases:

```
Phase 1: Core Clipping Pipeline (ingest → transcribe → detect → clip → caption)
Phase 2: Distribution System (auto-post to 4 platforms, scheduling, anti-detection)
Phase 3: AI Brain + Dashboard (viral optimization, client management UI)
Phase 4: Intelligence Layer (trend monitoring, performance analytics, learning)
```

## Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Language** | Python 3.11+ | Best ecosystem for video/AI/automation |
| **Video Processing** | FFmpeg (subprocess) | Industry standard, fast, free, handles all our needs |
| **Transcription** | WhisperX (local) | Best word-level timestamps via forced alignment, speaker diarization |
| **AI Brain** | Claude API (Anthropic) | Best at nuanced content analysis, hook writing, viral moment scoring |
| **Task Queue** | Dramatiq + Redis | 52% higher throughput than Celery, simpler API, good defaults |
| **Web Framework** | FastAPI + Jinja2 templates | Fast API for backend, simple HTML templates for dashboard |
| **Database** | PostgreSQL | Multi-client, concurrent jobs, complex queries, JSONB for metadata |
| **File Storage** | Local (processing) + S3-compatible (archive) | Fast local processing, cheap cloud backup |
| **Captions** | ASS subtitle format | Full styling control (colors, fonts, positioning, animations) |
| **Profanity Detection** | WhisperX word timestamps + profanity wordlist | Precise word-level muting via FFmpeg volume filter |
| **Browser Automation** | Playwright | For platforms without official posting APIs |
| **Proxy** | Bright Data / residential rotating | Anti-detection for multi-account posting |

## Technical Approach

### Architecture

```
                    +------------------+
                    |  Client Dashboard|
                    |  (FastAPI + HTML) |
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

All services communicate through the PostgreSQL database and Dramatiq task queue. No microservices — it's one Python application with different entry points.

### Implementation Phases

---

#### Phase 1: Core Clipping Pipeline

**Goal:** Feed in a YouTube URL or video file, get back finished clips with captions.

**This is the foundation. Nothing else works without this.**

##### 1.1 Project Setup

```
viral-clipper/
├── src/
│   ├── __init__.py
│   ├── config.py              # Settings, API keys, paths
│   ├── models.py              # SQLAlchemy models
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── downloader.py      # yt-dlp for URL downloads
│   │   └── transcriber.py     # WhisperX transcription
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── moment_detector.py # Find viral moments in transcript
│   │   ├── hook_writer.py     # Generate hooks and captions
│   │   └── prompts.py         # All AI prompts
│   ├── clipper/
│   │   ├── __init__.py
│   │   ├── ffmpeg_ops.py      # FFmpeg operations
│   │   ├── captioner.py       # ASS subtitle generation
│   │   ├── cropper.py         # Smart vertical crop
│   │   └── profanity.py       # Detect and mute profanity
│   ├── distribution/
│   │   ├── __init__.py
│   │   ├── scheduler.py       # Post scheduling logic
│   │   ├── tiktok.py          # TikTok posting
│   │   ├── instagram.py       # Instagram Reels posting
│   │   ├── youtube.py         # YouTube Shorts posting
│   │   └── twitter.py         # X/Twitter posting
│   ├── dashboard/
│   │   ├── __init__.py
│   │   ├── app.py             # FastAPI application
│   │   ├── routes.py          # API routes
│   │   └── templates/         # Jinja2 HTML templates
│   └── tasks.py               # Dramatiq task definitions
├── tests/
├── migrations/                # Alembic DB migrations
├── requirements.txt
└── docker-compose.yml         # PostgreSQL + Redis
```

##### 1.2 Content Ingestion

- **downloader.py**: Use `yt-dlp` to download videos from YouTube, TikTok, Instagram, X, or any URL. Extract best quality video + audio. Store in `storage/{client_id}/sources/`.
- **transcriber.py**: Run WhisperX on the audio track. Get word-level timestamps with speaker diarization. Store transcript as JSON in database. This is the raw material the AI Brain works with.

**Key detail:** WhisperX `large-v3` model for accuracy. Run on GPU if available, CPU fallback. A 1-hour video takes ~5-10 minutes to transcribe on a decent GPU, ~30-60 minutes on CPU.

##### 1.3 AI Viral Moment Detection

- **moment_detector.py**: Send the transcript (with timestamps) to Claude. Prompt asks Claude to identify the top N clip-worthy moments, scoring each by:
  - Emotional intensity (0-10)
  - Controversy/hot-take potential (0-10)
  - Story completeness (does it have a setup + payoff?)
  - Hook potential (how strong is the opening?)
  - Estimated viral score (0-100)
- Returns: list of `{start_time, end_time, hook_text, caption, viral_score, reasoning}`
- **For content-limited clients:** Prompt asks Claude to generate multiple variations of each moment (different start/end points, different hooks, different framing).

##### 1.4 Clip Generation

- **ffmpeg_ops.py**: Core video operations via FFmpeg subprocess calls:
  - Extract clip at timestamps: `ffmpeg -ss {start} -to {end} -i source.mp4 -c copy clip.mp4`
  - Scale to 9:16 vertical: detect source aspect ratio, smart crop or add blur background
  - Burn in ASS subtitles: `ffmpeg -i clip.mp4 -vf "ass=captions.ass" output.mp4`
  - Mute profanity: `ffmpeg -i clip.mp4 -af "volume=enable='between(t,1.23,1.45)':volume=0" output.mp4`
  - Add text hook overlay: render text on first 2-3 seconds
  - Quality validation: check duration, resolution (1080x1920), audio levels, no black frames

- **captioner.py**: Generate ASS subtitle files from WhisperX word timestamps:
  - Style options: word-by-word highlight (current word bold/colored), full sentence, karaoke-style
  - Custom fonts, colors, positioning (center-bottom or center-middle)
  - Research indicates word-by-word highlight with bold/color emphasis performs best for retention

- **cropper.py**: Smart vertical cropping:
  - Use MediaPipe or OpenCV face detection to find the primary speaker
  - Track face position across frames, center crop on speaker
  - Fallback: center crop if no face detected
  - Handle multi-person scenes: crop on whoever is speaking (use diarization data)

- **profanity.py**: Detect and mute profanity:
  - Cross-reference WhisperX word timestamps against a profanity wordlist
  - For each match: get exact start/end timestamp of that word
  - Apply FFmpeg volume=0 filter at those precise timestamps
  - Verify surrounding words are not affected (buffer of ~50ms on each side)

##### 1.5 Database Models

```python
# models.py (SQLAlchemy)

class Client:
    id, name, created_at
    # relationships: sources, clips, accounts, strategy_rules

class Source:
    id, client_id, url, file_path, title, duration_seconds
    transcript_json, status (pending/transcribing/ready/failed)
    created_at

class ClipMoment:
    id, source_id, client_id
    start_time, end_time, viral_score
    hook_text, caption_text, reasoning
    status (detected/generating/ready/posted/failed)

class GeneratedClip:
    id, moment_id, client_id
    file_path, duration, resolution
    caption_style, hook_type
    variation_number  # for multiple versions of same moment
    quality_check_passed: bool
    created_at

class Account:
    id, client_id, platform (tiktok/instagram/youtube/twitter)
    username, credentials_encrypted
    status (active/warned/suspended/banned)
    last_posted_at

class PostJob:
    id, clip_id, account_id
    scheduled_at, posted_at
    platform_post_id  # ID returned by platform after posting
    status (queued/posting/posted/failed)
    error_message
    post_caption, hashtags
```

---

#### Phase 2: Distribution System

**Goal:** Auto-post clips to all 30 accounts on schedule with anti-detection.

##### 2.1 Platform Posting

**TikTok** (10 accounts per client):
- Primary: TikTok Content Posting API (`video.publish` scope)
- Requires API audit for public posting. Unaudited: limited to 5 users/24hr, private only
- Limit: ~15 posts/day/creator account via API
- Fallback: Playwright browser automation if API isn't approved
- Chunked upload for videos > small size

**Instagram Reels** (10 accounts per client):
- Primary: Meta Content Publishing API for Reels
- Requires Business/Creator account + Facebook Page
- Upload via `POST /{ig-user-id}/media` with `media_type=REELS`
- Fallback: Playwright automation via mobile web or API workaround

**YouTube Shorts** (5 accounts per client):
- YouTube Data API v3, `videos.insert` endpoint
- Upload video ≤60 seconds, YouTube auto-classifies as Short
- Add `#Shorts` to title/description as additional signal
- Quota: ~1,600 units per upload. Default quota: 10,000 units/day = ~6 uploads/day
- Need to request quota increase for higher volume
- OAuth 2.0 per channel

**X/Twitter** (5 accounts per client):
- X API v2 + media upload v1.1 (chunked upload)
- Tweepy library for Python
- Requires Basic plan ($100/mo) for posting
- Rate limits per account

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

---

#### Phase 3: AI Brain + Dashboard

**Goal:** Intelligent content planning and a web UI for managing everything.

##### 3.1 AI Content Strategy Engine

- **Daily clip plan generation**: Each morning, AI reviews:
  - Available unclipped source material per client
  - Which moments haven't been used yet
  - What performed well recently (if analytics available)
  - Current trending formats/sounds (if trend monitoring available)
  - Per-client strategy rules
- Generates a plan: 62 clips for the day, assigned to specific accounts and time slots
- Uses Claude API with structured output (JSON mode) for reliable parsing

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

Simple web UI built with FastAPI + Jinja2 templates (HTML/CSS/JS):

**Pages:**
1. **Client List** — Overview of all artist clients, status, clip counts
2. **Client Detail** — Source material, clip library, accounts, strategy
3. **Content Upload** — Upload files or paste URLs for auto-download
4. **Clip Queue** — Upcoming clips, posted clips, failed clips
5. **Account Manager** — All 30 accounts, status, health indicators
6. **Strategy Settings** — Per-client rules (themes, content guidelines, posting frequency)
7. **Calendar View** — What's posting when across all accounts

**Key features:**
- File upload with drag-and-drop
- URL paste for auto-download (YouTube, TikTok, etc.)
- Clip preview (play before it posts)
- Quick strategy adjustment (change posting frequency, pause an account)
- Error alerts (failed posts, banned accounts, DMCA notices)

---

#### Phase 4: Intelligence Layer

**Goal:** The system gets smarter over time.

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

##### 4.3 Trend Monitoring

- Monitor trending content across platforms:
  - TikTok: Trending sounds, hashtags, effects via scraping or API
  - Instagram: Trending Reels audio, hashtags
  - YouTube: Trending Shorts topics
  - X: Trending topics, hashtags
- Feed trends to AI Brain for incorporation into clip plans
- Alert user when a trend is relevant to one of their clients

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

- [ ] Process a 1-hour video (transcribe + detect + generate clips) in under 30 minutes
- [ ] Handle 30 account postings per client without rate limit failures
- [ ] Dashboard loads in under 2 seconds
- [ ] Anti-detection measures prevent account bans (< 5% ban rate)
- [ ] System runs on a single machine (Mac or Linux server) to start
- [ ] Monthly cost under $100 for first client (excluding proxy costs)

### Quality Gates

- [ ] Every generated clip passes quality checks (resolution, duration, audio, no blank frames)
- [ ] Captions are accurately timed to speech (< 200ms offset)
- [ ] Hooks are present on every clip (text overlay or natural compelling start)
- [ ] No profanity in first 3 seconds of any clip
- [ ] Post captions are platform-appropriate (length, hashtag count, tone)

## Dependencies & Prerequisites

| Dependency | Type | Status | Notes |
|-----------|------|--------|-------|
| Python 3.11+ | Runtime | Available | Already installed or easy to install |
| FFmpeg | System | Must install | `brew install ffmpeg` on Mac |
| PostgreSQL | Database | Must set up | Docker or local install |
| Redis | Queue broker | Must set up | Docker or local install |
| WhisperX | ML model | Must install | Requires PyTorch + CUDA (GPU) or CPU fallback |
| Claude API key | External API | Must obtain | Anthropic API account + credits |
| TikTok Developer account | External API | Must apply | Audit required for public posting |
| Meta Developer account | External API | Must apply | For Instagram Reels API |
| Google Cloud project | External API | Must set up | For YouTube Data API |
| X Developer account | External API | Must apply | Basic plan ($100/mo) for posting |
| Bright Data account | External service | Must set up | Residential proxy for anti-detection |
| yt-dlp | Python package | Must install | Video downloading |

## Risk Analysis & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Platform API access denied | High | Medium | Playwright browser automation as fallback for every platform |
| Accounts get banned | High | Medium | Anti-detection measures, account warming, proxy rotation, replaceable accounts |
| WhisperX transcription errors | Medium | Low | Post-processing cleanup, manual review for first few clients |
| Claude API costs spike | Medium | Low | Cache prompts, batch requests, use smaller models for simple tasks |
| Video processing too slow | Medium | Low | GPU acceleration, parallel FFmpeg jobs, cloud compute if needed |
| TikTok daily post cap (15/day) | Medium | High | Spread across 10 accounts (2/day each = within limits) |
| YouTube quota limits (10k/day) | Medium | High | Request quota increase, spread uploads across 5 channels |
| DMCA takedowns | Low | Medium | Accept as cost of business. Auto-replace taken-down clips. |

## Resource Requirements

**Hardware (to start):**
- Mac or Linux machine with 16GB+ RAM
- GPU recommended for WhisperX (NVIDIA with CUDA)
- 500GB+ storage for video files

**Monthly costs (first client):**
- Claude API: ~$20-50 (transcript analysis + hook writing)
- Residential proxies: ~$50-100 (Bright Data)
- X API Basic plan: $100/mo
- Cloud storage (S3-compatible): ~$5-10
- **Total: ~$175-260/mo**

**Scaling costs per additional client:** ~$70-150/mo additional

## Future Considerations

- **AI video generation**: Plug in Runway/Kling for AI-enhanced clips (artistic intros, visual effects)
- **Multi-language support**: WhisperX supports 99+ languages — can clip non-English content
- **White-label dashboard**: Clients get their own login to view analytics
- **Mobile app**: Push notifications for performance milestones
- **A/B testing**: Post same moment with different hooks, measure which performs better
- **Auto content sourcing**: System crawls for new long-form content automatically

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

### Quality Reference Accounts

- [@730.archive](https://www.tiktok.com/@730.archive)
- [@bradleymartyn](https://www.tiktok.com/@bradleymartyn)
- [@nelkboys](https://www.tiktok.com/@nelkboys)
- [@loganpaul](https://www.tiktok.com/@loganpaul)
- [@dsavagevault](https://www.tiktok.com/@dsavagevault)
- [@lexagatesangels](https://www.tiktok.com/@lexagatesangels)
