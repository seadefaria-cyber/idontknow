# Monthly Expenses

Last updated: 2026-02-20

---

## Subscriptions & Tools

| Service | What it does | Cost |
|---------|-------------|------|
| Claude Max (20x) | AI assistant for everything - clipping, coding, planning | $200/mo |
| Later (Advanced) | Social media scheduling across TikTok, IG, YouTube, X | $80/mo |
| Postiz | Auto-posting to TikTok (@asspizza2026) via API | $20/mo |
| OpenAI API (image gen) | gpt-image-1.5 for slideshow slides | ~$45-65/mo (at 3 posts/day, 1 account) |
| AWS EC2 (OpenClaw) | Runs Bernie bot — WhatsApp + content generation | ~$20-30/mo |

**Subtotal: $365-395/mo**

---

## Transaction Fees

| Service | What it does | Cost |
|---------|-------------|------|
| Stripe | Invoicing clients, collecting payments | ~2.9% + $0.30 per payment |

---

## Free Tools (no cost, but tracking)

| Service | What it does |
|---------|-------------|
| CapCut | Video editing, trending sounds, effects |
| Google Drive | File storage and sharing with clients |
| Gmail / Yahoo Mail | Email accounts for social profiles |
| GitHub | Code hosting for this project |

---

## Other Overhead (estimate / add your actual numbers)

| Expense | Cost |
|---------|------|
| Internet | $__/mo |
| Phone plan | $__/mo |
| Computer (amortized) | $__/mo |
| Domain name (if any) | $__/mo |
| Cloud storage (Google One, iCloud, etc.) | $__/mo |

---

## Monthly Summary

| Category | Cost |
|----------|------|
| Subscriptions & Tools | ~$365-395/mo |
| Stripe fees (on a $10k invoice) | ~$290 |
| Other overhead | $__/mo |
| **Total (before overhead)** | **~$655-685/mo** |

---

## TikTok Automation — Cost Breakdown (as of 2026-02-20)

### What's Running
- **Account**: @asspizza2026 on TikTok
- **Trial**: 1 post/day for 1 week (Feb 20-27, 2026)
- **Bot**: Bernie (OpenClaw on EC2 at 3.239.100.180)
- **Pipeline**: Topic → generate 6 AI slides → upload to catbox.moe → send to Sean via WhatsApp for approval → post to TikTok via Postiz

### Per-Post Cost
| Item | Cost |
|------|------|
| AI image generation (6 slides) | ~$0.50-0.70 |
| Hybrid post (2 AI + 4 real photos) | ~$0.15-0.25 |
| Catbox.moe uploads | Free |
| Postiz posting | Included in $20/mo plan |

### Scaling Scenarios
| Scenario | Posts/Day | Weekly | Monthly |
|----------|-----------|--------|---------|
| 1 account, 1 post/day (current trial) | 1 | ~$8-10 | ~$35-45 |
| 1 account, 3 posts/day | 3 | ~$23-27 | ~$90-125 |
| 3 accounts, 3 posts/day each | 9 | ~$60-75 | ~$250-350 |

### Infrastructure (fixed costs, same regardless of post volume)
| Service | Monthly |
|---------|---------|
| EC2 server | ~$20-30 |
| Postiz (5 channels) | $20 |
| OpenAI text API (bot conversations) | ~$5-10 |
| **Fixed total** | **~$45-60** |

### Key Technical Details
- SSH: `ssh -i ~/Downloads/openclaw-key.pem ubuntu@3.239.100.180`
- Postiz API key: stored on EC2 in `/home/ubuntu/rap-media/config.json`
- TikTok integration ID: `cmlvcz31x00lxny0yex5bsi0v`
- Generation script: `~/.openclaw/workspace/skills/larry/scripts/generate-rap-news.js`
- Title card style: Virgil Abloh-inspired — Helvetica Bold, clean, minimal, diagonal accent stripe

---

## Not Yet Active (but on radar)

| Service | What it would do | Cost |
|---------|-----------------|------|
| Make.com | Automate workflows between tools | $9-16/mo |
| n8n | Alternative automation platform | Free (self-hosted) or $20/mo |
| Metricool | Alternative to Later with CSV bulk upload | $49/mo |
| Railway | Host your dashboard app | Free tier or ~$5/mo |
