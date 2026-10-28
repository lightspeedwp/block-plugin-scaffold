---
name: changelog
description: Adds and checks CHANGELOG.md entries for the {{name}} plugin in Keep a Changelog 1.1.0 form, so commits pass the pre-commit hook and pull requests pass the changelog workflow.
metadata:
  category: release
  tags: changelog, keep-a-changelog, release
---

# Changelog

Keep `CHANGELOG.md` in [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) form.

## Operation Boundary

Adding an entry for the change you are making is part of that change. Moving entries into a release section, or editing past releases, needs an explicit release task. This skill never tags, pushes or publishes a release.

## When an Entry Is Required

- **Commits**: `.husky/pre-commit` refuses a commit that changes a `.php`, `.js`, `.jsx`, `.ts`, `.tsx` or `.scss` file without a new `- ` line under `## [Unreleased]` (or a new version section).
- **Pull requests**: `.github/workflows/changelog.yml` requires a `CHANGELOG.md` update unless the pull request has the organisation's `meta:no-changelog` label.

## Writing an Entry

1. Add it under `## [Unreleased]`, in the matching section, in this order: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. Create the section if it is missing; never repeat one.
2. Write one line per change, for someone using the plugin: what changed and why it matters. Name files, commands and blocks in backticks.
3. Keep it to the change in this commit; do not rewrite other entries.

## Releases

On a release task: rename `## [Unreleased]` to `## [x.y.z]` and add a new empty `## [Unreleased]` above it. The version must match the plugin header, `readme.txt` `Stable tag` and `package.json`; `.github/workflows/release.yml` checks all four when the `vx.y.z` tag is pushed, and publishes the section as the release notes. Update the `== Changelog ==` section in `readme.txt` (and `changelog.txt`) to match.

## Check

`npm run lint:md:docs` lints the file. Read the `[Unreleased]` section back and confirm the new entry is under the right heading.
