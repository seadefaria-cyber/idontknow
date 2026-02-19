# Nettspend — Clipping Style Guide

**Created:** 2026-02-16
**Updated:** 2026-02-19 (v2 — locked in after hopecore session)
**Status:** LOCKED — these rules are final. Never deviate.

---

## Text Overlay (Title) — THE RULES

- **ALWAYS white bold text with thick black outline** — this is the TikTok native text tool look
- **NO background pill/rectangle/bubble** — just bold floating text with stroke
- **NO auto-contrast detection** — always white text, black outline, every time
- **Font:** Montserrat Bold, 44px on 1080-wide frame
- **Outline:** 5px thick black stroke (this is what makes it look TikTok-native)
- **Emojis:** Add rage-bait/clickbait emojis AFTER the caption text (react to the phrase)
  - Emojis must render as clean Apple emojis via pilmoji — NO black outline artifacts on emojis
  - Strip emojis from the outline rendering pass, only render them in the Pilmoji pass
- **Position:** Center of video (~55% from top), centered horizontally
- **Max width:** 72% of screen to avoid side buttons
- **Duration:** Title appears immediately, disappears after ~6 seconds (`--text-duration 6`)
- **Lines:** 1-2 lines max for the caption text. Keep it tight.

### What It Should Look Like
Study 730.archive on TikTok. Their text overlay = our text overlay. Bold, clean, white text with black stroke. Looks like someone used the TikTok text tool. That's the standard.

---

## Speech Captions (Subtitles) — THE RULES

- **Format:** ASS subtitles with karaoke word highlighting
- **ALL CAPS** — every word uppercase
- **Font:** Montserrat, 38px (smaller than title overlay)
- **Colors:** White text base, current word highlighted in YELLOW (`\kf` tags)
- **Outline:** 3px black outline
- **Margins:** MarginL=120, MarginR=120 (equal, centered, clears TikTok/Reels side buttons)
- **MarginV:** 420 from bottom (clears bottom UI — username, caption area, etc.)
- **Alignment:** Bottom center (2)
- **Must never interfere with TikTok/Reels side buttons** (like, comment, share, bookmark)

### ASS Style Line (copy this exactly for new clips)
```
Style: Speech,Montserrat,38,&H00FFFFFF,&H0000FFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,0,2,120,120,420,1
```

---

## Visual Motion — THE RULES

- **ALWAYS apply slow zoom-in (Ken Burns effect)** on every clip: `--zoom 10`
- 10% zoom over the clip duration — keeps the video engaging even on static footage (interviews, talking heads)
- The zoom is applied to the source video content only, not the black bars
- Uses ffmpeg `zoompan` filter matched to source fps
- This is NOT optional — every clip gets zoom. Static video = death on TikTok.

---

## Sound — THE RULES

### Regular Clips (concerts, performances, highlights)
- Use **Nettspend's own music** from `clips/sounds/`
- Volume: **15-20%** — background, never overpower speech or original audio
- `--sound auto` picks random, or specify a track

### Hopecore / Motivational Clips
- Use **soft instrumentals** — piano, strings, ambient (NO competing vocals)
- Good example: Ludovico Einaudi "Experience" (already in `clips/sounds/`)
- Volume: **15-20%**
- Or **no added sound** if the original video already has suitable audio/music
- NEVER use Nettspend songs on hopecore clips — wrong vibe entirely

### Sound Scoring Philosophy
- **FEEL the clip before placing a sound.** Score it like you're placing lyrics to a song.
- Match the emotional arc: if the clip builds from quiet to powerful, the sound should too.
- The sound creates MOTION — it should give the clip a rhythm, not just sit behind it.
- If the original audio is already good (music, ambient sound, crowd), consider using no added sound.

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
- Keep it short — 1-2 lines max
- Conversational tone — write how people actually talk
- Every caption should be a HOOK that makes someone stop scrolling
- **Never give away the ending** — create curiosity, make them watch to find out
- Caption should make someone NEED to watch, not just describe what's happening
- **Add emojis that REACT to the phrase** — rage-bait emojis: 💀 😭 🤯 🤦‍♂️

### The Caption Voice: Tension Without Resolution
The RULE is always: **create tension, never resolve it.** The caption opens a loop only the footage can close.

