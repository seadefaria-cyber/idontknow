---
title: "First 30 Days: Turn Riddle MGMT Portal Into a Sellable SaaS Product"
type: feat
status: active
date: 2026-03-03
brainstorm: docs/brainstorms/2026-03-03-agency-saas-viability-brainstorm.md
---

# First 30 Days: Turn Riddle MGMT Portal Into a Sellable SaaS Product

## Overview

Turn the working Riddle MGMT portal prototype into a product that Nolan's agency can pay for — and that can be redeployed for additional agencies. This plan covers the first 30 days only, focusing on: founder agreement, security hardening, branding extraction, first paid deployment, and PWA.

**Success criteria:** Nolan's agency is running on a branded portal with its own database, paying $500+/month, and the product can be redeployed for a second agency in under a day.

## Problem Statement / Motivation

Sean has a working prototype with 3 OAuth integrations (QuickBooks, Google Workspace, DocuSign), file storage, AI classification, and role-based access. But it's single-tenant, has security gaps, and every piece of branding is hardcoded to "Riddle MGMT." Before selling this to anyone — even Nolan — these issues must be fixed.

The brainstorm concluded: revenue first, polish later. This plan follows that principle — do the minimum to make it sellable, then iterate with real customer feedback.

## Proposed Solution

A 4-phase, 30-day sprint:
1. **Week 1:** Founder agreement + security fixes (the blockers)
2. **Week 2:** Extract branding into config (make it white-label-able)
3. **Week 3:** Deploy Nolan's branded portal + onboard his 3 artists
4. **Week 4:** PWA, pricing conversation, second agency prep

Each phase has concrete tasks with specific files and acceptance criteria.

---

## Phase 1: Foundation (Week 1, Days 1-7)

### 1A. Founder Agreement with Nolan

**This is not a code task. It is the most important task in the entire plan.**

- [ ] Write a simple 2-page co-founder agreement covering:
  - Who owns the software IP (Sean)
  - Equity split (30-50% for Nolan, with 4-year vesting and 1-year cliff)
  - What each person does (Sean: builds product. Nolan: brings clients, industry expertise)
  - What happens if someone leaves (vesting stops, unvested shares return)
  - Who makes final decisions on product vs. business (define roles)
- [ ] Both sign it (digital signatures are fine — use DocuSign if you want)
- [ ] Store the signed copy in a safe place (Google Drive + local backup)

**Cost:** $0 to draft yourself, $500 for a lawyer to review later. Draft first, get it signed, lawyer reviews after.

**Template resources:** Y Combinator's handshake protocol, Clerky founder agreement templates, or Stripe Atlas.

### 1B. Security Hardening — Critical Fixes

These are the security issues that would be embarrassing or dangerous for a paying customer.

**1B-1. Remove hardcoded secret fallbacks**

| File | Line | Issue | Fix |
|---|---|---|---|
| `src/lib/auth.ts` | 4 | JWT_SECRET fallback `"riddle-mgmt-secret-key-change-in-production"` | Throw error if env var missing |
| `src/app/api/files/[id]/download/route.ts` | 7 | FILE_SECRET fallback `"riddle-file-access-secret"` | Throw error if env var missing |
| `src/app/api/files/[id]/verify/route.ts` | 7 | FILE_SECRET fallback `"riddle-file-access-secret"` | Throw error if env var missing |
| `src/lib/s3.ts` | 12 | AWS_S3_BUCKET fallback `"riddle-mgmt-files"` | Throw error if env var missing |

- [x] In each file, replace `|| "fallback"` with a startup check that throws if the env var is not set

**1B-2. Remove hardcoded seed users**

- File: `src/lib/db.ts` lines 305-334
- [x] Remove all hardcoded user inserts (`seandefaria`, `test1`, `client1`, `nettspend`)
- [x] Replace with env-var-driven initial admin: read `ADMIN_USERNAME` and `ADMIN_PASSWORD` from env
- [x] On first boot, create one admin account if the users table is empty
- [x] Log the admin credentials to the Vercel function log on first boot only

