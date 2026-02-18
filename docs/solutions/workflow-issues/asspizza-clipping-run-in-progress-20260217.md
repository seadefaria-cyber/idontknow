---
module: Social Media Automation
date: 2026-02-17
problem_type: workflow_issue
component: tooling
symptoms:
  - "Asspizza clipping run in progress — need to resume from Whisper transcription step"
  - "Full pipeline partially complete: download, sounds, Later setup done; transcription and clip generation pending"
root_cause: incomplete_setup
severity: high
tags: [asspizza, clipping-run, whisper, later-com, playboi-carti, mitch-modes, in-progress]
---

# Asspizza Clipping Run — In-Progress State (Resume Here)

## Overview

Full clipping run for new client **asspizza (Austin Babbitt)** from the "MITCH MODES STREAM" interview (2hr14min). This document captures the exact state so any session can resume.

## Client Details

- **Client:** asspizza (Austin Babbitt) — fashion/brand personality
- **Source video:** https://www.youtube.com/watch?v=eUSY22T_Rtw
- **Stream title:** MITCH MODES STREAM (2:14:21)
- **Content type:** Brand-focused, motivational interview
- **Goal:** 20 most viral, controversial, motivational clips

## Pipeline State

### COMPLETED

1. **Stream downloaded** — `clips/raw/asspizza_mitch_modes.mp4` (644 MB, 1080p)
2. **10 Playboi Carti sounds downloaded** to `clips/sounds/carti/`:
   - Sky, Magnolia, Evil Jordan, Crush, Rather Lie, Long Time, RIP, Toxic, Backdoor, Mojo Jojo
   - Sound volume: **15%** (background, interview audio is primary)
3. **Emoji outline bug fixed** in `clips/make_clip.py` — emojis now render clean without outline artifacts (added `strip_emojis()` function to remove emojis from outline pass)
4. **Later.com session info captured:**
   - Group ID: `9JJW1`
   - TikTok profile: `asspizza2026` (ID: 9987534)
   - Instagram profile: `asspizza2026` (ID: 9987533)
   - CSRF token: Will need to be re-grabbed (expires after 24-48 hours)

### IN PROGRESS

5. **Whisper transcription** — Running with `base` model on CPU
   - Command: `whisper clips/raw/asspizza_mitch_modes.mp4 --model base --language en --output_format all --output_dir clips/raw/`
   - Output files will appear in `clips/raw/` as `asspizza_mitch_modes.txt`, `.srt`, `.vtt`, `.json`, `.tsv`
   - Check if process is still running: `ps aux | grep whisper`
   - If done, output files exist: `ls clips/raw/asspizza_mitch_modes.txt`
   - If process died, restart: `source clips/.venv/bin/activate && whisper clips/raw/asspizza_mitch_modes.mp4 --model base --language en --output_format all --output_dir clips/raw/`

### NOT STARTED

6. **Identify 20 viral moments** from transcript — Look for:
   - Controversial statements
   - Motivational/inspirational quotes
   - Funny/quotable moments
   - Brand philosophy insights
   - Moments that create tension/curiosity (hook-worthy)

7. **Generate 20 clips** using `clips/make_clip.py` + `clips/batch_gq_interview.py` pattern:
   - Montserrat Bold floating hook captions (same style as Nettspend)
   - Yellow CapCut-style speech subtitles (ASS format)
   - Playboi Carti sound at 15% volume (rotate through 10 tracks)
   - No emoji outline (bug fixed)
   - Output to `clips/output/`

8. **User reviews clips** — Present all 20, user approves/rejects

9. **Schedule on Later every 8 hours** — Hybrid approach:
   - TikTok (asspizza2026, ID 9987534): Direct API via `POST /api/v2/grams`
   - Instagram (asspizza2026, ID 9987533): Chrome UI automation (AppleScript + JS injection)
   - Spacing: Every 8 hours
   - Auto-publish enabled

## Caption Style

Same as Nettspend (see `clients/nettspend/clipping-style.md`):
- Montserrat Bold floating text, auto-contrast
- Rage-bait/hook energy — create tension, never resolve it
- Apple-native aesthetic
- Each caption should make someone NEED to watch
- Clip length: 5-25 seconds preferred, story dictates length

## Key Files

- `clips/raw/asspizza_mitch_modes.mp4` — Source stream
- `clips/sounds/carti/` — 10 Carti background tracks
- `clips/make_clip.py` — Clip generation script (emoji fix applied)
- `clips/batch_gq_interview.py` — Reference batch script (copy this pattern)
- `clips/schedule_all.py` — TikTok API scheduler (reference)
- `clips/schedule_ig.py` — Instagram UI automation scheduler (reference)
- `clients/nettspend/clipping-style.md` — Caption style guide (applies to asspizza too)

## Later API Reference

See `docs/solutions/integration-issues/later-instagram-reels-hybrid-approach-20260216.md` for full Later API docs and the hybrid scheduling approach.

## Related Documentation

- [Later Instagram Reels Hybrid Approach](../integration-issues/later-instagram-reels-hybrid-approach-20260216.md)
- [Nettspend Clipping Style Guide](../../clients/nettspend/clipping-style.md)
- [Batch GQ Interview Script](../../clips/batch_gq_interview.py)
