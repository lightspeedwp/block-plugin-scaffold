# Gemini CLI: {{name}}

Root `AGENTS.md` is the instruction file for this repository, and the LightSpeed organisation rules it links to come first. Check the branch before you edit (`node bin/check-branch-name.js`).

- Shared skills are in `.agents/skills/`, which Gemini CLI finds on its own.
- The agents in `.gemini/agents/` load their instructions from `.agents/roles/`.
- Spec Kit commands are in `.gemini/commands/`: `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement` and the rest. Specs live in `.github/specs/`.
