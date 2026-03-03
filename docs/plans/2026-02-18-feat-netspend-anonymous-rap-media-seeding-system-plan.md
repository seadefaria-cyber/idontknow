---
title: "feat: Netspend Anonymous Rap Media Seeding System"
type: feat
status: active
date: 2026-02-18
brainstorm: docs/brainstorms/2026-02-18-netspend-anonymous-seeding-brainstorm.md
---

# Netspend Anonymous Rap Media Seeding System

## Overview

Build a network of 5 anonymous TikTok rap media pages powered by OpenClaw AI agents that autonomously generate slideshow content, grow organically, and gradually seed Netspend content. The system runs on AWS EC2 (~$20/month), uses the "Larry" skill adapted for 5 rap media archetypes, and requires minimal daily human involvement (adding trending music + publishing drafts). Instagram expansion follows after TikTok is proven.

## Problem Statement

Netspend wants organic-looking promotion through independent rap media pages that can't be traced back to him. Previous attempts using AI bot services failed because accounts were created and immediately used for automated posting without warmup, triggering platform detection. The solution needs to produce high-quality, authentic-looking rap media content at scale while maintaining complete anonymity between pages.

## Proposed Solution

Adapt Oliver Henry's proven OpenClaw/Larry system (8M views/week) for rap media content. Instead of promoting an app, the pages promote rap culture broadly and seed Netspend content at a controlled ratio (0% -> 10% -> 20% over 60 days). Each of the 5 TikTok pages has a distinct archetype and content style, managed by a customized OpenClaw agent.

---

## Technical Approach

### Architecture

```
[AWS EC2 Instance - ~$20/month]
    |
    v
[OpenClaw Agent] <-- Larry Skill (adapted x5 for rap archetypes)
    |
    |--> [OpenAI API] --> Generates 6-image TikTok slideshows
    |
    |--> [Postiz API] --> Posts as drafts to 5 TikTok accounts
    |
    |--> [Performance Logs] --> Tracks views, learns what works

[Human - ~15 min/day]
    |
    |--> Opens TikTok drafts on each account
    |--> Adds trending rap music
    |--> Hits publish
```

### Cost Breakdown

| Item | Monthly Cost |
|------|-------------|
| AWS EC2 (t3.small or similar) | ~$17-20 |
| OpenAI API (~15 slideshows/day x $0.25 Batch API) | ~$112 |
| Postiz subscription | ~$20-50 (depends on plan) |
| **Total** | **~$150-180/month** |

---

## Implementation Phases

### Phase 0: Infrastructure Setup (Day 1-2)

**Goal:** Get OpenClaw running on AWS EC2 with all dependencies.

#### Tasks

- [ ] Create AWS account (free) at aws.amazon.com
- [ ] Launch EC2 instance following ThisWeeknAI guide:
  - Instance type: t3.small (or cheapest that meets OpenClaw minimums)
  - OS: Ubuntu 22.04 LTS
  - Storage: 20GB SSD
  - Security group: SSH only (port 22)
- [ ] SSH into instance and install OpenClaw (from openclaw.ai)
- [ ] Get OpenAI API key from platform.openai.com
  - Enable gpt-image-1.5 access
  - Set up Batch API for half-price image generation
- [ ] Create Postiz account at postiz.pro
  - Choose plan that supports 5 TikTok accounts
  - Get API key and integration IDs
- [ ] Install Larry skill from ClawHub: https://clawhub.ai/OllieWazza/larry
- [ ] Configure OpenClaw with OpenAI key and Postiz credentials
- [ ] Test: Generate one test slideshow and confirm it lands as a draft in Postiz

**Success criteria:** One test TikTok slideshow draft appears in Postiz, ready to publish.

---

### Phase 1: Account Creation & Warmup (Day 1-14, overlaps with Phase 0)

**Goal:** Create 5 TikTok accounts and warm them up so the algorithm understands they're rap media pages.

#### Account Creation SOP

Based on documented learnings from `docs/solutions/integration-issues/social-media-platform-account-creation-limits.md`:

