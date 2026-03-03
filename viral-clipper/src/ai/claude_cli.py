import json
import os
import re
import subprocess

import structlog

logger = structlog.get_logger()


def call_claude(system_prompt: str, user_prompt: str) -> str:
    """Call Claude via the Claude Code CLI (uses Pro Max subscription).

    Combines system + user prompt and calls `claude -p` which routes
    through the user's subscription, not the pay-per-use API.
    """
    full_prompt = f"{system_prompt}\n\n---\n\n{user_prompt}"

    logger.debug("calling_claude_cli", prompt_length=len(full_prompt))

    # Allow spawning claude CLI even when running inside a Claude Code session
    env = os.environ.copy()
    env.pop("CLAUDECODE", None)

    result = subprocess.run(
        ["claude", "-p", full_prompt, "--output-format", "json"],
        capture_output=True,
        text=True,
        timeout=600,
        env=env,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Claude CLI failed: {result.stderr}")

    output = json.loads(result.stdout)
    text = output["result"]

    return _extract_json(text)


def _extract_json(text: str) -> str:
    """Extract JSON from Claude's response, handling various wrapper formats.

    Claude sometimes returns:
    - Pure JSON
    - JSON wrapped in ```json...``` code fences
    - Text explanation followed by ```json...``` code fences
    """
    text = text.strip()

    # Try 1: It's already valid JSON
    if text.startswith("{") or text.startswith("["):
        return text

    # Try 2: Extract from markdown code fences (possibly with preceding text)
    fence_match = re.search(r"```(?:json)?\s*\n(.*?)```", text, re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()

    # Try 3: Find the first { or [ and extract to matching close
    for i, ch in enumerate(text):
        if ch == "{":
            # Find matching closing brace by counting depth
            depth = 0
            for j in range(i, len(text)):
                if text[j] == "{":
                    depth += 1
                elif text[j] == "}":
                    depth -= 1
                    if depth == 0:
                        return text[i : j + 1]
            break

    # Fallback: return as-is and let the caller handle the parse error
    return text
