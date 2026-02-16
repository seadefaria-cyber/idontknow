# Batch Processing & Workflow Optimization Research — Post Clipping Agency

**Date:** 2026-02-15
**Context:** Sean runs "Post," processing 15-20 clips/day/client. Current daily time: 50-75 min per client. Scaling wall at 4 clients. This research covers concrete, week 1-2 implementable optimizations.

---

## 1. Parallel Processing Strategies

### The Dead Time Problem

Sean's current workflow is sequential: upload segment -> wait 5-30 min -> review -> upload next segment -> wait again. With 3 clients and 2-hour streams each requiring 4+ segments, that is potentially 2+ hours of idle waiting time per day.

### Optimal Batching Strategy: Interleaved Pipeline

**Week 1 implementation — no tools needed, just a changed routine:**

```
TIME     CLIENT A              CLIENT B              CLIENT C
─────────────────────────────────────────────────────────────────
9:00     Pre-segment (2 min)
9:02     Upload seg 1-4
9:07     [Submagic processing] Pre-segment (2 min)
9:09     [Submagic processing] Upload seg 1-3
9:14     [Submagic processing] [Submagic processing] Pre-segment (2 min)
9:16     [Submagic processing] [Submagic processing] Upload seg 1-3
9:21     Review Client A clips [Submagic processing] [Submagic processing]
9:31     CapCut hero clips A   [Submagic processing] [Submagic processing]
9:46     Later scheduling A    Review Client B clips [Submagic processing]
10:11    DONE with A           CapCut hero clips B   Review Client C clips
10:26                          Later scheduling B    CapCut hero clips C
10:51                          DONE with B           Later scheduling C
11:16                                                DONE with C
```

**Key rule: Upload ALL segments for ALL clients first, then circle back to review.** Submagic processes in the background while you prep the next client.

**Time saved per day (3 clients):** 30-60 minutes of dead waiting time eliminated.

### Submagic Upload Parallelism

Submagic rate limits are generous:
- 30 project creations per hour
- 500 Magic Clips requests per hour
- 100 status polls per hour

This means you can upload all segments for all clients simultaneously. Open multiple browser tabs — one per client — and drag-drop all segments at once. Submagic processes them in parallel on their end.

**Practical limit:** Upload 8-12 segments in a single batch (all clients combined), then start review cycle when the first batch finishes.

### Browser Tab Organization

Set up a persistent browser window with pinned tabs in this order:
1. Submagic dashboard (Client A workspace)
2. Submagic dashboard (Client B workspace)
3. Submagic dashboard (Client C workspace)
4. Later dashboard
5. CapCut web
6. TikTok Creative Center
7. Google Drive

Use Chrome profiles or Firefox containers if managing separate Submagic workspaces per client.

---

## 2. FFmpeg Batch Scripts

### Basic Pre-Segmentation (What Sean already has)

```bash
ffmpeg -i stream.mp4 -c copy -segment_time 1500 -f segment chunk_%03d.mp4
```

### Advanced All-in-One Processing Script

This script handles pre-segmentation, audio normalization, thumbnail extraction, and optional watermarking in a single run. Save as `process.sh` and run from Terminal.

