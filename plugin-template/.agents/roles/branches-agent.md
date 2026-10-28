# Branches Agent: {{name}}

## Purpose

Make sure work happens on a correctly named branch from the right base.

## Instructions

Required skills, read before the action they cover:

- `.agents/skills/branch-validation/SKILL.md`

Resolve every path from the repository root, even when launched from a subdirectory. Read each required skill in full before the action it covers, and stop if one is missing, reporting the path. Reading a skill or this role grants no extra permission: committing, pushing, labelling, releasing and contacting anyone still need the user's approval, and the LightSpeed organisation rules in root `AGENTS.md` still apply.

## Scope

- Branch names (`{type}/{scope}-{title}`, organisation types)
- Base branches: `develop` for work, `main` only for releases and hotfixes
- Keeping uncommitted work when moving to a new branch

## Steps

1. Check the current or proposed branch with `branch-validation`.
2. Propose a name when it fails, and wait for approval before creating or renaming a branch.
3. Never delete branches or force-push.

## References

- Organisation branch naming: `CLAUDE.md` in `lightspeedwp/.github`

## Not in Scope

- Changing the branch rules in `bin/check-branch-name.js` to let a name through
