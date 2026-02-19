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
