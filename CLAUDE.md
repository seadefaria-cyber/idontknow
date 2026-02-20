# Project: idontknow

## Repository Setup

This project uses **git worktrees** for parallel development across multiple terminals:

- `/Users/seandefaria/idontknow` - Main repo (branch: `main`)
- `/Users/seandefaria/idontknow-1` - Worktree 1 (branch: `wt-1`)
- `/Users/seandefaria/idontknow-2` - Worktree 2 (branch: `wt-2`)
- `/Users/seandefaria/idontknow-3` - Worktree 3 (branch: `wt-3`)
- `/Users/seandefaria/idontknow-4` - Worktree 4 (branch: `wt-4`)

## Git Workflow

- The user is NOT experienced with git. Never assume git knowledge.
- Use `/save` to save work from any worktree and merge it into main.
- Always explain what git operations are doing in plain language.
- Never force-push, reset --hard, or do destructive git operations without explicit confirmation.

## Before Building Anything

Before starting any build/implementation work (Step 3: workflows:work), state your success criteria:
> **"I'll know I'm done when: [concrete, testable criteria]"**

Get user confirmation on the criteria before writing code. This prevents scope creep and gives a clear finish line.

## Browser Automation (agent-browser)

Claude can control a real browser using `agent-browser`. This is already installed and ready to use.

### Quick Start — Use This Every Time

```bash
# Launch browser (headed, persistent profile, logged into Sean's Google account)
agent-browser --headed --profile "$HOME/.chrome-agent-profile" --args "--disable-blink-features=AutomationControlled" --user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36" open "<URL>"
```

### Key Facts

- **Profile location**: `~/.chrome-agent-profile` — persistent, remembers logins between sessions
- **Google account**: Already logged in as Sean DeFaria (seadefaria@gmail.com)
- **MUST use these flags** or Google/other sites will block you as a bot:
  - `--args "--disable-blink-features=AutomationControlled"` — hides automation detection
  - `--user-agent "Mozilla/5.0 ..."` — uses a real Chrome user-agent string
- **Always use `--headed`** so Sean can see what's happening
- **Do NOT try to use Sean's real Chrome via CDP** — macOS blocks remote debugging on the default profile. The persistent profile approach is the solution.

### Common Commands

```bash
agent-browser open <url>                    # Navigate to URL
agent-browser click "<selector>"            # Click element
agent-browser fill "<selector>" "text"      # Fill input field
agent-browser screenshot /tmp/shot.png      # Take screenshot
agent-browser snapshot -ic                  # Get page structure (for finding elements)
agent-browser get text "<selector>"         # Read text from element
agent-browser press Enter                   # Press keyboard key
agent-browser scroll down 500               # Scroll
agent-browser close                         # Close browser session
```

### If Browser Is Already Running From Another Terminal

```bash
# Check if a session is already active — just use commands directly
agent-browser screenshot /tmp/check.png

# If you need to restart with correct flags, close first
agent-browser close
# Then relaunch with the full command above
```

### Troubleshooting

- **"daemon already running"** → Run `agent-browser close` first, then relaunch
- **Google blocks sign-in** → You forgot the anti-detection flags. Close and relaunch with full command.
- **Session lost** → The profile at `~/.chrome-agent-profile` persists. Just relaunch and logins should still be there.

## Clip Workflow (Underground Rap Content)

This is the core content system. Sean runs fan pages for underground rap (primarily Nettspend). Full style guide: `clients/nettspend/clipping-style.md` — READ IT BEFORE EVERY CLIP.

### Visual Style — LOCKED (never change these)

