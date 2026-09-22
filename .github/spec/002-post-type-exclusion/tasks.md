---

description: "Task list for feature implementation"
---

# Tasks: Functional-Only Generation Mode (Post Type & Taxonomy Exclusion)

**Input**: Design documents from `.github/spec/002-post-type-exclusion/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/plugin-config-schema-delta.md](./contracts/plugin-config-schema-delta.md), [quickstart.md](./quickstart.md)

**Tests**: Included — plan.md's Constitution Check (Principle IV) requires a test/lint gate on every change, so each behavioural task has a paired test task.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Single project (Node.js CLI generator) — paths are relative to the repository root `/Users/warwick/Local Sites/Tools/block-plugin-scaffold`.

---

## Phase 1: Setup

**Purpose**: Test fixture needed by every later phase's tests

- [x] T001 Create functional-only fixture config `tests/fixtures/plugin-config.functional-only.json` with `slug`, `name`, `author`, and `"content_model": "none"` (no `post_types`/`taxonomies`/`fields`), per [data-model.md](./data-model.md) and [quickstart.md](./quickstart.md) Scenario A

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `content_model` flag must exist in the schema and be resolvable to a single derived boolean before any generation-path task can use it

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 Add `content_model` property (`"type": "string"`, `"enum": ["none", "custom"]`, `"default": "custom"`) and the conditional constraint disallowing non-empty `post_types`/`taxonomies` when `content_model` is `"none"` to `.github/schemas/plugin-config.schema.json`, per [contracts/plugin-config-schema-delta.md](./contracts/plugin-config-schema-delta.md)
- [x] T003 [P] In `scripts/generate-plugin.js`, derive `fullConfig.isFunctionalOnly = (config.content_model === 'none')` inside `applyDefaults()` (~line 283), alongside the existing `post_types`/`taxonomies` normalization, per research.md's "Where the generator reads the flag" decision
- [x] T004 [P] In `scripts/generate-plugin.js`, add an explicit conflict check inside `validateConfig()` (~line 241): if `config.content_model === 'none'` and (`post_types.length > 0` or `taxonomies.length > 0`), return `{ valid: false, errors: [...] }` with a human-readable message naming both fields (FR-009), evaluated before/alongside the Ajv schema check
- [x] T005 [P] In `scripts/validation/validate-plugin-config.js`, add a `validateContentModel(config)` helper mirroring the existing `validateTaxonomies(config)` pattern (~line 83), returning the same conflict error as T004 in array form, and export it from `module.exports`

**Checkpoint**: `content_model` is schema-valid, derivable, and conflict-checked — user story implementation can now begin

---

## Phase 3: User Story 2 - Generated plugin contains no content-model artefacts (Priority: P1) 🎯 MVP

**Goal**: When `fullConfig.isFunctionalOnly` is true, the generated plugin output contains none of the content-model-specific files, and everything else is untouched

**Independent Test**: Generate a plugin from the T001 fixture and inspect the output tree per [quickstart.md](./quickstart.md) Scenario A

### Implementation for User Story 2

- [x] T006 [US2] In `scripts/generate-plugin.js` `generatePlugin()` (~line 814), when `fullConfig.isFunctionalOnly` is true, extend the `excludePaths` array passed to `copyDirWithReplacement()` with the content-display pattern files (`patterns/{{slug}}-grid.php`, `-archive.php`, `-card.php`, `-featured.php`, `-meta.php`, `-single.php`, `-slider.php`) and `scf-json/group_{{slug}}_example.json`, per FR-005 and the data-model.md file-presence matrix
- [x] T007 [US2] In the same `excludePaths` construction from T006, additionally exclude the content-model-dependent JS hooks (`src/hooks/usePostType.js`, `src/hooks/useTaxonomies.js`, `src/hooks/useCollection.js`), components (`src/components/TaxonomyFilter`, `src/components/PostSelector`), and the collection block (`src/blocks/{{block_slug}}-collection`) when `fullConfig.isFunctionalOnly` is true, per FR-006
- [x] T008 [US2] Add a new helper `stripExcludedModuleExports(outputDir, isFunctionalOnly)` in `scripts/generate-plugin.js`, called from `generatePlugin()` after `copyDirWithReplacement()`, that removes the corresponding `export { default as X } from './X';` lines for `usePostType`, `useTaxonomies`, `useCollection` from the copied `src/hooks/index.js`, and for `PostSelector`, `TaxonomyFilter` from the copied `src/components/index.js`, only when `isFunctionalOnly` — prevents broken imports left over from T007's file exclusion
- [x] T009 [US2] In `scripts/generate-plugin.js` `generatePlugin()`, add `!fullConfig.isFunctionalOnly &&` to the existing guard conditions around the `generatePerCPTBlocks()` call (~line 853) and the `generatePostTypeJSONFiles()`/`generateTaxonomySCFGroups()` calls (~line 877), as defence-in-depth alongside the existing `post_types.length > 0` checks (FR-004)
- [x] T010 [US2] Add `scripts/__tests__/generate-plugin.functional-only.test.js`: call `generatePlugin()` with the T001 fixture against a temporary `process.cwd()` (restore afterwards), and assert the full file-presence/absence matrix from [data-model.md](./data-model.md) — none of the T006/T007 paths exist, while `src/index.js`, `package.json`, `composer.json`, and `inc/*.php` are present; add a second case using an existing content-model fixture (e.g. `tests/fixtures/plugin-config.example.json`) asserting those same files ARE present, to guard SC-003 backward compatibility

**Checkpoint**: A functional-only config now produces a content-model-free output tree; a content-model config is unaffected

---

## Phase 4: User Story 1 - Choose functional-only mode during the conversational wizard (Priority: P1)

**Goal**: The generate-plugin agent asks a single up-front content-model question and skips Stages 2–5 entirely for a functional-only answer

**Independent Test**: Walk through `.github/agents/generate-plugin.agent.md`'s documented flow per [quickstart.md](./quickstart.md) Scenario D

### Implementation for User Story 1

- [x] T011 [US1] In `.github/agents/generate-plugin.agent.md`, insert a new question between "Stage 1: Plugin Identity" and "Stage 2: Custom Post Type (CPT)" asking whether the plugin needs a custom content type (post type/taxonomy) or is functional-only, with an explicit instruction that a functional-only answer sets `content_model: "none"` and skips directly to "Stage 6: Blocks Configuration" (FR-001, FR-002)
- [x] T012 [US1] In the same file's "Conversation Flow Example" section, update the example transcript to show the agent asking the new content-model question immediately after Stage 1 and branching to a functional-only path (or note the existing example remains the content-model branch, and add a short functional-only alternative example)
- [x] T013 [US1] In the same file's "Final Configuration Summary" example block, add a "Content model: none / custom" line to the yaml-style summary shown before generation confirmation (FR-012)

**Checkpoint**: Both P1 stories are complete — the wizard question drives the flag, and the generator honours it

---

## Phase 5: User Story 3 - Explicit, unambiguous configuration flag (Priority: P2)

**Goal**: Config-driven (non-wizard) use of `content_model` is documented and validated with the same rigour as the wizard path

**Independent Test**: Run the generator directly against a hand-authored config per [quickstart.md](./quickstart.md) Scenarios A and C

### Implementation for User Story 3

- [ ] T014 [US3] Document the `content_model` flag (name, allowed values, default, interaction with `post_types`/`taxonomies`, and which generated files it affects) in `docs/JSON-POST-TYPES.md` (FR-010, FR-011)
- [ ] T015 [US3] Add test case(s) to `scripts/validation/__tests__/validate-plugin-config.test.js` covering `validateContentModel()` from T005: a conflicting config returns an error naming both fields, a non-conflicting config (flag absent, or `"none"` with empty arrays) returns no error
- [ ] T016 [US3] Add a test case to `scripts/__tests__/generate-plugin.test.js` asserting `validateConfig()` rejects a config with `content_model: "none"` plus a non-empty `post_types` array, and that the returned error is human-readable (FR-009, SC-004)

**Checkpoint**: All three user stories are independently functional and tested

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation consistency, lint/test gate, and final validation against the quickstart guide

- [ ] T017 [P] Add a `"$comment"` to `.github/schemas/post-types.schema.json` noting that per-post-type JSON entries are not generated when the plugin config's top-level `content_model` is `"none"` (cross-reference for anyone editing this schema in isolation)
- [ ] T018 Run `npm run lint` (covers `lint:js`, `lint:pkg-json`, `lint:md:docs`) and fix any issues introduced by this feature's changes, per Constitution Principle I
- [ ] T019 Run `npm run test:unit` and confirm all new tests (T010, T015, T016) and the full existing suite pass, per Constitution Principle IV
- [ ] T020 Manually execute [quickstart.md](./quickstart.md) Scenarios A–D (or confirm equivalent automated coverage from T010/T015/T016/T019 for A–C) and update quickstart.md if any documented step no longer matches actual behaviour

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (fixture used by later tests, but schema/code changes in T002-T005 don't strictly need T001 first) — BLOCKS all user stories
- **User Story 2 (Phase 3)**: Depends on Foundational (T002-T005) — delivers the MVP (generator behaviour)
- **User Story 1 (Phase 4)**: Depends on Foundational only (T002-T005); independent of Phase 3's code changes but conceptually should follow it so the flag it sets is known to work
- **User Story 3 (Phase 5)**: Depends on Foundational (T002-T005); T015/T016 depend on T004/T005 existing
- **Polish (Phase 6)**: Depends on all prior phases being complete

### Parallel Opportunities

- T003, T004, T005 (all in Phase 2) touch different files and can run in parallel after T002
- T017 (Phase 6) can run any time after T002
- Phase 4 (US1, docs-only) and Phase 5 (US3, docs+tests) can be worked in parallel once Phase 2 is complete, independent of each other and of Phase 3

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 (fixture) + Phase 2 (flag plumbing) — Foundation ready
2. Complete Phase 3 (User Story 2) — a functional-only config now produces clean output; this is the smallest slice that fixes the concrete bug (unconditional static-file copy) driving this feature
3. **STOP and VALIDATE**: run T010's test, confirm Scenario A/B from quickstart.md

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US2) → generator honours the flag → validate independently (MVP)
3. Phase 4 (US1) → wizard sets the flag conversationally → validate independently
4. Phase 5 (US3) → config-driven/CI path fully documented and tested → validate independently
5. Phase 6 → lint, full test run, quickstart sign-off

---

## Notes

- Commit after each completed task (or small logical group of parallel `[P]` tasks), per the working agreement for this feature.
- No `[NEEDS CLARIFICATION]` markers remain from spec.md; all decisions were resolved in research.md.
- T008 (export-stripping helper) is not explicitly listed in plan.md's file touch-list but is required for correctness: excluding `usePostType.js`/`useTaxonomies.js`/`useCollection.js`/`PostSelector`/`TaxonomyFilter` without also removing their barrel-file (`index.js`) exports would ship a generated plugin with broken imports, which violates FR-004's/FR-006's intent as well as Constitution Principle IV (no shipping known-broken code).