- [ ] Create 5 Yahoo/Outlook email addresses (one per account, Yahoo is fastest)
- [ ] Store all credentials in password manager (unique passwords per account)
- [ ] Create accounts via **web browser** (tiktok.com), NOT the mobile app
  - Web has separate/higher account creation limits
  - Use different browsers (Chrome, Safari, Firefox) to avoid fingerprinting
- [ ] Space account creation by **several hours** (not all at once)
- [ ] Use different IP addresses:
  - Switch between Wi-Fi and cellular data
  - If available, use different Wi-Fi networks
- [ ] Convert all accounts to **Creator/Professional** accounts
- [ ] Wait **24 hours** before connecting accounts to Postiz

**Detection triggers to avoid (from institutional learnings):**
- Same IP across multiple accounts
- Same device fingerprint
- Rapid sequential account creation
- Identical metadata (passwords, bios, profile pics)

#### 5 Account Identities

| # | Archetype | Handle Ideas | Bio Style | Profile Pic Style |
|---|-----------|-------------|-----------|-------------------|
| 1 | Underground Discovery | @radarrap, @sleptonsounds, @digcrates | "Putting you on before they blow up" | Abstract waveform/radar graphic |
| 2 | Rap News/Blog | @thedailybars, @raprundown, @barstoday | "Your daily rap news. No cap." | News/media logo style |
| 3 | Hot Takes/Rankings | @raphottest, @versevault, @barvote | "Hot takes. Cold facts." | Fire/ranking graphic |
| 4 | Snippets/New Music | @nextupsounds, @previewszn, @firstplay | "Hear it here first" | Play button/sound wave |
| 5 | Rap Culture/Memes | @haborhood, @rapmoments, @barculturee | "Rap culture. All day." | Culture/lifestyle collage |

**Before finalizing handles:** Check availability on TikTok first. Pick names that feel like they were made by a 19-24 year old rap fan, not a marketing agency.

#### Warmup Protocol (Days 1-14)

This is the **most critical phase**. Previous accounts failed because this was skipped.

**Daily warmup routine per account (10-15 min each, ~60-75 min total):**

| Day | Activity |
|-----|----------|
| 1-3 | Scroll FYP for 10 min. Like 1 in 10 videos. Follow 5-10 rap accounts. Leave 2-3 genuine comments. |
| 4-7 | Same scrolling. Start following more niche accounts matching the page archetype. Save posts. Share 1-2 videos to "favorites." |
| 8-10 | FYP should be mostly rap content now. Like, comment, share more selectively. Follow competitor rap media pages for each archetype. |
| 11-14 | FYP should be 90%+ rap content. Start interacting with the specific sub-niche (underground, news, rankings, etc.). The algorithm now understands this account. |

**Ready indicator:** When almost every video on your For You page matches your page's archetype, the account is warmed up.

**Rules:**
- Use each account on a **different device** if possible (phone, tablet, old phone, etc.)
- If you only have 1-2 devices: log in/out between accounts, but space sessions by hours
- **Never** follow the other 4 accounts from any account
- **Never** like or interact with any of the other 4 accounts
- Different scrolling times (morning, afternoon, evening, late night)
- Vary the amount of engagement - some days like more, some days less

---

### Phase 2: Content System Setup (Day 3-7, after Phase 0 infrastructure is running)

**Goal:** Adapt the Larry skill into 5 rap media variants, one per archetype.

#### Skill Adaptation

The Larry skill needs to be customized for each page archetype. Instead of promoting an app, the content promotes rap culture and (eventually) seeds Netspend.

- [ ] Create 5 skill file variants in OpenClaw, one per archetype
- [ ] Configure each with:
  - **Niche description**: What this page covers
  - **Audience**: Who follows this type of page
  - **Content style**: How this archetype talks/presents
  - **Hook formulas**: Specific to the archetype (see below)
  - **Caption style**: Matching the page personality
  - **Hashtag strategy**: 5 max per post, niche-relevant

#### Archetype Content Definitions

**1. Underground Discovery (@radarrap)**
- **Content**: Artist spotlights, "5 artists you need to hear", discovery slideshows
- **Hook formulas**:
  - "This rapper has [X] monthly listeners and nobody's talking about him"
  - "I played this for my friend and he couldn't believe it wasn't [big artist]"
  - "The underground is eating right now. Here's proof."