**1B-3. Gate registration**

- File: `src/app/api/auth/register/route.ts`
- [x] Add `ALLOW_REGISTRATION` env var check (default: `"false"`)
- [x] When registration is closed, return a friendly error: "Registration is by invitation only"
- [x] Admin creates client accounts manually (new API route: `POST /api/admin/users`)

**1B-4. Remove or secure SiteGate**

- File: `src/components/SiteGate.tsx` lines 6-7
- [x] Remove the SiteGate component entirely — the portal auth (login page) is sufficient
- [ ] Or: move credentials to server-side env vars (`SITE_GATE_USER`, `SITE_GATE_PASSWORD`) and verify via API call instead of client-side check

**1B-5. Increase password minimum**

- File: `src/app/api/auth/register/route.ts` line 19
- [x] Change minimum password length from 4 to 8 characters

**1B-6. Fix hardcoded username checks**

Replace `seandefaria` username checks with role-based checks in these files:

| File | Line | Current | Fix |
|---|---|---|---|
| `src/components/portal/FilesSection.tsx` | 262 | filters out `seandefaria` | filter by `role === "admin"` |
| `src/components/portal/ReimbursementsSection.tsx` | 297 | filters out `seandefaria` | filter by `role === "admin"` |
| `src/components/portal/IdeasSection.tsx` | 160 | filters out `seandefaria` | filter by `role === "admin"` |
| `src/components/portal/LegalSection.tsx` | 248 | filters out `seandefaria` | filter by `role === "admin"` |
| `src/components/portal/ScheduleSection.tsx` | 547 | filters out `seandefaria` | filter by `role === "admin"` |
| `src/components/portal/NotesSection.tsx` | 242 | filters out `seandefaria` | filter by `role === "admin"` |

- [x] Update all 6 files to use role-based filtering

---

## Phase 2: White-Label Branding (Week 2, Days 8-14)

### 2A. Create a Branding Config

- [x] Create `src/lib/brand.ts` — a single file that reads all branding from env vars with sensible defaults

```
// Environment variables for branding:
BRAND_NAME          — "Riddle Mgmt" → "Agency Name"
BRAND_TAGLINE       — "Artist management by..."
BRAND_EMAIL         — "team@riddlellc.biz" → "team@agency.com"
BRAND_SOCIAL_URL    — "https://instagram.com/riddle"
BRAND_SOCIAL_HANDLE — "@riddle"
BRAND_LOCATION      — "Los Angeles · New York City"
BRAND_DOMAIN        — "riddlellc.biz" → "agency.com"
BRAND_LOGO_URL      — "/logo.png" (can be overridden with a URL)
BRAND_PRIMARY_COLOR — hex color for the agency's brand
SHOW_POWERED_BY     — "true" or "false"
```

### 2B. Replace All Hardcoded Branding

Every file below needs to import from `src/lib/brand.ts` instead of using string literals:

| File | What's hardcoded |
|---|---|
| `src/components/Nav.tsx:50` | `"Riddle Mgmt"` |
| `src/components/portal/DashboardHeader.tsx:27` | `"RIDDLE MGMT."` |
| `src/components/portal/DashboardHeader.tsx:60-65` | Instagram link + `@riddle` |
| `src/app/layout.tsx:20-22` | Page title, description, keywords |
| `src/app/opengraph-image.tsx:6,11-12` | OG image alt text + logo |
| `src/app/page.tsx:15,45` | Logo alt text, location |
| `src/app/about/page.tsx:22-31` | Full bio text |
| `src/app/privacy/page.tsx:14,28` | Company name, domain |
| `src/app/terms/page.tsx:14-15,20-21,35,41` | Company name, domain, portal name |
| `src/app/contact/page.tsx:22,25` | Email address |
| `src/app/api/requests/route.ts:43-46` | Sender name, recipient email |
| `src/app/api/docusign/sign/route.ts:44,56` | Fallback email domain, return URL |
| `src/app/api/docusign/send/route.ts:41` | Fallback email domain |
| `src/app/portal/dashboard/page.tsx:166-176` | "Powered by DeFaria" link |

