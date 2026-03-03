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

Every clip MUST follow this exact format. Do NOT deviate. Reference: @nettspend.clips0 TikTok.

**ASS subtitle structure (720x1280, all Alignment 8 = top-center):**
- Style "Caption": Arial Black, 20pt, white, yellow karaoke highlight (\k tags), MarginV=790, MarginL=30, MarginR=100
- Style "Hook": Arial Black, 24pt, white + drop shadow, MarginV=540, MarginL=50, MarginR=50, first 3-4s only
- Style "Impact": Arial Black, 36pt, white + cyan block bg (BorderStyle 3), MarginV=460, MarginL=30, MarginR=100

**Emoji overlays:** Generate PNGs with Pillow (Apple Color Emoji), overlay at x=285, y=600 via ffmpeg filter_complex

**Position map (video at y=358-763 with -80px offset):**
- Impact: y=460 (on video, upper)
- Hook: y=540 (on video, lower, near page center)
- Emojis: y=600 (on video, under text)
- Captions: y=790 (bottom black bar)

**See CLAUDE.md "Clip Style Spec" for complete ffmpeg template, Pillow code, and all rules.**

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