```bash
#!/bin/bash
# ================================================================
# Post Agency — Video Pre-Processing Script
# Usage: ./process.sh <input_video> [client_name]
# Example: ./process.sh ~/Downloads/stream.mp4 clienta
# ================================================================

set -euo pipefail

INPUT="$1"
CLIENT="${2:-unknown}"
DATE=$(date +%Y%m%d)
SEGMENT_DURATION=1500  # 25 minutes in seconds
OUTPUT_DIR="${HOME}/Post/${CLIENT}/${DATE}"

# Loudness target (EBU R128 broadcast standard)
LOUDNESS_I=-16
LOUDNESS_LRA=11
LOUDNESS_TP=-1.5

# Create output directories
mkdir -p "${OUTPUT_DIR}/segments"
mkdir -p "${OUTPUT_DIR}/thumbnails"

echo "=== Post Agency Processor ==="
echo "Input: ${INPUT}"
echo "Client: ${CLIENT}"
echo "Output: ${OUTPUT_DIR}"
echo ""

# Get video duration in seconds
DURATION=$(ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "${INPUT}" | cut -d. -f1)
echo "Video duration: ${DURATION}s ($(( DURATION / 60 ))m)"

# ---------------------------------------------------------------
# STEP 1: Segment + Normalize Audio (single pass per segment)
# ---------------------------------------------------------------
# Why not segment first then normalize? Because segment with -c copy
# can't apply audio filters. We split by time ranges instead.
echo ""
echo "--- Step 1: Segmenting + normalizing audio ---"

SEGMENT_NUM=0
START=0

while [ ${START} -lt ${DURATION} ]; do
  SEGMENT_NUM=$((SEGMENT_NUM + 1))
  PADDED=$(printf "%03d" ${SEGMENT_NUM})
  OUTFILE="${OUTPUT_DIR}/segments/${CLIENT}_${DATE}_seg${PADDED}.mp4"

  echo "  Segment ${SEGMENT_NUM}: starting at ${START}s"

  ffmpeg -y -hide_banner -loglevel warning \
    -ss ${START} -i "${INPUT}" -t ${SEGMENT_DURATION} \
    -c:v libx264 -preset fast -crf 22 \
    -af "loudnorm=I=${LOUDNESS_I}:LRA=${LOUDNESS_LRA}:TP=${LOUDNESS_TP}" \
    -c:a aac -b:a 192k \
    -movflags +faststart \
    "${OUTFILE}"

  START=$((START + SEGMENT_DURATION))
done

echo "  Created ${SEGMENT_NUM} segments"

# ---------------------------------------------------------------
# STEP 2: Extract thumbnail from each segment (middle frame)
# ---------------------------------------------------------------
echo ""
echo "--- Step 2: Extracting thumbnails ---"

for SEG in "${OUTPUT_DIR}/segments"/*.mp4; do
  BASENAME=$(basename "${SEG}" .mp4)
  THUMB="${OUTPUT_DIR}/thumbnails/${BASENAME}_thumb.jpg"

  # Get segment duration, extract frame from the middle
  SEG_DUR=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "${SEG}" | cut -d. -f1)
  MIDDLE=$(( SEG_DUR / 2 ))

  ffmpeg -y -hide_banner -loglevel warning \
    -ss ${MIDDLE} -i "${SEG}" \
    -frames:v 1 -q:v 2 \
    "${THUMB}"

  echo "  ${BASENAME} -> thumbnail at ${MIDDLE}s"
done

# ---------------------------------------------------------------
# STEP 3: Quick copy without re-encode (for when you DON'T need
# audio normalization — just fast splitting)
# ---------------------------------------------------------------
# Uncomment the function below and call fast_segment instead of
# the loop in Step 1 if you want speed over audio quality.
#
# fast_segment() {
#   ffmpeg -y -hide_banner -loglevel warning \
#     -i "${INPUT}" \
#     -c copy \
#     -segment_time ${SEGMENT_DURATION} \
#     -f segment \
#     -reset_timestamps 1 \
#     "${OUTPUT_DIR}/segments/${CLIENT}_${DATE}_seg%03d.mp4"
# }

echo ""
echo "=== Done ==="
echo "Segments: ${OUTPUT_DIR}/segments/"
echo "Thumbnails: ${OUTPUT_DIR}/thumbnails/"
echo "Ready for Submagic upload."
```

### Quick-Use Aliases (add to ~/.zshrc)

```bash
# Fast segment only (no re-encode, no normalization) — 1-2 min per hour
alias postsplit='f() {
  ffmpeg -i "$1" -c copy -segment_time 1500 -f segment \
    -reset_timestamps 1 "chunk_%03d.mp4";
}; f'

# Extract a single thumbnail at the 10-second mark
alias postthumb='f() {
  ffmpeg -ss 10 -i "$1" -frames:v 1 -q:v 2 "thumb_$(basename "$1" .mp4).jpg";
}; f'

# Overlay trending sound onto a clip (keeps original audio at 70%, adds sound at 30%)
alias postsound='f() {
  ffmpeg -i "$1" -i "$2" \
    -filter_complex "[0:a]volume=0.7[orig];[1:a]volume=0.3[sound];[orig][sound]amix=inputs=2:duration=first" \
    -c:v copy "sounded_$(basename "$1")";
}; f'

# Batch normalize audio for all mp4s in current directory
alias postnorm='for f in *.mp4; do
  ffmpeg -y -i "$f" -c:v copy \
    -af "loudnorm=I=-16:LRA=11:TP=-1.5" \
    -c:a aac "norm_$f";
done'
```

### FFmpeg Sound Overlay (Replaces CapCut for Simple Cases)

This is the highest-leverage FFmpeg optimization. Instead of opening CapCut for every hero clip just to add a trending sound, do it from Terminal:

