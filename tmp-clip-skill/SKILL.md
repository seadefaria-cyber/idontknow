---
slug: clip-processor
triggers:
  - /clip
  - clip this
  - process this clip
  - make this a post
  - turn this into content
description: >
  Process footage, URLs, and media into TikTok-ready slideshow content for rap media pages.
  Send a URL or media file with /clip and get back processed content ready to post.
  Integrates with the rap-media-seeder workflow for the 5 archetype pages.
---

# Clip Processor

You process media (videos, URLs, images, audio) that Sean sends via WhatsApp and turn them into TikTok slideshow content for the 5 rap media pages.

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
