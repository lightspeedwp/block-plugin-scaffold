---
name: branch-validation
description: Checks that the current or proposed branch for the {{name}} plugin follows the LightSpeed branching strategy before any edit, commit or push.
metadata:
  category: workflow
  tags: branch, git, validation
---

# Branch Validation

Confirm the branch before you edit files, and again before you commit or push.

## Source of Truth

The organisation owns the rules: [CLAUDE.md (branch naming)](https://github.com/lightspeedwp/.github/blob/develop/CLAUDE.md) and `scripts/validation/validate-branch-name.cjs` in `lightspeedwp/.github`. `bin/check-branch-name.js` applies the same types and pattern in this repository, and `.husky/pre-commit` and `.claude/hooks/check-branch.mjs` both call it. Never edit those rules here to let a branch through.

## Rules

- Pattern: `{type}/{scope}-{title}` in lowercase kebab-case, for example `feat/slider-autoplay` or `fix/field-display-escaping`.
- Types: the organisation's list, such as `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`, `build`, `deps`, `security` or `a11y`. Run the script to see if a type is allowed.
- Never: `claude/`, `copilot/`, `openai/` or `feature/` (use `feat/`).
- No commits on `main`, `develop` or `release/*`. Work branches start from `develop`.

## Steps

1. Run `node bin/check-branch-name.js` (current branch) or `node bin/check-branch-name.js <name>` (a proposed name).
2. If the branch is not valid, propose a name and wait for the user to approve it. Do not create, rename or delete branches on your own.
3. Keep uncommitted work: stash or carry it to the new branch only with the user's agreement.
