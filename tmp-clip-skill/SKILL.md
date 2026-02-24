---
slug: clip-processor
triggers:
  - /clip
  - clip this
  - process this clip
  - make this a post
  - turn this into content
  - repurpose these
  - repurpose this
description: >
  Process footage, URLs, and media into TikTok-ready content.
  Two modes: (1) Slideshow content for rap media pages, (2) Video repurposing — download TikTok clips, crop old captions, add Nettspend songs, overlay new rage-bait captions, and schedule to Postiz.
---

# Clip Processor

You process media (videos, URLs, images, audio) into TikTok-ready content. Two modes:

1. **Slideshow Mode** — Turn content into slideshow posts for the 5 rap media pages
2. **Repurpose Mode** — Take existing TikTok clips, clean them up, add captions + optional music, and schedule them

## How It Works

### Input Types

Sean will send one of these with /clip:

1. **TikTok/YouTube/Instagram URL** — Extract the content, analyze it, and create slideshow content inspired by it
2. **Video/audio file** — Process the media, identify key moments, suggest slideshow angles
3. **Screenshot/image** — Use as reference for content creation
4. **Text description** — "make a post about [topic]"

### Processing Steps

When Sean sends /clip with media or a URL:

1. **Acknowledge** — Reply immediately: "Got it. Processing..."
2. **Analyze the content:**
   - If URL: Use the browser tool to visit the page, screenshot it, extract info (artist name, song title, view count, comments)
   - If video/audio: Use the whisper skill to transcribe if needed, analyze the content
   - If image: Describe what you see and suggest content angles
3. **Suggest content angles** — For each relevant archetype, suggest how this could become a post:
   - Which archetype(s) would this fit? (Underground Discovery, Rap News, Hot Takes, Snippets, Culture/Memes)
   - What would the hook text be?
   - What would the 6 slides cover?
4. **Ask Sean to pick** — Present 2-3 options, let Sean choose
5. **Generate the slideshow** — Use the rap-media-seeder skill + generate-slides.js to create the 6 images
6. **Send back for review** — Send the generated images and hook text back to Sean via WhatsApp
7. **Post as draft** — If Sean approves, post via Postiz as SELF_ONLY draft

### Quick Mode

If Sean just says /clip with a URL and no other instructions, default to:
- Auto-detect the best archetype
- Generate the slideshow immediately
- Send it back for approval
- Don't over-ask — just produce something good

### Example Flows

**Sean sends:** /clip https://tiktok.com/@someartist/video/123
**You do:**
1. Visit URL, screenshot, extract info
2. Identify it as a rap snippet — fits Snippets/New Music archetype
3. Generate 6 slides with hook text like "This song is about to blow up"
4. Send images back to Sean
5. Sean says "fire, post it" — post as SELF_ONLY draft on the nextupsoundsco account

**Sean sends:** /clip [video attachment] + "this beat is crazy"
**You do:**
1. Process the video, transcribe if needed
2. Identify key moments (best bars, beat drops)
3. Suggest: Underground Discovery angle ("3am find that goes crazy") or Hot Takes angle ("This producer is top 5")
4. Generate slideshow based on Sean's pick
5. Send back for review

**Sean sends:** /clip make a post about the new Drake album announcement
**You do:**
1. Search for latest Drake news via browser
2. Create Rap News archetype content
3. Generate 6 slides covering the announcement
4. Send back for review

## Important Rules

- **Always check seeding rules** before including Netspend — follow the schedule in TOOLS.md
- **Never post directly** — always SELF_ONLY draft first, Sean approves
- **Match the archetype voice** — each page has a distinct tone (see rap-media-seeder skill)
- **Speed matters** — Sean wants quick turnaround. Don't over-explain, just produce
- **Send media back via WhatsApp** — Sean reviews on his phone

## Tools You Use

- Browser tool — Visit URLs, screenshot pages, extract content
- openai-image-gen skill — Generate slideshow images
- rap-media-seeder skill — Content templates, archetype voices, seeding rules
- openai-whisper-api skill — Transcribe audio/video if needed
- Postiz API — Post as SELF_ONLY drafts
- WhatsApp — Send results back to Sean

## File Locations

- Generated images: /home/ubuntu/rap-media/generated/
- Config: /home/ubuntu/rap-media/config.json
- Scripts: ~/.openclaw/workspace/skills/larry/scripts/ (generate-slides.js, post-to-tiktok.js, add-text-overlay.js)
- Clip processing: `clips/make_clip.py` — caption overlay tool
- Raw footage: `clips/raw/` — drop raw footage here
- Finished clips: `clips/output/` — processed clips come out here
- Sounds: `clips/sounds/` — Nettspend audio library
- Batch scripts: `clips/batch_repurpose.py`, `clips/batch_repurpose_v2.py`

---

# Repurpose Mode

When Sean sends multiple TikTok links and says to repurpose/clip them, follow this workflow:

## Step 1: Download

```bash
cd clips/raw/<batch_name>/
yt-dlp -o "clip_N.%(ext)s" --format "best[ext=mp4]/best" "<URL>"
```