- [x] Replace all instances above with imports from `brand.ts`
- [x] Test that the portal renders correctly with default values (should look identical to current)
- [x] Test with a different set of env vars to confirm branding changes

### 2C. Cookie Name

- File: `src/lib/auth.ts` line 5
- [x] Change `"riddle_session"` to a configurable or generic name like `"portal_session"`

---

## Phase 3: First Paid Deployment (Week 3, Days 15-21)

### 3A. Set Up Nolan's Production Infrastructure

- [ ] Create a new Turso database for Nolan's portal (free tier is fine to start)
- [ ] Create a new S3 bucket (or use a tenant prefix in the existing bucket)
- [ ] Create a new Vercel project pointing at the same repo
- [ ] Set all ~20 env vars (see checklist below)
- [ ] Deploy and verify the portal loads with Nolan's branding

**Env var checklist for a new agency deployment:**

```
# Database
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Auth
JWT_SECRET=              # Generate: openssl rand -hex 32
FILE_SECRET=             # Generate: openssl rand -hex 32
ADMIN_USERNAME=          # Nolan's admin username
ADMIN_PASSWORD=          # Strong initial password

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=

# QuickBooks
QB_CLIENT_ID=
QB_CLIENT_SECRET=
QB_REDIRECT_URI=https://portal.nolansagency.com/api/quickbooks/callback
QB_ENVIRONMENT=production

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://portal.nolansagency.com/api/google/callback

# DocuSign
DOCUSIGN_CLIENT_ID=
DOCUSIGN_CLIENT_SECRET=
DOCUSIGN_REDIRECT_URI=https://portal.nolansagency.com/api/docusign/callback
DOCUSIGN_BASE_URL=
DOCUSIGN_ACCOUNT_ID=

# Branding
BRAND_NAME=
BRAND_EMAIL=
BRAND_DOMAIN=
BRAND_SOCIAL_URL=
BRAND_SOCIAL_HANDLE=
BRAND_LOCATION=
SHOW_POWERED_BY=true

# Registration
ALLOW_REGISTRATION=false
```

### 3B. Onboard Nolan's 3 Artists

- [ ] Nolan logs in as admin, connects his QuickBooks, Google, and DocuSign accounts
- [ ] Create accounts for his 3 artist clients (via new admin user creation route)
- [ ] Each artist gets their login credentials
- [ ] Walk through the portal with Nolan: does the data show correctly? Any bugs?
- [ ] Document any issues found during onboarding (this is gold — real user feedback)

### 3C. Start Charging

- [ ] Have the pricing conversation with Nolan: $500/month? $750? Per-client pricing?
- [ ] Set up payment: Stripe subscription, or even just a monthly invoice to start
- [ ] Send the first invoice

---

## Phase 4: Polish & Prepare (Week 4, Days 22-30)

### 4A. Add PWA Support

