# Implementation Plan: Scaffold Toolchain Modernisation

**Branch**: `documentation/003-scaffold-toolchain-modernisation` (planning only; each implementation phase gets its own `feat/`, `chore/` or `ci/` branch) | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/.github/spec/003-scaffold-toolchain-modernisation/spec.md`

**Source**: [WordPress Scaffold Package Plan](https://docs.google.com/document/d/1kgs7pj9Sxfom4vtA5UBVMIkMY57rqx_EKV2H43Qa8KA/edit) (Google Doc)

## Summary

Bring the block plugin scaffold, and every plugin it generates, onto one standard WordPress toolchain:

- one config file per tool, each extending the official preset;
- the 10 standard command aliases shared with the theme scaffold;
- Playwright-only end-to-end testing;
- pre-commit hooks that are actually installed;
- the current stable major of every `@wordpress/*` package.

The main technical move is a **Standard Toolchain Definition** (`scripts/toolchain/standard-toolchain.json`). It replaces the hard-coded manifest in `generatePackageJson()`. Changes are first proven in a **test plugin** generated from a user-supplied config, then moved back into the scaffold. Regenerating the test plugin must reproduce them exactly. A **generation check** (`npm run check:generation`) then repeats that proof in CI on committed fixtures for every pull request.

The plan departs from the source document in five places, each justified in [research.md](./research.md):

1. The root manifest keeps its example values instead of switching to `{{slug}}` tags (R1).
2. Version ranges follow current stable releases, not the document's out-of-date numbers (R3).
3. ESLint uses the flat config format, not `.eslintrc.json` (R4).
4. Tools that `@wordpress/scripts` already provides are not listed twice (R5).
5. The doc's inline `sed` stub replacement in CI is replaced by real generation from fixture configs, after the changes are proven in a generated test plugin (R7, R14).

## Technical Context

**Language/Version**: JavaScript (Node.js ≥ 22.22, CommonJS scripts), PHP 8.0+ (plugin runtime; unchanged here), YAML (GitHub Actions)

**Primary Dependencies**: `@wordpress/scripts` 36.x (webpack, Babel, Jest 30, ESLint 9/10, Stylelint, npm-package-json-lint), `@wordpress/e2e-test-utils-playwright` 3.x, `@playwright/test` 1.6x, `husky` 9, `lint-staged` 17, `@wordpress/env` 10+

**Storage**: Files only (`package.json`, config files, JSON fixtures)

**Testing**: Jest (`scripts/__tests__`, `scripts/lib/__tests__`, `tests/bin`), the new `check:generation` integration command, Playwright end-to-end tests (`tests/e2e`), PHPUnit (unchanged)

**Target Platform**: Developer machines (macOS, Linux) and GitHub Actions `ubuntu-latest`

**Project Type**: A Node.js CLI generator plus a WordPress plugin template (single project)

**Performance Goals**: `check:generation` finishes within 6 minutes for each fixture on a GitHub-hosted runner with a warm npm cache. A generated plugin's first `build` finishes within 60 seconds.

**Constraints**: The scaffold must keep installing with `npm ci` and no extra step (R1). Generated plugin bundles must not contain WordPress packages (FR-006). No downgrades (FR-018). Each phase must be revertible on its own.

**Scale/Scope**: About 25 files changed across the scaffold. The generated output changes for every new client plugin. There are 2 generation fixtures and 1 new CI job.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design._

| Principle                                 | Assessment                                                                                                                                                                                                                                                                                   | Status                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **I. Org Coding Standards & Linting**     | The feature makes lint configs use the WordPress presets and adds package lint. Every phase ships its own lint fixes (the version jump in Phase 2 is expected to surface new ESLint and Stylelint findings, fixed in the same pull request).                                                 | ✅ Pass                                       |
| **II. Security & Data Handling**          | Removing the unused `puppeteer-core` shrinks the dependency surface. The generation fixtures contain only example metadata. The CI job uses no secrets and only reaches the npm registry. The pull request description must note the impact on `npm audit`.                                  | ✅ Pass                                       |
| **III. Accessibility & Performance**      | Dependency extraction keeps WordPress packages out of plugin bundles (FR-006, SC-007). The existing a11y end-to-end spec keeps running under the new Playwright config. No markup changes.                                                                                                   | ✅ Pass                                       |
| **IV. Test & Lint Gate on Every Change**  | Adds unit tests for `standard-toolchain.json` (schema and drift), `generatePackageJson()` (contract invariants) and the placeholder map, plus the `check:generation` integration gate as a required CI check.                                                                                | ✅ Pass                                       |
| **V. Modularity & Placeholder Integrity** | A single source of truth replaces duplicated version strings. Tools provided by `@wordpress/scripts` are not listed twice. Fixing `placeholders.js` and the leftover-placeholder scan directly enforce "an unreplaced default placeholder that isn't documented as intentional is a defect". | ✅ Pass                                       |
| **Tech & Tooling Constraints**            | The constitution states "Node.js 18.0+ / npm 8.0+". `@wordpress/scripts` 36 requires Node ≥ 22.22.                                                                                                                                                                                           | ⚠️ Amendment needed (see Complexity Tracking) |
| **Development Workflow**                  | Phased pull requests against `develop`, each with a changelog entry and rationale (FR-023). Branch names follow `{type}/{scope}-{description}`.                                                                                                                                              | ✅ Pass                                       |

**Post-design re-check (after Phase 1 artefacts)**: No new violations. The contracts keep scaffold-only tools out of generated plugins (Principle V), and the generation check is the gate that Principle IV asks for.

## Project Structure

### Documentation (this feature)

```text
.github/spec/003-scaffold-toolchain-modernisation/
├── spec.md
├── plan.md                       # This file
├── research.md                   # Phase 0: decisions R1–R13
├── data-model.md                 # Phase 1: toolchain definition, fixtures, placeholder map
├── quickstart.md                 # Phase 1: validation scenarios A–E
├── contracts/
│   ├── command-aliases.md
│   ├── generated-package-manifest.md
│   └── generation-check.md
├── checklists/
│   └── requirements.md
└── tasks.md                      # Phase 2: /speckit-tasks output
```

### Source Code (repository root)

```text
package.json                      # aliases, ranges, engines, prepare → husky
package-lock.json                 # regenerated in the version-jump phase
.nvmrc                            # 22
eslint.config.cjs                 # NEW (flat); replaces .eslintrc.cjs + .eslint.config.cjs
.stylelintrc.json                 # NEW; replaces .stylelint.config.cjs (tag-free pattern)
.prettierrc.js                    # kept; .prettier.config.cjs merged in and removed
.npmpackagejsonlintrc.json        # NEW; replaces .npmpackagejsonlintrc.cjs
jest.config.js                    # kept; .jest.config.cjs merged in and removed
playwright.config.js              # NEW; extends @wordpress/scripts Playwright config
.husky/pre-commit                 # NEW
.github/workflows/ci-cd.yml       # Node matrix 22/24; new generation-check job
.github/schemas/standard-toolchain.schema.json   # NEW
.specify/memory/constitution.md   # PATCH: Node/npm minimums

scripts/
├── generate-plugin.js            # generatePackageJson() reads toolchain; --output-dir; copies configs
├── toolchain/                    # NEW
│   ├── standard-toolchain.json
│   ├── check-generation.js
│   ├── compare-toolchain.js      # round-trip comparison of toolchain files
│   ├── fill-placeholders.js
│   └── __tests__/
│       ├── standard-toolchain.test.js
│       ├── generate-package-json.test.js
│       └── check-generation.test.js
└── utils/placeholders.js         # rewritten with plugin-scaffold keys

templates/                        # NEW: copied into generated plugins only
├── tests/                        # starter unit + e2e tests (FR-024)
└── github/workflows/ci.yml       # plugin CI workflow (FR-025)

tests/
├── fixtures/generation/          # NEW: default.json, functional-only.json
└── e2e/                          # unchanged specs; run via the new playwright.config.js

docs/
├── GENERATE_PLUGIN.md            # updated
└── INTERACTIVITY-AND-DATAVIEWS.md  # NEW short guide
README.md, DEVELOPMENT.md, CHANGELOG.md
.github/instructions/{javascript-react-development,jest-tests,playwright-tests,testing-e2e,blocks-development}.instructions.md
```

**Structure Decision**: Single project. The new toolchain code goes in `scripts/toolchain/`, so it is excluded from generated plugins by the existing `scripts` entry in the generator's exclusion list. The config files that generated plugins need are copied explicitly by the generator from the root.

## Way of Working: Generate, Fix, Move Back

All toolchain work starts in a **test plugin** generated from a config the user supplies ([research.md R14](./research.md#r14-working-in-a-generated-test-plugin-first)):

```text
$TEST_CONFIG ──generate (current scaffold)──▶ $TEST_PLUGIN  (git init, baseline commit)
                                                   │  fix until green: one commit per change,
                                                   │  each naming its move-back target
                                                   ▼
                     scaffold sources ◀──move back── test plugin commits
                           │
                           └──regenerate (same config)──▶ /tmp/rt/<slug>
                                                             │
                     compare-toolchain $TEST_PLUGIN /tmp/rt/<slug>  ⇒ 0 differences
```

- **Fixing in the test plugin** (tasks T001–T017) changes nothing in the scaffold, and each step can be undone with Git in the test plugin.
- **Moving back** (T018–T034) is mostly mechanical. The risky parts, the version jump and the config rewrite, have already been proven to work.
- **The round trip** (T035–T037) is the acceptance gate for pull request 1. The CI generation check (T038–T043) then repeats it on committed fixtures for every future pull request.

## Delivery Phases (pull requests)

| Pull request                  | Source document phase | Scope                                                                                                                                                                                                                    | User stories | Risk                                                                      |
| ----------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------- |
| _(no PR)_ Test plugin         | —                     | Generate, audit and fix until green; prove the modern APIs work. Recorded in `config-audit.md` and the test plugin's Git history                                                                                         | US1, US4     | Low: scaffold untouched                                                   |
| **1. Toolchain moved back**   | Phases 1 and 2        | `standard-toolchain.json` and schema, `generatePackageJson()`, exclusions, one config per tool, starter test and CI templates, Composer `lint:fix`, Husky, version jump, Node 22, placeholder map, round-trip comparison | US1, US3     | Medium: already proven in the test plugin, and the round trip is the gate |
| **2. Generation check in CI** | Phase 3               | Fixtures, `check:generation`, the required `generation-check` job, first-push CI proof                                                                                                                                   | US2          | Low                                                                       |
| **3. Docs and governance**    | Phase 4               | Interactivity and DataViews guide, docs, instruction files, constitution PATCH                                                                                                                                           | US4, US5     | Low                                                                       |

## Complexity Tracking

| Violation                                                                                                                | Why Needed                                                                                                                                   | Simpler Alternative Rejected Because                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The constitution's _Technology & Tooling Constraints_ says Node 18+ / npm 8+; this plan requires Node ≥ 22.22 / npm ≥ 10 | `@wordpress/scripts` 36 (the current stable release) declares `node: ^22.22.2 \|\| ^24.15.0 \|\| >=26`. Node 18 and 20 are past end of life. | Staying on `@wordpress/scripts` 31 would keep Node 18 support, but it contradicts FR-018 (current stable majors) and the source document's aim of removing dependency drift. Handled as a PATCH amendment to the constitution in pull request 3 (task T047), with a Sync Impact Report. |
| Deviations from the source document (R1, R3, R4, R5)                                                                     | Following the document literally would downgrade packages, break `npm ci` on the scaffold, and use a config format ESLint 10 removes.        | Each deviation keeps the document's _intent_. They are listed in the spec's _Context_ section so reviewers can check them against the document.                                                                                                                                         |
