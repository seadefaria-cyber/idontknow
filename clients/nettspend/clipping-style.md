# Nettspend — Clipping Style Guide

**Created:** 2026-02-16
**Status:** Developing

---

## Caption Style (v3 — Apple-Native Floating Text)

- **No background pill/bubble** — text floats directly on the video
- **Font:** Helvetica Neue Bold (Apple native), ~42px on 1080 wide frame
- **Outline:** Thin 2px outline for readability (opposite color of text)
- **Auto-contrast:** White text + black outline on dark footage, black text + white outline on light footage
  - Brightness threshold: 120/255 (samples the caption area of the frame)
- **Apple emojis:** Real system emojis via pilmoji (not cross-platform substitutes)
- **Position:** Lower-center of frame (~58% from top), centered horizontally
- **Emojis:** Polarizing emojis that match the caption context (💀 😭 😳 🤦‍♂️)
- **Safe zones:** Text avoids TikTok/IG button areas (top 15%, bottom 25%, right 15%)

### Design Philosophy
- Should feel like it was made on an iPhone and posted directly
- Apple-native aesthetic — treat every clip like an Apple products campaign
- Clean, minimal, no clutter — the text is part of the frame, not on top of it
- Helvetica is the Apple font — it signals quality subconsciously

---

## Caption Strategy

### Rage-Bait / Engagement Hooks
- **Goal:** Get the comment section going. Fans rush to defend = engagement.
- **Never make the artist look bad** — we're on Nettspend's side
- **Angles that work:**
  - "This kid" / questioning his age and power
  - "This generation is cooked" — older people won't get it
  - "How is he selling out venues" — disbelief angle
  - "Nobody can explain this" — mystery/intrigue
  - "Your parents wouldn't understand" — generational divide
  - "Name one song" — bait fans into listing songs in comments
  - Question the music quality (to trigger defenders)

### Caption Rules
- Each display of words should make sense as a phrase
- Keep it short — 1-2 lines max in the pill
- Conversational tone — write how people actually talk
- Every caption should be a HOOK that makes someone stop scrolling
- **Never give away the ending** — create curiosity, make them watch to find out
- Caption should make someone NEED to watch, not just describe what's happening

---

## Sean's Creative Philosophy

### The 1.5-Second Rule
Every clip must hook within 1.5 seconds. Caption + sound + visual all need to hit simultaneously. If any one of those three is weak, the scroll keeps going.

### Selling a Vibe, Not Information
We're not making news clips. We're selling a FEELING to the consumer. Every clip should make the viewer feel something — excitement, disbelief, curiosity, nostalgia, hype. The emotional reaction is what drives engagement.

### What Makes Other Pages Lazy
1. **Bad captions** — they just describe what's happening instead of creating a hook
2. **Ugly footage** — bad crops, watermarks, screen recordings, stretched video
3. **Not aesthetically clean** — things aren't centered, presentation is sloppy

### What Makes Clips Look Clean
- **iPhone footage** has a naturally pleasing quality — lean into that aesthetic
- **Interview footage** looks good when well-framed
- **Everything centered** — the frame should feel balanced and intentional
- **No clutter** — clean at all times, nothing distracting from the content
- The presentation should look like someone who cares made this, not a random repost

### The Caption Voice: Tension Without Resolution
The caption voice isn't one fixed perspective — it shifts based on the clip. But the RULE is always the same: **create tension, never resolve it.**

**"Watch what happens" energy:**
- "We let Nettspend through the gates..." — sets up a story, doesn't finish it
- "There's no way this kid did this" — makes a claim, forces you to watch for proof
- "Watch what happens when..." — explicit tension builder

**The formula:** Finish the sentence grammatically, but DON'T give them a reason to stop watching. The caption opens a loop that only the footage can close.

**Examples of what NOT to do:**
- "Nettspend performs Dazed at sold-out show" — this tells you everything, no reason to watch
- "Crazy concert footage" — lazy, no hook, no tension

