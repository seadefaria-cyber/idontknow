# Fan Page Video Engine — Brainstorm

**Date:** 2026-02-14
**Status:** Brainstorm

---

## What We're Building

An automated viral content creation and distribution engine for a fan page agency. The system creates unique short-form videos for musical artist fan pages, optimized for virality, and auto-posts them across social media platforms.

### Core Numbers (Per Client)

- **30 accounts**: 10 TikTok, 10 Instagram, 5 YouTube Shorts, 5 X/Twitter
- **62 unique videos per account per month** (~2/day, posted every 12 hours)
- **1,860 unique videos per month per client**
- **Video length**: 5 seconds to 2 minutes
- **Video format**: All vertical 9:16 (works across all platforms)
- **Every video must be completely unique** — no duplicates, no template swaps

### Content Types

- Lyric/audio visualizers (song clips with lyrics, waveform animations, visual effects)
- Edit compilations (fan edits, photo slideshows, highlight reels)
- News/update clips (tour dates, new releases, announcements)
- Memes, trending format remixes, reaction clips
- And more — wide variety to keep content fresh

### Viral Content Strategy

- **Hooks are the #1 priority** — every video needs a strong, attention-grabbing hook
- **No profanity in hooks** — keep the opening clean to maximize reach
- **Mute cuss words in body content** — without losing context or cutting other words
- **Rage-baiting** — provocative takes that drive comments and engagement
- **Click-baiting** — thumbnails, captions, and hooks that compel clicks
- **Engagement optimization** — the AI brain must understand what makes content go viral
- The system needs deep knowledge of viral mechanics across all 4 platforms

### Source Material

- Official music, music videos, album art
- Live/behind-the-scenes footage (concerts, studio, interviews)
- Fan-generated content (fan edits, fan art, covers)
- Social media clips, memes, trending audio
- **Ingestion**: Upload directly + provide links for system to auto-download
- Stored across: local folders, cloud storage, and web sources

---

## Why This Approach (Hybrid Pipeline)

**Start with FFmpeg-based programmatic video assembly, architect for AI video generation later.**

Rationale:
1. **Cost-effective launch** — FFmpeg is free, AI API costs are only for content planning (~$20-50/mo)
2. **Full creative control** — Rule-based system ensures consistency with client's brand
3. **Scalable architecture** — Modular generators mean swapping in AI video gen later is easy
4. **Speed** — FFmpeg can render hundreds of videos per hour locally
5. **Quality grows with budget** — Add AI-generated content types as revenue increases

### Alternatives Considered

| Approach | Why Not (for now) |
|---|---|
| Pure AI Video Generation | Too expensive at scale ($930-3,720/mo per client), less control |
| Pure FFmpeg Only | Works but limits future quality growth, no upgrade path |

---

## Key Decisions

1. **Hybrid approach** — FFmpeg core with pluggable AI video generation
2. **Fully automated posting** — No manual approval step, system posts on schedule
3. **Rule/theme-based creative control** — User defines themes and guidelines, system executes
4. **All accounts similar style** — Within a client, accounts share the same aesthetic
5. **Agency model** — System must support multiple artist clients
6. **Quality is the top priority** — Clients must be impressed with the output
7. **Viral optimization is core** — Not just content creation, but viral content creation
8. **User is non-technical** — Needs a simple interface, all code handled by developer (Claude)
9. **Budget: start cheap, scale up** — Begin with low-cost tools, willing to go to $1,000+/mo as agency grows
10. **All vertical 9:16** — Single format across all platforms
11. **Profanity handling** — Clean hooks, muted cuss words in body (context-preserving)

---

## System Components (High-Level)

### 1. Asset Library
- Ingest source material from local folders, cloud storage, web downloads
- Auto-download from provided links (YouTube, social media, etc.)
- Auto-tag and categorize assets (clips, images, audio, by type/mood/content)
- Track usage to avoid over-reusing the same clips
- Per-client asset isolation

