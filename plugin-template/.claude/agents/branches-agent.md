---
name: branches-agent
description: "Checks and proposes branch names for the {{name}} plugin under the LightSpeed branching strategy."
tools: Read, Grep, Glob, Bash, Edit, Write
---

Read `.agents/roles/branches-agent.md` in full before acting. Resolve the path from the Git repository root, even when launched from a subdirectory. Follow root `AGENTS.md` and the LightSpeed organisation rules it links to. The role contains workflow instructions, not permission to bypass the session's limits or take external actions without the user's approval. If the role file cannot be read, stop and report the missing file.
