---
module: System
date: 2026-02-16
problem_type: developer_experience
component: tooling
symptoms:
  - "11 duplicate skill files across 5 git worktrees"
  - "/save skill bloated at 88 lines with redundant examples and hardcoded paths"
  - "No way to audit installed skills or detect duplication"
  - "No self-improvement feedback loop between sessions"
root_cause: missing_tooling
resolution_type: tooling_addition
severity: medium
tags: [skills, duplication, token-efficiency, claude-code, hooks, dx]
---

# Troubleshooting: Skill File Duplication Across Git Worktrees + Missing Meta-Tooling

## Problem
Custom Claude Code skills were duplicated across all 5 git worktrees (main + 4 worktrees) in both `skills/` and `commands/` directories, wasting ~400 lines of redundant tokens. No tooling existed to detect this or to provide session-over-session self-improvement.

## Environment
- Module: System-wide (Claude Code configuration)
- Affected Component: `~/.claude/skills/`, `.claude/skills/`, `.claude/commands/` across all worktrees
- Date: 2026-02-16

## Symptoms
- `/save` skill existed as 11 identical files (same MD5 hash) across global + project levels in both skills/ and commands/ dirs
- Each file was 88 lines with verbose examples, bash code blocks Claude doesn't copy-paste, and a hardcoded repo path
- No mechanism to list installed skills or check for duplication
- No feedback loop to suggest optimizations after heavy tool usage sessions

## What Didn't Work

**Direct solution:** The problems were identified and fixed on the first attempt via a skills audit approach.

## Solution

### 1. Rewrote `/save` skill (88 → 40 lines)
- Removed verbose examples Claude doesn't need (it knows how to summarize files)
- Replaced bash code blocks with prose instructions (same effect, half the tokens)
- Removed redundant Step 8 (Claude always confirms multi-step operations)
- Consolidated repeated safety instructions into one section
- Fixed hardcoded path: now derives main worktree path from `git worktree list` output

### 2. Deleted 11 duplicate files
Global skills only need to live in `~/.claude/skills/`. They automatically apply to all sessions. Removed:
- All `.claude/commands/save.md` copies (legacy location)
- All project-level `.claude/skills/save.md` copies (redundant with global)
- Across: main repo, worktree-1, worktree-2, worktree-3, worktree-4

### 3. Created `/skills-audit` skill (`~/.claude/skills/skills-audit.md`)
A meta-skill that:
- Scans global + project skill/command directories
- Counts lines per file
- Flags duplicates (by MD5 hash comparison)
- Lists plugin skills from the current session
- Asks user which to review for conciseness, clarity, overlap, and token efficiency

### 4. Created self-improvement hook (`~/.claude/hooks/self-improve.sh`)
A `UserPromptSubmit` hook in global settings that injects an instruction on every prompt: if Claude used 8+ tool calls in the previous response, append one optimization hint (reusable skill, memory pattern, or workflow fix). Skips exploratory work.

**Hook configuration added to `~/.claude/settings.json`:**
```json
"hooks": {
  "UserPromptSubmit": [{
    "matcher": "",
    "hooks": [{
      "type": "command",
      "command": "/Users/seandefaria/.claude/hooks/self-improve.sh",
      "timeout": 5
    }]
  }]
}
```

## Why This Works

1. **Global skills apply everywhere.** `~/.claude/skills/` is read by every Claude session regardless of working directory. Project-level copies are only needed for project-specific skills that shouldn't be global.
2. **`commands/` is legacy.** `skills/` supersedes it. Having both causes double-loading.
3. **Concise skills perform identically.** Claude doesn't copy-paste bash blocks from skills - it interprets instructions. Prose is equally effective and costs fewer tokens.
4. **The self-improvement hook creates a compounding loop.** Each session's heavy operations get a free optimization suggestion, which can become a new skill, memory pattern, or workflow fix.

## Prevention

- **Use `/skills-audit` periodically** to catch duplication and bloat before it compounds
- **Only place skills in `~/.claude/skills/` (global) or `.claude/skills/` (project-specific)** - never both, never in commands/
- **When creating skills for worktree repos:** put them at the global level unless they're truly project-specific
- **Keep skills under 50 lines.** If a skill exceeds this, audit it for verbose examples, redundant instructions, or bash blocks that could be prose
- **One copy, one location.** If a skill works globally, it should only exist globally

## Related Issues

No related issues documented yet.