```bash
# Mix trending sound under original audio
ffmpeg -i hero_clip.mp4 -i trending_sound.mp3 \
  -filter_complex \
    "[0:a]volume=0.7[orig]; \
     [1:a]atrim=0:$(ffprobe -v error -show_entries format=duration \
       -of default=noprint_wrappers=1:nokey=1 hero_clip.mp4),afade=t=out:st=28:d=2,volume=0.3[sound]; \
     [orig][sound]amix=inputs=2:duration=first[out]" \
  -map 0:v -map "[out]" -c:v copy -c:a aac \
  hero_clip_sounded.mp4
```

**What this does:** Keeps original audio at 70% volume, mixes the trending sound at 30% volume, trims the sound to match clip length, adds a 2-second fade-out. Video stream is copied (not re-encoded), so it runs in seconds.

**Time saved:** 3-5 min per hero clip x 3-5 clips = 9-25 min per client per day. This alone can save 30-75 min daily across 3 clients.

**When you still need CapCut:** When you want visual effects, beat-synced edits, or text overlays that go beyond just adding a sound track.

---

## 3. Keyboard Shortcuts & Speed Techniques

### CapCut Desktop — Essential Shortcuts

| Action | Shortcut | Time Saved |
|--------|----------|------------|
| Split clip at playhead | C | Fastest way to trim |
| Delete left of playhead | Q | No mouse needed |
| Delete right of playhead | W | No mouse needed |
| Jump to start | 3 | Quick navigation |
| Jump to end | 4 | Quick navigation |
| Previous frame | 1 | Frame-precise editing |
| Next frame | 2 | Frame-precise editing |
| Playback speed: 2x forward | L (press twice) | Review clips 2x faster |
| Playback speed: 2x reverse | J (press twice) | Quick rewind |
| Play/Pause | K | Standard transport |
| Copy clip | Cmd+C | Standard |
| Paste clip | Cmd+V | Standard |
| Undo | Cmd+Z | Standard |
| Export | Cmd+E | Skip menus |

**Speed technique:** When reviewing clips for sound addition, use L+L to play at 2x speed. You only need to hear the first 3 seconds and the general vibe — you are not doing detailed audio editing. This cuts review-per-clip from 60 seconds to 20 seconds.

**Template technique:** Create a CapCut project template with your standard export settings (1080x1920, 30fps, H.264). Save it. Duplicate it for each hero clip session. This skips the settings step every time.

### Later — Speed Techniques

Later does not have documented keyboard shortcuts, but these workflow hacks save significant time:

| Technique | How | Time Saved |
|-----------|-----|------------|
| **Bulk media upload** | Drag and drop all clips at once into the Media Library | 5-8 min vs one-by-one |
| **Best Time to Post** | Let Later auto-suggest times instead of manually picking slots | 3-5 min |
| **Saved captions/hashtags** | Pre-build hashtag sets per client per platform. Save as "Saved Captions" in Later | 5-10 min per client |
| **Visual planner drag** | Use the calendar view, drag clips from media library to time slots instead of opening each post editor | 3-5 min |
| **Duplicate post** | After scheduling a clip for one platform, duplicate it for the next platform. Only change the caption text. | 2-3 min per clip |
| **Label system** | Color-label clips by type: red = hero, blue = filler, green = scheduled | Reduces decision time |

**Biggest Later time-saver: Pre-built hashtag sets.** Create and save:
- `{client}_tiktok_hashtags` (15-20 hashtags)
- `{client}_instagram_hashtags` (20-25 hashtags)
- `{client}_youtube_hashtags` (5-8 hashtags)
- `{client}_x_hashtags` (3-5 hashtags)

Then just select the set when scheduling instead of typing hashtags every time.

### Submagic — Speed Techniques

| Technique | How | Time Saved |
|-----------|-----|------------|
| **Batch upload** | Upload all segments at once, not one at a time | 3-5 min |
| **Pre-set caption style** | Save your preferred caption template (e.g., Hormozi style) as default | 1-2 min per batch |
| **Use virality scores** | Sort clips by virality score. Only watch clips scoring 70+ for hero consideration. Skim 50-69 for filler. Skip <50. | 5-10 min |
| **Quick-reject scan** | Use thumbnail view (not video view) for filler clips. If the thumbnail shows dead air, skip without watching. | 3-5 min |
| **Browser bookmarks** | Bookmark each client's Submagic workspace for instant access | 30 sec per switch |

### Combined Daily Time Savings Estimate