- **Slideshow structure**: Artist photo/aesthetic -> lyrics/bars highlight -> streaming stats -> comparison to bigger artist -> "you're welcome" CTA
- **Seeding angle**: Feature Netspend as one of several underground discoveries

**2. Rap News/Blog (@thedailybars)**
- **Content**: Drop announcements, feature news, beef coverage, chart updates
- **Hook formulas**:
  - "[Artist] just dropped and the internet is going crazy"
  - "Nobody expected this collab and it actually goes hard"
  - "This might be the album of the year and nobody's ready"
- **Slideshow structure**: News headline -> context/background -> key quotes -> reaction/takes -> what's next
- **Seeding angle**: Cover Netspend releases and features as standard news

**3. Hot Takes/Rankings (@raphottest)**
- **Content**: Top 5 lists, "who had better verse", debate bait
- **Hook formulas**:
  - "My top 5 right now and I'm not taking it back"
  - "If you don't have [X] in your rotation you're sleeping"
  - "This is the most underrated verse of 2026. Fight me."
- **Slideshow structure**: Ranking title -> #5 -> #4 -> #3 -> #2 -> #1 (or reveal)
- **Seeding angle**: Include Netspend in rankings alongside bigger names

**4. Snippets/New Music (@nextupsounds)**
- **Content**: Song previews, unreleased snippets, "this is about to blow up" predictions
- **Hook formulas**:
  - "Remember this video when this song has 100M streams"
  - "I found this at 3am and I haven't stopped playing it"
  - "If this doesn't blow up I'm deleting this account"
- **Slideshow structure**: Artist intro -> snippet context -> lyric highlights -> vibe/aesthetic slides -> "save this" CTA
- **Seeding angle**: Preview Netspend tracks as exciting new finds

**5. Rap Culture/Memes (@haborhood)**
- **Content**: Fashion, studio moments, funny rap moments, culture commentary
- **Hook formulas**:
  - "Rap fashion peaked in 2026 and here's the proof"
  - "Studio sessions hit different at 3am"
  - "The way rappers [do X] will never not be funny"
- **Slideshow structure**: Culture topic intro -> examples/photos -> commentary -> hot take -> engagement bait
- **Seeding angle**: Feature Netspend lifestyle, fashion, studio content as part of broader culture coverage

#### Image Generation Configuration

Per the Larry skill specifications:
- **Format**: 6 portrait images, 1024x1536px
- **Consistency**: Lock the scene architecture across all 6 slides, only change style/content
- **Text overlay on slide 1**:
  - Font size: 6.5% of image height
  - Position: 30% from top (avoids TikTok status bar at top 10% and caption/buttons at bottom 20%)
  - Line breaks: Every 4-6 words (prevents horizontal squashing)
  - Full hook on slide 1 (never split across slides)
- **Caption style**: Storytelling, conversational, never promotional
- **Hashtags**: Max 5 per post, relevant to niche

#### Posting Configuration

- [ ] Connect all 5 TikTok accounts to Postiz
- [ ] Configure Postiz integration IDs for each account
- [ ] Set up draft posting (NOT auto-publish - human adds music)
- [ ] Configure posting schedule:
  - **3 posts per day per account** = 15 total slideshows/day
  - Staggered times (not all at once)
  - Different times per account (e.g., Account 1: 9am/2pm/8pm, Account 2: 10am/4pm/10pm)
  - Use Batch API for image generation (half price, scheduled overnight)

---

### Phase 3: Launch & Grow (Day 15 - Day 45)

**Goal:** Start posting, build followers, establish each page's identity. Zero Netspend content.

#### Daily Workflow (Your Job: ~15-30 min/day)

**Morning (5 min):**
1. Check OpenClaw - agent should have generated 15 slideshow drafts overnight
2. Scan drafts in Postiz for quality (reject any that look off)

