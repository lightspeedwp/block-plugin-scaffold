---
name: validate
description: Checks that the {{name}} plugin builds and passes its linters and static analysis (JavaScript, CSS, package.json, block.json, Markdown, PHPCS, PHPStan) before a commit or pull request.
metadata:
  category: quality
  tags: validation, lint, phpcs, phpstan, build
---

# Validate

Run the plugin's checks and report the result, file by file.

## Operation Boundary

Start read-only: look at the diff, the branch and `git status`. The checks below write nothing except `build/`. Fixing what they find (`npm run format`, `composer run lint:fix`, `--fix` flags) changes files, so do it only when the task asks for fixes, and say which files changed. Do not install, update or remove dependencies, or edit lockfiles, to make a check pass. Keep any uncommitted work as it is.

## Checks

| Check | Command | Config |
| --- | --- | --- |
| Branch | `node bin/check-branch-name.js` | Organisation branching strategy |
| JavaScript | `npm run lint:js` | `eslint.config.mjs`, `tools/eslint/` |
| CSS (BEM class names) | `npm run lint:css` | `.stylelintrc.js` |
| `package.json` | `npm run lint:pkg` | `.npmpackagejsonlintrc.json` |
| `block.json` schema | `npm run lint:json` | `bin/validate-json.js` |
| Markdown | `npm run lint:md:docs` | `.markdownlint.json` |
| PHP coding standards | `composer run lint` | `phpcs.xml.dist` |
| PHP static analysis | `composer run phpstan` | `phpstan.neon` (level 6) |
| Build | `npm run build` | `webpack.config.js`, `tools/webpack/` |

`npm run lint` runs the five npm linters in one go.

## Steps

1. Run the checks that cover the changed files, or all of them before a pull request.
2. Record each command's exit code and the first errors it prints.
3. Report errors before warnings. Pre-existing warnings are not failures, but mention new ones.
4. Add `test` (the skill) when the change needs its tests run too.

## Report

A table of check, result and the errors that matter, then the repairs you propose. Say which checks you did not run and why.
