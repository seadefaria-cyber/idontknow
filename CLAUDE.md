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

## Financial Overview (Updated Feb 20, 2026)

Full business plan PDF: `~/Desktop/business-plans/DeFaria-NYC-6-Month-Plan-Feb2026.pdf`
Full business plan HTML: `docs/business-plan-feb-2026.html`
Monthly expenses doc: `docs/monthly-expenses.md`

### Business Entity: DeFaria NYC, LLC
- Filing via ZenBusiness (registered agent included)
- LLC formation cost: $450–$1,650 (depends on publication county — Albany vs Brooklyn)
- Annual maintenance: $30–$175/yr + $9 biennial statement

### Monthly Fixed Overhead: ~$233/mo
- **Claude Max 20x:** $200/mo (covers all Claude Code across all worktrees — no separate API costs)
- **AWS EC2:** ~$25/mo (runs Bernie/OpenClaw at 3.239.100.180)
- **Google Workspace (1 user, Starter):** $8.40/mo (business email + calendar)

### Monthly Variable Costs (scale with clients)
- **OpenAI API (image gen + text):** ~$50–80/mo (GPT-4o for slideshows + Bernie chat)
- **Postiz (scheduling):** $39/mo (1 client) → $49 (2-4 clients) → $99 (5+ clients)
- **Residential proxies:** $35–75/mo (for TikTok account scaling)

### Team
- **Freelance editor:** $1,000/mo (starting Month 3 / May 2026) — runs their own pages, produces clips for clients

### Total Monthly Burn
- Solo, 1 client: ~$357/mo
- Solo, 2-4 clients: ~$397/mo
- With editor, 2-4 clients: ~$1,397/mo
- With editor, 5+ clients: ~$1,487/mo

### Total Spent To Date: $237.42
- Claude Max upgrade charges: $210 (Feb 2026)
- OpenAI API: $27.42 ($10.89 on Feb 18 + $16.53 on Feb 20)

### Production Costs
- **Clips (footage edits):** $0 per clip — FFmpeg, WhisperX, and captioning all run locally for free
- **Slideshows (full AI, 6 slides):** $0.50–$0.70 per post
- **Slideshows (hybrid, 2 AI + 4 photos):** $0.15–$0.25 per post
- Clips are pure margin. Slideshows have small variable cost from OpenAI image generation.

### Client Pricing Tiers (Updated Feb 23, 2026)
- **Seed:** $1,000/mo + $500 setup — AI production (sound, text overlays, distribution), 1 post/day per platform
- **Starter:** $2,000/mo + $500 setup — Dedicated editor, 2 posts/day per platform
- **Growth:** $3,500/mo + $500 setup — Dedicated editor, 4 posts/day per platform
- **Pro:** $5,000/mo + $500 setup — Dedicated editor, 8 posts/day per platform
- **Elite:** Custom pricing — Everything in Pro + publication & media seeding
- **All tiers:** 1 account per platform (TikTok, IG, X, YT Shorts = 4 accounts), $500 one-time setup (account activation, scheduling setup, editor onboarding), weekly performance report, optional strategy call
- **Minimum contract:** 3 months
- **Setup fee is flat $500** across all tiers
- **Pricing PDF:** `docs/pricing-tiers.html` → exported to `~/Desktop/DeFaria-NYC-Pricing.pdf`

### How the Service Works
- Each unique post goes live on ALL 4 platforms daily (TikTok, IG, X, YT Shorts)
- Tiers scale on content volume (unique posts/day), NOT number of accounts
- Seed tier = AI handles production (sound + overlays + captions). Human picks clip moments.
- Starter and above = dedicated human editor makes all creative decisions. AI handles distribution.
- **Layer 1 (human):** Clip selection, caption writing, sound choice, posting strategy
- **Layer 2 (AI):** Text overlays, captions, sound placement, scheduling, distribution, performance tracking
- **Rule:** AI never touches creative decisions. AI executes what humans decide.

### Capacity
- Seed: AI handles production. ~30 min/day of Sean's time (clip selection only)
- Starter: Editor handles all clips. Sean reviews + approves. ~1 hr/day
- Growth: Editor does 2-3 clips, Sean does 1-2. ~2-3 hrs/day
- Pro: Needs Sean + editor both at full output. ~4-5 hrs/day. Second editor recommended.
- Current editor capacity: 1 freelance editor, 2 accounts, 3-4 clips/day

### Break-Even Targets
- 1 Seed client: $1,000/mo revenue → ~$717 profit
- 1 Starter client: $2,000/mo revenue → ~$1,717 profit
- 1 Starter + 1 Seed: $3,000/mo revenue → ~$2,700 profit
- 1 Starter + 1 Growth: $5,500/mo revenue → ~$3,700 profit (with second editor)
- Target (Month 6): 1 Pro + 1 Starter = $7,000/mo → ~$5,200 profit

### Track Record
- **Asspizza:** Proven account growth using real editors (case study PDF pending — need to compile numbers)
- **Nettspend:** Current testing lab. Best reel 30K views, avg ~2K. Diagnosing what works.
- Growth plan: `docs/growth-plan-feb-2026.md`