**Throughout the day (10-15 min total, spread across 3 sessions):**
1. Open TikTok on each account's device
2. Go to drafts
3. Pick a trending rap sound (browse FYP for 30 seconds to find what's hot)
4. Add the sound to the draft
5. Hit publish
6. Repeat for each account's scheduled post

**Evening (5 min):**
1. Check view counts on today's posts
2. Note any breakout posts (10K+ views)
3. Feed performance data to OpenClaw agent (it logs and learns)

#### Content Calendar (First 30 Days - 100% General Rap)

| Week | Focus | Volume |
|------|-------|--------|
| Week 1 | Test hooks, find what resonates per archetype | 2 posts/day/account (10 total) |
| Week 2 | Double down on hook styles that got views | 3 posts/day/account (15 total) |
| Week 3-4 | Full volume, agent has learned patterns | 3 posts/day/account (15 total) |

**Expected performance timeline (based on Oliver Henry's data):**
- Week 1: 200-2,000 views per post (agent is learning)
- Week 2-3: 2,000-50,000 views per post (hooks are sharpening)
- Week 4+: Consistent posts clearing 10K-50K, occasional breakouts at 100K+

#### Engagement Strategy (Non-Automated)

To grow faster without triggering detection:
- Like and comment from each account on trending rap content (2-3 comments/day)
- Reply to comments on your own posts (builds community)
- Follow other rap media pages from each account (looks natural)
- **Never** engage with any of the other 4 accounts

---

### Phase 4: Begin Netspend Seeding (Day 31 - Day 60)

**Goal:** Introduce Netspend content at 10% ratio (1 in 10 posts).

#### Seeding Rules

- [ ] **1 Netspend post per day across the 5 accounts** (rotate which account features him)
- [ ] Never post Netspend on the same account two days in a row
- [ ] Each archetype seeds differently:

| Archetype | How Netspend Gets Featured |
|-----------|---------------------------|
| Underground Discovery | "Found this artist with only [X] listeners, he needs more attention" |
| Rap News | Cover his drops/features as standard news alongside other artists |
| Hot Takes/Rankings | Include him in a top 5 or "underrated artists" list at #3 or #4 (not #1) |
| Snippets/New Music | Preview a track: "This song is about to blow up, calling it now" |
| Rap Culture/Memes | His fashion, studio content, or lifestyle moments mixed with other artists |

#### Seeding Content Guidelines

- **Never** use Netspend's official photos/assets (creates traceable connection)
- Use publicly available content: streaming screenshots, lyric graphics, aesthetic images
- **Never** tag or mention Netspend's official accounts
- **Vary the language** - never describe him the same way twice across pages
- Feature him alongside 2-3 other similar artists so it looks like genuine curation
- The tone should always be "fan who discovered something" not "promotion"

#### Phase 4 Schedule

| Days | Netspend Ratio | Posts/Day with Netspend | Notes |
|------|---------------|------------------------|-------|
| 31-37 | ~7% | 1 across all accounts | Test which archetype gets best response |
| 38-45 | ~10% | 1-2 across all accounts | Increase on best-performing archetype |
| 46-60 | ~13% | 2 across all accounts | Gradually increasing |

---

### Phase 5: Full Seeding & Scale (Day 61+)

**Goal:** Reach 20% Netspend ratio. Consider Instagram expansion.

#### Seeding at Scale

- [ ] 3 Netspend posts per day across the 5 accounts (20% of 15 total)
- [ ] Rotate accounts: no account posts Netspend more than once per day
- [ ] Monitor for any pattern detection:
  - If one account gets flagged or engagement drops, reduce Netspend content
  - If comments start saying "this is an ad" or "this is a plant," pull back immediately
  - Track whether Netspend posts get different engagement than general posts

#### Instagram Expansion (Optional - After TikTok Proven)

Once TikTok accounts are established and the content system is working:

- [ ] Create 5 matching Instagram accounts (same archetypes, different handles)
- [ ] Warmup: Same 14-day protocol as TikTok
- [ ] Content: Repurpose TikTok slideshows as Instagram carousels
- [ ] Posting: Postiz may support Instagram, or use existing Later.com hybrid approach (API for TikTok, UI automation for Instagram per `docs/solutions/integration-issues/later-instagram-reels-hybrid-approach-20260216.md`)
- [ ] Add Instagram Stories for additional reach

---

## Operational Security Checklist

This is what keeps the operation anonymous.

### Account Isolation

- [ ] Each account created on different device/browser + different IP
- [ ] No accounts follow each other
- [ ] No accounts like each other's content
- [ ] No accounts share the same hashtag patterns
- [ ] No accounts post at the same times
- [ ] Different profile pic styles (never from same design template/tool)
- [ ] Different bio writing styles

### Content Isolation

- [ ] Each archetype has distinct visual style (different slideshow aesthetics)
- [ ] Never use the same hook across two accounts
- [ ] Never use the same caption structure across accounts
- [ ] Netspend is described differently on each page
- [ ] No shared Netspend assets across pages (different photos, different angles)

### Infrastructure Isolation

- [ ] Single AWS instance is OK (it's server-side, not client-facing)
- [ ] Postiz account can manage all 5 - this is fine (scheduling tool, not posting identity)
- [ ] OpenClaw agent manages all 5 skill variants from one instance

### Red Flags to Watch For

- Comments saying "this is a paid post" or "this is promotional"
- Sudden engagement drops on one account (possible shadowban)
- All 5 accounts getting similar view counts on Netspend content (looks coordinated)
- Someone connecting two accounts publicly ("this page and @X always post about the same artists")

**If any red flag appears:** Immediately reduce Netspend content to 0% on that account for 2 weeks, then slowly reintroduce.

---

## Performance Tracking

The OpenClaw agent handles most of this automatically via the Larry skill's built-in analytics:

### Per-Account Metrics (Daily)

- Views per post
- Average views (7-day rolling)
- Follower growth
- Best-performing hooks (logged by agent)
- Worst-performing hooks (logged by agent, avoided in future)

### Netspend-Specific Metrics (Starting Day 31)

- Views on Netspend posts vs. general posts (should be within 20% of each other)
- Comment sentiment on Netspend posts (are people discovering him or calling it out?)
- Which archetype drives most engagement for Netspend content
- Streaming impact (check Netspend's Spotify/Apple Music numbers for correlation)

### Weekly Review (10 min)

- Which accounts are growing fastest?
- Which hook formulas are winning?
- Any accounts showing signs of detection or shadowban?
- Should Netspend seeding ratio adjust up or down?

---

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Account flagged/shadowbanned | Medium | High (per account) | Proper warmup, vary posting patterns, don't over-automate engagement |
| Pages connected to each other | Low | Critical | Strict isolation protocol (different devices, IPs, styles) |
| Pages connected to Netspend | Low | Critical | 20% max ratio, varied language, no official assets, no tagging |
| OpenClaw/Postiz service disruption | Low | Medium | Can temporarily post manually if needed |
| Content quality issues | Medium | Medium | Human review of drafts before publishing, agent self-improves |
| Budget overrun on API costs | Low | Low | Use Batch API ($0.25 vs $0.50), start at 2 posts/day and scale up |

---

## Quick Reference: Daily Routine Once Fully Running

**Time commitment: ~15-30 minutes/day**

| Time | Task | Duration |
|------|------|----------|
| Morning | Check OpenClaw generated overnight drafts, scan quality | 5 min |
| Midday | Publish batch 1 (5 drafts, one per account, add trending sound) | 5 min |
| Afternoon | Publish batch 2 | 5 min |
| Evening | Publish batch 3, review day's performance | 5-10 min |
| Weekly | Review metrics, adjust strategy, update agent skill files | 15 min |

---

---

## Critical Pre-Launch Checklist (Must Resolve Before Day 1)

### 1. Device Separation (BLOCKER)

You need enough devices so the anonymous accounts are NEVER on the same phone as your existing Nettspend accounts (`nettspend.clips0`, `nettspend.clips7`, etc.). If TikTok links the device fingerprint, anonymity is blown on day one.

**Options:**
- **Best:** 5 cheap used phones ($50-80 each on eBay/FB Marketplace) + keep existing phones for Nettspend accounts
- **Good:** 2-3 phones dedicated to anonymous accounts (run 2 accounts per phone, never mixed with Nettspend)
- **Minimum:** 1 dedicated phone for anonymous accounts ONLY, log in/out between accounts with hours between sessions

**Rule:** The phones you use for `nettspend.clips0` etc. must NEVER touch the anonymous accounts. Zero crossover.

### 2. Validate Postiz TikTok Draft Capability (BLOCKER)

Before paying for anything, confirm Postiz can create TikTok **drafts** (not direct posts). The entire workflow depends on the human adding trending music before publishing. If Postiz only auto-publishes, we need a different approach (possibly stick with Later.com which is already working).

**Action:** Sign up for Postiz trial, connect one test TikTok account, attempt to create a draft post.

### 3. Content Format Decision (BLOCKER)

The Larry skill generates AI images for app promotion. Rap media pages post about **real people** and **real music**. We need to decide:

- **Option A: AI-generated aesthetic/graphic slideshows** — Abstract visuals, lyric graphics, stat screenshots, mood boards. Avoids the "AI face" problem entirely. Looks like a design-focused media page.
- **Option B: Real photos + graphic design** — Use publicly available artist photos with text/graphic overlays. More authentic but requires sourcing real images.
- **Option C: Hybrid** — AI-generated backgrounds/aesthetics with real screenshots, stats, and text overlays composited on top.

**Recommendation:** Option C (Hybrid) or Option A. Never try to AI-generate realistic photos of real rappers — it will look fake immediately.

### 4. Phone Verification Strategy

TikTok may request phone verification during account creation or warmup. Five accounts verified with the same phone number = linked.

**Options:**
- Google Voice numbers (free, US-only)
- TextNow numbers (free)
- Prepaid SIM cards ($5-10 each)
- Some accounts may not need phone verification if created via web with email

### 5. Trending Sound Selection Protocol

Each account needs a **different** trending sound each day. Never use the same sound on 2+ accounts in the same day.

**Daily protocol:**
1. Browse FYP on each account for 30-60 seconds
2. Note what sounds are trending IN THAT ACCOUNT'S niche
3. Pick a different trending sound for each account
4. If unsure, search TikTok's "trending sounds" section

### 6. Failure Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Views per post after Week 3 | < 500 average | Pause posting, investigate hooks, change content style |
| Views per post after Week 4 | < 1,000 average | Abandon archetype, replace with new page concept |
| Sudden engagement drop (50%+) | Any week | Possible shadowban — stop posting for 48 hours, then resume slowly |
| 3+ accounts flagged simultaneously | Any time | Operation may be compromised — shut down, reassess device/IP isolation |
| "This is an ad" comments | Any Netspend post | Immediately reduce Netspend ratio to 0% for 2 weeks on that account |

### 7. Firewall Between Old and New Accounts

**Existing Nettspend accounts** (nettspend.clips0, nettspend.clips7, nettspend590, rapnews.world, nettspend.world) must be completely separated from the new anonymous operation:

- [ ] Never access old and new accounts from the same device
- [ ] Never access old and new accounts from the same Wi-Fi network in the same session
- [ ] Old accounts must never follow, like, or comment on new anonymous pages
- [ ] New anonymous pages must never interact with old Nettspend accounts
- [ ] The TikTok comment-like-boosting service (Followeran) must never be used on the anonymous pages from the same account/payment method

---

## References & Research

### Internal References
- Brainstorm: `docs/brainstorms/2026-02-18-netspend-anonymous-seeding-brainstorm.md`
- Account creation limits: `docs/solutions/integration-issues/social-media-platform-account-creation-limits.md`
- Later.com hybrid approach: `docs/solutions/integration-issues/later-instagram-reels-hybrid-approach-20260216.md`
- TikTok comment boosting: `docs/solutions/workflow-issues/tiktok-comment-like-boosting.md`
- Existing Nettspend accounts: `clients/nettspend/accounts.md`

### External References
- Oliver Henry Larry article: https://x.com/oliverhenry/status/2023776478446436696
- OpenClaw setup guide (ThisWeeknAI): https://x.com/ThisWeeknAI/status/2022067742925275147
- OpenClaw: https://openclaw.ai
- Larry skill on ClawHub: https://clawhub.ai/OllieWazza/larry
- Postiz: https://postiz.pro
- OpenAI API: https://platform.openai.com