- **Text overlay:** White bold text + thick black outline (5px). Montserrat Bold, 44px. NO background pill/rectangle. NO auto-contrast — ALWAYS white on black outline.
- **Emojis:** Clean Apple emojis after caption text (no outline artifacts). Strip emojis from outline rendering pass.
- **Title duration:** Appears immediately, disappears after 6 seconds (`--text-duration 6`).
- **Speech captions:** ASS subtitles, ALL CAPS, font 32, white text with yellow karaoke word highlighting (`\kf` tags), MarginL=MarginR=200, MarginV=440. Must never hit TikTok side buttons.
- **Zoom:** ALWAYS 10% slow zoom-in (`--zoom 10`). Every clip. No exceptions.
- **Reference account:** 730.archive on TikTok — that's the visual standard.

### Default Pipeline Command

```bash
python3 clips/make_clip.py <FULL_ABSOLUTE_PATH> "<caption 💀>" \
  --start <start> --end <end> \
  --style light --text-duration 6 --zoom 10 \
  --subs <FULL_ABSOLUTE_PATH_subs.ass> \
  -o <output_name>
```

**Always use absolute paths** (relative paths break trimming).

### Sound Rules

- **Regular clips:** Nettspend tracks from `clips/sounds/`, volume 15-20%
- **Hopecore/motivational:** Soft instrumentals only (piano, strings, no vocals). Or no added sound if original audio is good. NEVER Nettspend songs on hopecore.
- **Score the sound to the emotional arc** — feel the clip, place the sound like lyrics.

### Caption Voice

- Create tension, never resolve it. The caption opens a loop only the footage can close.
- Conversational tone, how people actually talk. Add rage-bait emojis that REACT to the phrase.
- Never make the artist look bad — we're on Nettspend's side.
- 1-2 lines max. Never give away the ending.

### Accounts (7 total)

- **TikTok:** nettspend.clips7, nettspend590, nettspend.clips0
- **Instagram:** rapnews.world, nettspend.world
- **X:** NettspendWorld_, NettSpendNews_

### Performance Tracking

Log every clip to `clips/clip_log.csv` after posting. Review weekly to double down on winning formulas.

### Lessons Learned (Don't Repeat These Mistakes)

- **Generic captions kill clips.** "The Internet's Most Hated Rapper Has A Message For You" = 193 views. The caption MUST create an open loop — tension that only the footage can resolve. If the caption could describe any video, it's too generic.
- **Interview/sit-down footage is low-energy.** Someone talking to a camera doesn't stop the scroll. Unless the moment is genuinely wild (crazy quote, controversial take, emotional reaction), pick high-energy footage: live performances, behind-the-scenes chaos, street encounters.
- **Captions must not overlap TikTok UI.** Font sizes were too big and margins too tight. Fixed: title font 38px (was 44), speech subs font 32px (was 38), side margins 200px (was 120). Always preview before posting.
- **No shares = algorithm death.** Before posting, gut-check: "Would someone send this to a friend?" If the answer isn't obviously yes, rework the caption or pick different footage.
- **Hook in frame 1.** The most intense or confusing moment should be the very first thing people see. Don't build up to it.

## Invoicing

- Business name: **DeFaria NYC** (Sean DeFaria, Sole Proprietor)
- Address: 188 Scholes St., Brooklyn, NY 11206
- Phone: 310 625 4899
- Email: seadefaria@gmail.com
- Invoice template: `invoices/invoice_virginia_stream.html` (use as base template)
- Template style: Clean black & white, Inter font, 2-column (Description + Amount), black project bar, no tax line
- No late fee clause — just "Net 30 Terms"
- No tax line on invoices — bill flat amounts
- Payment section has placeholder for bank details (user fills in manually)
- Invoice numbering: INV-2026-001, INV-2026-002, etc.
- Primary client: Clover New York / Interscope Records (NettSpend projects)
- PDFs exported via Chrome headless to `~/Desktop/invoices/`
- Don't charge sales tax on invoices — tax on equipment is Sean's cost, not billed to client
- Interscope will ask for a W-9 before paying (standard for payments over $600)
- Sean does NOT have an LLC yet — invoicing as sole proprietor is fine for now
- Old email was sean@asspizza.com — switched to seadefaria@gmail.com for invoicing
- Existing invoices:
  - `invoices/invoice_virginia_stream.html` — INV-2026-001, $6,500, NettSpend Richmond Virginia LiveStream
  - `invoices/invoice_nyc_early_crisis.html` — INV-2026-002, $1,215.77, NettSpend NYC Early Crisis Stream
  - `invoices/invoice_clover_interscope.html` — Original draft template (superseded by above)

