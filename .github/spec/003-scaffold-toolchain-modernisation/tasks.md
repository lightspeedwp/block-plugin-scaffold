---
description: 'Task list for feature implementation'
---

# Tasks: Scaffold Toolchain Modernisation

**Input**: Design documents from `.github/spec/003-scaffold-toolchain-modernisation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Included. The plan's Constitution Check (Principle IV) requires a test and lint gate on every change, so each behaviour change has a test task, written first.

**Organisation**: Tasks are grouped by user story so each story can be built and tested on its own. The _Delivery Phase_ table at the end maps tasks to the four pull requests in [plan.md](./plan.md#delivery-phases-pull-requests).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: The user story this task belongs to (US1–US5)

## Path Conventions

Single project (Node.js CLI generator plus a WordPress plugin template). Paths are relative to the repository root.

---

## Phase 1: Setup

**Purpose**: Folders, fixtures and the config-file audit that later phases rely on

- [ ] T001 Create `scripts/toolchain/` (with `__tests__/`) and `tests/fixtures/generation/`, each with a short `README.md` explaining its purpose
- [ ] T002 [P] Create the generation fixtures `tests/fixtures/generation/default.json` and `tests/fixtures/generation/functional-only.json` with test-only metadata (`slug: "lsx-gen-check"`, `author: "LightSpeed CI"`), validated against `.github/schemas/plugin-config.schema.json`, as described in [data-model.md §4](./data-model.md#4-generation-fixture)
- [ ] T003 [P] Audit which config file each tool actually loads (ESLint, Stylelint, Prettier, Jest, PostCSS, npm-package-json-lint), using `--print-config` or the tool's debug output. Record the results in `.github/spec/003-scaffold-toolchain-modernisation/config-audit.md`, including any rules that live only in a file that is never loaded ([research.md R4](./research.md#r4-config-file-formats))

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The single source of truth, the placeholder map and the output folder flag, which every user story needs

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create `.github/schemas/standard-toolchain.schema.json` with the fields and rules in [data-model.md §1](./data-model.md#1-standard-toolchain-definition)
- [ ] T005 Create `scripts/toolchain/standard-toolchain.json` with the scaffold's **current** ranges (no upgrades yet), `providedBy`, `scripts.standard`, `scripts.generated`, `scripts.deprecated`, `configFiles` and `lintStaged`, as described in [research.md R5](./research.md#r5-which-packages-a-generated-plugin-lists-directly)
- [ ] T006 [P] Write `scripts/toolchain/__tests__/standard-toolchain.test.js`. It validates the file against the schema, fails on any range that differs from the root `package.json` (drift test), and checks that `scripts.standard` has exactly the 10 aliases in [command-aliases.md](./contracts/command-aliases.md)
- [ ] T007 [P] Rewrite `scripts/utils/placeholders.js` with plugin-scaffold keys taken from `scripts/mustache-variables-registry.json`, using values that match the root manifest's example values. Add `scripts/utils/__tests__/placeholders.test.js`, which fails on any `{{…}}` tag found in a root config file that has no entry in the map ([research.md R6](./research.md#r6-filling-template-tags-in-the-scaffolds-own-config-files))
- [ ] T008 Add an `--output-dir <path>` flag to `scripts/generate-plugin.js`. The default stays `generated-plugins/<slug>`. Add a case to `tests/bin/generate-plugin.test.js`

**Checkpoint**: The toolchain definition exists and is checked for drift. The generator can write anywhere.

---

## Phase 3: User Story 1 — A generated plugin works out of the box (Priority: P1) 🎯 MVP

**Goal**: A generated plugin gets the full standard manifest and config files, and installs, builds, lints and passes unit tests with no edits.

**Independent Test**: [quickstart.md Scenario A](./quickstart.md#scenario-a--a-generated-plugin-works-out-of-the-box-us1)

### Tests for User Story 1 ⚠️ (write first; they must fail before implementation)

- [ ] T009 [P] [US1] Write `scripts/toolchain/__tests__/generate-package-json.test.js` covering every invariant in [generated-package-manifest.md](./contracts/generated-package-manifest.md): field order, no `{{…}}` tags, no scaffold example values, ranges equal to `standard-toolchain.json`, and optional fields left out when not set
- [ ] T010 [P] [US1] Add a test case in `tests/bin/generate-plugin.test.js` checking that an invalid slug (uppercase letters or spaces) is rejected before any file is written
- [ ] T011 [P] [US1] Add a test case in `scripts/toolchain/__tests__/generate-package-json.test.js` checking that `--in-place` regeneration updates standard keys and keeps client-added dependencies and scripts

### Implementation for User Story 1

- [ ] T012 [US1] Refactor `generatePackageJson()` in `scripts/generate-plugin.js` to build the manifest from `standard-toolchain.json` plus the config metadata, following the field contract. Remove the hard-coded versions
- [ ] T013 [US1] Add npm package-name validation for `slug` in `scripts/lib/config-schema.js` (and the JSON schema, if needed), so generation stops before writing files
- [ ] T014 [US1] Add the `--in-place` merge for an existing `package.json` in `scripts/generate-plugin.js`, logging a summary of the changes
- [ ] T015 [US1] Make the generator copy each `configFiles` entry from `standard-toolchain.json` into the generated output and strip scaffold-only overrides. Add an assertion to `tests/bin/generate-plugin.test.js` that exactly one config file per tool is present
- [ ] T016 [US1] Check that the generated plugin's PHP block and editor registration (`inc/` and the main plugin file template) loads dependencies from each `*.asset.php` and never from a hard-coded list. Fix any hard-coded list found (FR-006)
- [ ] T017 [US1] Run [quickstart.md Scenario A](./quickstart.md#scenario-a--a-generated-plugin-works-out-of-the-box-us1) and paste the results into the pull request description

**Checkpoint**: User Story 1 works on its own. A generated plugin is fully tooled.

---

## Phase 4: User Story 2 — Scaffold changes are proven against a generated plugin (Priority: P1)

**Goal**: One command, and one required CI job, generates a plugin from each fixture and proves it installs, builds, lints and tests cleanly.

**Independent Test**: [quickstart.md Scenario B](./quickstart.md#scenario-b--the-generation-check-catches-a-broken-template-us2)

### Tests for User Story 2 ⚠️

- [ ] T018 [P] [US2] Write `scripts/toolchain/__tests__/check-generation.test.js` for the leftover-placeholder scanner (an exported function) and the step runner's exit-code handling, using small temporary folders created in the test

### Implementation for User Story 2

- [ ] T019 [US2] Implement `scripts/toolchain/check-generation.js` following [generation-check.md](./contracts/generation-check.md): the 8 steps, `--fixture`, `--keep` and `--skip-install`, a temporary folder created with `fs.mkdtemp`, and a summary table
- [ ] T020 [US2] Add `"check:generation": "node scripts/toolchain/check-generation.js"` to `package.json` and to `standard-toolchain.json → scripts` (scaffold only)
- [ ] T021 [US2] Make the Stylelint class pattern tag-free (any `wp-block-*` namespace). Implement `scripts/toolchain/fill-placeholders.js --check` for any templated config file that remains, and run it as `prelint`
- [ ] T022 [US2] Add a `generation-check` job to `.github/workflows/ci-cd.yml` that runs `npm run check:generation` on Node `22.x` and `24.x` with npm caching, triggered on pull requests to `develop` and `main`
- [ ] T023 [US2] Document in the pull request description that a repository admin must add `generation-check` to the branch protection required checks for `develop` and `main`, since that is a repository setting, not a code change
- [ ] T024 [US2] Run [quickstart.md Scenario B](./quickstart.md#scenario-b--the-generation-check-catches-a-broken-template-us2), including both seeded breaks, and record the results in the pull request

**Checkpoint**: Generation is gated in CI. User Stories 1 and 2 together are the MVP.

---

## Phase 5: User Story 3 — The scaffold uses the same standard toolchain (Priority: P2)

**Goal**: One config per tool, current stable majors, no Puppeteer, hooks installed, standard aliases.

**Independent Test**: [quickstart.md Scenario C](./quickstart.md#scenario-c--the-scaffolds-own-toolchain-us3)

- [ ] T025 [US3] Raise every WordPress package and its tooling to the current stable major ([research.md R3](./research.md#r3-version-ranges-current-stable-majors-not-the-source-documents-numbers): check the registry again first) in `package.json` **and** `scripts/toolchain/standard-toolchain.json`. Add `@wordpress/interactivity`, `@wordpress/interactivity-router`, `@wordpress/dataviews` and `@wordpress/url`. Set `engines` to Node `>=22.22.0` / npm `>=10.0.0`, set `.nvmrc` to `22`, and regenerate `package-lock.json`
- [ ] T026 [US3] Create a flat `eslint.config.cjs` extending `@wordpress/eslint-plugin`, carrying over the rules that are actually loaded (from T003). Delete `.eslintrc.cjs` and `.eslint.config.cjs`, and fix any new lint findings in `src/`, `scripts/` and `tests/`
- [ ] T027 [P] [US3] Create `.stylelintrc.json` extending `@wordpress/stylelint-config` (SCSS) with the tag-free class pattern from T021. Delete `.stylelint.config.cjs` and fix any new findings in `src/**/*.scss`
- [ ] T028 [P] [US3] Merge the PHP and SCSS overrides from `.prettier.config.cjs` into `.prettierrc.js`, then delete `.prettier.config.cjs`
- [ ] T029 [P] [US3] Merge `.jest.config.cjs` into `jest.config.js`, then delete `.jest.config.cjs`. Fix any Jest 30 incompatibilities in `scripts/**/__tests__`, `tests/js` and `tests/__mocks__`
- [ ] T030 [P] [US3] Create `.npmpackagejsonlintrc.json` extending `@wordpress/npm-package-json-lint-config`, keeping the `@lightspeedwp` scope rule as an override. Delete `.npmpackagejsonlintrc.cjs`
- [ ] T031 [US3] Create `playwright.config.js` extending `@wordpress/scripts/config/playwright.config.js` with `testDir: './tests/e2e'` and `baseURL` from `WP_BASE_URL` (default `http://localhost:8888`). Point `test:e2e` at `wp-scripts test-playwright`, update `tests/e2e/setup.js` if needed, then remove `puppeteer-core` once `grep -r puppeteer scripts tests` confirms nothing uses it ([research.md R13](./research.md#r13-puppeteer-removal))
- [ ] T032 [P] [US3] Using the T003 audit, either rename `.postcss.config.cjs` to a name PostCSS loads, or delete it if `@wordpress/scripts` already applies `@wordpress/postcss-plugins-preset`
- [ ] T033 [P] [US3] Add `"prepare": "husky"` to `package.json` and commit `.husky/pre-commit` running `npx lint-staged`. Mirror both in `standard-toolchain.json` so generated plugins get them ([research.md R9](./research.md#r9-pre-commit-hooks))
- [ ] T034 [US3] Add the standard aliases `lint:pkg` and `zip` to `package.json`, keep `lint:pkg-json` and `plugin-zip` as deprecated aliases, update `lint` to call `lint:pkg`, and add a _Deprecated_ entry to `CHANGELOG.md` ([research.md R10](./research.md#r10-command-aliases))
- [ ] T035 [US3] Change the Node matrix to `[22.x, 24.x]` in every workflow under `.github/workflows/` that sets up Node (`ci-cd.yml`, `code-quality.yml`, `performance.yml`, `release.yml`, `i18n.yml`, `deploy-wporg.yml`, `agent-workflow.yml`)
- [ ] T036 [US3] Run `npm run lint`, `npm run test`, `npm run test:e2e` (with `wp-env`), `composer run lint` and `npm run check:generation`. Then run [quickstart.md Scenario C](./quickstart.md#scenario-c--the-scaffolds-own-toolchain-us3) and record the results

**Checkpoint**: The scaffold and generated plugins share one toolchain at current versions.

---

## Phase 6: User Story 4 — Modern WordPress APIs are ready to use (Priority: P3)

**Goal**: The Interactivity API and DataViews work in a generated plugin with no extra setup, and a short guide explains when to use them.

**Independent Test**: [quickstart.md Scenario D](./quickstart.md#scenario-d--modern-apis-are-available-us4)

- [ ] T037 [US4] Check that `npm run build` (both `scripts/build.js` and the generated `wp-scripts build`) outputs `viewScriptModule` entries with module asset files at the `@wordpress/scripts` version chosen in T025. Add the module flag to the build scripts or `webpack.config.js` if it is still needed ([research.md R12](./research.md#r12-interactivity-api-module-support))
- [ ] T038 [P] [US4] Write `docs/INTERACTIVITY-AND-DATAVIEWS.md` (one page, UK English): when to use each package, a minimal `block.json` and `viewScriptModule` example, a minimal DataViews admin example, and links to the handbook
- [ ] T039 [US4] Run [quickstart.md Scenario D](./quickstart.md#scenario-d--modern-apis-are-available-us4) and record the results

**Checkpoint**: Modern APIs are ready for the client features that follow.

---

## Phase 7: User Story 5 — The team and AI assistants follow the new standard (Priority: P3)

**Goal**: The docs and instruction files describe only the new toolchain.

**Independent Test**: [quickstart.md Scenario E](./quickstart.md#scenario-e--documentation-and-instructions-us5)

- [ ] T040 [P] [US5] Update `README.md`, `DEVELOPMENT.md` and `docs/GENERATE_PLUGIN.md` with the standard alias table, the one-config-per-tool list, the Node 22 requirement, `--output-dir` and `npm run check:generation`
- [ ] T041 [US5] Amend `.specify/memory/constitution.md` (PATCH): set _Technology & Tooling Constraints_ to Node ≥ 22.22 / npm ≥ 10, with a Sync Impact Report comment and a version bump to 1.0.1
- [ ] T042 [P] [US5] Update `.github/instructions/javascript-react-development.instructions.md`, `jest-tests.instructions.md`, `playwright-tests.instructions.md`, `testing-e2e.instructions.md` and `blocks-development.instructions.md` to reference the standard aliases, the `@wordpress/e2e-test-utils-playwright` fixtures, and the `useBlockProps`, `useSelect` and `useDispatch` hooks. Remove references to removed configs and to Puppeteer
- [ ] T043 [US5] Run [quickstart.md Scenario E](./quickstart.md#scenario-e--documentation-and-instructions-us5) and fix any remaining references

**Checkpoint**: The documentation matches the toolchain.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T044 Add a `CHANGELOG.md` entry to each delivery pull request (_Added_, _Changed_, _Deprecated_ or _Removed_, as applicable)
- [ ] T045 [P] Run `npm audit --omit=dev` before and after T025, and record the change in the Phase 2 pull request (Constitution Principle II)
- [ ] T046 [P] Raise an issue in `lightspeedwp/block-theme-scaffold` that links [command-aliases.md](./contracts/command-aliases.md), so both scaffolds agree on the 10 alias names (SC-006)
- [ ] T047 Update the AGENTS.md _Agent Test Status_ table if any agent scripts under `scripts/agents/` were touched by T026–T029

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)**: none.
- **Foundational (Phase 2)**: needs Setup. Blocks every user story.
- **US1 (Phase 3)**: needs Foundational.
- **US2 (Phase 4)**: needs Foundational. T019 uses the generator's `--output-dir` (T008). Its full run (T024) needs US1, so the generated plugin has lint configs to run.
- **US3 (Phase 5)**: needs Foundational and T003. T025 must come before T026–T031, because the new configs need the new package majors. T027 needs T021.
- **US4 (Phase 6)**: needs T025 (the new `@wordpress/scripts` and the added packages).
- **US5 (Phase 7)**: best done last, so the docs describe the final state. T041 can be done any time after T025.
- **Polish (Phase 8)**: runs alongside each delivery pull request.

### Within each story

Tests (T009–T011, T018) are written first and must fail before implementation. Within a story, change the toolchain definition before the generator, and the generator before the CI.

### Parallel opportunities

- T002 and T003 in parallel.
- T006 and T007 in parallel (different files) after T004 and T005.
- T009, T010 and T011 in parallel.
- After T025 and T026: T027, T028, T029, T030, T032 and T033 in parallel (separate config files).
- T038, T040 and T042 in parallel (separate docs).

### Parallel example: User Story 3 config files

```text
After T025 + T026 merge into the Phase 2 branch:
  T027 .stylelintrc.json
  T028 .prettierrc.js merge
  T029 jest.config.js merge
  T030 .npmpackagejsonlintrc.json
  T032 PostCSS config
  T033 Husky hook
```

---

## Delivery Phase Mapping (pull requests)

| Pull request                        | Branch                          | Tasks                        | Source document phase              |
| ----------------------------------- | ------------------------------- | ---------------------------- | ---------------------------------- |
| 1. Lock & single source of truth    | `feat/003-toolchain-definition` | T001–T024 (without T022)     | Phase 1 _Repository Audit & Lock_  |
| 2. Config uniformity & version jump | `chore/003-toolchain-upgrade`   | T025–T032, T035, T045        | Phase 2 _Configuration Uniformity_ |
| 3. CI & hooks                       | `ci/003-generation-check`       | T022, T023, T033, T034, T036 | Phase 3 _CI/CD Pipeline Update_    |
| 4. Modern APIs & docs               | `docs/003-toolchain-docs`       | T037–T043, T046, T047        | Phase 4 _Documentation & Rollout_  |

T044 (changelog) applies to every pull request.

## Implementation Strategy

### MVP first (User Stories 1 and 2)

1. Setup, then Foundational.
2. US1: generated plugins get the standard manifest and configs at the **current** versions.
3. US2: the generation check proves it, locally first.
4. **Stop and validate**: run Scenarios A and B. This is shippable as pull request 1, with no version changes yet, so the risk is low.

### Incremental delivery

5. Pull request 2 (US3, version jump): the riskiest change, isolated, with the generation check already in place to catch regressions in generated output.
6. Pull request 3: make the generation check a required CI job, and turn on hooks and aliases.
7. Pull request 4: modern API readiness and documentation.

### Notes

- [P] tasks touch different files and have no unfinished dependencies.
- Commit after each task or logical group. Each pull request uses the matching template in `.github/PULL_REQUEST_TEMPLATES/`.
- Run `/speckit-analyze` before starting implementation, to cross-check the spec, plan and tasks.
