# /slideshow — Generate & Post a TikTok/Instagram Slideshow

Usage: `/slideshow <platform> <account> <topic>`

Examples:
- `/slideshow tiktok @asspizza2026 Nettspend drops Early Life Crisis`
- `/slideshow instagram @asspizza2026 Who ran 2016 streetwear`
- `/slideshow tiktok @asspizza2026` (then ask for topic)

## Arguments

Parse the user's input after `/slideshow`:
1. **Platform**: `tiktok` or `instagram` (required)
2. **Account**: The @ handle to post to (required)
3. **Topic**: Everything after the account handle (if missing, ask: "What's the topic?")

## Account Registry

Known accounts and their Postiz integration IDs:

| Account | Platform | Integration ID |
|---------|----------|---------------|
| @asspizza2026 | TikTok | cmlvcz31x00lxny0yex5bsi0v |

If the account isn't in this table, tell Sean: "I don't have that account connected yet. Add it in Postiz first, then I'll update the registry."

## Workflow

### Step 1: Generate Slides on EC2

SSH into the server and run the generation script:

```bash
ssh -i ~/Downloads/openclaw-key.pem ubuntu@3.239.100.180 'node ~/.openclaw/workspace/skills/larry/scripts/generate-rap-news.js "TOPIC HERE"'
```

Parse the catbox.moe URLs from the output. You need 6 URLs (or however many succeeded).

### Step 2: Send to Sean's WhatsApp for Approval

SSH into EC2 and send each slide via OpenClaw:

```bash
ssh -i ~/Downloads/openclaw-key.pem ubuntu@3.239.100.180 'npx openclaw message send --channel whatsapp --target "+13106254899" --message "Slide N" --media CATBOX_URL'
```

Send all slides, then send a suggested caption:

```bash
ssh -i ~/Downloads/openclaw-key.pem ubuntu@3.239.100.180 'npx openclaw message send --channel whatsapp --target "+13106254899" --message "CAPTION TEXT"'
```

### Caption Rules
- Lowercase, casual tone
- Under 150 chars + 4-5 hashtags
- No promotional language ("go stream", "support")
- End with a question to drive comments
- Example: "nettspend just dropped early life crisis... this might change everything. thoughts? #nettspend #rapnews #hiphop #newmusic #fyp"

### Step 3: Ask Sean for Approval

Use AskUserQuestion:
- **"Post this to [platform] @[account]?"**
  - "Post it" — proceed to Step 4
  - "Change caption" — ask for new caption, then re-ask
  - "Redo slides" — go back to Step 1 with same topic
  - "Cancel" — stop

### Step 4: Post via Postiz

Upload each image to Postiz and create the post.

```bash
# Upload each image
POSTIZ_API_KEY=e964c2e49e94fa7d870c1f94f4327d875c135c6b73d9ab9ba02e745da6872408 npx postiz upload <downloaded_file>
```

For each catbox URL, download locally first, then upload to Postiz:
```bash
curl -s -o /tmp/slide_N.png "CATBOX_URL"
POSTIZ_API_KEY=e964c2e49e94fa7d870c1f94f4327d875c135c6b73d9ab9ba02e745da6872408 npx postiz upload /tmp/slide_N.png
```

Then create the post with ALL Postiz media URLs:

```bash
POSTIZ_API_KEY=e964c2e49e94fa7d870c1f94f4327d875c135c6b73d9ab9ba02e745da6872408 npx postiz posts:create \
  -c "CAPTION WITH HASHTAGS" \
  -m "postiz_url1,postiz_url2,postiz_url3,postiz_url4,postiz_url5,postiz_url6" \
  --settings '{"privacy_level":"PUBLIC_TO_EVERYONE","duet":true,"stitch":true,"comment":true,"autoAddMusic":"yes","brand_content_toggle":false,"brand_organic_toggle":false,"content_posting_method":"DIRECT_POST"}' \
  -i "INTEGRATION_ID_FROM_REGISTRY"
```

### Step 5: Confirm

Tell Sean: "Posted to [platform] @[account]. Check it out!"

Track the post in CLAUDE.md under "Published Posts" with date, topic, and type.

## Post Types

If Sean says "use real photos" or "curated" — this is a HYBRID post:
- Generate only 2 AI title cards (Virgil Abloh style: Helvetica Bold, minimal, diagonal accent)
- Find 4 real photos via web search, download them
- Combine: title cards + real photos = 6 slides

Default is full AI (6 generated slides) unless Sean says otherwise.

## Important Rules

- ALWAYS send to WhatsApp first for approval — NEVER post directly without Sean seeing it
- Title cards should be Virgil Abloh style: Helvetica Bold, black/white, clean, diagonal orange stripe
- Keep it fast — generate, show, approve, post
- If generation fails, tell Sean and offer to retry
- OpenAI blocks celebrity names in photo-realistic prompts — only use names in text/graphic slides