| Optimization | Minutes Saved Per Client | Implementation |
|--------------|--------------------------|----------------|
| Interleaved pipeline (parallel processing) | 10-20 min | Week 1, Day 1 |
| FFmpeg sound overlay (replaces CapCut for sounds) | 9-25 min | Week 1, Day 2-3 |
| Pre-built hashtag sets in Later | 5-10 min | Week 1, Day 1 |
| Later bulk upload + visual planner | 3-5 min | Week 1, Day 1 |
| Submagic batch upload + virality sort | 5-10 min | Week 1, Day 1 |
| CapCut 2x playback for review | 3-5 min | Week 1, Day 1 |
| AI caption generation (see section 4) | 10-20 min | Week 1, Day 3-5 |
| **TOTAL** | **45-95 min per client** | |

At 3 clients, this is **135-285 min saved daily** — potentially cutting daily work time in half.

---

## 4. Caption Generation Automation

### The Caption Problem

Later scheduling takes 25-35 min per client primarily because of unique captions. With 15-20 clips x 4 platforms x unique text per account, that is 60-80 individual captions per client per day. Writing those manually is the single biggest time sink.

### Solution: Claude API Batch Caption Generation

**Yes, you can generate 20+ unique captions from a single clip description in under a minute.**

Claude's Batch API processes requests at 50% of standard pricing. For caption generation, even the standard API is fast and cheap enough.

### Ready-to-Use Prompt Template

```
You are the social media manager for {client_name}, a {client_description}.

Brand voice: {voice_descriptors}
Platform: {platform}

I have {N} video clips to post today. For each clip, I'll give you a 1-2 sentence description. Generate {captions_per_clip} unique captions for each.

Rules:
- Each caption must be genuinely different (not just word swaps)
- Match the platform's native style:
  - TikTok: casual, hook-first, 1-3 sentences, use trending phrases
  - Instagram: slightly more polished, can be longer, end with CTA
  - YouTube Shorts: descriptive, keyword-rich for search
  - X: punchy, under 280 chars, conversation-starter
- Include 1-2 relevant emojis per caption (platform-appropriate)
- Do NOT repeat hashtags in captions (those are added separately)
- Each caption should feel like a different person wrote it

Clips:
1. {clip_1_description}
2. {clip_2_description}
3. {clip_3_description}
...

Output format (strict):
CLIP 1:
Caption A: ...
Caption B: ...
Caption C: ...

CLIP 2:
Caption A: ...
Caption B: ...
Caption C: ...
```

### Implementation Options (Week 1)

**Option A: Manual Claude Chat (zero setup, start today)**
1. Open claude.ai
2. Paste the prompt template above
3. Fill in clip descriptions (1 sentence each — what happened in the clip)
4. Get 20+ captions in 15-30 seconds
5. Copy-paste into Later

Time: 2-3 min per client instead of 15-20 min. Net savings: 12-17 min per client.

**Option B: Claude API Script (30 min setup, week 1-2)**

```python
#!/usr/bin/env python3
"""
Post Agency — Batch Caption Generator
Usage: python captions.py --client clienta --platform tiktok --clips clips.txt
"""

import anthropic
import sys
import argparse

# Client voice profiles (add your clients here)
CLIENTS = {
    "clienta": {
        "name": "Client A",
        "description": "gaming streamer known for rage moments and clutch plays",
        "voice": "hype, edgy, Gen-Z humor, uses slang"
    },
    "clientb": {
        "name": "Client B",
        "description": "music artist with a laid-back vibe",
        "voice": "cool, understated, confident, minimal words"
    }
}

PLATFORM_STYLES = {
    "tiktok": "casual, hook-first, 1-3 sentences, use trending phrases, max 150 words",
    "instagram": "slightly polished, can be 2-4 sentences, end with soft CTA, max 200 words",
    "youtube": "descriptive, keyword-rich for search, 1-2 sentences, max 100 words",
    "x": "punchy, under 280 characters, conversation-starter tone"
}

def generate_captions(client_key, platform, clip_descriptions, captions_per_clip=3):
    client = CLIENTS[client_key]
    style = PLATFORM_STYLES[platform]

    clips_text = "\n".join(
        f"{i+1}. {desc}" for i, desc in enumerate(clip_descriptions)
    )

    prompt = f"""You are the social media manager for {client['name']}, a {client['description']}.

Brand voice: {client['voice']}
Platform: {platform}
Platform style: {style}

Generate {captions_per_clip} unique captions for each clip below. Each caption must be genuinely different — not word swaps. Do not include hashtags.

Clips:
{clips_text}

Output format (strict):
CLIP 1:
A: ...
B: ...
C: ...

CLIP 2:
A: ...
B: ...
C: ...
"""

    api_client = anthropic.Anthropic()  # Uses ANTHROPIC_API_KEY env var

    message = api_client.messages.create(
        model="claude-sonnet-4-20250514",  # Fast + cheap for captions
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )

    return message.content[0].text

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate social media captions")
    parser.add_argument("--client", required=True, choices=CLIENTS.keys())
    parser.add_argument("--platform", required=True, choices=PLATFORM_STYLES.keys())
    parser.add_argument("--clips", required=True, help="Text file with one clip description per line")
    parser.add_argument("--per-clip", type=int, default=3, help="Captions per clip (default: 3)")

    args = parser.parse_args()

    with open(args.clips) as f:
        descriptions = [line.strip() for line in f if line.strip()]

    result = generate_captions(args.client, args.platform, descriptions, args.per_clip)
    print(result)
```

