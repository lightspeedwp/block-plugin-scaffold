<!--
Sync Impact Report
- Version change: TEMPLATE (unratified placeholders) → 1.0.0 (initial ratification)
- Modified principles: none (first concrete adoption — all 5 slots filled in for the first time)
- Added sections: Core Principles I-V (all newly named), Technology & Tooling Constraints,
  Development Workflow, Governance (all newly populated from placeholder scaffolding)
- Removed sections: none
- Templates requiring follow-up: none — plan-template.md's Constitution Check gate already reads
  this file generically; no template text references old placeholder principle names directly.
- Deferred items: TODO(RATIFICATION_DATE) — the practices below (AGENTS.md, coding-standards
  instructions, CONTRIBUTING.md) predate this constitution file; the exact date this project first
  adopted them as binding was not recorded. Using this amendment's date as Last Amended; a maintainer
  should backfill Ratified if the true origin date is known.
-->

# Block Plugin Scaffold Constitution

## Core Principles

### I. Org Coding Standards & Linting (NON-NEGOTIABLE)

All code (PHP, JS, CSS/SCSS, JSON) MUST follow the org standards defined under
`.github/instructions/` (coding-standards, linting, html-template, pattern-development,
php-block, theme-json). PHP MUST follow WordPress PHP Coding Standards with PSR-4 autoloading
and type hints where PHP 8.0+ allows. Every code change MUST include any required lint fixes as
part of the same change, not deferred to a follow-up. Documentation and comments MUST use UK
English per org convention.

**Rationale**: This scaffold is consumed by multiple downstream client projects; inconsistent
standards compound across every fork, so enforcing them once here is far cheaper than fixing
drift later.

### II. Security & Data Handling (NON-NEGOTIABLE)

All input MUST be sanitized and all output escaped following WordPress and OWASP Top 10
practices. Secrets, API keys, and credentials MUST NEVER be output, logged, or committed.
Production and customer data MUST be treated as sensitive by default, even in test/example code.

**Rationale**: As a scaffold, insecure patterns here get copied verbatim into every generated
plugin — a vulnerability introduced in the template is a vulnerability shipped to every client.

### III. Accessibility & Performance

Accessibility (WCAG-aligned) and performance are non-negotiable acceptance criteria, not optional
polish. Any change to markup, block output, or asset loading MUST be reviewed for accessibility
and performance impact, and issues MUST be raised during review rather than deferred silently.

**Rationale**: These are structural properties of generated output that are expensive to retrofit
per-client once a plugin has been generated and customized downstream.

### IV. Test & Lint Gate on Every Change

Every code change MUST be accompanied by relevant automated tests (PHPUnit under `tests/php`,
Jest/JS tests, and/or e2e tests under `tests/e2e` as applicable) and MUST pass the existing lint
suite (`npm run lint`, `composer run lint`) and test suite (`npm run test`, `composer run test`)
before merge. A short rationale summarizing the change MUST accompany the PR.

**Rationale**: The scaffold's generator and templates are exercised indirectly by every
downstream project; regressions here are silent until a consumer hits them, so the test/lint gate
is the primary safety net.

### V. Modularity, WordPress-Native Patterns & Scaffold Placeholder Integrity

Prefer minimal, modular solutions using WordPress-native mechanisms (`theme.json`, core block
components, standard WP APIs) over bespoke code; justify heavier dependencies with a clear
ROI/maintenance-cost rationale. Scaffold placeholder tokens (mustache variables such as
`{{slug}}`, `{{name}}`, `{{namespace}}`, and the default example identifiers like
`example-plugin` they resolve from) MUST remain intentional: they are either resolved by the
generator for a consuming project, or explicitly documented as example/test-fixture content. An
unreplaced default placeholder that isn't documented as intentional is a defect.

**Rationale**: This principle formalizes what the LS-3726 prefix audit exists to check —
placeholder integrity is an ongoing property the scaffold must maintain, not a one-time cleanup.

## Technology & Tooling Constraints

- **Runtime/tooling versions**: Node.js 18.0+ / npm 8.0+, PHP 8.0+ with Composer, WordPress 6.0+
  for testing.
- **Build system**: Webpack via `@wordpress/scripts`; block metadata via `block.json`.
- **Templating**: Mustache variables for plugin/block scaffolding templates; all generated
  `block.json`/config JSON MUST validate against the schemas under `.github/schemas/`.
- **Fields**: Secure Custom Fields (SCF) JSON is the supported custom-fields mechanism; SCF JSON
  changes MUST validate against `.github/schemas/scf-field-group.schema.json`.
- **Testing stack**: PHPUnit (`tests/php`), Jest (`*.test.js`), Playwright-style e2e specs
  (`tests/e2e`).

## Development Workflow

- **Branching**: Branch names MUST follow `{type}/{scope}-{short-description}` per the org
  [branching strategy](https://github.com/lightspeedwp/.github/blob/develop/docs/BRANCHING_STRATEGY.md),
  using the prefix matching the linked issue's type (e.g. `feat/`, `fix/`, `audit/`, `refactor/`,
  `docs/`) unless a documented, reviewer-agreed exception applies.
- **PRs**: Every PR MUST link its originating issue, use the PR template matching the issue/PR
  type label, include a changelog entry when the change is user-facing, and pass CI (lint + tests)
  before merge.
- **Reviews**: Reviewers MUST verify compliance with Principles I-V above; deviations MUST be
  called out explicitly in the PR description with a rationale, not silently merged.
- **Project tracking files**: Multi-step task/project tracking documents belong under
  `.github/projects/active/` (moved to `.github/projects/completed/` when done), never in the
  repository root or `docs/`, per `.github/custom-instructions.md`.

## Governance

This constitution supersedes ad hoc practice where the two conflict. Amendments require:

1. A PR modifying this file with a Sync Impact Report (as an HTML comment) describing what
   changed and why.
2. A version bump following semantic versioning: MAJOR for backward-incompatible principle
   removals/redefinitions, MINOR for new principles or materially expanded guidance, PATCH for
   wording/clarification-only changes.
3. Review and approval like any other PR; no self-merged constitutional changes.

All feature plans generated via Spec Kit (`/speckit-plan`) MUST evaluate their Constitution Check
gate against the principles above, and any justified violation MUST be recorded in that plan's
Complexity Tracking table rather than silently ignored. Use `AGENTS.md` and
`.github/custom-instructions.md` for day-to-day operational guidance that implements these
principles in detail.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date of these
practices (AGENTS.md / coding-standards instructions) was not recorded; backfill if known | **Last Amended**: 2026-09-11