## Media Brand: 2016vault

Sean is building a media company / video page for underground rap, inspired by KidsTakeOver, Your Multimedia, and Lyrical Lemonade.

- **Brand name:** 2016vault
- **Handle:** @2016vault (available on TikTok, Instagram, and X as of Feb 2026)
- **Concept:** Archival, exclusive underground rap content. "The vault" = rare, unreleased, premium. 2016 = the SoundCloud era that started it all (Carti, Uzi, Yachty, X, Ski Mask).
- **Positioning:** We found them before you did. Opening the vault on underground artists before they blow.

## Conventions

- When the user dictates instructions, interpret them generously - they are communicating verbally.
- Ask clarifying questions when requirements are ambiguous.
- Keep explanations simple and jargon-free.

## Site: defaria.nyc — Current State (Updated 2026-02-20, v53)

### Deployment Pipeline
1. Work on any worktree branch (wt-1 through wt-4)
2. `cd /Users/seandefaria/idontknow && git merge <branch> --no-edit`
3. `rsync -av --delete --exclude='.git' /Users/seandefaria/idontknow/site/ /tmp/defaria-pages/`
4. `cd /tmp/defaria-pages && git add -A && git commit -m "message" && git push origin main`
5. Trigger build: `gh api -X POST repos/seadefaria-cyber/seadefaria-cyber.github.io/pages/builds`
6. **CDN caches aggressively** — always bump `?v=N` on CSS/JS links in index.html when deploying CSS/JS changes

### Cache Busting
- Current version: `?v=53` on sections.css, responsive.css, and main.js
- **CRITICAL**: Every time you change CSS or JS, bump the version number in index.html or the CDN will serve stale files

### Site Architecture
- Pure static HTML/CSS/JS — no frameworks
- NYC MTA Subway design theme (Helvetica, colored subway circles, bold uppercase)
- Files: `site/index.html`, `site/css/{reset,variables,layout,components,sections,responsive}.css`, `site/js/{counter,main}.js`

