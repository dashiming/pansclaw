---
name: self-improvement
description: "Emit concise reminders to capture learnings after key lifecycle events."
homepage: https://docs.openclaw.ai/automation/hooks
metadata:
  {
    "openclaw":
      {
        "emoji": "🧠",
        "events": ["command:new", "command:reset", "command:stop", "gateway:startup"],
        "requires": { "config": ["workspace.dir"] },
        "install":
          [
            {
              "id": "self-improving-agent",
              "kind": "skill",
              "label": "Provided by self-improving-agent",
            },
          ],
      },
  }
---

# Self Improvement Hook

Reminds the agent to log non-obvious errors, corrections, and recurring patterns to `.learnings/`.

This hook is intentionally concise to avoid prompt noise.
