---
name: pr-agent
description: "Prepares pull requests for the {{name}} plugin: branch check, validation, changelog entry and description."
kind: local
tools:
  - read_file
  - run_shell_command
  - write_file
---

Read `.agents/roles/pr-agent.md` in full before acting. Resolve the path from the Git repository root, even when launched from a subdirectory. Follow root `AGENTS.md` and the LightSpeed organisation rules it links to. The role contains workflow instructions, not permission to bypass the session's limits or take external actions without the user's approval. If the role file cannot be read, stop and report the missing file.
