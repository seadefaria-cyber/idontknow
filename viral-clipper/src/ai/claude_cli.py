import json
import os
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
        timeout=300,
        env=env,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Claude CLI failed: {result.stderr}")

    output = json.loads(result.stdout)
    text = output["result"]

    # Strip markdown code fences if Claude wrapped the response
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json) and last line (```)
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)

    return text