**Usage:**
```bash
# Create a clips file (one description per line)
cat > today_clips.txt << 'EOF'
Sean rage-quits after getting sniped from across the map
Insane 1v4 clutch in the final circle
Funny moment where Sean accidentally kills his own teammate
EOF

# Generate captions for each platform
python captions.py --client clienta --platform tiktok --clips today_clips.txt
python captions.py --client clienta --platform instagram --clips today_clips.txt
python captions.py --client clienta --platform youtube --clips today_clips.txt
python captions.py --client clienta --platform x --clips today_clips.txt
```

**Cost estimate:** Claude Sonnet at $3/$15 per million input/output tokens. 20 clips x 4 platforms = 80 captions. That is roughly 2,000 input tokens + 4,000 output tokens per run = ~$0.07 per client per day. Under $7/month for 3 clients.

**Option C: Google Sheets + Claude (middle ground)**

If you want to avoid code entirely:
1. Create a Google Sheet with columns: Clip #, Description, TikTok Caption, IG Caption, YT Caption, X Caption
2. Fill in the Description column (1 sentence per clip)
3. Copy all descriptions, paste into Claude chat with the prompt template
4. Paste the generated captions back into the sheet
5. Copy from the sheet into Later

This keeps everything organized and creates a log of all captions generated.

### Caption Template Library (Pre-Built, No AI Needed)

For filler clips where unique creative captions aren't critical, use fill-in-the-blank templates:

**TikTok Templates:**
```
1. "wait for it... {key_moment} [fire emoji]"
2. "{client} really just did that [skull emoji]"
3. "no way {client} {action} [shocked emoji]"
4. "POV: you're watching {client} {action}"
5. "this is why we watch {client} [fire emoji]"
6. "{action} hits different at {time_of_day}"
7. "tell me {client} isn't the goat [goat emoji]"
8. "bro really said '{quote_from_clip}' [dead emoji]"
9. "the way {client} {action} tho..."
10. "if you know you know. {one_word_hint}"
```

**Instagram Templates:**
```
1. "{client} showing why {superlative}. Link in bio for more."
2. "Caught this moment live. {brief_description}. Who else saw it?"
3. "{action} energy. Drop a [emoji] if you relate."
4. "This {client} clip is everything. Save it."
5. "The moment everyone is talking about. {brief_description}."
```

These templates take 10-15 seconds per caption instead of 60+ seconds of original writing.

---

## 5. Template Workflows — How High-Volume Agencies Operate

### The 50+ Posts/Day Agency Model

Agencies producing 50+ posts daily use a fundamentally different workflow than what a solo creator uses. Here is how they structure it:

**Tier 1: Content Production Assembly Line**

```
ROLE 1: Intake Manager (or automation)
  - Receives raw content from clients
  - Pre-processes (segments, normalizes, organizes)
  - Tags content by client, type, priority

ROLE 2: Clipping/Editing (AI tools + junior editors)
  - AI generates first-pass clips
  - Junior editors review and polish
  - Senior editor (Sean's role) approves hero clips only

ROLE 3: Caption Writer (AI + human review)
  - AI generates caption variants
  - Writer reviews and adjusts brand voice
  - Hashtag sets are pre-built and rotated

ROLE 4: Scheduler (dedicated person or CSV bulk upload)
  - Bulk uploads via CSV to scheduling tool
  - Uses auto-scheduling for optimal times
  - Manages content calendar across all clients
```

For Sean as a solo operator, the takeaway is to **batch by task type, not by client.** Do all pre-segmentation at once, then all Submagic uploads, then all reviews, then all caption generation, then all scheduling. This minimizes context-switching.

### CSV Bulk Scheduling (The Agency Secret)

High-volume agencies don't schedule posts one-by-one in Later or any other tool. They generate a CSV and bulk-upload.

