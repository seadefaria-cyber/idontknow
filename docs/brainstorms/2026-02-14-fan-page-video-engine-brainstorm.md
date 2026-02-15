# Viral Clipping Engine — Brainstorm

**Date:** 2026-02-14
**Status:** Brainstorm

---

## What We're Building

A fully automated viral clipping engine for a fan page agency. The system takes long-form content (interviews, podcasts, live streams, concerts, vlogs) featuring musical artists, identifies the most viral-worthy moments, clips them into short-form vertical videos with captions and hooks, and auto-posts them across fan page accounts on TikTok, Instagram, YouTube Shorts, and X.

The goal: become the most successful clipping agency on the internet.

### Reference Accounts (Quality Standard)

- [@730.archive](https://www.tiktok.com/@730.archive)
- [@bradleymartyn](https://www.tiktok.com/@bradleymartyn)
- [@nelkboys](https://www.tiktok.com/@nelkboys)
- [@loganpaul](https://www.tiktok.com/@loganpaul)
- [@dsavagevault](https://www.tiktok.com/@dsavagevault)
- [@lexagatesangels](https://www.tiktok.com/@lexagatesangels)

These represent the quality bar. Professional clipping channels with strong hooks, clean captions, high engagement.

### Core Numbers (Per Client)

- **30 accounts**: 10 TikTok, 10 Instagram, 5 YouTube Shorts, 5 X/Twitter
- **62 unique clips per account per month** (~2/day, posted every 12 hours)
- **1,860 unique clips per month per client**
- **Clip length**: 5 seconds to 2 minutes
- **Format**: All vertical 9:16
- **Every clip must be completely unique** — but variations of the same moment (different hook, caption style, crop, length) count as unique

### Business Model

- **Agency model** — built to serve multiple artist clients
- **Scales per client** — each new client gets their own set of accounts, content library, and strategy
- **Quality is the #1 priority** — clients must be impressed enough to stay and refer others
- **Budget**: Start affordable, willing to scale to $1,000+/mo as client base grows

---

## The Core Pipeline

```
Long-form content → AI finds viral moments → Auto-clip → Add captions + hooks → Auto-post
```

### Step 1: Content Ingestion
- User uploads long-form videos (interviews, podcasts, streams, concerts, etc.)
- User provides links (YouTube, social media) for system to auto-download
- System accepts any source: local files, cloud storage, web URLs
- Content is stored per-client in an organized asset library

### Step 2: AI Viral Moment Detection
- AI watches/analyzes long-form content and identifies clip-worthy moments
- **What makes a moment clip-worthy:**
  - Emotional peaks (anger, surprise, laughter, controversy, vulnerability)
  - Hot takes and bold opinions that provoke reactions
  - Mini-stories with setup and payoff
  - Shock value, humor, relatability
  - Anything that would stop someone mid-scroll
- AI scores and ranks moments by viral potential
- For content-limited clients: AI creates multiple unique variations of the same moment

### Step 3: Clip Generation (FFmpeg)
- Extract the clip at the identified timestamps
- Convert to vertical 9:16 (smart crop/zoom on the speaker)
- Add burned-in captions (style TBD — research best performing caption styles)
- Add text hook overlay when appropriate (e.g., "He said THIS about Drake...")
- AI decides per-clip whether to use text hook, natural compelling start, or both
- Mute profanity without losing context (no profanity in hooks, ever)
- Apply quality checks (no blank frames, correct resolution, proper audio levels)

### Step 4: Post Copy Generation
- AI writes platform-optimized post captions, hashtags, and descriptions
- Engagement-optimized: questions, hot takes, calls to action, rage-bait, click-bait
- Platform-specific (TikTok caption style differs from IG differs from YouTube)

### Step 5: Auto-Post & Schedule
- Post to all 30 accounts on schedule (every 12 hours per account)
- Stagger posting times to avoid platform detection
- Handle platform-specific upload requirements
- Retry failed posts automatically

---

## Viral Content Strategy

This is not just a clipping tool — it's a **viral content engine**. The AI brain must deeply understand:

- **Hooks are everything** — first 1-3 seconds determine if someone watches. Every clip needs a scroll-stopping hook.
- **Rage-baiting** — provocative framing that drives comments ("He ACTUALLY said this...")
- **Click-baiting** — hooks and captions that compel engagement
- **Platform-specific virality** — what works on TikTok is different from IG Reels vs YouTube Shorts vs X
- **Trend awareness** — system must monitor real-time trends (sounds, formats, challenges) and incorporate them
- **Engagement optimization** — captions designed to drive comments, shares, saves
- **Clean hooks, dirty content OK** — no profanity in the first few seconds, mute cuss words in body

---

## System Components

### 1. Asset Library & Ingestion
- Accept uploads (local files, cloud links) and auto-download from URLs
- Per-client content isolation
- Track which moments have been clipped to avoid exact duplication
- Catalog source content metadata (artist, type, date, topics)

### 2. AI Brain (Content Strategy Engine)
- Analyzes long-form content to find viral moments
- Generates daily clip plans for all 30 accounts
- Crafts hooks and selects caption strategies per clip
- Writes post captions, hashtags, descriptions
- Ensures uniqueness across all 1,860 monthly clips
- Learns from performance data — what gets views, what doesn't
- Incorporates trending formats and sounds
- Respects per-client strategy/rules set by the user

### 3. Clip Generation Pipeline
- **FFmpeg Core**: Extract, crop, resize, overlay text, burn captions, mute profanity
- **Smart Cropping**: Auto-detect and track speakers for vertical framing
- **Caption Engine**: Burned-in subtitles with research-optimized styling
- **Hook Engine**: Text overlays, compelling start selection, scroll-stop optimization
- **Profanity Filter**: Detect and mute cuss words without losing surrounding context
- **Variation Engine**: For content-limited clients, create multiple unique versions of the same moment (different hooks, crops, caption styles, lengths)
- **Quality Checks**: Resolution, audio levels, no blank frames, proper duration

### 4. Distribution System
- Auto-post to TikTok, Instagram (Reels), YouTube Shorts, X/Twitter
- Full automation — no manual approval step
- Platform-specific upload handling
- Credential management for 30+ accounts per client
- Anti-detection measures: staggered timing, human-like posting patterns, proxy rotation

### 5. Account Management
- System creates and manages fan page accounts across all 4 platforms
- Profile setup: bio, profile pic, display name matching artist brand
- Accept client-provided accounts alongside system-created ones
- Secure credential storage
- Monitor account health (shadow bans, restrictions, etc.)

### 6. Trend Monitoring Engine
- Real-time tracking of trending sounds, formats, and challenges across all 4 platforms
- Feed trends into the AI Brain for automatic incorporation into clip plans
- Platform-specific trend detection

### 7. Performance Analytics & Learning
- Track clip performance (views, likes, comments, shares, saves) across all accounts
- Feed performance data back to AI Brain to improve future clip selection
- Identify what hooks, caption styles, and content types perform best
- Per-client performance dashboards

### 8. Scheduling Engine
- Queue management for all accounts across all clients
- 12-hour posting intervals per account
- Smart staggering to avoid platform detection
- Retry logic for failed posts
- Handle timezone awareness

### 9. Client Dashboard (Web UI)
- Add/manage artist clients
- Upload source content + provide URLs for auto-download
- Set per-client strategy, rules, and content guidelines
- View content calendar (what's been posted, what's queued)
- Performance analytics per account, per client
- Manage accounts and credentials

---

## Key Decisions

1. **This is a clipping engine** — not a general video creator. Core operation is extracting viral moments from long-form content.
2. **Hybrid pipeline** — FFmpeg for clip generation now, architected so AI video generation can be plugged in later for premium content types.
3. **Fully automated end-to-end** — content in, clips out, posted on schedule. No manual approval.
4. **AI writes everything** — hooks, captions, post text, hashtags. All AI-generated, optimized for virality.
5. **AI decides hook strategy per clip** — sometimes text overlay, sometimes natural compelling start, sometimes both.
6. **System creates accounts** — not relying on client to provide them. System is the primary account creator.
7. **Account safety is top priority** — anti-detection measures, human-like behavior, staggered posting.
8. **Performance feedback loop** — system learns from what works and gets smarter over time.
9. **Trend monitoring is essential** — system stays current with platform trends in real-time.
10. **Variations are acceptable** — same moment, different treatment counts as unique. Critical for content-limited clients.
11. **All vertical 9:16** — single format across all platforms.
12. **Profanity handling** — clean hooks always, muted cuss words in body content.
13. **Copyright risk accepted** — fan page model inherently involves using artist content. Accept takedowns as cost of doing business.
14. **Caption style TBD** — needs research on what performs best. Will be determined in planning phase.
15. **Full system from day 1** — user wants complete system, not incremental MVP.
16. **User's daily role** — feed content into the system and set strategy per client. System handles everything else.

---

## Open Questions (Technical — For Planning Phase)

These are research questions to answer during the planning phase, not design decisions:

1. **Posting automation approach** — Which tool/API for auto-posting to 30+ accounts across 4 platforms? Options: social media management APIs, browser automation (Playwright/Puppeteer), third-party services. Critical technical decision with anti-ban implications.

2. **Account creation approach** — How to create accounts at scale on TikTok, IG, YouTube, X? Platforms resist automated creation. Options: browser automation, phone farms, manual with system tracking. Needs feasibility research.

3. **Trend monitoring approach** — How to monitor trending content in real-time across 4 platforms? Options: official APIs, web scraping, third-party services (TrendTok, etc.).

4. **Caption style research** — What burned-in caption style performs best for virality in 2026? Word-by-word highlight, subtitle bar, mixed? Needs data-driven decision.

5. **AI model selection** — Which AI model(s) for viral moment detection, hook writing, and content planning? Claude, GPT-4, open-source, or specialized models?

6. **Infrastructure** — Where does this run? Local machine, cloud server, hybrid? 1,860 clips/month needs real compute for FFmpeg processing.

7. **Speech-to-text for captions** — Which transcription service for accurate burned-in captions? Whisper, Deepgram, AssemblyAI, etc.

8. **Profanity detection** — How to detect and precisely mute cuss words without affecting surrounding audio? Needs audio processing research.

---

## Success Criteria

- Generate 1,860+ unique, high-quality clips per month per client
- Clips match or exceed the quality of reference accounts
- Fully automated: long-form content in → clips posted on schedule, no manual steps
- Every clip has a scroll-stopping hook
- AI-generated captions and post copy that drive engagement
- System learns and improves clip quality over time based on performance data
- Accounts stay safe — minimal bans and restrictions
- Scalable to multiple artist clients without linear effort increase
- Non-technical user can operate through a simple dashboard
- Costs start under $100/mo, scale with agency growth
- Ultimate goal: the most successful clipping agency on the internet