### Current Sections (top to bottom)
1. **Nav** — "deFaria" logo (2.5rem, white glow on hover) + "Clipping Distribution Creative Agency" tagline that slides in on hover (blue/green/orange/white colored words). White nav links.
2. **Hero** — "We Know How It Works." headline (word-by-word). Twitch chat overlay (left), floating blue hearts/comments (right). "Start A Project" button (blue, turns green on hover).
3. **Clients** — 5 PNG logos in infinite 3-copy carousel: Interscope, Chris Heyn Show, Welcome JPEG, Asspizza, Clover NY. 24px height, 0.2 opacity, 25s scroll. Pauses on hover. Logos glow white + grow (scale 1.08) on hover. NO floating hearts.
4. **Showcase** — 3 phone mockups with scroll-linked video feeds. NO view counts. "500M+ Views Generated" orange counter fades to 0.15 opacity (not fully invisible). Mobile: 80vh, no dissolution, compact.
5. **Process** (#1 red bullet) — "How It Works" with blue underline + blue border-top on section. VERTICAL subway line, 4 stops: Meet, Study, Plan, Execute. Steps grow on hover (scale 1.04). Bots mentioned ONCE in Execute only.
6. **Stats** — Pink border-top. 3 items: Impressions Generated (10M+), Clips Deployed Monthly (3000+), Seeding Accounts Active (100+). overflow: visible (plus signs not cut off). NO emoji bursts.
7. **Services** (#2 orange bullet) — "How We Force It" — HORIZONTAL metro route with 3 colored stations. Consulting, Viral Clipping, Distribution.
8. **Creative** (#3 purple bullet) — "What Else We Offer" with orange underline + orange border-top. 3x2 grid with purple left borders. 5 items WITH descriptions. Mobile: tap-to-expand (hidden details by default).
9. **About Banner** — "We built the system." (white) + "Now we run it for you." (blue). Animated subway track (280px height).
10. **Contact** (#4 green bullet) — "Start A Project." with green glow animation on scroll. Form: Project Name, Name, Email, Message. "Get Started" button (white, turns green on hover). 6 social circles (TikTok, Instagram, YouTube, Twitch, X, Kik).
11. **CLIP. SEED. GROW.** — Three animated words (slash/bury/hearts animations).
12. **Footer** — deFaria logo (2.5rem) + always-visible tagline. Services + Contact links. White copyright (400 weight). "Located in New York City" subtext.

### Client Logo Files (PNG, white on transparent)
- `site/img/clients/interscope.png` — Interscope Records logo (68x100)
- `site/img/clients/chrisheyn.png` — Broadcast wave "C" + "The Chris Heyn Show" text (116x100)
- `site/img/clients/welcomejpeg.png` — Smiley/wow design (114x100)
- `site/img/clients/asspizza.png` — Star with smiley face (103x100, processed from black-on-white original)
- `site/img/clients/clover.png` — Dot pattern logo (100x100)
- Source logos saved at: `/Users/seandefaria/Desktop/LOGOS/`

### Design Decisions / Sensitivities
- **Botting**: ONLY mentioned once in Process > Execute step. Language is careful: "strictly to amplify real momentum, never to manipulate the algorithm"
- **No fake metrics**: Phone mockups show NO view counts or engagement numbers — "not accurate" and "bad look"
- **No cheesy animations**: Emoji bursts removed from stats. No floating hearts on client logos. Keep interactions subtle and macho
- **Metro theme consistency**: Process = vertical subway line, Services = horizontal metro route — different formats
- **Section colored borders**: Process = blue border-top, Stats = pink border-top, Creative = orange border-top
- **Hover effects**: Nav logo glows white, client logos glow + grow, process steps grow, hero CTA turns green, contact CTA turns green
- **Nav tagline**: Only shows on hover (desktop). Hidden on mobile. Footer tagline always visible.
- **Mobile**: Creative items tap-to-expand, showcase compact (80vh, no dissolution), no nav tagline

## Active Project: TikTok Automation — @asspizza2026 (Started 2026-02-20)

### Status: 1-WEEK TRIAL (Feb 20-27)
- **Account**: @asspizza2026 on TikTok
- **Plan**: 1 post/day for 1 week, Sean approves each post before it goes live
- **Cost**: ~$3-4/day (~$23-27/week)

### How It Works (Full Pipeline)
1. Sean sends topic to Bernie on WhatsApp (or Claude generates one)
2. Bernie runs `generate-rap-news.js` on EC2 → creates 6 slides → uploads to catbox.moe
3. Slides sent to Sean on WhatsApp for approval
4. Once approved, post to TikTok via Postiz API with `DIRECT_POST`
5. TikTok auto-selects a sound (API doesn't support custom sound selection)

### Post Types
- **Full AI**: 6 AI-generated slides (title cards + atmospheric images) — ~$0.50-0.70/post
- **Hybrid** (preferred): 2 AI Virgil-style title cards + 4 real curated photos — ~$0.15-0.25/post
- **Title card style**: Virgil Abloh-inspired — Helvetica Bold, black/white, diagonal orange accent, clean minimal

### Infrastructure
- **EC2**: `ssh -i ~/Downloads/openclaw-key.pem ubuntu@3.239.100.180`
- **Bot**: Bernie (OpenClaw) — WhatsApp connected to Sean (+13106254899)
- **Postiz**: Auto-posting to TikTok. API key in EC2 config.
- **TikTok integration ID**: `cmlvcz31x00lxny0yex5bsi0v`
- **Generation script**: `~/.openclaw/workspace/skills/larry/scripts/generate-rap-news.js "TOPIC"`
- **Catbox.moe**: Free image hosting intermediary (WhatsApp blocks local file paths)

### Posting via Postiz CLI
```bash
# Upload images
POSTIZ_API_KEY=<key> npx postiz upload <file>

# Create post
POSTIZ_API_KEY=<key> npx postiz posts:create \
  -c "caption with hashtags" \
  -m "url1,url2,url3,url4,url5,url6" \
  --settings '{"privacy_level":"PUBLIC_TO_EVERYONE","duet":true,"stitch":true,"comment":true,"autoAddMusic":"yes","brand_content_toggle":false,"brand_organic_toggle":false,"content_posting_method":"DIRECT_POST"}' \
  -i "cmlvcz31x00lxny0yex5bsi0v"
```

### Published Posts (tracking)
1. **Feb 20** — Future x Metro Boomin "We Still Don't Trust You 2" (test post, may be deleted)
2. **Feb 20** — Asspizza 2016 streetwear nostalgia (hybrid: 2 AI title cards + 4 real photos) — LIVE

### Cost Reference
- See `docs/monthly-expenses.md` for full cost breakdown and scaling scenarios
- Current trial: ~$8-10/week for 1 post/day on 1 account

---

## Active Project: Amanda Bynes — "Girlfriend" Music Video

### Overview
Sean is pitching to direct a music video for Amanda Bynes. She's 40, on a comeback with an EDM/dubstep track called "Girlfriend." She wants to shoot it in the style of Concrete Boys' "Millionaire" video (directed by ASAP & Boy Dilla).

### Aesthetic References
- **Concrete Boys "Millionaire"** — Dark environments, luxury details on real locations, warm/cool light contrast, no VFX, gold accents, urban concrete, feast/abundance scenes
- **Charli XCX "brat" era** — Raw, unapologetic, rave-adjacent, lime green, cool-girl energy
- **2hollis** — Rick Owens goth-glamour, hyperpop, hardstyle, digital aesthetic
- **The Hellp** — Electroclash, indie sleaze, nocturnal leather energy, Hedi Slimane vibes
- **Fakemink** — "Luxury and dirty," digital nostalgia, blurry Valencia-filter aesthetic

### Treatment Summary (full doc: `docs/amanda-bynes-girlfriend-treatment.md`)
- **Concept:** Not a comeback video — a presence video. Amanda moving through one night in a city.
- **Act 1 (The Quiet):** Apartment interior, getting ready ritual, warm amber light, intimate close-ups
- **Act 2 (The Walk):** NYC streets at night, neon + concrete, handheld camera, claiming space
- **Act 3 (The Drop):** Underground parking garage/tunnel, LED practicals, chaotic energy matching the bass drop
- **Outro:** Empty apartment, boots by the door, clean title card
- **Budget:** $1–2K, all towards crew (DP + PA). iPhone Pro + gimbal, all free locations, one evening shoot.
- **Role:** Sean directing. Crew = DP + PA + 2-3 friends as background.

### Key Sensitivities
- This is NOT a nostalgia/comeback narrative — Amanda is present tense, full volume
- The rawness is earned, not a costume — respect her journey
- No overproduction — the Millionaire video proves you don't need money to look expensive

### Files
- `docs/amanda-bynes-girlfriend-treatment.md` — Full treatment (markdown)
- `docs/amanda-bynes-girlfriend-treatment.pdf` — PDF version for pitching
- `docs/sean-claude-setup-guide.md` — Setup guide written for Sean's brother (beginner-friendly)
- `docs/sean-claude-setup-guide.pdf` — PDF version
