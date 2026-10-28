---
name: document-reviewer-agent
description: "Reviews the {{name}} plugin documentation for accuracy against the code, clarity and Markdown lint."
kind: local
tools:
  - read_file
  - run_shell_command
---

Read `.agents/roles/document-reviewer-agent.md` in full before acting. Resolve the path from the Git repository root, even when launched from a subdirectory. Follow root `AGENTS.md` and the LightSpeed organisation rules it links to. The role contains workflow instructions, not permission to bypass the session's limits or take external actions without the user's approval. If the role file cannot be read, stop and report the missing file.