Download all clips in parallel. Create a batch folder (e.g. `repurpose_batch`).

## Step 2: Analyze Each Clip

For each downloaded clip:
1. Take a screenshot at multiple timestamps (`ffmpeg -ss <time> -i <file> -frames:v 1`)
2. Read the screenshots to understand the content visually
3. Get the TikTok description via `yt-dlp --print title --print description --skip-download`
4. Check dimensions: `ffprobe -v quiet -select_streams v:0 -show_entries stream=width,height`
5. Identify:
   - Does it have existing captions/text overlays to crop?
   - Does it already have music? (check audio: `ffmpeg -af "volumedetect" -vn -f null /dev/null`)
   - Does it have baked-in black bars? (`ffmpeg -vf "cropdetect=24:16:0" -frames:v 30 -f null /dev/null`)

## Step 3: Crop & Clean

**Remove old captions:**
- Bottom subtitles: `crop=in_w:in_h-130:0:0` (adjust px based on subtitle size)
- Top text overlays: `crop=in_w:in_h*0.65:0:in_h*0.35` (adjust percentage based on text size)
- Take a screenshot after cropping to verify text is fully removed. If not, crop more aggressively.

**Remove baked-in black bars:**
- Use `cropdetect` output: `ffmpeg -vf "crop=W:H:X:Y"` with the detected values
- This ensures the actual content fills as much of the frame as possible

Always verify crops with a screenshot before processing through make_clip.py.

## Step 4: Process with make_clip.py

```python
from make_clip import make_clip

make_clip(
    video_path="path/to/cleaned/video.mp4",
    caption="Your rage-bait caption here 💀",
    output_name="batch_name/clip_name",
    sound_path="path/to/song.mp3" or None,  # None if clip already has music
    sound_volume=0.15,  # 15% volume when adding music
)
```

**Key rules:**
- **If the clip already has music** (concerts, performances, fan edits with beats) → `sound_path=None`. Don't layer music on music.
- **If the clip is speech-only** (interviews, podcasts) → add a Nettspend song at 15% volume
- make_clip.py handles: scaling to 1080x1920, centering with black bars, caption overlay with auto-contrast, Apple emojis

## Step 5: Caption Writing (Rage-Bait Style)

Follow the style guide at `clients/nettspend/clipping-style.md`:

**The formula:** Create tension, never resolve it. The caption opens a loop only the footage can close.

**Angles that work:**
- "This kid" / questioning age and power
- "This generation is cooked" — generational divide
- "How is he doing this" — disbelief
- "Nobody can explain this" — mystery/intrigue
- "Your parents wouldn't understand"
- "Name one song" — bait fans into commenting

**Rules:**
- 1-2 lines max
- Conversational tone
- Every caption is a HOOK — makes someone stop scrolling
- Never give away what happens — create curiosity
- Finish the sentence grammatically but DON'T resolve the tension

**Good:** "They really let this kid headline..." / "Nobody was ready for what he did next"
**Bad:** "Nettspend performs at sold-out show" / "Crazy concert footage"

## Step 6: Review

1. Take preview screenshots of all finished clips
2. Present them to Sean with a summary table (clip name, caption, song, what was cropped)
3. Open the output folder in Finder: `open clips/output/<batch_name>/`
4. Wait for Sean's approval — he may want caption changes, volume adjustments, or clips redone

## Step 7: Schedule to Postiz

After approval:

1. **Upload clips:** `POSTIZ_API_KEY="..." npx postiz upload <file>`
2. **Check existing schedule:** `npx postiz posts:list` — find the last scheduled post time
3. **Continue the cadence** (usually 6 hours apart) — never overlap or create gaps
4. **Create posts for each platform:**

```bash
npx postiz posts:create \
  -c "Caption with #hashtags" \
  -m "https://uploads.postiz.com/<file>.mp4" \
  -s "2026-MM-DDT00:00:00Z" \
  -i "<integration_id>" \
  --settings '<platform_settings_json>'
```

**2016vault integration IDs:**
- TikTok: `cmly3nop6020lru0yjtvfnmxv`
- Instagram: `cmly3gpqs0203ru0yn6qh332i`
- X/Twitter: `cmlya0uqc02nmru0y17bsdsf3`

**Platform settings:**
- TikTok: `{"privacy_level":"PUBLIC_TO_EVERYONE","duet":true,"stitch":true,"comment":true,"autoAddMusic":"no","brand_content_toggle":false,"brand_organic_toggle":false,"content_posting_method":"DIRECT_POST"}`
- Instagram: `{"post_type":"post"}`
- X: `{"who_can_reply_post":"everyone"}`