**Good hooks:**
- "They really let this kid headline... 💀"
- "Nobody was ready for what he did next 😭"
- "This is why parents don't understand this generation"
- "Name ONE song 🤦‍♂️" (bait fans into listing songs)
- "The internet's most hated rapper has a message for you 💀😭"
- "We let Nettspend through the gates..."

**Bad hooks (NEVER do these):**
- "Nettspend performs Dazed at sold-out show" (tells everything, no reason to watch)
- "Crazy concert footage" (lazy, no hook)
- "New Nettspend clip" (zero tension)

---

## Pipeline Command — DEFAULT FLAGS

**Every clip should use these flags unless Sean explicitly says otherwise:**

```bash
python3 clips/make_clip.py <input> "<caption with emojis>" \
  --start <start> --end <end> \
  --style light \
  --text-duration 6 \
  --zoom 10 \
  --subs <subs.ass> \
  -o <output_name>
```

- `--style light` = white text, black outline (ALWAYS)
- `--text-duration 6` = title disappears after 6 seconds (ALWAYS)
- `--zoom 10` = 10% slow zoom-in (ALWAYS)
- `--subs` = speech captions in ASS format (when clip has speech)
- Sound is optional — add with `--sound` and `--volume 0.2` only when needed
- **ALWAYS use full absolute paths** for input video (relative paths break trimming)

---

## Sean's Creative Philosophy

### The 1.5-Second Rule
Every clip must hook within 1.5 seconds. Caption + sound + visual all need to hit simultaneously. If any one of those three is weak, the scroll keeps going.

### Selling a Vibe, Not Information
We're not making news clips. We're selling a FEELING. Every clip should make the viewer feel something — excitement, disbelief, curiosity, nostalgia, hype.

### What Makes Clips Look Clean
- **iPhone footage** has a naturally pleasing quality — lean into that aesthetic
- **Interview footage** looks good when well-framed
- **Everything centered** — the frame should feel balanced and intentional
- **No clutter** — clean at all times, nothing distracting from the content

### Clip Length: Story Dictates Length
- **Quick punches (5-10s):** Hard-hitting moments, one-shot energy.
- **Medium (15-25s):** Enough room to build tension and pay off.
- **Full story (30-60s):** Can still hit if the storytelling justifies the length.
- **The rule:** Cut it when the story is done. No dead space.

---

## Video Handling

- **Never stretch** the original video
- If video doesn't fill 9:16 frame, add **black background** to fill
- Video stays **centered** at its original aspect ratio
- Target output: **1080x1920** (9:16 TikTok/IG ratio)
- Encoding: libx264, CRF 18, AAC 192k

---

## NEVER DO LIST

1. Never use auto brightness detection for text color — ALWAYS white text, black outline
2. Never use a pill/rectangle/bubble background on text overlay
3. Never add Nettspend songs on hopecore/motivational clips
4. Never use sounds with competing vocals over speech content
5. Never make captions large enough to interfere with TikTok/Reels side buttons
6. Never put black outline on emojis (strip from outline pass)
7. Never skip the zoom — every clip gets `--zoom 10`
8. Never skip text-duration — title always disappears after ~6s
9. Never use relative paths for input video (breaks trimming)
10. Never deliver a clip without watching/checking it yourself first

---

## Reference Accounts

### 730.archive (TikTok) — PRIMARY REFERENCE
- THIS is the visual standard for text overlay
- White bold text with thick black stroke, TikTok native text tool look
- ALL CAPS speech captions with word-by-word highlighting
- Clean, minimal, professional

### nettspend.clips0 (TikTok)
- Concert/performance footage
- Simple, minimal aesthetic

---

## Platform Accounts (7 total)

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
3. **Trim** to exact timestamps
4. **Generate caption overlay** (Python + Pillow + pilmoji) — white text, black outline, emojis clean
5. **Generate ASS subtitles** if clip has speech — ALL CAPS, karaoke yellow highlighting
6. **Composite** video + caption + subs + zoom + optional sound (FFmpeg)
7. **Output** to `clips/output/` ready for posting

### Tools
- `clips/make_clip.py` — Main clip generation script (v5+)
- `clips/raw/` — Raw footage
- `clips/output/` — Finished clips
- `clips/sounds/` — Sound library (21 Nettspend tracks + instrumentals)
- `clips/fonts/` — Montserrat Bold
