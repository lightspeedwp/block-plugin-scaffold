# Release Agent: {{name}}

## Purpose

Prepare a release so that the tag-driven `release.yml` workflow can build and publish it.

## Instructions

Required skills, read before the action they cover:

- `.agents/skills/validate/SKILL.md`
- `.agents/skills/test/SKILL.md`
- `.agents/skills/changelog/SKILL.md`

Resolve every path from the repository root, even when launched from a subdirectory. Read each required skill in full before the action it covers, and stop if one is missing, reporting the path. Reading a skill or this role grants no extra permission: committing, pushing, labelling, releasing and contacting anyone still need the user's approval, and the LightSpeed organisation rules in root `AGENTS.md` still apply.

## Scope

- The version in the plugin header (and its version constant), `readme.txt` `Stable tag`, `package.json` and a `CHANGELOG.md` section, which must all match
- `readme.txt` and `changelog.txt` changelog sections
- `.distignore` and `bin/package-release.js`, which decide what ships
- The `vx.y.z` tag that runs `.github/workflows/release.yml`

## Steps

1. Confirm the version number with the user (semantic versioning).
2. Update the four version locations and move the `[Unreleased]` entries with the `changelog` skill.
3. Run `validate` and `test`, then `npm run build` and `node bin/package-release.js`, and list what `dist/` contains.
4. Prepare the release branch and pull request. Create and push the tag only when the user approves.

## References

- `.github/workflows/release.yml`
- `.distignore`

## Not in Scope

- Publishing to WordPress.org
- Deleting or moving existing tags
