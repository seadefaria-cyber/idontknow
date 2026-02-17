---
title: "Reposition Aperture Agency Website from AI-Powered to Human-Expert Model"
date: 2026-02-16
category: content-issues
component: site/index.html
tags:
  - brand-positioning
  - messaging-alignment
  - copywriting
  - business-model-correction
severity: high
symptoms:
  - Marketing copy misrepresented business model as "AI-powered" when service is human-operated
  - Meta descriptions, hero section, service cards, process steps, philosophy, and stats all contained AI references
  - Brand messaging contradicted actual service model (team of editors vs automated system)
root_cause: >
  Initial website copy was written positioning Aperture as an AI-powered automation platform.
  The actual service model relies on assembling dedicated teams of human editors and consulting
  with clients on viral content strategy. Copy was never audited after the model clarified.
---

# Reposition Aperture Website: AI-Powered to Human-Expert Model

## Problem

The Aperture agency website (apertureagency.co) contained 12+ instances of AI-centric language across every major section. The business is actually a human-powered clipping agency that assembles teams of editors and consults with clients on how to go viral. The copy needed a full audit and rewrite.

## Symptoms

- Meta descriptions said "AI-powered clipping" and "posted on autopilot"
- Hero section referenced AI and autopilot
- Service card titled "Automated Clipping" with "zero manual editing"
- Another service card said "AI-powered analysis identifies..."
- Process steps said "Our AI scans" and "No human bias -- just data"
- Philosophy section said "POWERED BY AI" and "We built a system"
- Stats section said "AUTOMATED"

## Investigation

1. **Grep audit** with pattern `[Aa][Ii][-\s]?powered|AI\b|automated|autopilot|proprietary pipeline|no human|system that does it` -- found 12 matches
2. **Secondary sweep** with `AUTOMATED|Auto|zero manual|no human` -- caught additional edge cases
3. All 12 instances mapped to specific sections for targeted rewriting

## Root Cause

Initial site copy was written assuming an AI-agency positioning. When the business model clarified as human-powered (team of editors + consultants), the website copy was never updated to match.

## Solution

Made 12 targeted edits to `site/index.html`, replacing all AI/automation language with human-team language:

| Location | Before | After |
|----------|--------|-------|
| Meta description | "AI-powered clipping...posted on autopilot" | "Expert clipping...crafted by a dedicated team of editors" |
| OG description | Same AI copy | Same human copy |
| Hero subtitle | "AI-powered clipping...posted on autopilot" | "Expert clipping...Our team of editors...so you don't have to" |
| Viral Moment Detection card | "AI-powered analysis identifies" | "Our editors watch every second and identify" |
| Service card title | "Automated Clipping" | "Precision Clipping" |
| Service card desc | "zero manual editing" | "crafted by our editing team" |
| Distribution card | "Scheduled and automated" | "Scheduled and managed for you" |
| Process subtitle | "Our proprietary pipeline" | "Our team and process" |
| Process - Detect step | "Our AI scans...No human bias -- just data" | "Our editors study...Trained eyes, sharp instincts" |
| Process - Distribute step | "automated" | "managed by our team" |
| Philosophy headline | "POWERED BY AI" | "POWERED BY EXPERTS" |
| Philosophy body | "We built a system that does it in minutes" | "We assemble a dedicated team around your brand" |
| Stats label | "AUTOMATED" | "DONE FOR YOU" |

## Verification

Final grep sweep with pattern `\bAI\b|autopilot|automated|automat` returned zero matches across the entire `site/index.html`.

## Prevention

### Quick audit command

```bash
grep -rn "AI-powered\|Our AI\|automated\|autopilot\|zero manual\|no human" --include="*.html" site/
```

Run this before any deploy to catch AI language creeping back in.

### Content review checklist

- [ ] Copy matches current business model (human-powered team, not AI tool)
- [ ] No prohibited terms: "AI-powered", "Our AI", "automated", "autopilot", "zero manual", "no human"
- [ ] Service descriptions reflect what the team actually does
- [ ] Meta descriptions and OG tags checked (easy to forget)

## Related

- [Linux to Mac Portability](../integration-issues/linux-to-mac-portability.md) -- related infrastructure solution for the same project
