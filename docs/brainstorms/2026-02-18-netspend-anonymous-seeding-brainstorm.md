---
date: 2026-02-18
topic: netspend-anonymous-rap-media-seeding
---

# Netspend Anonymous Rap Media Page Seeding Strategy

## What We're Building

A network of 10 anonymous rap media pages (5 TikTok + 5 Instagram) that look like independent rap media brands. These pages will grow organically by posting high-quality rap content, then naturally seed Netspend content without any connection tracing back to Netspend or his team.

The system will be powered by OpenClaw AI agents (adapted from the Oliver Henry "Larry" method) that autonomously generate TikTok slideshows and Instagram content, track performance, and self-improve over time. Target: as hands-off as possible after initial setup.

## Why This Approach

**Approaches considered:**
1. **Manual content creation + scheduling** - Too labor-intensive for 10 accounts at 3 posts/day each
2. **AI bot services** - Already tried this. Accounts got flagged immediately because there was no human warmup period
3. **OpenClaw agent system (chosen)** - AI generates content autonomously, learns from performance, compounds over time. Human only needed for account warmup and adding trending music before publishing. $20/month infrastructure.

**Why OpenClaw/Larry method wins:**
- Agent creates TikTok slideshows (2.9x more engagement than video per TikTok's own data)
- Self-improving: logs what hooks work/flop, gets better every day
- Posts as drafts so human adds trending music (10x reach boost)
- $0.25-0.50 per slideshow via OpenAI image generation
- Proven: 8M views in one week for Oliver Henry's apps

## Key Decisions

### 5 Page Archetypes (per platform)

| # | Archetype | Example Names | Seeding Angle |
|---|-----------|---------------|---------------|
| 1 | Underground Discovery | @radarrap, @sleptonsounds | "Why is nobody talking about this guy?" |
| 2 | Rap News/Blog | @thedailybars, @raprundown | Cover Netspend releases alongside major artists |
| 3 | Hot Takes/Rankings | @raphottest, @versevault | Include Netspend in lists and rankings |
| 4 | Snippets/New Music | @nextupsounds, @previewszn | Preview Netspend tracks alongside others |
| 5 | Rap Culture/Memes | @haborhood, @rapmoments | Weave Netspend into lifestyle/culture content |

### Seeding Ratio
- First 30 days: 100% general rap content (build credibility)
- Days 30-60: 90% general / 10% Netspend (1 in 10 posts)
- Days 60+: 80% general / 20% Netspend (1 in 5 posts)
- Never go above 20% Netspend on any single page

### Account Warmup (CRITICAL - why previous accounts failed)
- Create accounts manually on real phones (NOT via services)
- 7-14 days of human scrolling behavior before any posting
- Scroll For You page, like sparingly (1 in 10), follow rap accounts
- Leave genuine comments on rap content
- When your FYP is all rap content, the account is ready

### Operational Security (Anonymous Seeding)
- Each account created on a different device/IP
- No accounts follow each other
- Different posting times per account
- Different content styles per archetype
- No shared hashtags patterns across accounts
- Never mention Netspend in the same way twice across pages

### Content System (Adapted from Larry/OpenClaw)
- OpenClaw agent generates 6-image TikTok slideshows
- Hook text on slide 1 (font 6.5% of image height, 30% from top)
- Storytelling captions, never promotional language
- Posts as drafts via Postiz
- Human adds trending rap music and publishes
- Agent tracks performance and self-improves

### Infrastructure
- OpenClaw on AWS EC2: ~$17-20/month
- OpenAI API for image generation: ~$0.25-0.50/slideshow
- Postiz for TikTok posting + analytics
- At 3 posts/day across 5 TikTok accounts = 15 slideshows/day = ~$4-7.50/day in API costs

## Open Questions

- [ ] Instagram posting: Postiz handles TikTok, what handles Instagram? (Later.com? Postiz also?)
- [ ] Phone/device situation: Does the user have enough devices for 10 separate accounts?
- [ ] Netspend content assets: What content exists to seed? (music, videos, lifestyle photos, snippets)
- [ ] Account names: Need to finalize actual handles for all 10 accounts
- [ ] Budget confirmation: ~$20/month infra + ~$120-225/month API costs + Postiz subscription

## Next Steps

-> `/workflows:plan` for full implementation plan including:
- AWS EC2 OpenClaw setup
- Adapting Larry skill for rap media content (5 variants, one per archetype)
- Account creation and warmup SOP
- Content pipeline and posting workflow
- Seeding schedule and rules
- Performance tracking system
