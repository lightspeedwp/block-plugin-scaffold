# Report Creation Guidelines

How to write the audit and analysis reports that agents and people produce for {{name}}.

## Where Reports Live

```text
.github/reports/
├── block-accessibility-audit.md          from a single-file prompt
├── 2026-10-28-interactivity-migration/   from a multi-step prompt (dated)
│   ├── 01-inventory-view-scripts.md
│   └── 02-convert-to-stores.md
└── archived/                             reports whose work is done
```

`.distignore` keeps reports out of the release.

## Front Matter

```yaml
---
title: Block accessibility audit
date: 2026-10-28
prompt: .github/prompts/block-accessibility-audit.md
status: draft # draft, final or archived
---
```

## Sections

1. **Summary**: the result in a few sentences, and the one or two things to act on first.
2. **Scope**: what was checked, what was not, and the branch or commit.
3. **Method**: the commands, tools and checklists used.
4. **Findings**: grouped by priority (P0 blocks a release, P1 should be fixed this cycle, P2 soon, P3 when convenient). Each has the file and line, what is wrong, why it matters and a suggested fix.
5. **Next steps**: the tasks or issues the findings lead to.

## Rules

- Report what you checked. A check you could not run is listed as not run, with the reason; never as passed.
- Quote command output only as far as it supports a finding.
- Link issues and pull requests by full URL.
- Move a report to `archived/` when its work is merged.
