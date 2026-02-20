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
