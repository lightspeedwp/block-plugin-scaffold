# Prompt Creation Guidelines

How to write a prompt that an AI agent can run again later, such as an audit of every block or a migration across the plugin.

## Where Prompts Live

```text
.github/prompts/
├── block-accessibility-audit.md      a single-file prompt
└── interactivity-migration/          a multi-step prompt
    ├── 00-ORCHESTRATOR.md            runs the steps in order
    ├── 01-inventory-view-scripts.md
    └── 02-convert-to-stores.md
```

- Use kebab-case names. A multi-step prompt is a folder with `00-ORCHESTRATOR.md` and numbered steps.
- Prompts are repository tools: `.distignore` keeps them out of the release.

## Front Matter

```yaml
---
title: Block accessibility audit
description: Checks every block in src/blocks against guidelines/accessibility-checklist.md.
type: single # single, orchestrator or step
output: .github/reports/block-accessibility-audit.md
---
```

## Sections

1. **Objective**: one or two sentences on what the prompt achieves.
2. **Scope**: the files and folders it reads, and what it must not change.
3. **Inputs**: the guidelines, skills or earlier reports it depends on, by path.
4. **Steps**: numbered and specific enough to repeat. Name the commands to run.
5. **Output**: the report path and its structure, following the [report guidelines](report-creation-guidelines.md).
6. **Done when**: checks that show the prompt finished, such as "every block in `src/blocks/` has a row in the report".

## Rules

- Say what the agent may and may not change. A prompt that only audits must say so.
- Refer to skills (`.agents/skills/`) and guidelines by path instead of copying them.
- Prompts follow the branch, changelog and label rules in `AGENTS.md`; they cannot grant permission to push or publish.
