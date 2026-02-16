# Post — AI-Powered Social Media Clipping Agency

**Date:** 2026-02-14
**Status:** Brainstorm

---

## What We're Building

**Post** is a solo-run, AI-powered social media clipping agency serving streamers, podcasters, YouTubers, and music artists/labels. The business takes a client's raw content (streams, podcasts, videos, performances, interviews) and turns it into a high volume of short-form clips distributed across multiple fan pages on TikTok, Instagram, YouTube Shorts, and X — with the goal of forcing virality through volume and algorithm optimization.

The industry charges **$10-20k/month retainers** for this service. Sean already has clients ready to pay — the bottleneck is building a scalable workflow to deliver.

We're building two things (in priority order):

1. **An AI-powered clipping and distribution workflow** (PRIMARY) — A system that automates the full pipeline: AI identifies viral moments, generates clips with edits and trending sounds, Sean approves, and clips get distributed across all accounts with one click. The goal is to be as hands-off as possible — Sean is the creative director, not the editor.

2. **A client-facing website** (SECONDARY) — A sleek, minimal, dark-aesthetic single-page site (inspired by lv8.co) to reinforce credibility. Clients are already coming — the site just needs to look professional.

---

## Why This Approach

- **Solo operation** — Sean is running this alone, so automation isn't a nice-to-have, it's the business model
- **AI-first** — Use AI clipping tools and automation platforms instead of human editors
- **Website as credibility** — The site's job is to make Post look established and professional, converting artist inquiries into clients
- **Volume strategy** — The clipping model relies on high output across many accounts to play platform algorithms

---

## Key Decisions

### Agency Name: "Post"
- Double meaning: posting content + post-production
- SEO concern with a common word — may need a modifier (e.g., "Post Agency," "Post Clips") or a strong domain
- Keep Hambins New York (sunglasses) completely separate — don't mix brands

### Website Direction
- **Single-page scrollable site** inspired by lv8.co
- Dark background, bold typography, minimal and sleek
- Sections: Hero/tagline, clip showcase (embedded videos), services, contact form
- Content available: real clips (no hard metrics yet)
- Contact method: simple contact form
- Build in a way that allows expanding to multi-page later

### Target Platforms
- TikTok, Instagram, YouTube Shorts, X (Twitter)
- All short-form vertical video focused

### Clipping Workflow (AI-Powered) — THE CORE OF THE BUSINESS

**The problem:** Sean can't hand-edit 30 clips a day alone. He also can't manually post to 30+ accounts across 4 platforms. Both editing AND distribution need to be automated.

**What goes viral:** Depends on the creator — hot takes/controversy, funny/relatable moments, high-energy highlights. Sean's taste and judgment for picking moments is the core differentiator. AI tools alone (like Opus Clip) produce decent filler content but rarely go viral.

**Tiered clip strategy:**
- **Hero clips (3-5/day):** AI-assisted but Sean-guided. AI identifies potential moments, generates draft clips with trending sounds. Sean reviews, tweaks, approves. These are the viral attempts.
- **Filler clips (10-15/day):** Fully AI-generated from source material. Keep the posting schedule full and the algorithm fed. Consistent content > no content.

**The ideal pipeline:**
1. **Input:** Client sends raw content via Google Drive, Dropbox, or email/DM. This is reactive — when something pops off, clips need to go out same day.
2. **AI Analysis:** AI watches/scans content, identifies the best moments, timestamps them
3. **AI Editing:** AI generates clips with edits, captions, and trending sounds (CapCut or similar)
4. **Review:** Sean reviews clips, approves or tweaks the hero clips, auto-approves filler
5. **One-click distribution:** Approved clips get pushed to all accounts across TikTok, IG, YouTube Shorts, and X automatically

**Key insight:** Sean wants to be the creative director, not the editor. The more hands-off, the better — but his taste still guides the output.

### What AI (Claude) Handles vs. External Tools
- **Claude:** Website development, automation scripts, content strategy templates, posting schedules, system architecture, workflow design
- **External AI tools:** Video clipping/editing (CapCut, Opus Clip, etc.), moment detection, sound/music selection
- **External platforms:** Social media scheduling and posting (Buffer, Later, Meta Business Suite, X Pro)
- **Automation glue:** Make.com or Zapier to connect everything
- **Sean:** Creative direction, taste, approval of hero clips, client relationships

---

## Open Questions

1. **Domain name:** What domain will Post use? — to be decided later
2. **Account strategy:** How many accounts per platform per client is realistic without triggering platform bans? Need to research platform TOS limits.
3. **Best AI clipping tool:** Opus Clip vs. CapCut API vs. others — need to evaluate which can best handle trending sounds, captions, and quality edits automatically for streamer/podcaster/music content.
4. **Best distribution tool:** Which scheduling/posting platform supports managing 30+ accounts across TikTok, IG, YouTube Shorts, and X? Need to evaluate Buffer, Later, Publer, SocialBee, etc.

---

## Resolved Questions

- **Pricing model:** Monthly retainer per client
- **Content intake:** On-demand and reactive — artists share via Google Drive, Dropbox, or email/DM as moments happen. Speed is critical; when something goes viral, clips need to go out the same day.
- **No editors — confirmed:** The agency runs without hiring editors. AI handles bulk editing. Sean polishes hero clips (3-5 min per clip, not editing from scratch). Filler clips are auto-approved. This model scales to ~2-3 clients solo; beyond that, reassess (hire, raise prices, or tighten the approval system). Sean's taste is the competitive advantage — not the editing labor.

---

## Scope Boundaries

**In scope:**
- Client-facing website
- AI clipping workflow design
- Automation pipeline architecture
- Posting schedule templates

**Out of scope (for now):**
- Client login portal / dashboard
- Analytics tracking platform
- Billing / invoicing system
