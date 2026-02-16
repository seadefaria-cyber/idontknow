---
title: "Post — AI-Powered Social Media Clipping Agency"
type: feat
status: active
date: 2026-02-14
---

## Enhancement Summary

**Deepened on:** 2026-02-14 (Round 1), 2026-02-15 (Round 2)
**Sections enhanced:** All
**Research agents used (Round 2):** Submagic API deep dive, Later alternatives research, social media algorithm analysis, architecture review, security audit, performance analysis, simplicity review, spec-flow analysis, frontend design skill

### Key Improvements (Round 2)
1. **Submagic API technical limits discovered** — Magic Clips endpoint is YouTube-URL-only; Business plan caps at 30 min per video; long-form streams must be pre-segmented before upload. Pre-segmentation step added to daily workflow.
2. **Later scheduling time corrected** — Revised from 10-15 min to 25-35 min per client when accounting for unique captions per account (required by the plan's own anti-detection guidelines).
3. **Cross-platform music licensing gap identified (CRITICAL)** — A sound licensed on TikTok is NOT licensed on YouTube/X. DMCA response procedure and per-platform clearance step added.
4. **API distribution alternatives confirmed** — Late (getlate.dev) at $33-49/mo is the top pick for future automated distribution; Ayrshare ($499-599/mo) runner-up; Publer ($190/mo) strong option.
5. **Platform algorithm strategy added** — Per-platform optimal posting frequencies, lengths, and cross-posting guidelines based on 2025-2026 algorithm research.
6. **Operational gaps filled** — Weekend/holiday policy, content buffer strategy, offboarding checklist, billing edge cases, reactive workflow, and content input specs defined.
7. **Font swap: Clash Display replaces Bebas Neue** — Bebas Neue deemed overexposed; Clash Display (Fontshare, free) is sharper and less generic.
8. **Breach response matrix expanded** — Now covers all 7 services, not just Later. Phone loss scenario and DMCA runbook added.
9. **Slack contradiction fixed** — Removed Slack from future automation scenarios (was eliminated but reappeared).
10. **Scaling wall clarified** — Sean hits the wall at 4 clients, not "past 3." Later scheduling is the first bottleneck.

### Critical Findings (Round 2)
- **Submagic Business plan: 30-min max video length, 2 GB max file size.** A 2-hour stream must be split into 4+ segments before upload. This step was completely missing from the pipeline.
- **Later scheduling at scale takes 25-35 min per client**, not 10-15 min. With unique captions per account (required to avoid detection), the daily Later time for 3 clients is 75-105 min — more than all other steps combined.
- **Cross-platform music licensing is NOT universal.** TikTok Commercial Music Library does NOT cover YouTube, Instagram, or X. Using a TikTok-licensed sound on YouTube generates a copyright violation.
- **TikTok 2026 algorithm change:** Content is now shown to followers FIRST before broader distribution. Accounts need an engaged follower base for initial momentum.
- **Instagram penalty:** Accounts posting 10+ reposts within 30 days are excluded from all recommendations (Explore, Reels feed, suggested posts).
- **YouTube Shorts:** Trending audio = 2.5x more views (VidIQ 2026). Any playback of any duration counts as a view (changed March 2025).

---

# Post — AI-Powered Social Media Clipping Agency

## Overview

Build the operational backbone and client-facing website for **Post**, a solo-run AI-powered social media clipping agency. Post takes raw content from streamers, podcasters, YouTubers, and music artists, and turns it into a high volume of short-form clips distributed across TikTok, Instagram, YouTube Shorts, and X.

The business charges $10-20k/month retainers. Clients are already lined up — the bottleneck is building a scalable workflow to deliver. Sean operates solo with no editors; AI handles bulk editing while Sean provides creative direction.

**Prerequisites assumed complete:** Business entity formed (LLC or sole proprietorship), business bank account open, service agreement reviewed by attorney (or acknowledged as template-only for initial clients).

## Problem Statement

Sean has the taste, the clients, and the industry knowledge to run a successful clipping agency. What he lacks is:

1. **An automated clipping pipeline** — He can't manually edit 30+ clips per day per client
2. **A distribution system** — He can't manually post to 30+ accounts across 4 platforms
3. **A professional web presence** — He needs a credible website to reinforce the brand
4. **Operational structure** — Client onboarding, contracts, billing, and reporting are undefined

## Proposed Solution

A phased build across 4 tracks, prioritized by what unblocks revenue first. **Start manual, automate later.** The first client should be onboarded within 2 weeks.

---

## Technical Approach

### Architecture Overview — MVP (Manual Pipeline)

```
CLIENT                          SEAN
  |                               |
  |-- Drops video in Drive -----> Gets notified (client texts/messages)
  |                               |
  |                         Pre-segments if >30 min (FFmpeg, 1-2 min)
  |                         Opens Submagic, uploads segment(s)
  |                         Waits for clips (5-30 min per segment)
  |                         Reviews in Submagic dashboard
  |                         Downloads approved clips
  |                               |
  |                         Opens hero clips in CapCut
  |                         Adds trending sounds (3-5 min each)
  |                         Verifies sound licensing per platform
  |                         Exports finished clips
  |                               |
  |                         Opens Later, uploads all clips
  |                         Writes unique captions per account
  |                         Schedules posts across platforms
  |                               |
  |                         Posts go live across platforms
  |                               |
  |<-- Monthly report (email) ----|
```

Zero automations. Zero integrations. Zero things that can break at 3 AM. The entire pipeline lives in Sean's hands, which at 2-3 clients is exactly where it should be.

**Why manual first:** At 2-3 clients, Make.com automation saves only 10-15 minutes per day of manual work, in exchange for hours of setup, debugging, and ongoing maintenance. Additionally, **Later.com does not have a public scheduling/posting API** — you cannot automate the Later step regardless. Start manual, add automation when daily time exceeds 3 hours or when scaling past 3 clients.

### Tool Stack (Simplified)

| Function | Tool | Cost/Month | Why |
|----------|------|-----------|-----|
| AI Clipping | **Submagic** Business plan | $41 (annual) | Best API value, Magic Clips, 48+ language captions |
| Distribution | **Later** Advanced plan | $80 | 42 profiles across TikTok, IG, YT, X |
| Manual editing | **CapCut** | Free | Trending sounds for hero clips |
| Website | **Astro + Tailwind CSS** | Free | Fast, minimal, zero-JS by default |
| Hosting + Contact Form | **Netlify** (with Netlify Forms) | Free | One-click deploy, CDN, built-in forms |
| Content storage | **Google Drive** | Free-$10 | One folder per client |
| Billing | **Stripe Invoicing** | 0.4% per invoice | Simple monthly invoicing |

**Total: 7 tools, ~$121/month** (against $10-20k+ revenue per client)

**Eliminated from original plan:**
- ~~Vizard~~ ($14.50/mo) — YAGNI; evaluate only if Submagic proves unreliable
- ~~Make.com~~ ($9-16/mo) — premature automation; Later has no API anyway
- ~~Slack/Telegram~~ — solo operator doesn't need to notify himself
- ~~Resend~~ — replaced by free Netlify Forms

### Submagic API Technical Details

| Constraint | Value |
|---|---|
| Supported formats | MP4, MOV only |
| Max file size | 2 GB |
| Max video duration (Business plan) | **30 minutes** |
| Magic Clips input | **YouTube URLs only** (not arbitrary video files) |
| Clip length range | 15-300 seconds |
| Rate limit: project creation | 30/hour |
| Rate limit: Magic Clips | 500/hour |
| Rate limit: project status polling | 100/hour |
| Virality scoring | 5 dimensions: total, shareability, hook_strength, story_quality, emotional_impact (0-100) |
| Custom moment detection criteria | **Not supported** — AI decides autonomously |

**Critical implication:** Long-form streams (1-4 hours) must be pre-segmented into 25-minute chunks before upload. This step is in the daily workflow below.

---

## Implementation Phases

### Phase 1: Tool Setup (Days 1-2)

**Goal:** Get Submagic and Later accounts ready. Test with real content.

- [ ] Sign up for Submagic Business plan ($41/mo annual)
- [ ] Run a real source video through Submagic — evaluate clip quality, caption accuracy, processing speed, and virality scores
- [ ] If output is unusable, try Vizard.ai as a backup ($14.50/mo)
- [ ] Sign up for Later Advanced plan ($80/mo)
- [ ] **Set up a password manager** (1Password or Bitwarden) with MFA — do this FIRST before creating any more accounts
- [ ] Enable MFA on Google, Stripe, Later, Submagic, and Netlify

---

### Phase 2: First Client Pipeline (Days 3-10)

**Goal:** Get the first client fully operational with a manual workflow.

#### 2a. Content Storage Setup

- [ ] Create a dedicated Google Drive folder per client (one folder, no subfolders needed):
  ```
  Post - Client A/    (shared with client, they drop files here)
  Post - Client B/    (separate folder, shared separately)
  ```
- [ ] **Security:** Each client folder is a separate shared folder. Restrict sharing to specific email addresses (NOT "anyone with the link"). Never share a parent folder. Client A cannot see Client B's content.
- [ ] Use a dedicated Google Workspace account for the agency ($6/mo) — not your personal Gmail
- [ ] **Never use "Sign in with Google" for agency tools.** Use email+password (stored in password manager) for each service independently.

#### 2b. Daily Clipping Workflow

Sean's daily routine per client:

1. **Check for new content** — Client texts/messages when something's ready. Sean commits to checking within 2 hours during business hours (9 AM - 10 PM ET, Mon-Fri).
2. **Pre-segment if needed** — If source video exceeds 30 minutes, split into 25-min chunks:
   ```bash
   ffmpeg -i stream.mp4 -c copy -segment_time 1500 -f segment chunk_%03d.mp4
   ```
   Takes 1-2 min per hour of source video (copy codec, no re-encoding).
3. **Upload to Submagic** — Open Submagic dashboard, upload segment(s). For YouTube content, paste the YouTube URL directly into Magic Clips endpoint instead.
4. **Wait for processing** — 5-30 min per segment depending on length.
5. **Review hero clips (3-5)** — Watch the top-ranked clips (virality score > 70). Approve the ones with genuine viral potential.
   - **Decision framework:** Does it have an emotional hook in the first 3 seconds? Would you share it? Is it controversial, funny, or high-energy? If yes to 2+, it's a hero clip.
   - **Copyright check:** Listen for identifiable copyrighted music or content in the clip. Flag any with potential issues.
6. **Quick-scan filler clips (10-15)** — 60-second thumbnail scan. Flag and remove anything: out of context, potentially offensive, low quality, or off-brand. Batch-approve the rest.
7. **Add trending sounds to hero clips** — Open CapCut, add trending sounds (TikTok/IG hero clips only). **Verify sound licensing per platform before use** (see 2c below). Export.
8. **Upload to Later** — Upload all approved clips to Later's dashboard. Write unique captions per account (not the same caption copied), add hashtags, schedule across all accounts.

**File naming convention:** `{client}_{date}_{platform}_{sequence}_{hero|filler}.mp4` (e.g., `clienta_20260215_tiktok_01_hero.mp4`)

**Estimated daily time per client: 45-75 minutes** (includes pre-segmentation + review + CapCut + Later scheduling at 25-35 min)

#### 2c. Trending Sound Discovery & Licensing

- [ ] **Daily scan (5-10 min):** Check these sources for trending sounds:
  - **TikTok Creative Center** (creative.tiktok.com) — browse trending songs by region
  - **TokChart** (tokchart.com) — tracks hottest trending songs with traction graphs
  - **Instagram Reels** — start creating a Reel, tap music icon, go to Trending tab
- [ ] **48-hour window:** Once a sound is trending, use it within 48 hours for maximum algorithmic boost
- [ ] **Sound bank:** Keep a running list (Google Doc or Notes app) of proven sounds that work for each client's niche

**CRITICAL — Per-Platform Music Licensing:**

| Platform | Music Licensing | Rule |
|----------|----------------|------|
| **TikTok** | TikTok Commercial Music Library | Verify sound is in the Commercial Music Library for business accounts |
| **Instagram** | Instagram's licensed music library | Verify separately — TikTok license does NOT cover Instagram |
| **YouTube Shorts** | YouTube Content ID | **Highest risk.** Most copyrighted sounds trigger Content ID claims. Use royalty-free music or original audio only. |
| **X** | No music licensing program | **Do not use copyrighted trending sounds on X.** Use original audio or royalty-free only. |

**Safe approach for hero clips going to all 4 platforms:** Use the trending sound on TikTok and Instagram only. For YouTube and X versions of the same clip, strip the trending sound and use original audio or royalty-free music.

#### 2d. Distribution Setup

- [ ] Connect all client social accounts via Later's OAuth flow
  - **Use Leadsie** (leadsie.com) for secure account access — client clicks a link and grants permissions via OAuth, no password sharing needed
  - Verify that OAuth connections persist in Later independently of Leadsie's infrastructure (important if Leadsie ever goes down)
- [ ] Create posting schedule per client:
  - Hero clips: Peak hours (Later suggests optimal times per platform)
  - Filler clips: Fill remaining schedule slots
  - Cadence: See Platform Strategy section below

#### 2e. Platform Risk Mitigation

| Platform | Risk Level | Mitigation |
|----------|-----------|------------|
| **TikTok** | Low | Use Later for scheduling (official API partner). Each account has unique email/phone. Space out posting times. |
| **Instagram** | Medium | Use Later's official Meta API integration. Vary captions and hashtags across accounts. **Never exceed 10 reposts in 30 days** (triggers recommendation exclusion). |
| **YouTube** | **HIGH** | Do NOT post template-identical clips across multiple channels. Each channel must have distinct branding, unique intros/outros, varied clip selections. **Limit to 2-3 YouTube channels per client max.** Use royalty-free audio only. |
| **X** | Medium | Limit to 5-10 accounts per client. Stagger posting times. Vary tweet text per account. No copyrighted music. |

**General rules:**
- Never post the exact same clip with the exact same caption to multiple accounts at the same time
- Each account should have a distinct "personality"
- YouTube gets the most cautious approach — quality over quantity
- Remove all platform watermarks before cross-posting

#### 2f. Weekend & Holiday Policy

- [ ] **Standard coverage: Monday-Friday, 9 AM - 10 PM ET.**
- [ ] **Weekends and holidays:** Pre-schedule 2-3 days of content on Thursdays/Fridays. Reactive clips are NOT available on weekends or holidays.
- [ ] **Content buffer:** Always maintain **3-5 days of pre-scheduled content** per client in Later. This is Sean's insurance against illness, travel, tool outages, and content droughts.
- [ ] **State this in the contract:** "Standard service hours: Monday-Friday, 9 AM - 10 PM ET. Weekend and holiday content is pre-scheduled. Reactive/urgent clip requests are available during standard service hours only."
- [ ] **Content drought:** If a client provides no new content for 7+ days, notify them that posting volume will decrease. Draw from backlog of previously generated but unscheduled clips if available.

### Platform Posting Strategy (Per-Platform Algorithm Guidelines)

Based on 2025-2026 algorithm research:

| Platform | Optimal Posts/Day | Optimal Length | Best Times | Key Signal |
|----------|------------------|---------------|------------|------------|
| **TikTok** | 2-3 (max 4) | 15-30 seconds | 5-9 PM weekdays, Sun 8 PM | Completion rate (70%+ needed), saves > likes |
| **Instagram Reels** | 1-2 | 15-30 seconds | 11 AM-6 PM Wed-Fri | Watch time (3-sec retention critical), DM shares |
| **YouTube Shorts** | 1-2 | 20-45 seconds | Wed 7 PM, Fri-Sat evenings | Trending audio (2.5x views), completion rate |
| **X** | 2-4 | Under 45 seconds | Tue-Wed, morning/early afternoon | First 30-min engagement, replies + reposts |

**For 15-20 total clips/day per client across 4 platforms:**
- TikTok: 4-5 clips/day (most tolerant of volume)
- Instagram: 2-3 clips/day (supplement with Stories and carousels for variety)
- YouTube Shorts: 1-2 clips/day (quality over quantity)
- X: 3-5 clips/day (high-frequency tolerant)

**Cross-posting rules:**
- Stagger posting times across platforms (do NOT post simultaneously)
- Remove all watermarks before cross-posting
- Use platform-native features where possible (TikTok effects, Instagram stickers)
- TikTok trends hit Instagram 2-5 days later — monitoring TikTok gives a head start on Instagram sounds

---

### Phase 3: Website Build (Days 10-17, after first client is stable)

**Goal:** Launch a professional single-page website that makes Post look credible.

**Note:** Client work always takes priority. The website is interruptible — it ships when it ships. Clients are already coming through referrals; the site reinforces credibility, it doesn't generate leads.

#### Tech Stack

```
post-website/
├── src/
│   ├── layouts/
│   │   └── Base.astro              (global dark theme, fonts, meta)
│   ├── pages/
│   │   └── index.astro             (single scrollable page)
│   ├── components/
│   │   ├── Hero.astro              (tagline + CTA)
│   │   ├── ValueProps.astro        (3 bold statements, vertically stacked)
│   │   ├── VideoShowcase.astro     (self-hosted clips, hover-to-play grid)
│   │   ├── Services.astro          (2-column: sticky heading + service list)
│   │   ├── ContactForm.astro       (minimal, bottom-border inputs)
│   │   └── Footer.astro            (wordmark + social text links)
│   ├── assets/
│   │   └── fonts/                  (Clash Display + Satoshi woff2)
│   └── styles/
│       └── globals.css             (Tailwind v4 @theme tokens)
├── public/
│   └── clips/                      (self-hosted showcase videos)
├── astro.config.mjs
└── package.json
```

#### Design Direction

**Color Palette — Electric Vermillion**
```css
:root {
  --bg-primary: #0a0a0a;
  --bg-elevated: #141414;
  --bg-surface: #1a1a1a;
  --text-primary: #f5f5f0;    /* warm white */
  --text-secondary: #8a8a8a;  /* bumped from #737373 for WCAG AA compliance */
  --accent: #FF3D00;           /* electric red-orange */
  --accent-hover: #FF6D3A;
  --border: #1a1a1a;
}
```

**Typography — Clash Display + Satoshi**
- **Headings:** Clash Display (Fontshare, free) — geometric display face with sharp, modern edges. Less overexposed than Bebas Neue while hitting the same impact.
- **Body:** Satoshi (Fontshare, free) — geometric sans, clean, modern, excellent readability.
- Hero headline: `clamp(4rem, 12vw, 10rem)` with `line-height: 0.9`
- Section headings: `clamp(2.5rem, 6vw, 5rem)`

**Accent color usage (exactly 5 places):**
1. Hero headline final word (the punch word)
2. Value props accent phrase (one per statement)
3. Form input focus border
4. CTA hover state (hero + submit buttons)
5. Custom `:focus-visible` outline for keyboard navigation

**Layout:**
- Full-width sections, fluid spacing with `clamp()` (e.g., `clamp(6rem, 12vw, 10rem)` between sections)
- Inline SVG noise texture overlay on background (3-5% opacity, zero network requests)
- No gradient meshes, no glassmorphism, no stock photos

**Animations — CSS-only with Intersection Observer:**
- Hero: staggered word reveal using `clip-path: inset()` (500ms per word, `cubic-bezier(0.16, 1, 0.3, 1)`)
- Below fold: `translateY(40px)` + fade-in on scroll, triggered at 15-20% visibility
- Video grid: staggered card reveal (80ms delay between cards)
- `prefers-reduced-motion` media query disables all animations for accessibility

#### Sections

1. **Hero:** Enormous headline (e.g., "30 CLIPS. EVERY DAY. EVERY PLATFORM."), one-line value prop beneath, single "Get in Touch" CTA. Text bleeds to viewport edges. No images — typography IS the design.

2. **Value Props:** 3 bold statements stacked vertically with extreme whitespace. Display font, left-aligned with `max-width: 20ch` for intentional line breaks. One keyword per statement highlighted in accent color. NOT a 3-column grid.

3. **Video Showcase:** Grid of self-hosted vertical video clips (9:16 cards, `aspect-ratio: 9/16`). 3-4 columns on desktop, 2 on mobile. Hover-to-play on desktop (detect with `hover: none` media query), tap-to-play on mobile. Use `poster` thumbnails (WebP, 540x960, 30-80 KB each) + `preload="none"` + `muted loop playsinline`. Add `tabindex="0"` and keyboard focus/blur events for accessibility. **Do NOT embed TikTok/IG iframes.**

4. **Services:** 2-column on desktop — sticky heading on left, service list on right. Each service: bold title + 1-2 sentence description + thin border separator. No icons.

5. **Contact Form:** Minimal editorial form with Netlify honeypot spam filter. Bottom-border-only inputs. Fields: Name, Email, Instagram/TikTok handle, Message. Submit via Netlify Forms. Add `aria-describedby` for error states. Heading: "LET'S WORK" in display font.

6. **Footer:** Wordmark on left, social links as text labels on right ("Instagram", "TikTok", "X"). Thin top border. Minimal.

#### Implementation Steps

- [ ] Initialize Astro project: `npm create astro@latest`
- [ ] Add Tailwind: `npx astro add tailwind`
- [ ] Add Netlify adapter: `npx astro add netlify`
- [ ] Set up dark theme tokens in `globals.css` with Tailwind v4 `@theme`
- [ ] Add Clash Display + Satoshi fonts (self-hosted woff2 in `src/assets/fonts/`)
- [ ] Build Hero section with staggered `clip-path` text animation
- [ ] Build Value Props section (vertical stack, large type, accent highlights)
- [ ] Build Video Showcase with hover-to-play grid (self-hosted mp4s, WebP posters)
- [ ] Build Services section (2-column sticky layout)
- [ ] Build Contact Form with Netlify Forms + honeypot spam filter
- [ ] Build Footer
- [ ] Add Intersection Observer scroll animations (`<script>` tag, ~25 lines)
- [ ] Add `prefers-reduced-motion` media query
- [ ] Add custom `:focus-visible` outline and skip-to-content link
- [ ] Mobile responsive pass (touch targets, tap-to-play, spacing)
- [ ] Add security headers in `netlify.toml`:
  ```toml
  [[headers]]
    for = "/*"
    [headers.values]
      Content-Security-Policy = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; media-src 'self'; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'"
      Strict-Transport-Security = "max-age=31536000; includeSubDomains"
      X-Frame-Options = "DENY"
      X-Content-Type-Options = "nosniff"
      Referrer-Policy = "strict-origin-when-cross-origin"
      Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=()"
  ```
- [ ] Add `.gitignore` with `.env*`, `node_modules/`, `dist/`
- [ ] Set up Netlify bandwidth usage alerts (free tier: 100 GB/mo)
- [ ] Add free uptime monitor (UptimeRobot) for the website
- [ ] Deploy to Netlify
- [ ] Connect custom domain (once chosen)

---

### Phase 4: Operations Setup (Days 10-15, parallel with Phase 3)

**Goal:** Formalize the business operations so Sean can confidently onboard paying clients.

#### 4a. Client Onboarding Checklist (14-day window)

- [ ] Contract signed (see 4b)
- [ ] First retainer payment received via Stripe
- [ ] Client connects social accounts via Leadsie OAuth link (no password sharing)
- [ ] Client confirms 2FA/MFA is enabled on ALL connected social accounts (mandatory)
- [ ] Sean creates shared Google Drive folder (restricted to client's email, NOT link-based sharing)
- [ ] **Content input spec provided to client:**
  - Accepted formats: MP4, MOV
  - Minimum resolution: 1080p
  - Maximum file size: 2 GB per file
  - Maximum video duration: no limit (Sean will pre-segment if over 30 min)
  - Language: any (Submagic supports 48+ languages, but verify quality for non-English)
- [ ] Brand guidelines collected via structured intake form:
  - Tone and voice (3-5 adjective descriptors)
  - Visual dos/don'ts
  - Off-limits topics or people
  - Preferred platforms (rank priority)
  - Example clips they like (links)
- [ ] Content strategy call (30-60 min): what kind of clips, platform priorities, posting cadence. **Produces a written 1-page content brief** that both parties sign off on.
- [ ] Communication channel established: pick ONE per client (email, iMessage, or Slack Connect). Define expected response time: Sean responds within 2 hours during business hours (Mon-Fri, 9 AM - 10 PM ET).
- [ ] **For clients requiring pre-publication approval:** Upload approved clips to a shared Drive review folder. Client has 72 hours to flag any clip. Unflagged clips proceed to scheduling. Configure per-client during onboarding.
- [ ] **Pilot batch (Days 7-14):** First 5-10 clips produced for client approval. Calibrate editorial direction. Up to 2 pilot iterations before full production.
- [ ] Client approves pilot batch (overall direction approval, not per-clip). Full production begins.
- [ ] **Passive approval clause activated:** After pilot batch approval, all future content follows the 72-hour auto-approval window (if client doesn't respond to a review request within 72 hours, content is considered approved).

#### 4b. Service Agreement (Template)

- [ ] Draft a service agreement covering:
  - **Scope:** Clipping, distribution, scheduling — NOT guaranteed results
  - **Deliverables:** Number of clips per week/month, platforms covered, revision rounds (2 max)
  - **Service hours:** Monday-Friday, 9 AM - 10 PM ET. Weekend/holiday content is pre-scheduled.
  - **Payment:** Monthly retainer, prepaid via Stripe, due within 7 days of invoice
  - **Late payment:** 1.5%/month penalty; **14-day grace period** after due date; service pauses on Day 22 if unpaid
  - **Service pause by client request:** Client may request pause with 7 days notice. Retainer is still due for the pause month. Maximum 1 pause per 12-month period. Alternatively, client may cancel with 30-day notice.
  - **Turnaround SLA:** Standard clips within 24 hours. Reactive/urgent clips best-effort same-day during business hours (Mon-Fri, 9 AM - 10 PM ET). Reactive clips are not available on weekends or holidays.
  - **Passive approval:** 72-hour auto-approval window for reviewed content
  - **Platform risk:** "Post manages accounts on third-party platforms. Account restrictions or bans by platforms are outside Post's control. Post is not liable for platform enforcement actions."
  - **Credential policy:** "Post connects to client social accounts exclusively through OAuth authorization. Post never requests, stores, or accepts account passwords."
  - **Music/copyright disclaimer:** "Post uses trending and royalty-free audio in clips. Post is not liable for copyright claims arising from third-party music or copyrighted material present in the client's source content. Client warrants that source content provided to Post is owned by or licensed to the client."
  - **Content ownership:** Client owns all raw content and clips. Post has right to showcase clips on Post's website/portfolio (with audio replaced by royalty-free music for portfolio use).
  - **Performance disclaimer:** "Post cannot guarantee specific metrics, follower counts, or view numbers due to external factors including platform algorithm changes."
  - **Cancellation:** 30-day written notice. Service continues at full capacity during notice period.
  - **Refund policy:** Full refund if cancelled before pilot batch delivery. No refund after pilot batch approval.
  - **Confidentiality:** Covers login credentials, unreleased content, brand strategy, analytics data, financial terms. Survives termination for 2 years.
  - **Data retention:** Raw content retained for duration of agreement plus 30 days after termination, then permanently deleted.
  - **Dispute resolution:** Informal resolution attempt via video call first. If unresolved, binding arbitration.

#### 4c. Client Offboarding Checklist

When a client cancels (30-day notice period):

- [ ] Continue full service through the 30-day notice period
- [ ] Revoke all Leadsie OAuth connections to client accounts
- [ ] Remove client accounts from Later
- [ ] Transfer any scheduled-but-not-yet-posted content to client (via Drive)
- [ ] Provide final performance report
- [ ] Send final invoice (full month, not prorated)
- [ ] Provide client with Google Drive link to download all their raw content and processed clips
- [ ] After 30 days post-termination: permanently delete all client data from Drive
- [ ] Confirm deletion in writing to client
- [ ] Remove client from any internal tracking (sound bank, brand guidelines, etc.)

#### 4d. Monthly Reporting (Simple)

- [ ] Create a monthly report template (deliver via email as PDF or formatted email, by the 3rd of the following month — before the invoice):
  - Total clips produced
  - Total posts distributed (by platform)
  - Top 5 performing clips (screenshots of view counts)
  - Accounts managed
  - Performance vs. KPIs established during onboarding (if applicable)
  - Next month plan/focus
- [ ] **Mid-month check-in:** Brief email with 3-4 highlights (top clips, notable metrics). Takes 10 minutes. Significantly reduces churn.
- [ ] No analytics dashboard needed at this scale — manual screenshots from Later + platforms

#### 4e. Billing

- [ ] Set up Stripe account with MFA (hardware key preferred, authenticator app acceptable)
- [ ] Use restricted API keys: only Invoices + Customers + Products permissions
- [ ] Create invoice template for monthly retainer
- [ ] Send invoice on the 1st of each month, due within 7 days
- [ ] **All invoices go through Stripe's hosted invoice pages** (stripe.com domain). Never send bank details or alternative payment methods via email.
- [ ] Enable Stripe email notifications for payouts, refunds, disputes, and new device logins
- [ ] Instruct clients during onboarding that all invoices will come from Stripe's notification system

#### 4f. Reactive/Urgent Clip Workflow

When something trends or goes viral involving a client:

1. **Client contacts Sean** via the established communication channel with an "urgent" flag
2. **Sean sees notification** within 2 hours during business hours (push notifications enabled for client messages)
3. **Fast-track processing:** If content is short (<30 min), upload directly to Submagic. If content is long, identify the specific timestamp range and clip manually in CapCut.
4. **Abbreviated review:** Sean reviews immediately (no batch scan). Sound selection prioritized for speed.
5. **Post immediately** to the highest-priority platform (usually TikTok), then schedule remaining platforms for the next 1-2 hours.
6. **SLA:** Best-effort same-day during business hours. If request arrives after 8 PM ET, clips go out by 10 AM next business day.
7. **Priority conflict:** If two clients have urgent requests simultaneously, process in order received. Notify the second client of the expected delay.

---

## DMCA & Copyright Response Procedure

**When a clip receives a copyright claim or DMCA takedown:**

1. **Check platform dashboards daily** for copyright notifications (YouTube Studio, TikTok Creator Portal, Instagram Professional Dashboard)
2. **Assess the claim:**
   - Valid claim (copyrighted music in clip): Remove the clip, add the sound to the "banned sounds" list, notify client
   - Disputable (fair use, licensed content): Consult with client before filing counter-notice
   - Automated false positive: File counter-notice through platform's dispute process
3. **Prevent recurrence:** Add the flagged sound/content to a "banned" list per client. Do not reuse.
4. **Client communication template:** "A copyright claim was filed on [clip] posted to [platform/account]. We've [removed it / filed a dispute]. The sound [X] has been flagged to prevent future use. No action needed from you."
5. **Escalation:** If a client receives 2+ copyright strikes on any platform, schedule a call to review content strategy and sound selection approach.

---

## Security Checklist

### Before First Client (~2 hours)

- [ ] Set up password manager (1Password or Bitwarden) with MFA
- [ ] Enable MFA on Google, Stripe, Later, Submagic, and Netlify (authenticator app at minimum)
- [ ] Add credential handling and music/copyright language to service agreement
- [ ] Add data retention policy to service agreement
- [ ] Add client 2FA requirement to onboarding checklist
- [ ] Store TOTP backup/recovery codes in password manager when setting up MFA on each service
- [ ] Verify FileVault is enabled on laptop, enable Find My Mac
- [ ] Add `.gitignore` to the repository before any code

### Within First Month

- [ ] Create breach response matrix (see below)
- [ ] Create "Device Lost/Stolen" runbook:
  1. Remote wipe via Find My Mac immediately
  2. Revoke all active sessions from each service's security settings (Google, Stripe, Later, Submagic, Netlify) — verify this can be done from phone
  3. Rotate all API keys
  4. Notify clients of potential delay
  5. Resume operations on backup device within 4 hours for critical tasks (Later scheduling from phone), full capability within 48 hours
- [ ] Ensure password manager is accessible without the phone (via backup recovery codes stored in a separate physical location)
- [ ] Document manual fallback process (if Submagic goes down, clip in CapCut manually)
- [ ] Set calendar reminders: rotate API keys every 90 days

### Breach Response Matrix

| Service Breached | Data at Risk | Immediate Actions |
|---|---|---|
| **Later** | Client social account access, scheduled content | Revoke all OAuth connections, notify clients to change passwords, re-authorize after contained |
| **Submagic** | Raw client video, processed clips, API key | Rotate API key, assess content exposure, notify affected clients |
| **Leadsie** | Client social account OAuth tokens | Revoke all Leadsie-mediated connections immediately, re-authorize directly through Later |
| **Google Workspace** | All client content, communications, business docs | Reset password, revoke all app passwords, review audit log, notify clients |
| **Stripe** | Client payment data (limited — Stripe handles PCI) | Review Stripe's breach notification, notify clients, monitor for fraudulent charges |
| **Netlify** | Website source, form submissions (names, emails, handles) | Rotate deploy key, review submissions exposed, notify contacts if PII leaked |
| **CapCut** | Only local files — no cloud risk unless cloud features used | Verify no cloud sync enabled, assess local file exposure |

---

## Performance Analysis

### Pipeline Timing (Per Client) — Revised

| Stage | Time | Notes |
|-------|------|-------|
| Client uploads to Drive | 10-60 min | Depends on file size and client's internet |
| Pre-segmentation (if >30 min) | 1-2 min | FFmpeg copy codec, only for long content |
| Sean uploads to Submagic | 2-5 min | Per segment, manual drag-and-drop |
| Submagic processes | 5-30 min | Per segment, depends on length |
| Sean reviews clips | 5-10 min | Hero (3-5 min) + filler scan (60 sec) |
| Copyright check on clips | 2-3 min | Listen for identifiable copyrighted material |
| Trending sounds in CapCut | 9-25 min | 3-5 hero clips x 3-5 min each |
| Sound licensing verification | 2-3 min | Check per platform (see 2c table) |
| Upload + schedule in Later | **25-35 min** | **Unique captions per account** + scheduling |
| **Total Sean time** | **~50-75 min** | More realistic with caption variation |

### Scaling Analysis

| Clients | Daily Sean Time | Bottleneck | Status |
|---------|----------------|------------|--------|
| 1 | 50-75 min | None | Comfortable |
| 2 | 100-150 min | None | Busy but fine |
| 3 | 150-225 min | Later scheduling (75-105 min) | Tight, no buffer |
| **4** | **200-300 min** | **Later scheduling + cognitive load** | **Unsustainable solo** |

**Hiring trigger:** When daily time exceeds 3 hours OR at 4 active clients — whichever comes first. At $10-20k/client/month, hiring a part-time scheduler at $2-4k/month has immediate ROI.

### Highest-Impact Optimizations (for later)

1. **AI caption generation** — Use Claude or ChatGPT to generate 5-10 caption variants from a single brief. Replaces 15-20 min of manual caption writing with 2-3 min. Highest-leverage time saver.

2. **Caption templates** — Build 5-10 fill-in-the-blank caption templates per platform during the first 2 weeks. Cuts caption time by 50-70%.

3. **FFmpeg trending sound automation** — Overlay a selected sound onto hero clips automatically. Eliminates 15-25 min/client/day of CapCut work:
   ```bash
   ffmpeg -i hero_clip.mp4 -i trending_sound.mp3 \
     -filter_complex "[1:a]volume=0.3[sound];[0:a][sound]amix=inputs=2:duration=first" \
     -c:v copy output.mp4
   ```

---

## Future: Automation Upgrade (When Scaling Past 3 Clients)

When daily time exceeds 3 hours, add these tools:

### Automated Distribution (API-based, replacing Later's manual dashboard)

| Tool | Cost/Month | Profiles | API Quality | Best For |
|------|-----------|----------|-------------|----------|
| **Late** (getlate.dev) | $33-49 | 50 | Excellent, API-first | **TOP PICK** — best value, 600 req/min, all 4 platforms |
| **Ayrshare** | $499-599 | 30 | Excellent, mature | Runner-up — best documentation, SDKs in multiple languages |
| **Publer** | ~$190 | 30 | Good | Strong option — bulk 500-post API requests |
| **Metricool** | $139-172 | 30-50 | Moderate | Worth considering — has MCP server for AI agent integration |

### Make.com Pipeline (3-Scenario Architecture)

**Scenario A — Video Intake** (triggers every 15 min):
```
Google Drive Watch → Filter (video files only) → Get Share Link
→ Data Store: Create job record (status: "uploaded")
→ HTTP: POST to Submagic API (webhookUrl = Scenario B hook)
→ Push notification to Sean's phone
```

**Scenario B — Clip Processing** (webhook from Submagic):
```
Webhook: Receive Submagic callback → Data Store: Dedup check
→ Update job status to "clips_ready"
→ Download clips → Upload to Drive → Notify Sean "clips ready"
```

**Scenario C — Distribution** (triggered after Sean approves):
```
Webhook: Receive approval → Iterator: Loop clips
→ HTTP: POST to Late/Ayrshare scheduling API (NOT Later)
→ Update job status to "scheduled"
```

**Error handling:** All HTTP modules use 3 retries with exponential backoff. Scenario A sets a timeout: if Scenario B has not received a callback within 60 minutes, flag the job for manual review. All errors logged to Data Store with `error_message` field.

**Job state model in Data Store:** `job_id`, `client_id`, `source_file`, `status` (uploaded → processing → clips_ready → reviewed → scheduled → published), `created_at`, `updated_at`, `error_message`

**Cost:** Make.com Core plan ($10.59/mo for 10,000 credits). Each pipeline run uses ~24-50 credits. Supports 5+ clients.

---

## Acceptance Criteria

### Definition of Done

- [ ] First client's clips are being produced and posted daily via the manual pipeline
- [ ] Website is live with a working contact form (Netlify Forms)
- [ ] Contract is signed and first invoice is sent via Stripe
- [ ] Content buffer of 3-5 days pre-scheduled in Later
- [ ] Weekend/holiday policy documented and communicated to client

### Non-Functional Requirements

- [ ] Daily workflow per client takes Sean under 75 minutes (review + sound addition + scheduling)
- [ ] Website scores 90+ on Lighthouse performance
- [ ] All service accounts protected with MFA
- [ ] After Sean uploads to Submagic, clips are generated within 30 minutes per segment

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Daily clips per client | 15-20 | Count in Submagic dashboard |
| Sean's daily time per client | < 75 min (improve to < 45 over time via AI captions + templates) | Self-tracked |
| Posts distributed per day per client | 15-20 across all accounts | Later analytics |
| Pipeline turnaround (standard) | < 24 hours | Timestamps |
| Pipeline turnaround (reactive) | < 12 hours (business hours only) | Timestamps |
| Website Lighthouse score | 90+ | Lighthouse audit |
| Client retention | Month-over-month | Invoice history |
| Onboarding time | < 14 days to full production | Calendar tracking |
| Content buffer maintained | 3-5 days ahead | Later scheduling calendar |

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| YouTube bans accounts for "inauthentic content" | High | High | Limit to 2-3 quality channels per client, unique branding per channel, royalty-free audio only on YouTube |
| Cross-platform music copyright violations | High | High | Per-platform sound licensing check (see 2c table), DMCA response procedure, "banned sounds" list |
| AI clipping tool produces low-quality clips | Medium | Medium | Sean reviews all hero clips; filler clips get 60-second scan |
| Client disputes over performance | Medium | High | Contract states no guaranteed results; KPIs set during onboarding; report on volume + top performers |
| Later changes pricing or reduces profile limits | Medium | High | Late and Ayrshare evaluated as alternatives; native platform scheduling as emergency fallback |
| Client account restriction/ban on any platform | Medium | High | Notify client, provide appeal guidance, redistribute posting volume to remaining platforms |
| Solo operator illness/unavailability | Medium | Medium | 3-5 day content buffer pre-scheduled; all tools web-based (recoverable from any device with browser + password manager) |
| Submagic goes down | Low | Medium | Manual fallback: clip in CapCut. Slower but functional for 1-2 days. |
| Pipeline tool breach | Low | Critical | Breach response matrix covers all 7 services; MFA on everything; API key rotation every 90 days |

---

## Cost Scaling Analysis

| Scale | Monthly Revenue | Monthly Tool Cost | Margin | Sean's Hours/Day |
|-------|-----------------|-------------------|--------|-----------------|
| 1 client | $10-20k | ~$130 | 99%+ | 1-1.5h |
| 3 clients | $30-60k | ~$190 | 99%+ | 2.5-3.5h |
| 5 clients | $50-100k | ~$260 | 99%+ | Need part-time help |
| 10 clients | $100-200k | ~$470 | 99%+ | Need 1-2 hires |

Tool costs are negligible at all scales. The constraint is always Sean's time.

---

## Future Considerations (NOT building now)

- Make.com automation pipeline (when daily time exceeds 3 hours)
- Late/Ayrshare for automated distribution (replacing Later's manual dashboard)
- AI-powered caption generation per platform (Claude/ChatGPT)
- Antidetect browsers + residential proxies (when managing 50+ accounts)
- Part-time scheduler/editor hire (at 4+ clients)

---

## References

### Tool Documentation
- Submagic API: https://docs.submagic.co/introduction ($41/mo business plan with API)
- Submagic Rate Limits: https://docs.submagic.co/rate-limits
- Submagic Video Limits: https://care.submagic.co/en/article/what-is-the-size-and-video-length-limit-for-each-video-in-submagic-gl84of/
- Vizard.ai API: https://docs.vizard.ai/docs/introduction ($14.50/mo with API on all paid plans)
- Later Pricing: https://later.com/pricing ($80/mo Advanced for 42 profiles)
- Late API (scheduling alternative): https://getlate.dev ($33-49/mo, 50 profiles, all platforms)
- Ayrshare API: https://www.ayrshare.com/ ($499-599/mo, 30 profiles, mature API)
- Publer API: https://publer.com/docs (~$190/mo, bulk 500-post requests)
- Leadsie (secure account access): https://leadsie.com

### Platform Resources
- TikTok Creative Center: https://creative.tiktok.com
- TokChart (trending sound tracker): https://tokchart.com
- Platform TOS limits: TikTok (6 accounts/device), Instagram (5 simultaneous), YouTube (inauthentic content policy), X (10 accounts/person)

### Algorithm Research Sources
- Buffer: TikTok Algorithm Guide, Instagram Algorithm Guide, Best Times to Post
- Sprout Social: TikTok/Instagram/X Algorithm Insights 2025-2026
- VidIQ: YouTube Shorts Algorithm & Trending Audio Analysis 2026
- Hootsuite: Instagram Algorithm Tips 2026
- Napolify: TikTok Duplicate Content Guidelines

### Industry Sources
- Bloomberg: "Paid Armies of Clippers Boost Internet Stars Like MrBeast" (2025)
- Digital Music News: "What Are Contract Clippers?" (2025)
- Sprout Social Index 2025: 65% of marketing leaders need to prove social media ROI
- Focus Digital 2026: Retainer agencies achieve 18% annual churn vs. 42% for project-based

### Brainstorm Document
- `docs/brainstorms/2026-02-14-post-clipping-agency-brainstorm.md`

### Design Reference
- lv8.co — Dark aesthetic agency site (inspiration for Post website)
- Fontshare: Clash Display + Satoshi (free commercial use fonts)