**Hashtag rules:**
- TikTok/IG: 5 hashtags (always include #nettspend and account tag)
- X: 2 hashtags only (under 200 char total)

**After scheduling:** Verify with `npx postiz posts:list` — check no duplicates, no gaps, correct order.

## Nettspend Songs Available

Located in `clips/sounds/`:
- 07_beach_leak.mp3
- 08_impact.mp3
- 09_withdrawals.mp3
- 10_drankdrankdrank.mp3
- (plus older tracks in carti/ subfolder)

---

# Podcast/Stream Clipping Mode

When Sean sends a long-form video (podcast, stream, interview) and asks for clips:

## The Hook Rule (MOST IMPORTANT)

**The first 1.5 seconds decide everything.** If the opening words don't make someone stop mid-scroll, the clip is worthless. Previous mistakes: picking "interesting" mid-conversation moments. Those don't work because they require context.

### What makes a scroll-stopping hook:
- **Shocking comparisons:** "Skydiving feels like heroin"
- **Raw confessions:** "When I was in rehab..."
- **Contrarian manifestos:** "Being healthy is the new punk rock"
- **Provocative claims:** "Alcohol is worse than heroin"
- **Universal emotional triggers:** drugs, addiction, rebellion, death, family, money

### What does NOT work as a hook:
- Mid-conversation rants that need context ("And then the fashion thing...")
- Advice that starts slowly ("I think you should...")
- Agreeing with each other ("Yeah bro, exactly")
- Stories that need setup before they get interesting

### Hook test: Read ONLY the first sentence out loud. If it doesn't make you go "wait, WHAT?" — skip it.

## Full Pipeline

### Step 1: Download & Transcribe
```bash
# Download stream
yt-dlp -o "clips/raw/<name>.mp4" "<URL>"

# Extract audio
ffmpeg -i clips/raw/<name>.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 /tmp/<name>_audio.wav

# Split into 15-min chunks (for long videos)
ffmpeg -i /tmp/<name>_audio.wav -f segment -segment_time 900 -c copy /tmp/<name>_chunks/chunk_%d.wav

# Transcribe each chunk with word-level timestamps
mlx_whisper /tmp/<name>_chunks/chunk_0.wav --model mlx-community/whisper-large-v3-turbo --language en --word-timestamps True --output-dir /tmp/<name>_chunks/
```

### Step 2: Find Hook Moments
- Read ALL transcripts, search for scroll-stopping opening lines
- Apply the hook test above
- Identify exact segment timestamps (each chunk starts at chunk_number * 900 seconds)
- Pick 3 clips (quality over quantity)

### Step 3: Cut & Crop
```bash
# Cut from source with tight crop on speakers
ffmpeg -y -ss <start_seconds> -t <duration> -i clips/raw/<name>.mp4 \
  -vf "crop=1350:850:0:80" \
  -c:v libx264 -preset fast -crf 18 -c:a aac -b:a 192k \
  clips/raw/<batch>/clip_name.mp4
```

**Crop setting `crop=1350:850:0:80`** works for standard podcast 2-person setups. Adjust x/y offset based on speaker positions.

### Step 4: Generate ASS Subtitles (Speech Captions)
From the whisper transcript segments, generate `.ass` subtitle files with:
- **Font:** Montserrat 22px
- **Color:** Yellow (`&H0000FFFF`) with black outline
- **Position:** MarginV=350 (centers text in the lower black bar, NOT on the video)
- **Pacing:** ~4 words per subtitle line for readability
- **Small overlap:** -0.10s on start times for smooth transitions

```
Style: Default,Montserrat,22,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,2,40,40,350,1
```

### Step 5: Process with make_clip.py
```python
from make_clip import make_clip

make_clip(
    video_path="raw/<batch>/clip_name.mp4",
    caption="hook text goes here",      # White text overlay ON the video
    output_name="clip_name",
    text_style="auto",                   # Auto-detects brightness -> white or black text
    subtitle_path="/path/to/clip.ass"    # Yellow speech subtitles in black bar
)
```

**CRITICAL DISTINCTION:**
- **Hook caption** (`caption` param) = White text with black outline, ON the video, Montserrat Bold 36px. This is the rage-bait/clickbait text overlay.
- **Speech subtitles** (`subtitle_path` param) = Yellow text, small (22px), in the BLACK BAR below the video. These are the actual words being spoken.

### Step 6: Schedule via Postiz
- NO embedded music. Enable TikTok `autoAddMusic: "yes"` so TikTok adds a trending sound
- Schedule every 12 hours
- Upload, then create posts with appropriate integration IDs

## asspizza2026 Postiz Configuration

**Integration IDs:**
- TikTok: `cmlvcz31x00lxny0yex5bsi0v`
- Instagram: NOT CONNECTED (as of 2026-02-23)

**TikTok settings (with auto-add music):**
```json
{
  "privacy_level": "PUBLIC_TO_EVERYONE",
  "duet": true,
  "stitch": true,
  "comment": true,
  "autoAddMusic": "yes",
  "brand_content_toggle": false,
  "brand_organic_toggle": false,
  "content_posting_method": "DIRECT_POST"
}
```

**Hashtags:** #asspizza #mitchmodes + topic-specific tags (5 total)

**API Key:** Same as 2016vault: `e964c2e49e94fa7d870c1f94f4327d875c135c6b73d9ab9ba02e745da6872408`