- [x] Create `public/manifest.json`:
  ```json
  {
    "name": "Agency Portal",
    "short_name": "Portal",
    "start_url": "/portal",
    "display": "standalone",
    "background_color": "#000000",
    "theme_color": "#000000",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- [x] Generate 192x192 and 512x512 icons from the agency's logo
- [x] Add `<link rel="manifest" href="/manifest.json">` to `layout.tsx`
- [x] Add `<meta name="theme-color">` to `layout.tsx`
- [x] Add `<meta name="apple-mobile-web-app-capable" content="yes">` for iOS
- [x] Add `<link rel="apple-touch-icon" href="/icon-192.png">` for iOS home screen
- [x] Test "Add to Home Screen" on iPhone and Android

### 4B. Admin User Management

The admin needs to create accounts for new artists without self-registration.

- [x] Create `POST /api/admin/users` — admin-only endpoint to create client accounts
- [x] Create a simple admin UI page at `/portal/admin/users` with:
  - List of all users (username, role, created date)
  - "Add User" form (username, password, role)
  - Delete user button
- [x] Only visible to users with `role === "admin"`

### 4C. Deployment Documentation

Write a checklist so you can deploy for the next agency in under a day.

- [ ] Create `docs/deployment-checklist.md` with:
  - Step-by-step new agency setup (Turso, S3, Vercel, env vars, OAuth apps)
  - Branding env var reference
  - Onboarding script (what to walk the agency through)
  - Common issues and fixes

### 4D. Product Name Decision

- [ ] Check trademark availability on USPTO TESS for top candidates (Conduit, Nexus)
- [ ] Check domain availability (.com and .io)
- [ ] Pick a name and buy the domain
- [ ] Update the "Powered by" attribution to use the product name

---

## What's NOT In This Plan (Intentionally Deferred)

| Feature | Why it's deferred | When to revisit |
|---|---|---|
| Multi-tenancy (shared database) | Separate deployments work for 3-5 agencies | When managing deployments becomes painful (~5+ tenants) |
| SSO / SAML | No agency has asked for it yet | When an enterprise-tier agency requires it |
| SOC 2 | Too expensive ($10K+) and slow for day 1 | When you have $50K+ ARR and enterprise prospects |
| Native mobile app | PWA covers 90% of the need | When you have $500K+ ARR |
| Landing page / marketing site | Nolan is doing warm outreach, not inbound | After 3-5 paying agencies (for inbound leads) |
| Formal migration tooling | `tryExec` ALTER TABLE works fine at this scale | When schema changes become frequent |
| Rate limiting / CAPTCHA | Low risk with gated registration | Before Intuit production review |
| MFA | Low risk with gated registration | Before Intuit production review |
| Stripe billing integration | Manual invoicing works for 3-5 customers | When billing becomes a time sink |

---

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Nolan disagrees on equity split | Medium | Critical | Have the conversation early (Day 1). Be prepared to negotiate. |
| OAuth redirect URIs break on new domain | High | Medium | Test each integration individually on the new domain before onboarding artists |
| Nolan's artists don't use the portal | Medium | High | Walk them through it personally. Make it dead simple. Get feedback. |
| QuickBooks/Google/DocuSign reject new OAuth app | Low | High | Register apps early (Week 1). QB requires review for production access. |
| Turso free tier has limitations | Low | Low | Upgrade to paid ($29/mo) if needed. Tiny cost. |

---

## Success Metrics

| Metric | Target | How to measure |
|---|---|---|
| Founder agreement signed | Week 1 | Document exists, both signatures |
| Security fixes deployed | Week 1 | All hardcoded secrets removed, registration gated |
| Branding configurable | Week 2 | Change env vars → branding changes everywhere |
| Nolan's portal live | Week 3 | His artists can log in and see their data |
| First payment received | Week 3-4 | Invoice sent and paid |
| PWA installable | Week 4 | "Add to Home Screen" works on iOS/Android |
| Second agency deployable in <1 day | Week 4 | Deployment checklist tested |

---

## References & Research

### Internal References
- Brainstorm: `docs/brainstorms/2026-03-03-agency-saas-viability-brainstorm.md`
- Branding locations: `src/components/Nav.tsx:50`, `src/components/portal/DashboardHeader.tsx:27`, `src/app/layout.tsx:20-22`
- Security gaps: `src/lib/auth.ts:4`, `src/lib/db.ts:305-334`, `src/components/SiteGate.tsx:6-7`
- Hardcoded username: `src/components/portal/FilesSection.tsx:262` (and 5 other portal components)
- DocuSign per-user pattern: `docs/solutions/integration-issues/docusign-oauth-integration-20260303.md`

### External References
- Y Combinator Handshake Protocol: search "YC cofounder agreement template"
- Clerky founder docs: clerky.com
- PWA manifest spec: web.dev/add-manifest
- USPTO TESS trademark search: tmsearch.uspto.gov

### Competitive Landscape (from brainstorm)
- Agency CRM tools: Syngency, Mainboard, Prism.fm, Overture, Stagent
- Our differentiation: artist-facing portal, not agency workflow tool