**Examples of what TO do:**
- "They really let this kid headline..." — what happened? gotta watch
- "Nobody was ready for what he did next" — what did he do? gotta watch
- "This is why parents don't understand this generation" — why? gotta watch

### Clip Length: Story Dictates Length
- **Quick punches (5-10s):** Preferred. Hard-hitting moments, one-shot energy.
- **Medium (15-25s):** Preferred. Enough room to build tension and pay off.
- **Full story (30-60s):** Can still hit if the storytelling justifies the length.
- **The rule:** Length is dictated by how well the story is told. A 7-second clip with perfect pacing beats a 60-second clip with dead space. Cut it when the story is done.

### One Second to Win
We have ONE second — not 1.5, realistically one — to stop the scroll. That means the caption needs to be visible and hooking IMMEDIATELY as the clip starts. The sound needs to hit. The visual needs to be interesting. All three at once, all within that first second.

### Sound-Content Cohesion
The sound isn't just background music — it should match and enhance the vibe of what's happening in the clip. We're creating a complete sensory experience, not just slapping a trending sound on footage.

---

## Video Handling

- **Never stretch** the original video
- If video doesn't fill 9:16 frame, add **black background** to fill
- Video stays **centered** at its original aspect ratio
- Crop out existing captions/watermarks from source videos before adding our own
- Target output: **1080x1920** (9:16 TikTok/IG ratio)

---

## Sound Strategy

- Use **Nettspend's own music** as background sounds
- Sound volume: **50%** (background, not overpowering)
- Available sounds downloaded:
  - Dazed
  - Out the Way
  - Gas Gas
  - Backpack
  - Pissed Off
  - Fall N Luv
  - Laughin
  - Still Standing
  - Taste
  - Stressed
  - Shut Up

---

## Reference Accounts

### nettspend.clips0 (TikTok)
- Clean white pill caption style
- Concert/performance footage
- Simple, minimal aesthetic — footage speaks for itself

### 730.archive (TikTok)
- Target aesthetic for how our pages should look overall
- (Page details to be analyzed further)

### Full Send Podcast style (YouTube Shorts)
- Bold yellow italic text with black stroke
- ALL CAPS, 1-3 words at a time
- Sean reviewed this but **chose the white pill style instead** for Nettspend

---

## Content Sources

- Publicly available Nettspend content (YouTube, TikTok, interviews, performances)
- Concert/show footage from fan recordings
- Freestyles, studio sessions, interviews

---

## Platform Accounts

### TikTok (3 accounts)
- nettspend.clips7
- nettspend590
- nettspend.clips0

### Instagram (2 accounts)
- rapnews.world
- nettspend.world

### X (2 accounts)
- NettspendWorld_
- NettSpendNews_

---

## Technical Pipeline

1. **Find/receive raw footage** (YouTube, TikTok, public content)
2. **Download with yt-dlp** to `clips/raw/`
3. **Crop** if existing captions need removal (FFmpeg)
4. **Generate caption overlay** (Python + Pillow + pilmoji)
5. **Composite** video + caption + sound (FFmpeg)
6. **Output** to `clips/output/` ready for posting

### Tools
- `clips/make_clip.py` — Main clip generation script
- `clips/raw/` — Drop raw footage here
- `clips/output/` — Finished clips come out here
- `clips/sounds/` — Nettspend audio library

---

## Account Strategy

**All 7 accounts run the same signature style.** The goal is to be the BEST clipper — one distinct, recognizable look replicated across all platforms. Varying captions slightly per account to avoid looking linked, but the aesthetic, quality bar, and creative voice are identical.

**The brand is the STYLE itself.** When someone sees one of Sean's clips, regardless of which account or platform, they should recognize the quality and feel.

---

## Open Questions

- Posting schedule and frequency per account?
- How to handle platform-specific differences (IG carousel vs TikTok vs X video)?
- When to add/not add captions (Sean mentioned "until I decide not to")
