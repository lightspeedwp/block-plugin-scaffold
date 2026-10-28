# Agent Instructions: {{name}}

Instructions for AI coding agents (Claude Code, Codex, Gemini CLI, GitHub Copilot) working in this repository.

## Read First

1. The LightSpeed organisation rules: [AGENTS.md](https://github.com/lightspeedwp/.github/blob/develop/AGENTS.md) and [CLAUDE.md](https://github.com/lightspeedwp/.github/blob/develop/CLAUDE.md) in `lightspeedwp/.github`.
2. This file, which adds the rules specific to this plugin.

The organisation rules win where they overlap. In particular, this repository never redefines what the organisation provides: branch types, labels, issue types, issue and pull request templates, the code of conduct and the support policy. Do not add `.github/labels.yml`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE/` or community health files here.

## What This Repository Is

{{name}} is a WordPress block plugin generated from [lightspeedwp/block-plugin-scaffold](https://github.com/lightspeedwp/block-plugin-scaffold). It requires WordPress {{requires_wp}} and PHP {{requires_php}} or later, and develops on Node.js 24.

| Path | Contents |
| --- | --- |
| `{{slug}}.php` | Plugin header and bootstrap |
| `inc/` | PHP classes (`{{namespace}}\classes`) and helper functions |
| `src/blocks/` | Blocks, each with its `block.json` |
| `src/components/`, `src/hooks/`, `src/utils/` | Shared React components, hooks and utilities |
| `test/unit/`, `test/e2e/` | Vitest unit tests and Playwright end-to-end tests |
| `phpunit/` | PHPUnit tests and the PHPStan bootstrap |
| `tools/` | The plugin's ESLint additions and webpack entries |
| `bin/` | Node scripts: `block.json` validation and release packaging |
| `docs/`, `guidelines/` | Project documentation and the coding guidelines agents follow |
| `.agents/`, `.claude/`, `.codex/`, `.gemini/`, `.specify/` | Agent skills, roles, adapters and Spec Kit (see below) |

`build/`, `vendor/`, `node_modules/` and `languages/*.pot` are generated. Do not edit them by hand.

## Before Every Task

1. **Branch.** Work on a branch from `develop` with a type prefix from the organisation's list, such as `feat/`, `fix/`, `chore/`, `docs/` or `test/`. Never commit to `main`, `develop` or `release/*`, and never use `claude/`, `copilot/`, `openai/` or `feature/`. The pre-commit hook checks this, and so does the Claude Code hook in `.claude/hooks/`.
2. **Changelog.** Every change to a `.php`, `.js`, `.jsx`, `.ts`, `.tsx` or `.scss` file needs a new entry under `## [Unreleased]` in `CHANGELOG.md`, in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) form. The pre-commit hook and the changelog workflow check for it.
3. **Labels.** Use only the organisation's prefixed labels (`type:*`, `status:*`, `priority:*`, `area:*`, `meta:*`).

## Commands

| Command | What it does |
| --- | --- |
| `npm run start` / `npm run build` | Watch or build the blocks with `@wordpress/scripts` |
| `npm run lint` | JavaScript, CSS, `package.json`, `block.json` and Markdown |
| `npm run format` | Prettier (WordPress style) |
| `npm run test:unit` | Vitest, with a coverage gate |
| `npm run env:start` then `npm run test:e2e` | Playwright against wp-env (add `-- --runtime=playground` without Docker) |
| `composer run lint` / `composer run lint:fix` | PHP_CodeSniffer with the WordPress Coding Standards |
| `composer run phpstan` | PHPStan level 6 |
| `composer run test` | PHPUnit with Brain Monkey (no WordPress install needed) |

Run the checks that cover your change before you finish, and report any you could not run.

## Standards

- **PHP**: the [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/) (`phpcs.xml.dist`). Escape output late, sanitise input, check nonces and capabilities. Prefix functions, hooks and options with `{{namespace}}_`, and constants with `{{upper.namespace}}_`.
- **JavaScript**: the [Gutenberg coding guidelines](https://developer.wordpress.org/block-editor/contributors/code/coding-guidelines/). Use `@wordpress/*` packages, and the Interactivity API for front-end behaviour (see `docs/INTERACTIVITY-AND-DATAVIEWS.md`).
- **CSS**: [BEM](https://bem.info/en/methodology/) class names (`block__element--modifier`), which Stylelint enforces. See `guidelines/css-architecture.md`.
- **Accessibility**: WCAG 2.2 AA. See `guidelines/accessibility-checklist.md`; `test/e2e/accessibility.spec.js` runs axe-core.
- **Translation**: every user-facing string uses the `{{textdomain}}` text domain.
- **Blocks**: `block.json` must validate against the WordPress schema (`npm run lint:json`).

## Agent Skills, Roles and Spec Kit

| Location | Purpose |
| --- | --- |
| `.agents/skills/<name>/SKILL.md` | Shared skills: `test`, `validate`, `changelog`, `branch-validation` |
| `.agents/roles/<name>.md` | Shared role instructions (see `.agents/roles/INVENTORY.md`) |
| `.claude/skills/`, `.claude/agents/` | Claude Code: links to the shared skills, and adapters that load the roles |
| `.codex/agents/`, `.gemini/agents/` | Codex and Gemini CLI adapters that load the same roles |
| `.specify/`, `speckit-*` skills | Spec Kit for specification-first features; specs live in `.github/specs/` |
| `guidelines/` | Coding, testing, accessibility, prompt and report guidelines |

Edit behaviour in `.agents/`; the adapters only point to it. A skill or role is workflow guidance. It does not grant permission to push, publish, label, release or message anyone without the user's approval.