**Metricool CSV format (example):**
```csv
Date,Time,Platform,Account,Text,Media URL,Hashtags
2026-02-16,14:00,tiktok,@clienta_clips,wait for it... insane clutch,/path/to/clip1.mp4,#gaming #clutch
2026-02-16,14:30,instagram,@clienta_reels,Caught this live. The clutch everyone is talking about.,/path/to/clip1.mp4,#gaming #reels
2026-02-16,15:00,tiktok,@clienta_clips,bro really just did that,/path/to/clip2.mp4,#gaming #streamer
```

**Workflow with CSV bulk scheduling:**
1. Generate all captions using Claude (2-3 min)
2. Paste into a pre-formatted Google Sheet template
3. Export as CSV
4. Bulk upload to scheduling tool
5. Review in visual calendar

**Time for 20 clips across 4 platforms: 10-15 min** vs 25-35 min with manual Later scheduling.

**Tools that support CSV bulk upload:**
- **Metricool** ($49/mo for 15 brands) — CSV + Google Drive import, recommended up to 50 posts per file
- **Cloud Campaign** (agency-focused) — CSV bulk upload with captions, hashtags, and scheduling
- **SocialPilot** ($42.50/mo) — CSV bulk scheduling with AI caption suggestions
- **Publer** (~$190/mo) — API-based, supports 500-post bulk requests

**Note:** Later does NOT support CSV bulk upload on its current plans. If CSV bulk scheduling becomes critical (likely at 3+ clients), switching from Later to Metricool or Cloud Campaign would be the single biggest time-saver. Metricool at $49/mo vs Later at $80/mo is also cheaper.

### Notion/Airtable Content Tracker (Optional, Week 2)

If Sean wants a single dashboard tracking all clients' content status:

**Minimal Notion board:**
```
Columns: Client | Date | Source Video | Segments | Clips Generated | Hero Approved | Filler Approved | Scheduled | Posted
Status: [Waiting] [Processing] [Review] [Scheduled] [Live]
```

This takes 10 minutes to set up in Notion and gives Sean a bird's-eye view across all clients. At 1-2 clients, it is unnecessary. At 3+, it prevents things from falling through cracks.

---

## 6. Content Calendar & 3-5 Day Buffer

### Buffer Maintenance System

The plan already specifies maintaining 3-5 days of pre-scheduled content. Here is the concrete system for doing it:

**Thursday "Buffer Day" Routine:**

```
THURSDAY ROUTINE (add 30-45 min to normal workflow)

1. Check each client's Later calendar:
   - Count scheduled posts through the following Wednesday
   - Target: minimum 3 business days of content queued

2. If buffer is thin (< 3 days):
   - Pull from "evergreen backlog" (see below)
   - Generate captions for backlog clips
   - Schedule to fill gaps through Wednesday

3. If buffer is healthy (3-5 days):
   - No extra work needed
   - Note it in the client tracker
```

**Evergreen Backlog Strategy:**

Maintain a folder per client called `backlog/` in Google Drive:
- Every time Submagic generates clips, save 3-5 extra filler clips that are decent but didn't make the daily cut
- These are "timeless" clips — nothing time-sensitive or reactive
- Label them: `clienta_backlog_001.mp4`, `clienta_backlog_002.mp4`, etc.
- Aim to accumulate 15-20 backlog clips per client within the first 2 weeks

When Sean is sick, traveling, or a client sends no new content:
1. Pull 5-8 clips from backlog
2. Generate captions via Claude
3. Schedule in Later
4. Buffer restored in 15-20 min

### Content Calendar Template (Per Client)

```
MONDAY    - Standard daily batch (15-20 clips from fresh content)
TUESDAY   - Standard daily batch
WEDNESDAY - Standard daily batch
THURSDAY  - Standard daily batch + buffer check + backlog scheduling
FRIDAY    - Standard daily batch + pre-schedule Saturday/Sunday content
SATURDAY  - PRE-SCHEDULED (no active work)
SUNDAY    - PRE-SCHEDULED (no active work)
```

**Friday pre-scheduling for weekends:**
- Schedule 10-15 filler clips per platform for Saturday and Sunday
- Use backlog clips if Friday's fresh content is insufficient
- This takes an extra 15-20 min on Fridays but buys complete weekends off

### Multi-Client Calendar Coordination

Avoid scheduling the same time slots across clients if they share an audience:

```
CLIENT A: TikTok posts at :00 and :30 past the hour
CLIENT B: TikTok posts at :15 and :45 past the hour
CLIENT C: TikTok posts at :10 and :40 past the hour
```

Use Later's "Best Time to Post" suggestions per account — the tool already handles this. Just verify no collisions.

---

## 7. Time Tracking

### Recommendation: Toggl Track (Free Plan)

