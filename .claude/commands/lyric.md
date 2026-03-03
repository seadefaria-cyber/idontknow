# /lyric — Lyric Video from a TikTok/Instagram Link

Usage: `/lyric <tiktok_or_instagram_url> [optional: song choice, account to post to, caption]`

## What This Does
Takes a video link, downloads it, adds a Nettspend (or specified artist) song with D Savage vault-style word-by-word lyrics overlaid on top, formatted for TikTok/Instagram Reels (9:16).

## Workflow

### Step 1: Download the Video
```bash
yt-dlp -o "/tmp/lyric-source.mp4" "<URL>"
```
Probe it with ffprobe to get resolution, duration, aspect ratio.

### Step 2: Pick the Song
- If user specifies a song, use that
- Otherwise ask which song to use
- Download audio: `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "/tmp/song.mp3" "ytsearch:<artist> <song>"`

### Step 3: Get Accurate Lyrics
1. Transcribe with mlx-whisper for word-level timestamps:
```python
import mlx_whisper
result = mlx_whisper.transcribe('/tmp/song.mp3', word_timestamps=True, path_or_hf_repo='mlx-community/whisper-large-v3-turbo')
```
2. Cross-reference with Genius lyrics using agent-browser (web fetch is blocked on Genius):
```bash
agent-browser --headed --profile "$HOME/.chrome-agent-profile" --args "--disable-blink-features=AutomationControlled" --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36" open "https://genius.com/<artist>-<song>-lyrics"
agent-browser snapshot -ic  # to grab lyrics text
```
3. Fix Whisper transcription errors using the Genius lyrics. Keep Whisper's timestamps, replace wrong words.

### Step 4: Generate D Savage Vault-Style Subtitle File
Reference: @dsavagevault TikTok — https://www.tiktok.com/@dsavagevault/video/7606249007240711438

**Style rules:**
- **Lowercase** text (never ALL CAPS)
- **White, bold** font — Arial Black, 55pt at 720x1280
- **Words pop in one at a time** — each new word adds to the cumulative line on screen
- **Centered horizontally** on the video (ASS Alignment 5 or 8)
- **Positioned in center of video area** (~MarginV=460 with Alignment 5)
- **Subtle drop shadow** for readability (Outline=1, Shadow=2, OutlineColour=&H80000000&)
- **Double spaces** between words for generous spacing
- **Line clears** between lyric lines (each Genius line builds up, then resets for next line)
- **No karaoke color** — just clean white, word-by-word appearance

**ASS Style line:**
```
Style: Lyrics,Arial Black,55,&H00FFFFFF&,&H00FFFFFF&,&H80000000&,&H80000000&,-1,0,0,0,100,100,0,0,1,1,2,5,50,50,460
```

**Generating events with Python:**
For each lyric line, create cumulative dialogue events:
- Word 1 appears: "i"
- Word 2 appears: "i  think"
- Word 3 appears: "i  think  i'm"
- etc.
Each event replaces the previous, timed to Whisper word timestamps.

### Step 5: Render the Video
```bash
ffmpeg -y -i source.mp4 -i song.mp3 \
  -filter_complex " \
    color=black:720x1280:d=DURATION[bg]; \
    [0:v]scale=720:-2[scaled]; \
    [bg][scaled]overlay=0:(H-h)/2-80[base]; \
    [base]ass=lyrics.ass[outv]" \
  -map "[outv]" -map 1:a \
  -c:v libx264 -preset fast -crf 22 \
  -c:a aac -b:a 128k \
  -t DURATION -movflags +faststart -shortest \
  output.mp4
```

### Step 6: Preview
Open the clip: `open /tmp/output.mp4`
Ask Sean for approval or changes.

### Step 7: Post (if approved)
**CRITICAL: Read CLAUDE.md "Postiz Posting Rules" — ONE post per account, NEVER duplicate.**

Ask which account(s) to post to. Post ONE at a time:
```bash
export POSTIZ_API_KEY="e964c2e49e94fa7d870c1f94f4327d875c135c6b73d9ab9ba02e745da6872408"
SCHEDULE=$(date -u -v+2M +"%Y-%m-%dT%H:%M:%SZ")

# TikTok (autoAddMusic required)
npx postiz posts:create \
  -c "CAPTION" \
  -m "UPLOADED_URL" \
  -s "$SCHEDULE" \
  --settings '{"privacy_level":"PUBLIC_TO_EVERYONE","duet":true,"stitch":true,"comment":true,"autoAddMusic":"no","brand_content_toggle":false,"brand_organic_toggle":false,"content_posting_method":"DIRECT_POST"}' \
  -i "INTEGRATION_ID"

# Instagram (post_type required)
npx postiz posts:create \
  -c "CAPTION" \
  -m "UPLOADED_URL" \
  -s "$SCHEDULE" \
  --settings '{"post_type":"post"}' \
  -i "INTEGRATION_ID"
```

**Known Postiz integration IDs:**
- 2016vault TikTok: `cmly3nop6020lru0yjtvfnmxv`
- 2016vault Instagram: `cmly3gpqs0203ru0yn6qh332i`
- asspizza2026 TikTok: `cmlvcz31x00lxny0yex5bsi0v`

**After posting:** Wait and verify state reaches PUBLISHED. Never create a second post if first is in QUEUE.

## Important
- Always cross-reference lyrics with Genius — Whisper gets words wrong on autotuned vocals
- The TikTok API cannot attach a specific sound — if user wants a tagged sound, they need to upload manually through the TikTok app
- Keep clips under 60 seconds for optimal Reels/TikTok performance
