# /save - Save and merge work to main

## Description
Saves all work in the current worktree, merges it into main, and pushes to GitHub. One command to save everything.

## User-invocable
true

## Instructions

When the user runs `/save`, follow these steps exactly. Keep all communication simple and jargon-free.

### Step 1: Figure out where we are
```bash
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
```
```bash
git worktree list
```
Tell the user: "Saving your work from terminal [number]..."

If we're already on `main`, tell the user "You're on the main branch - there's nothing to merge. Switch to one of your terminal worktrees first!" and stop.

### Step 2: Check for changes
```bash
git status
```
- If there are NO changes (nothing to commit, working tree clean), tell the user: "Nothing new to save - you're all caught up!" and stop.
- If there ARE changes, continue.

### Step 3: Show the user what will be saved
List the changed files in plain language. For example: "I'm about to save these changes: modified index.html, new file style.css"

### Step 4: Commit all changes
```bash
git add -A
git commit -m "Save from [branch-name]: [brief description of what changed]"
```
Write a clear commit message describing what actually changed (look at the files and diffs).

### Step 5: Update current branch from main first (prevent conflicts)
Before merging into main, make sure our branch has the latest from main:
```bash
git merge main --no-edit
```
- If this causes conflicts, STOP and help the user resolve them in simple terms before continuing.
- If it merges cleanly, continue.

### Step 6: Merge into main
Use the main repo path (first entry from `git worktree list`, the one on branch `main`) to merge:
```bash
git -C /Users/seandefaria/idontknow merge [current-branch] --no-edit
```

- If merge conflicts occur, DO NOT force anything. Explain what happened simply: "Two terminals changed the same part of the same file. Let me help you sort this out."
- If it merges cleanly, continue.

### Step 7: Push to GitHub
Push main to GitHub so everything is backed up online:
```bash
git -C /Users/seandefaria/idontknow push origin main
```

Also push the current branch:
```bash
git push origin [current-branch]
```

If push fails because the remote branch doesn't exist yet:
```bash
git push -u origin [current-branch]
```

### Step 8: Confirm success
Tell the user in plain, friendly language:
- What files were saved
- That everything is merged and backed up on GitHub
- They can keep working in this terminal

Example: "All saved! Your changes to index.html and style.css are now merged and backed up on GitHub. Keep working whenever you're ready."

### Error Handling Rules
- **NEVER** use `--force`, `reset --hard`, `clean -f`, or any destructive commands
- If something goes wrong, explain what happened in simple terms and suggest what to do
- If there are merge conflicts, walk the user through resolving them step by step
- If GitHub push fails (network issues), tell the user their work is saved locally and they can try again later
- Always err on the side of caution - ask the user before doing anything risky
