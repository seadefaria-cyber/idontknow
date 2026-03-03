---
name: rap-media-seeder
description: Automate anonymous rap media TikTok pages that build organic audiences and gradually seed artist content. Manages 5 page archetypes (Underground Discovery, Rap News, Hot Takes/Rankings, Snippets/New Music, Rap Culture/Memes), generates AI slideshows about rap culture, posts via Postiz as drafts, tracks performance, and self-improves. Use when creating rap media content, generating slideshows, checking analytics, managing seeding schedules, or when the user mentions rap pages, Netspend content, or media page growth. Covers content generation for all 5 archetypes, seeding ratio management, operational security between accounts, hook testing, analytics tracking, and the feedback loop.
---

# Rap Media Page Seeder

Automate 5 anonymous rap media TikTok pages: generate rap content slideshows -> overlay text -> post as drafts -> user adds trending music -> track -> iterate.

**Goal:** Build 5 independent-looking rap media brands on TikTok that grow organically, then naturally seed Netspend content without any connection tracing back to him or his team.

## Prerequisites

### Required
- **Node.js** (v18+) — all scripts run on Node
- **node-canvas** (`npm install canvas`) — text overlays on slides. On Ubuntu: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev && npm install canvas`
- **Postiz** — posting to TikTok + analytics. Team plan ($39/month) for 10 channels. Sign up at postiz.com
- **Larry skill** — this skill DEPENDS on Larry's scripts (generate-slides.js, add-text-overlay.js, post-to-tiktok.js, check-analytics.js, daily-report.js). Make sure Larry is installed: `npx clawhub install larry`

### Image Generation
- **OpenAI** — `gpt-image-1.5` (ALWAYS 1.5, never 1). Best for photo-realistic rap content images.
- At 3 posts/day across 5 accounts = 15 slideshows/day = ~$4-7.50/day in API costs

## The 5 Page Archetypes

Each TikTok account is a different archetype with its own brand identity, content style, and voice. They must NEVER look connected to each other.

### 1. Underground Discovery (@radarrap style)
- **Voice:** "I find artists before anyone else"
- **Content:** Discovering underground rappers, hidden gems, slept-on tracks
- **Slide style:** Dark/moody aesthetic, lo-fi photography feel
- **Hook formula:** "Why is nobody talking about [artist]?" / "This guy has 500 listeners and sounds like [famous artist]" / "I found this at 3am and can't stop listening"
- **Seeding angle for Netspend:** "Found this underground artist called Netspend... why does he only have [X] monthly listeners?"
- **Hashtags:** #undergroundrap #sleptonsounds #hiddengems #newrappers #fyp

### 2. Rap News/Blog (@thedailybars style)
- **Voice:** Professional rap news source, covers the culture
- **Content:** New releases, album announcements, beef updates, industry news
- **Slide style:** Clean, editorial, news-graphic aesthetic
- **Hook formula:** "[Artist] just dropped and it's [reaction]" / "Breaking: [news]" / "This week in rap: the 5 biggest moments"
- **Seeding angle for Netspend:** Cover Netspend releases/news alongside major artists as if he's naturally newsworthy
- **Hashtags:** #rapnews #hiphopnews #newmusic #rap2026 #fyp

### 3. Hot Takes/Rankings (@raphottest style)
- **Voice:** Opinionated, bold, debate-starting
- **Content:** Top 5 lists, "who's better" debates, hot takes, rankings
- **Slide style:** Bold colors, versus layouts, ranking graphics
- **Hook formula:** "Top 5 rappers right now and I'm not including [popular artist]" / "This is the most underrated rapper of 2026" / "Unpopular opinion: [hot take]"
- **Seeding angle for Netspend:** Include Netspend in lists/rankings naturally ("My top 10 underground rappers right now" with Netspend at #3-5)
- **Hashtags:** #hottakes #raprankings #top5 #rappers #fyp

### 4. Snippets/New Music (@nextupsounds style)
- **Voice:** "Listen to this" — pure music discovery, minimal commentary
- **Content:** Song snippets, new release previews, beat showcases
- **Slide style:** Album art aesthetic, waveform visuals, artist photos
- **Hook formula:** "Play this at full volume" / "This song is about to blow up" / "New [artist] and it's crazy"
- **Seeding angle for Netspend:** Preview Netspend tracks alongside other artists' new music
- **Hashtags:** #newmusic #snippets #preview #nextup #fyp

### 5. Rap Culture/Memes (@rapmoments style)
- **Voice:** Fun, relatable, meme-adjacent
- **Content:** Rap culture moments, funny takes, lifestyle content, "POV" scenarios
- **Slide style:** Casual, meme-format, relatable imagery
- **Hook formula:** "POV: you're at a party and [rap scenario]" / "Every rap fan when [relatable moment]" / "The difference between [X] fans and [Y] fans"
- **Seeding angle for Netspend:** Weave Netspend into culture/lifestyle posts naturally ("Songs that hit different at 2am" with a Netspend track included)
- **Hashtags:** #rapculture #hiphop #rapfans #rapmemes #fyp

## CRITICAL: Operational Security Rules

These pages must NEVER look connected. Follow these rules strictly:

1. **No accounts follow each other** — ever
2. **Different posting times per account** — stagger by at least 2 hours
3. **Different content styles** — each archetype has its own visual identity
4. **No shared hashtag patterns** — each account uses different hashtag sets
5. **Never mention Netspend the same way twice across pages** — vary the language every time
6. **Different caption styles** — Underground Discovery is casual/excited, Rap News is professional, Hot Takes is bold/controversial, etc.
7. **No cross-promotion** — pages never reference or reshare each other's content
8. **Different image aesthetics** — each archetype has distinct visual branding

## Seeding Schedule (STRICT — Do Not Deviate)

| Period | General Rap Content | Netspend Content | Rule |
|--------|-------------------|-----------------|------|
| Days 1-30 | 100% | 0% | Build credibility. NO Netspend content at all. |
| Days 31-60 | 90% | 10% | 1 in 10 posts can feature Netspend. Natural, not promotional. |
| Days 61+ | 80% | 20% | 1 in 5 posts max. Never go above this on any single page. |

**Netspend content rules:**
- NEVER use promotional language ("go stream", "check out", "support")
- Frame as organic discovery: "just found this", "why isn't this bigger", "this deserves more attention"
- Different framing per archetype (see seeding angles above)
- Mix Netspend with other similar artists in the same post when possible
- NEVER post Netspend content on the same day across multiple accounts

## Content Generation

### Rap Slideshow Formula (6 slides)

| Slide | Purpose | Content |
|-------|---------|---------|
| 1 | HOOK — stop the scroll | Bold statement, question, or hot take about rap |
| 2 | CONTEXT — set the scene | Background info, why this matters |
| 3 | EVIDENCE — build credibility | Stats, quotes, comparisons |
| 4 | PEAK — the main point | The core revelation, ranking, or discovery |
| 5 | REACTION — emotional payoff | Hot take, surprise element, debate-starter |
| 6 | ENGAGEMENT — drive comments | Question to audience, "who agrees?", call for debate |

### Image Generation Prompts by Archetype

**Underground Discovery:**
```
Moody photograph of a rapper in a dimly lit recording studio. Lo-fi aesthetic, warm amber lighting from a single desk lamp. Vintage equipment visible. Shot on iPhone, slightly grainy. The rapper is [description]. No text, no watermarks. Portrait orientation 1024x1536.
```

**Rap News:**
```
Clean editorial-style photograph related to hip-hop culture. Professional lighting, sharp focus. Modern urban backdrop. News-worthy composition. Shot on iPhone 15 Pro. No text, no watermarks. Portrait orientation 1024x1536.
```

**Hot Takes/Rankings:**
```
Dynamic photograph capturing rap culture energy. Bold, high-contrast lighting. Urban setting with vibrant colors. Action or confrontational pose. Shot on iPhone. No text, no watermarks. Portrait orientation 1024x1536.
```

**Snippets/New Music:**
```
Artistic photograph of headphones, vinyl records, or a studio setup. Atmospheric lighting, music-focused composition. Clean aesthetic with strong color palette. Shot on iPhone. No text, no watermarks. Portrait orientation 1024x1536.
```

**Rap Culture/Memes:**
```
Casual, relatable photograph of everyday life connected to hip-hop culture. Natural lighting, authentic feel. Could be a car, a party scene, someone scrolling their phone. Shot on iPhone, candid style. No text, no watermarks. Portrait orientation 1024x1536.
```

### Text Overlay Rules (same as Larry)
- Font size: 6.5-7.5% of image width depending on text length
- Position: 28-30% from top, centered
- White text with thick black outline (15% of font size)
- 4-6 words per line, use \n for line breaks
- REACTIONS not labels: "Wait this guy is insane??" not "Good rapper"
- No emoji (canvas can't render them)

### Caption Formula
```
[Hook matching slide 1] [2-3 sentences building the narrative].
[Key point or hot take]. [Question or engagement driver].
#[niche1] #[niche2] #[niche3] #[trend] #fyp
```

Keep it conversational. Tell a story. Sound like a real person who's passionate about rap, NOT a marketing account. Max 5 hashtags.

## Workflow

### Daily Content Generation (runs for each account)

1. **Check seeding schedule** — determine if this post should be general rap or Netspend content
2. **Select archetype-appropriate topic** — based on trending rap news, new releases, or evergreen rap culture topics
3. **Generate 6 slide images** using Larry's `scripts/generate-slides.js` with archetype-specific prompts
4. **Add text overlays** using Larry's `scripts/add-text-overlay.js`
5. **Post as draft to TikTok** using Larry's `scripts/post-to-tiktok.js` (SELF_ONLY privacy)
6. **Notify user** — "Draft ready for [account name]. Add trending music and publish."

### User's Daily Routine (~15-30 min total)
1. Open TikTok on each account
2. Go to inbox/drafts
3. For each draft: add a trending rap sound, preview, publish
4. Done

### Analytics & Feedback Loop

Same as Larry's feedback loop but adapted for rap media:

- **High views (50K+):** DOUBLE DOWN — make 3 variations of that hook/topic
- **Good views (10K-50K):** Keep in rotation, test tweaks
- **Okay views (1K-10K):** Try 1 more variation before dropping
- **Low views (<1K twice):** DROP — try radically different topic/hook

Track per-archetype what works. Underground Discovery might perform best with "3am finds" while Hot Takes might perform best with controversial rankings.

### Weekly Review
1. Sort all posts by views across all 5 accounts
2. Identify top hooks per archetype
3. Identify which archetypes are growing fastest
4. Adjust content strategy based on data
5. Check seeding schedule compliance (never above ratio limits)

## Config Structure

Store in `rap-media/config.json`:

```json
{
  "accounts": [
    {
      "name": "radarrap",
      "archetype": "underground-discovery",
      "platform": "tiktok",
      "postizIntegrationId": "...",
      "postingTimes": ["08:00", "17:00", "21:30"],
      "startDate": "2026-02-18",
      "status": "warmup"
    },
    {
      "name": "thedailybars",
      "archetype": "rap-news",
      "platform": "tiktok",
      "postizIntegrationId": "...",
      "postingTimes": ["09:30", "15:00", "20:00"],
      "startDate": "2026-02-18",
      "status": "warmup"
    },
    {
      "name": "raphottest",
      "archetype": "hot-takes",
      "platform": "tiktok",
      "postizIntegrationId": "...",
      "postingTimes": ["07:30", "14:00", "22:00"],
      "startDate": "2026-02-18",
      "status": "warmup"
    },
    {
      "name": "nextupsounds",
      "archetype": "snippets",
      "platform": "tiktok",
      "postizIntegrationId": "...",
      "postingTimes": ["10:00", "16:30", "21:00"],
      "startDate": "2026-02-18",
      "status": "warmup"
    },
    {
      "name": "rapmoments",
      "archetype": "rap-culture",
      "platform": "tiktok",
      "postizIntegrationId": "...",
      "postingTimes": ["11:00", "18:00", "23:00"],
      "startDate": "2026-02-18",
      "status": "warmup"
    }
  ],
  "imageGen": {
    "provider": "openai",
    "model": "gpt-image-1.5",
    "apiKey": "sk-..."
  },
  "postiz": {
    "apiKey": "your-postiz-api-key"
  },
  "seeding": {
    "artist": "Netspend",
    "currentPhase": "warmup",
    "seedingStartDate": null
  },
  "posting": {
    "privacyLevel": "SELF_ONLY",
    "postsPerDay": 3
  }
}
```

## Seeding Content Templates (for when seeding begins after day 30)

### Underground Discovery - Netspend Seeding
- "I found this artist called Netspend at 2am\nand I genuinely can't\nstop listening"
- "Why does nobody\ntalk about Netspend?\nThis guy is insane"
- "Netspend has [X] monthly listeners\nand sounds like he should\nhave millions"

### Rap News - Netspend Seeding
- "Netspend just dropped\n[song/project name]\nand the internet is\nsleeping on it"
- "5 releases this week\nyou need to hear\n(Netspend at #3)"
- "New music Friday roundup:\n[Artist 1], Netspend,\n[Artist 3], [Artist 4]"

### Hot Takes - Netspend Seeding
- "My top 10 underground\nrappers right now\n(Netspend is top 5)"
- "Netspend vs [similar artist]\nand it's not even close"
- "Unpopular opinion:\nNetspend is the most\nslept-on rapper of 2026"

### Snippets - Netspend Seeding
- "New Netspend snippet\nplay this at\nfull volume"
- "This Netspend track\nis about to blow up\ncalling it now"

### Rap Culture - Netspend Seeding
- "Songs that hit different\nat 2am\n(slide 4 is Netspend)"
- "POV: your friend puts on\nNetspend for the first time\nand now they're hooked"

## First Run

When this skill is loaded, ask the user:

1. "Have you created the 5 TikTok accounts yet?" — if not, guide them through account creation with different emails/devices
2. "Have you set up Postiz and connected all 5 accounts?" — if not, walk through Postiz setup
3. "Are any accounts still in warmup?" — check if 7-14 days of manual activity has happened
4. "What Netspend content do you have available for when seeding begins?" — songs, snippets, videos, photos

Then validate the config and start generating content for accounts that are past warmup.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| All pages post at the same time | Stagger posting times by 2+ hours |
| Same hashtags across accounts | Each archetype uses unique hashtag sets |
| Mentioning Netspend identically | Vary language: "found", "discovered", "stumbled on", "heard" |
| Seeding too early | STRICT 30-day minimum before any Netspend content |
| Seeding too much | NEVER above 20% on any single page |
| Pages following each other | Zero cross-following, zero cross-promotion |
| Generic rap images | Each archetype has distinct visual identity |
| Promotional language for Netspend | Frame as organic discovery, NEVER promotional |
| Posting Netspend on same day on 2+ pages | Space Netspend posts across accounts by 2+ days |
