# Agency SaaS Viability Brainstorm

**Date:** 2026-03-03
**Status:** Draft
**Participants:** Sean DeFaria, Claude

---

## What We're Exploring

**Core question:** Is it viable for Sean to turn the Riddle MGMT portal prototype into a sellable vertical SaaS product for talent agencies? What does it take, and can he pull it off?

---

## What We Learned

### The Pain Point Is Real (Validated)
- Sean has had real conversations with people at talent agencies
- The #1 pain: **artists (especially young ones) want everything in one place** — finances, contracts, schedule, files
- Artists want it to be user-friendly and accessible 24/7
- The value proposition is: agency pays, artist benefits, both sides win (less back-and-forth)

### The Prototype Is Strong
- Working OAuth integrations: QuickBooks, Google Workspace, DocuSign
- End-to-end e-signing, S3 file storage with per-file encryption, AI classification
- Role-based access (admin/client), mobile-friendly UI, real-time polling
- Roughly 80% of the product is built — the hard integrations are done

### Competition Exists, But Different Angle
**Agency-side tools** (booking, scheduling, CRM):
- Syngency, Mainboard, Netwalk, Skybolt (modeling/acting)
- Prism.fm, Overture, Stagent, Artist Growth, Band Pencil (music)

**Sean's differentiation:** These are all agency workflow tools. Sean is building the **artist-facing dashboard** — a client portal where the artist sees their own money, contracts, and files. Nobody else is doing this specific thing.

### The Team
- **Sean (founder):** Built the entire product. Full-time, limited budget (<$10K). Strong technical ability.
- **Nolan Riddle (co-founder):** Had the original idea. Runs Riddle LLC (management company). Has 3 clients ready to onboard. Industry connections.
- **Phoenix (TBD):** Can bring more clients. Role and compensation to be decided later.

### IP Situation — CRITICAL RISK
- Sean built everything, but there's **no written agreement** with Nolan
- The prototype runs under "Riddle MGMT" branding on Nolan's company name
- Without a contract, IP ownership is ambiguous and could lead to disputes
- **This must be resolved before anything else**

---

## Chosen Approach: Productized Service → Bootstrap

### Why This Approach
- Limited budget means revenue must come fast (weeks, not months)
- A paying customer (Nolan) is ready now
- Multi-tenancy and enterprise features can wait
- Separate deployments work fine for the first 3-5 agencies
- Validates the market before investing in scale

### Execution Plan (High Level)

| Phase | Timeline | What | Goal |
|---|---|---|---|
| 0 | Week 1-2 | Founder agreement with Nolan | Legal protection, clarity on ownership |
| 1 | Week 2-4 | Deploy Nolan's branded portal | First paying customer |
| 2 | Month 2-3 | Sign 2-3 more agencies | Revenue + case studies |
| 3 | Month 3-6 | Build real multi-tenancy | Scalable architecture |
| 4 | Month 6+ | Decide: grow bigger, raise, or stay lean | Strategic inflection point |

### Distribution Model
- **White-label web portal** per agency (portal.agencyname.com)
- **PWA (Progressive Web App)** so artists can "Add to Home Screen" and it feels like a native app
- Native mobile app deferred until $500K+ ARR

### Pricing (Not Yet Validated)
- Target: $500-$1,000/month for boutique agencies (3-10 clients)
- Per-client pricing ($50-$100/client/month) is an option as agencies scale
- Setup fees ($3K-$5K) for white-label configuration
- **Must have a real pricing conversation with Nolan before launch**

---

## Key Decisions Made

1. **Artist-facing portal, not agency CRM** — this is the differentiator
2. **Web portal + PWA first** — skip native app for now
3. **Productized service model** — manually deploy per agency, build multi-tenancy later
4. **Nolan is co-founder (30-50% equity)** — needs written agreement with vesting
5. **Phoenix deferred** — figure out his role after Sean + Nolan formalize
6. **Revenue first, polish later** — skip SOC 2, SSO, landing page until there's traction

---

## Open Questions

1. **Exact equity split** — Sean and Nolan need to agree on specific percentages + vesting schedule
2. **Pricing** — What will Nolan's company actually pay per month? This hasn't been tested with real numbers
3. **Product name** — Still TBD (Conduit, Nexus are top candidates). Needs trademark + domain search

## Resolved Questions

4. **Nolan's ongoing role** — Nolan wants to actively build and sell the company. He's not just advisory — he's a real co-founder who will be the industry face and sales lead.
5. **End goal: Build and sell** — Both Sean and Nolan are aligned on building to an exit. Target: $500K-$1M ARR → sell for $2.5M-$10M at 5-10x ARR. Timeline: 2-4 years.
6. **Support model** — Tiered: agency handles first-line artist support, escalates to Sean for technical bugs. Standard white-label pattern.
7. **Digital distribution** — Deferred. Separate idea, may become a portal feature later.
8. **Phoenix's role** — Deferred until Sean + Nolan formalize their partnership.

---

## Revenue Bridge: Consulting-to-SaaS

Nolan can bring Sean freelance digital agency clients (websites, portals, digital work) to generate cash flow while the SaaS product matures.

**How it works:**
- Freelance agency work pays bills now ($2K-$10K/project)
- Every freelance client is a potential SaaS customer
- Max 50% time on freelance, 50% on product — don't get trapped in services
- Target Month 3 income: $4K-$8K/month (freelance + SaaS combined)

**Rule:** Don't customize the portal per-client. Build the product, sell the product. Freelance work is the bridge, not the destination.

---

## Exit Strategy: Build & Sell

**Target ARR for exit:** $500K - $1M
**Expected multiple:** 5-10x ARR
**Potential sale price:** $2.5M - $10M
**Timeline:** 2-4 years
**Potential buyers:**
- Larger agency software companies (Syngency, Mainboard, Prism.fm)
- Horizontal SaaS platforms wanting a talent vertical
- Private equity firms that roll up niche SaaS companies

---

## Viability Verdict

**Yes, this is viable.** Here's why:

- The pain point is validated by real conversations
- The prototype proves the hard technical problems are solvable
- The competitive landscape has a clear gap (artist-facing vs. agency-facing)
- There's a co-founder with clients ready to pay
- The bootstrapped approach means low downside risk (~$500 to start)
- Claude Code as an AI pair programmer gives Sean 3-5x the output of a typical solo dev

**The biggest risk is not technical — it's the founder relationship.** Get the agreement with Nolan in writing before building anything else.

**The second biggest risk is distraction.** There are dozens of things Sean could build (app, distribution, enterprise features). The path to viability is narrow: get 3-5 agencies paying, then expand.