**Why Toggl over Clockify:** Simpler interface, one-click start/stop, no surveillance features. The free plan supports 5 users and unlimited projects — more than enough for solo use.

**Setup (10 minutes):**

1. Create account at toggl.com
2. Create 3 projects: `Client A`, `Client B`, `Client C`
3. Create 5 task tags:
   - `pre-processing` (FFmpeg, uploads)
   - `review` (Submagic clip review)
   - `editing` (CapCut work)
   - `scheduling` (Later/caption writing)
   - `admin` (reporting, communication)

**Daily usage:**
- Start timer when you begin working on a client
- Switch task tag when you switch activities
- Stop timer when done
- Takes literally 2 seconds per switch (one click)

**Weekly review (5 min on Fridays):**
- Open Toggl Reports
- Check: time per client, time per task type
- Identify bottleneck: which task takes the most time?
- Track against the plan's success metric: < 75 min per client (goal: < 45 min)

### Alternative: Clockify (Free, Unlimited)

If Toggl's 5-user limit ever matters, or if you want invoicing built in, Clockify is the better free option. Same workflow, slightly busier interface.

### Simplest Option: Apple Shortcuts Timer

If even Toggl feels like overhead, create an Apple Shortcut on iPhone:
1. Shortcut: "Start Client A" — logs current time to a Note
2. Shortcut: "Stop" — logs current time, calculates duration, appends to the same Note
3. Review the Note weekly

This is the absolute minimum viable time tracking. No app, no account, 5-second setup.

---

## 8. Submagic Automation (Future — Week 3+)

### Google Drive -> Submagic -> Google Drive Automation

When Sean is ready to add automation (past 3 clients or 3+ hours daily), the n8n workflow template provides a ready-made pipeline:

**n8n Workflow (Free self-hosted, or $20/mo cloud):**
1. **Google Drive Trigger** — watches a specific folder for new video uploads
2. **HTTP Request** — sends video URL to Submagic API (`POST https://api.submagic.co/v1/projects`)
3. **Wait Loop** — polls Submagic status every 2 minutes until processing is complete
4. **Download** — retrieves the captioned/clipped video
5. **Google Drive Upload** — saves finished clips to an output folder

**Pre-built templates available at:**
- n8n.io/workflows/7730 — Google Drive + Submagic auto-caption
- n8n.io/workflows/7992 — Google Drive + Submagic + OpenAI + auto-post to Instagram/TikTok

This means Sean's only manual step becomes: review and approve clips. Everything else (upload, process, download, organize) runs automatically.

**Make.com equivalent:** The plan already documents a 3-scenario Make.com architecture. Both n8n and Make.com work; n8n is cheaper (free self-hosted) and more flexible; Make.com is easier for non-technical users.

---

## 9. Week 1-2 Implementation Checklist

### Day 1 (30 min setup)
- [ ] Set up browser tab organization (pinned tabs: Submagic x3, Later, CapCut, TikTok Creative Center, Drive)
- [ ] Create pre-built hashtag sets in Later for each client (4 per client: TikTok, IG, YT, X)
- [ ] Start interleaved pipeline workflow (upload all segments first, then review)
- [ ] Sign up for Toggl Track, create projects and tags
- [ ] Start tracking daily time per client

### Day 2-3 (45 min setup)
- [ ] Save `process.sh` script to `~/Post/scripts/`
- [ ] Make it executable: `chmod +x ~/Post/scripts/process.sh`
- [ ] Test on a real client video
- [ ] Add zshrc aliases (`postsplit`, `postthumb`, `postsound`, `postnorm`)
- [ ] Test FFmpeg sound overlay on one hero clip — compare quality to CapCut

### Day 3-5 (30 min setup)
- [ ] Test Claude caption generation with one client's clips (use claude.ai chat first)
- [ ] Build caption template library (10 TikTok, 5 Instagram, 5 YouTube, 5 X templates)
- [ ] If captions are good, set up the Python script for faster batch generation
- [ ] Create evergreen backlog folders per client in Google Drive

### Day 5-7 (ongoing)
- [ ] Build up evergreen backlog (save 3-5 extra filler clips per client per day)
- [ ] Establish Thursday buffer check routine
- [ ] Establish Friday weekend pre-scheduling routine

### Day 7-14 (evaluate)
- [ ] Review Toggl data: what is actual time per client?
- [ ] Compare against baseline (50-75 min per client)
- [ ] Identify remaining bottleneck (likely Later scheduling if not using CSV)
- [ ] If Later scheduling is still > 15 min per client, evaluate Metricool or Cloud Campaign for CSV bulk upload
- [ ] Adjust workflow based on data

### Target After Week 2