### 2. Content Strategy Engine (AI Brain)
- AI generates daily content plans for each account
- **Viral optimization**: crafts hooks, applies rage-bait/click-bait strategies per platform
- Decides video type, which assets to combine, text overlays, music selection
- Writes captions optimized for engagement (questions, hot takes, calls to action)
- Ensures uniqueness across all 1,860 monthly videos
- Respects themes/rules set by the user
- Understands platform-specific viral mechanics (TikTok trends vs IG Reels vs YouTube Shorts vs X)

### 3. Video Generation Pipeline
- **FFmpeg Core**: Programmatic video assembly (clips, transitions, text, effects, music)
- **Hook Engine**: Ensures every video opens with a strong hook (visual + text)
- **Profanity Filter**: Auto-detects and mutes cuss words without cutting context
- **Modular Generators**: Each video type (lyric viz, edit compilation, news clip, etc.) has its own generator
- **Plugin Architecture**: AI video generation APIs can be plugged in for specific types later
- **Quality Checks**: Automated validation (correct length, resolution, no blank frames, etc.)

### 4. Distribution System
- Auto-post to TikTok, Instagram, YouTube Shorts, X/Twitter
- Uses automation software/APIs for posting (needs research on best tools)
- Schedule posts every 12 hours per account
- Handle platform-specific requirements (length limits, captions, hashtags)
- Manage 30 accounts per client with proper authentication

### 5. Client Dashboard (Web UI)
- Add/manage artist clients
- Upload source material + provide links for auto-download
- Set themes, rules, and content guidelines
- View content calendar and upcoming posts
- Monitor account performance (optional, future)

### 6. Scheduling Engine
- Queue management for all accounts
- 12-hour posting intervals
- Stagger posts to avoid platform detection
- Retry logic for failed posts

### 7. Account Creation & Management
- Automated creation of fan page accounts on TikTok, IG, YouTube, X
- Profile setup (bio, profile pic, display name) matching client brand
- Credential management and secure storage
- Accept client-provided accounts alongside system-created ones

### 8. Trend Monitoring Engine
- Real-time tracking of trending sounds, formats, and challenges
- Platform-specific trend detection (TikTok, IG Reels, YouTube Shorts, X)
- Feeds trends into the Content Strategy Engine for automatic incorporation
- Helps ensure content stays relevant and maximizes viral potential

---

## Resolved Questions

1. **Platform API access** — Currently posting manually. Wants full automation software. Need to research best tools for auto-posting to TikTok, IG, YouTube Shorts, and X at scale (30 accounts per client).

2. **Client onboarding** — Both direct upload and link-based auto-download. User uploads some assets, provides links for the rest, system pulls content automatically.

3. **Content guardrails** — No profanity in hooks. Mute cuss words in body content without losing context. Beyond that, focus on viral optimization: rage-baiting, click-baiting, strong hooks. System should understand what makes content go viral.

4. **Platform formatting** — All vertical 9:16 across all platforms. No platform-specific reformatting needed.

5. **Account management** — System creates and manages the 30 accounts per client. Client may also provide a few existing accounts. System is the primary account creator.

6. **Trending content awareness** — Real-time trend monitoring is essential. System must track trending sounds, formats, and challenges across all 4 platforms and incorporate them into video creation automatically.

---

## Open Questions

1. **Posting automation tool** — Need to research and decide which tool/API to use for auto-posting to 30+ accounts across 4 platforms. Options include social media management APIs, browser automation, or third-party services. This is a critical technical decision.

2. **Account creation automation** — System needs to create accounts on TikTok, IG, YouTube, and X. Need to research feasibility and approach (API-based, browser automation, manual with system tracking). Platforms actively resist automated account creation, so this needs careful design.

3. **Trend monitoring infrastructure** — Need to research how to monitor trending sounds/formats/challenges in real-time across 4 platforms. Options: platform APIs, web scraping, third-party trend tracking services. This feeds directly into the Content Strategy Engine.

---

## Success Criteria

- Generate 1,860+ unique, high-quality videos per month per client
- Fully automated end-to-end: asset in, video out, posted on schedule
- Videos are optimized for virality: strong hooks, engagement-driving content
- Client is impressed with video quality and variety
- System is manageable by a non-technical user through a simple dashboard
- Scalable to multiple artist clients without linear cost increase
- Costs start under $100/mo and scale with revenue
- Goal: become the most successful clipping agency on the internet
