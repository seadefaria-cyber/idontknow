# Nightly Wind-Down Routine

End-of-day ritual: ops cleanup, optional reflection, and a business intelligence PDF report.

Run this every night before closing the laptop. Takes < 2 minutes of active input.

## Phase 1: Ops (Automatic)

Run all ops steps in sequence. Report results in a summary table at the end.

### 1.0 Check Uncommitted Changes

```bash
git status --porcelain
git diff --cached --stat
```

If there are pre-staged changes you didn't make, unstage them first with `git reset HEAD`.

If there are uncommitted changes, use AskUserQuestion to ask:
- "Stash for now" — `git stash push -m "winddown-$(date +%Y-%m-%d)"`
- "Quick commit" — Stage relevant files by name, verify with `git diff --cached --stat`, commit
- "Continue (deal with it later)" — Note in ops summary and move on

### 1.1 Branch Cleanup

Delete merged local branches:
```bash
git branch --merged main | grep -v '^\*\|main' | xargs -r git branch -d
```

Prune stale remote tracking branches:
```bash
git remote prune origin
```

Report unmerged branches (DO NOT delete):
```bash
git branch --no-merged main --format='%(refname:short) (%(committerdate:relative))'
```

Never touch main or the current working branch.

### 1.2 Quality Checks

Run all checks and capture pass/fail + error counts. Adapt these commands to your project's tooling:

```bash
# TypeScript check (or your equivalent)
npm run typecheck

# Linting
npm run lint

# Tests
npm test -- --ci
```

Do NOT block the rest of the winddown on failures — just report them.

### 1.3 Merge to Main

```bash
git checkout main
git pull origin main
```

Check for open PRs that are merged but not pulled locally:
```bash
gh pr list --state merged --limit 10 --json number,title,headRefName,mergedAt
```

If the working branch has a merged PR, it's already in main. If it has an open PR ready to merge, ask the user whether to merge it.

### 1.4 Ops Summary

Print a clean summary table:

```
┌─────────────────────────────────────────┐
│          Wind-Down Ops Summary          │
├───────────────────┬─────────────────────┤
│ Working tree      │ [clean/stashed/etc] │
│ Branches cleaned  │ [N deleted, M open] │
│ Typecheck         │ [PASS/FAIL]         │
│ Lint              │ [PASS/N warnings]   │
│ Tests             │ [N/M passing]       │
│ Merged to main    │ [PR #N / no PRs]    │
└───────────────────┴─────────────────────┘
```

---

## Phase 2: Reflection (Optional)

Use AskUserQuestion to prompt:
- "Voice dump (paste text)" — Accept raw stream-of-consciousness text
- "Q&A (I'll ask questions)" — Ask 3-5 targeted questions based on today's git activity
- "Skip" — Jump straight to the report

If voice dump or Q&A, parse into structured insights: business direction, feature priorities, user feedback, concerns, decisions made, open questions.

Save to `docs/founder-log/YYYY-MM-DD.md`.

---

## Phase 3: Report Generation

Generate a nightly business intelligence report as a PDF.

### 3.1 Gather Inputs

Collect from local environment:
- Recent commits (last 7 days)
- Test/typecheck/lint results from Phase 1
- PR activity via `gh pr list`
- Recent founder-log entries (last 7 days)
- Product docs (roadmap, features, known issues — if they exist)

### 3.2 Web Research

3-5 searches for current, relevant startup/industry insights. Keep it focused and actionable.

### 3.3 Generate Report

Write to `docs/reports/YYYY-MM-DD-nightly.md` with these sections:

1. **Where You Are** — Features shipped, in progress, planned. Codebase health table. User-facing state.
2. **What Stage This Is** — Pre-launch assessment. Comparable companies at this stage. Common mistakes to avoid.
3. **Strategic Decisions Ahead** — 3-5 upcoming decisions with options, tradeoffs, and recommendations.
4. **Founder Calibration** — Synthesize recent voice notes. How thinking has evolved. Gentle challenges.
5. **Tomorrow's Focus** — Recommended priorities. Highest-leverage action. Open questions. Suggested first command.

Guidelines: Be specific and grounded in data. Reference actual PRs and features by name. Use tables and bullet points.

### 3.4 Convert to PDF

```bash
npx md-to-pdf docs/reports/YYYY-MM-DD-nightly.md
```

### 3.5 Executive Summary

Print a 1-paragraph summary (3-4 sentences) to the terminal with the PDF path.
