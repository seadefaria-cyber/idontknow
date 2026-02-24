# Asspizza (Austin Babbitt) — Clipping Style Guide

**Created:** 2026-02-17
**Status:** In Progress (first run)

---

## Client Info

- **Name:** asspizza (Austin Babbitt)
- **Known for:** Fashion, brand building, pizza-themed streetwear, creative entrepreneurship
- **Content angle:** Brand-focused, motivational, controversial, entrepreneurial

---

## Caption Style

Same as Nettspend style guide (see `clients/nettspend/clipping-style.md`):
- Montserrat Bold floating text, auto-contrast
- Thin 2px outline for readability (NO outline on emojis)
- Apple-native aesthetic
- Hook captions that create tension/curiosity

---

## Sound Strategy

- **NO embedded music.** Use TikTok's `autoAddMusic: "yes"` setting so TikTok adds a trending sound automatically.
- Interview audio is primary — TikTok adds subtle background music on its own.

---

## Caption Style (Refined 2026-02-23)

Two separate text layers:

1. **Hook caption (text overlay):** White text, black outline, Montserrat Bold 36px, ON the video at ~55% Y. This is the rage-bait/clickbait hook.
2. **Speech subtitles:** Yellow text (`&H0000FFFF`), Montserrat 22px, black outline, in the BLACK BAR below the video (MarginV=350). These are the actual spoken words as ASS subtitles.

---

## Platform Accounts

### Postiz (NOT Later.com)
- **TikTok:** asspizza2026 (Postiz ID: `cmlvcz31x00lxny0yex5bsi0v`)
- **Instagram:** asspizza2026 (NOT CONNECTED to Postiz as of 2026-02-23)

### Postiz API Key
`e964c2e49e94fa7d870c1f94f4327d875c135c6b73d9ab9ba02e745da6872408`

---

## Content Schedule

- Post every **12 hours**
- Auto-publish enabled
- TikTok autoAddMusic enabled

---

## Video Processing

- **Crop for podcast/stream clips:** `crop=1350:850:0:80` (tighter framing on speakers)
- **Output:** 1080x1920 (9:16), H.264, CRF 18
- **Transcription:** mlx-whisper large-v3-turbo with word timestamps

---

## Source Content

- MITCH MODES STREAM: https://www.youtube.com/watch?v=eUSY22T_Rtw (2:14:21)
- Downloaded to: `clips/raw/asspizza_mitch_modes.mp4`
