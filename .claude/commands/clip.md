# /clip — Cut a Viral Clip from a Video

Usage: `/clip <youtube_url> [topic/direction]`

Examples:
- `/clip https://youtube.com/watch?v=xxxxx` (auto-find best moments)
- `/clip https://youtube.com/watch?v=xxxxx asspizza talks about streetwear`

## Workflow

### Step 1: Analyze the Video
1. Download metadata with `yt-dlp --dump-json`
2. Download auto-subs: `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt`
3. Parse VTT into timestamped transcript
4. Find the TOP 5-10 most viral/clippable moments (hot takes, funny stories, emotional moments, quotable bars)

### Step 2: Present Moments to Sean
Show ranked list with timestamp, quote, and suggested clip title. Ask which ones to cut.

### Step 3: Cut the Clips
For each selected moment:

1. Download the segment: `yt-dlp --download-sections "*START-END"`
2. Create ASS subtitle file following the **MANDATORY CLIP STYLE** (see CLAUDE.md "Clip Style Spec")
3. Process with ffmpeg

## MANDATORY CLIP STYLE — Read CLAUDE.md "Clip Style Spec" Section

Every clip MUST follow this exact format. Do NOT deviate.

**ffmpeg template:**
```bash
ffmpeg -y \
  -ss START -t DURATION -i input.mp4 \
  -filter_complex "
    color=black:720x1280:d=DURATION[bg];
    [0:v]scale=720:-2[scaled];
    [bg][scaled]overlay=0:(H-h)/2-80[composed];
    [composed]ass=SUBTITLE_FILE.ass[outv]
  " \
  -map "[outv]" -map 0:a \
  -c:v libx264 -preset fast -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart -shortest \
  output.mp4
```

**ASS subtitle structure:**
- Resolution: 720x1280
- Style "Caption": Arial Black, size 38, white (&H00FFFFFF), ALL CAPS, NO outline, NO background, positioned at bottom (MarginV ~60), word-by-word karaoke with \k tags, current word turns YELLOW (&H0000FFFF)
- Style "Hook": Arial Black, size 32, white with drop shadow, positioned over video lower-third (MarginV ~340), title-case, first 3-4 seconds only
- Style "Impact": Arial Black, size 52, white text with colored block background (cyan #00A5D4 as BorderStyle 3), positioned center of video (MarginV ~340), ALL CAPS, appears at punchline moments for 2-4 seconds

**Layout rules:**
- Clean BLACK bars top and bottom — NO blur, NO gradient
- Video centered in frame
- Captions in bottom black bar with yellow word highlight
- Impact text on the video at key moments
- NO background boxes on captions or emojis

## Step 4: Preview
Open the clip: `open /tmp/clip-output.mp4`
Ask Sean for approval or changes.

## Step 5: Post (if approved)
Ask where to post: TikTok @asspizza2026 or send to WhatsApp.
If TikTok: follow the /slideshow posting workflow via Postiz.
If WhatsApp: upload to catbox.moe and send via OpenClaw.

## Caption Rules (for TikTok post caption)
- Lowercase, casual tone
- Under 150 chars + 4-5 hashtags
- Hook question to drive comments
- No promotional language

## Important
- ALWAYS use the style from CLAUDE.md "Clip Style Spec" — never improvise a different look
- Keep clips 15-45 seconds for TikTok optimal length
- The first 2 seconds must hook — start with action or a provocative statement
- Trim dead air and filler words where possible
