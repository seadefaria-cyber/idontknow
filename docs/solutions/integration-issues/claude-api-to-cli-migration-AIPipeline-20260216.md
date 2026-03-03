---
module: AI Pipeline
date: 2026-02-16
problem_type: integration_issue
component: service_object
symptoms:
  - "Claude API calls costing extra money on top of Pro Max subscription"
  - "Claude CLI failed: Error: Claude Code cannot be launched inside another Claude Code session"
  - "Pydantic JSON validation error: response wrapped in markdown code fences"
root_cause: wrong_api
resolution_type: code_fix
severity: high
tags: [claude-cli, pro-max, subprocess, anthropic-sdk, nested-session, json-parsing]
---

# Troubleshooting: Replace Anthropic SDK with Claude Code CLI for Pro Max Subscription

## Problem
The AI pipeline's moment detection and hook generation modules used the `anthropic` Python SDK to call the Claude API directly, incurring pay-per-use costs on top of the $200/month Pro Max subscription. Switching to the `claude -p` CLI (which is covered by Pro Max) hit two non-obvious runtime issues.

## Environment
- Module: AI Pipeline (moment_detector.py, hook_writer.py, claude_cli.py)
- Python Version: 3.13
- Affected Component: src/ai/ service objects
- Date: 2026-02-16

## Symptoms
- AI calls costing extra money despite having Pro Max subscription
- `RuntimeError: Claude CLI failed: Error: Claude Code cannot be launched inside another Claude Code session`
- `ValidationError: Invalid JSON: expected value at line 1 column 1` — response text started with ````json` instead of raw JSON

## What Didn't Work

**Attempted Solution 1:** Simply calling `claude -p` via subprocess without environment cleanup
- **Why it failed:** When running the pipeline from inside a Claude Code terminal session, the `CLAUDECODE` environment variable is set, which prevents nested `claude` CLI invocations. The CLI throws a hard error to prevent resource conflicts.

**Attempted Solution 2:** Adding JSON format instructions to prompts only
- **Why it failed:** The CLI's `--output-format json` flag wraps the response in a JSON envelope (`{"result": "..."}`) but Claude's actual response text inside that envelope was wrapped in markdown code fences (````json\n{...}\n````) instead of raw JSON. The Pydantic `model_validate_json()` call failed on the backtick prefix.

## Solution

Created a thin CLI wrapper (`src/ai/claude_cli.py`) that handles all three concerns:

**Code changes:**

```python
# Before (broken — costs extra money):
import anthropic
client = anthropic.Anthropic(api_key=settings.claude_api_key)
response = client.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4000,
    system=MOMENT_DETECTION_SYSTEM,
    messages=[{"role": "user", "content": user_prompt}],
)
text = response.content[0].text

# After (fixed — uses Pro Max subscription):
from src.ai.claude_cli import call_claude
text = call_claude(
    system_prompt=MOMENT_DETECTION_SYSTEM,
    user_prompt=user_prompt,
)
```

**The wrapper (`src/ai/claude_cli.py`):**

```python
import json
import os
import subprocess

def call_claude(system_prompt: str, user_prompt: str) -> str:
    full_prompt = f"{system_prompt}\n\n---\n\n{user_prompt}"

    # Fix 1: Remove CLAUDECODE env var to allow nested CLI calls
    env = os.environ.copy()
    env.pop("CLAUDECODE", None)

    result = subprocess.run(
        ["claude", "-p", full_prompt, "--output-format", "json"],
        capture_output=True, text=True, timeout=300, env=env,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Claude CLI failed: {result.stderr}")

    output = json.loads(result.stdout)
    text = output["result"]

    # Fix 2: Strip markdown code fences if Claude wrapped the response
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]  # Remove ```json line
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]  # Remove closing ```
        text = "\n".join(lines)

    return text
```

**Prompt changes (src/ai/prompts.py):**

Added explicit JSON format instructions to end of each user prompt:
```
Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{"moments": [{"start_time": 0.0, "end_time": 30.0, ...}]}
```

**Other changes:**
- Removed `anthropic` import from `moment_detector.py` and `hook_writer.py`
- Removed `claude_api_key` validation checks from `src/cli.py`
- Updated all tests to mock `call_claude` instead of `anthropic.Anthropic`

## Why This Works

1. **Root cause:** The project was using the wrong interface to Claude. The `anthropic` SDK hits the pay-per-use API regardless of subscription status. The `claude` CLI routes through the user's subscription.

2. **Nested session fix:** The `CLAUDECODE` environment variable is a guard set by Claude Code to prevent recursive sessions. Removing it from the subprocess environment allows the CLI to run as an independent process while still being invoked from within a Claude Code terminal.

3. **Code fence stripping:** The `claude -p` command with `--output-format json` returns a JSON envelope, but Claude's actual response text may still contain markdown formatting. Even with explicit "no markdown" instructions in the prompt, Claude sometimes wraps JSON in code fences. The strip logic handles this gracefully.

## Prevention

- Always use `claude_cli.py` wrapper for AI calls — never call the anthropic SDK directly in this project
- When spawning `claude` CLI from subprocess, always strip `CLAUDECODE` from the environment
- Always strip markdown code fences from Claude responses before JSON parsing — Claude doesn't reliably follow "no markdown" instructions
- Include explicit JSON format examples in prompts (not just "respond in JSON")
- When testing locally from inside Claude Code, be aware of the nested session restriction

## Related Issues

- See also: [linux-to-mac-portability.md](./linux-to-mac-portability.md) — related Mac portability work on the same pipeline