### Paying Yourself (Owner's Draw)
- 30% → tax reserve savings account (quarterly payments: Apr 15, Jun 16, Sep 15, Jan 15)
- 15% → business reserve (keep in business account)
- 55% → your draw (paycheck)
- Consider S Corp election once netting $60-80K+/year

### Key Financial Facts
- Transcription is FREE (WhisperX runs locally, not OpenAI Whisper API)
- Claude Code usage is included in the $200/mo Max subscription (no separate API key)
- Video processing (FFmpeg) is free and local — clips cost $0 per unit
- Clients must NEVER know AI is involved — position everything as human creative team
- Freelance editors run their own pages separately from AI workflow

## Conventions

- When the user dictates instructions, interpret them generously - they are communicating verbally.
- Ask clarifying questions when requirements are ambiguous.
- Keep explanations simple and jargon-free.

## Site: defaria.nyc — Current State (Updated 2026-02-19)

### Deployment Pipeline
1. Work on any worktree branch (wt-1 through wt-4)
2. `cd /Users/seandefaria/idontknow && git merge <branch> --no-edit`
3. `rsync -av --delete --exclude='.git' /Users/seandefaria/idontknow/site/ /tmp/defaria-pages/`
4. `cd /tmp/defaria-pages && git add -A && git commit -m "message" && git push origin main`
5. Trigger build: `gh api -X POST repos/seadefaria-cyber/seadefaria-cyber.github.io/pages/builds`
6. **CDN caches aggressively** — always bump `?v=N` on CSS/JS links in index.html when deploying CSS/JS changes

### Cache Busting
- Current version: `?v=6` on sections.css, responsive.css, and main.js
- **CRITICAL**: Every time you change CSS or JS, bump the version number in index.html or the CDN will serve stale files

### Site Architecture
- Pure static HTML/CSS/JS — no frameworks
- NYC MTA Subway design theme (Helvetica, colored subway circles, bold uppercase)
- Files: `site/index.html`, `site/css/{reset,variables,layout,components,sections,responsive}.css`, `site/js/{counter,main}.js`

### Current Sections (top to bottom)
1. **Nav** — "deFaria" logo with "new york" sliding out on hover (white, same size, train animation)
2. **Hero** — "Engineering Virality." headline. "Virality" has shine effect + scale(1.06) on hover. Twitch chat overlay (left), floating hearts (right)
3. **Clients** — 6 SVG logos scrolling left: Interscope, Chris Heyn, Welcome JPEG, Asspizza, Early Life Crisis, Clover. 24px height, 0.2 opacity, 25s scroll speed
4. **Showcase** — 3 phone mockups with scroll-linked video feeds. NO view counts, NO engagement metrics. Total counter "500M+ Views Generated" with dissolution effect
5. **CLIP. SEED. GROW.** — Three animated words (slash/bury/hearts animations)
6. **Stats** — 2 items only: "Clips Deployed Monthly" (3000+) and "Seeding Accounts Active" (100+). NO emoji burst animations
7. **Process** (#1 red bullet) — "How The System Works" — VERTICAL subway line with 4 stops: Meet, Study, Plan, Execute. Bots mentioned ONCE carefully in Execute step only
8. **Services** (#2 orange bullet) — "How We Force It" — HORIZONTAL metro route with 3 colored stations (orange C, red V, green D) connected by track line. Consulting, Viral Clipping, Distribution
9. **Creative** (#3 purple bullet) — "Full-Service Creative" — 3x2 grid with purple left borders. 5 items WITH descriptions: Directing, Scoring, Post-Production, Live Production, Media Seeding
10. **About Banner** — Single sentence: "We built the system." (white) + "Now we run it for you." (blue accent). Dark background with borders
11. **Contact** (#4 green bullet) — "Let's lock in." with lock emoji animation. Form: Project Name, Name, Email, Message, Get Started button. 6 social circles (TikTok, Instagram, YouTube, Twitch, X, Kik) white on blue
12. **Footer** — deFaria logo (left), Services + Contact links (right), copyright line

### SVG Client Logos
- `site/img/clients/asspizza.svg` — Text "ASSPIZZA"
- `site/img/clients/clover.svg` — Text "CLOVER"
- `site/img/clients/early-life-crisis.svg` — Italic serif text "early life crisis."
- `site/img/clients/interscope.svg` — Skewed rectangle with "i" cutout
- `site/img/clients/chrisheyn.svg` — 4 broadcast wave lines
- `site/img/clients/welcomejpeg.svg` — 5 ellipse blob shapes

### Design Decisions / Sensitivities
- **Botting**: ONLY mentioned once in Process > Execute step. Removed from stats, services cards, creative items. Language is careful: "strictly to amplify real momentum, never to manipulate the algorithm"
- **No fake metrics**: Phone mockups show NO view counts or engagement numbers — "not accurate" and "bad look"
- **No cheesy animations**: Emoji bursts removed from stats. Keep interactions subtle and macho
- **Metro theme consistency**: Process = vertical subway line, Services = horizontal metro route — different formats for different sections

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