| Metric | Before | After | How |
|--------|--------|-------|-----|
| Time per client | 50-75 min | 25-40 min | All optimizations combined |
| Daily time (3 clients) | 150-225 min | 75-120 min | Parallel processing + AI captions |
| Scaling wall | 4 clients | 5-6 clients | Before hitting 3-hour daily ceiling |
| Caption writing time | 15-20 min/client | 2-5 min/client | Claude + templates |
| CapCut time | 9-25 min/client | 0-10 min/client | FFmpeg sound overlay for simple cases |
| Dead waiting time | 30-60 min/day | 0 min | Interleaved pipeline |

---

## Sources

### FFmpeg
- [ffmpeg-normalize (GitHub)](https://github.com/slhck/ffmpeg-normalize) — Audio normalization for Python/FFmpeg
- [FFmpeg Batch AV Converter](https://ffmpeg-batch.sourceforge.io/) — GUI batch processing
- [Complete FFmpeg Tutorial 2025](https://dawid.ai/complete-ffmpeg-tutorial-and-reference-manual-2025/)
- [Splitting Video with FFmpeg (2026 Guide)](https://filme.imyfone.com/video-editing-tips/splitting-video-with-ffmpeg/)
- [FFmpeg Split Video Into Chunks](https://blog.programster.org/ffmpeg-split-video-into-chunks)

### Submagic
- [Submagic Batch Video Editing](https://www.submagic.co/blog/batch-video-editing)
- [Submagic Make.com Automation](https://www.submagic.co/blog/how-to-automate-video-creation-with-make-com)
- [Submagic API Documentation](https://care.submagic.co/en/article/how-to-use-submagics-api-jbyav2/)
- [Submagic Integrations](https://www.submagic.co/integrations)

### n8n Workflow Templates
- [Auto-caption videos with Google Drive + Submagic (n8n)](https://n8n.io/workflows/7730-auto-caption-videos-for-instagramtiktok-with-google-drive-and-submagic/)
- [Auto-caption + post with Submagic + Postiz + OpenAI (n8n)](https://n8n.io/workflows/7992-auto-caption-and-post-videos-to-instagram-and-tiktok-with-submagic-postiz-and-openai/)

### CapCut Shortcuts
- [CapCut Keyboard Shortcuts Cheat Sheet](https://www.benclaremont.com/capcutshortcuts)
- [Mastering CapCut Pro Shortcuts](https://michaelshatravka.com/mastering-capcut-pro-the-ultimate-keyboard-shortcuts-guide-to-skyrocket-your-editing-speed/)
- [CapCut Shortcuts for Faster Editing (2025)](https://droidcrunch.com/keyboard-shortcuts-for-capcut/)

### Scheduling & Agencies
- [Social Media Content Creation Workflows 2025 (300% Output Increase)](https://socialrails.com/blog/social-media-content-creation-workflows)
- [How to Create Social Media SOPs for Your Agency](https://vistasocial.com/insights/social-media-sop)
- [Social Media Management Workflow 2026 Template (Metricool)](https://metricool.com/social-media-workflow/)
- [Metricool CSV Bulk Upload](https://metricool.com/import-csv-for-scheduling/)
- [Cloud Campaign Scheduling Platform](https://www.cloudcampaign.com/tools/social-media-scheduling)
- [Best Social Media Automation Tools 2026](https://www.gumloop.com/blog/best-social-media-automation-tools)

### Caption Generation
- [Claude API Batch Processing Docs](https://platform.claude.com/docs/en/build-with-claude/batch-processing)
- [ChatGPT Prompts for Social Media (Castmagic)](https://www.castmagic.io/post/chatgpt-prompts-for-social-media)
- [ChatGPT for Social Media (Hootsuite)](https://blog.hootsuite.com/chatgpt-social-media/)
- [CaptionAI by Cloud Campaign](https://www.cloudcampaign.com/tools/captionai)

### Time Tracking
- [Toggl Track](https://toggl.com/) — Simple time tracking, free for 5 users
- [Clockify vs Toggl Comparison](https://thebusinessdive.com/toggl-vs-clockify)
- [Later Social Media Scheduler Review 2025](https://www.fahimai.com/later-social-media-scheduler)

### Content Calendar & Agency Operations
- [Social Media Content Calendar Guide (Captogen)](https://captogen.com/blog/social-media-content-calendar-guide)
- [Digital Marketing Agency Workflow 2025](https://digitalagencynetwork.com/create-a-digital-marketing-agency-workflow-that-grows-with-your-business/)
- [Notion Social Media Agency Templates](https://www.notion.com/templates/social-media-management-for-agencies)
