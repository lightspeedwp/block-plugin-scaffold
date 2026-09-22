# Implementation Plan: Functional-Only Generation Mode (Post Type & Taxonomy Exclusion)

**Branch**: `feat/generator-functional-only-mode` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.github/spec/002-post-type-exclusion/spec.md`

## Summary

Let a user tell the generate-plugin agent/wizard and `plugin-config.json` that a plugin is functional-only (blocks/settings, no custom content model), so the conversational wizard skips all post-type/taxonomy/field/repeater discovery, and the generator skips writing content-model JSON, content-display patterns, and content-model-dependent JS hooks/components/blocks — while every other generation path (block registration, build tooling, core `inc/` classes) stays byte-identical to today.

Technical approach: add one explicit boolean config property (`content_model: false`, see Research for naming decision) read early in `scripts/generate-plugin.js`; wrap the currently-unconditional static-file copy calls for content-model files in a guard alongside the existing `post_types.length > 0` guards; add a schema-level mutual-exclusion rule between the new flag and non-empty `post_types`/`taxonomies`; insert one new question at the top of the `generate-plugin.agent.md` conversational flow, with an explicit skip instruction for Stages 2–5 when answered "functional only".

## Technical Context

**Language/Version**: Node.js 18+ (per `package.json` engines), CommonJS scripts under `scripts/`

**Primary Dependencies**: None new — reuses the existing generator's own file-copy/templating utilities (`copyDirWithReplacement`, `copyFileWithReplacement`, `applyDefaults`) in `scripts/generate-plugin.js`; existing AJV-based schema validation for `plugin-config.json`

**Storage**: N/A — file-system generation only (reads `plugin-config.json`, writes to `output-plugin/` or `generated-plugins/<slug>/` or in-place per existing generator modes)

**Testing**: Jest for JS generator logic (`npm run test:unit`, `npm run test:dry-run`), existing PHPUnit/SCF suites are unaffected (no PHP registration code exists in this scaffold), plus manual dry-run generation smoke test (`npm run test:dry-run`) verifying output-tree contents for both modes

**Target Platform**: CLI tool run locally or via the `generate-plugin` GitHub Copilot/agent chat inside VS Code; output is a WordPress plugin (WordPress 6.5+, PHP 8.0+)

**Project Type**: Single project — Node.js CLI generator (not a web/mobile app; no frontend/backend split)

**Performance Goals**: N/A — generation is a one-shot local file-write operation; no new perf-sensitive path introduced

**Constraints**: Must remain 100% backward compatible for any config that omits the new flag (Constitution Principle V — placeholder/behavioural integrity); must not introduce PHP CPT/taxonomy registration code (violates the scaffold's SCF-Local-JSON-only architecture note at the top of `generate-plugin.agent.md`)

**Scale/Scope**: Touches one generator script (`scripts/generate-plugin.js`), one agent doc (`.github/agents/generate-plugin.agent.md`), two JSON schemas (`plugin-config.schema.json`, `post-types.schema.json`), one doc (`docs/JSON-POST-TYPES.md`), plus associated unit/dry-run test fixtures. No new top-level modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Org Coding Standards & Linting** — PASS. Change is plain JS/Markdown/JSON edits to existing files; will run `npm run lint` (lint:js, lint:pkg-json, lint:md:docs) as part of the change, no new tooling.
- **II. Security & Data Handling** — PASS. No secrets, credentials, or customer data involved; purely structural generation-config logic.
- **III. Accessibility & Performance** — N/A / PASS. Functional-only mode *removes* generated markup/blocks (fewer artefacts, not new UI), so no new a11y/perf surface is introduced. Existing generated blocks/patterns are unaffected in content-model mode.
- **IV. Test & Lint Gate on Every Change** — PASS (planned). New/updated Jest unit tests for the config-validation conflict rule (FR-009) and for generator output-tree assertions in both modes (FR-004–FR-008); existing `npm run test:dry-run` extended with a functional-only fixture config.
- **V. Modularity, WordPress-Native Patterns & Placeholder Integrity** — PASS, and this feature directly reinforces it: functional-only mode ensures a plugin with no content model never ships mustache-resolved but semantically orphaned content-model files (e.g. a `{{slug}}-grid.php` pattern with nothing to grid). No new placeholder tokens are introduced.

No violations — Complexity Tracking table is not required.

## Project Structure

### Documentation (this feature)

```text
.github/spec/002-post-type-exclusion/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── plugin-config-schema-delta.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
# Single project (CLI generator) — existing layout, edits only, no new top-level dirs

scripts/
├── generate-plugin.js              # applyDefaults(), generatePerCPTBlocks(),
│                                    # generatePostTypeJSONFiles(), generateTaxonomySCFGroups(),
│                                    # generateSCFFieldGroup(), copyDirWithReplacement() call site
│                                    # — add content-model guard here
├── validate-post-types.js          # CPT validation — add early-exit when functional-only
└── validation/
    └── validate-plugin-config.js   # add FR-009 conflict check (flag + non-empty post_types/taxonomies)

.github/
├── agents/
│   └── generate-plugin.agent.md    # insert content-model question before Stage 2
├── schemas/
│   ├── plugin-config.schema.json   # add new flag property + conflict rule
│   └── post-types.schema.json      # document flag's relationship to this schema (if needed)
└── spec/002-post-type-exclusion/   # this feature's spec artefacts

docs/
└── JSON-POST-TYPES.md              # document functional-only flag and skipped files

tests/
├── unit/ (or wherever Jest specs for scripts/generate-plugin.js live today)
│   └── generate-plugin.functional-only.test.js   # new
└── fixtures/
    └── plugin-config.functional-only.json         # new dry-run fixture
```

**Structure Decision**: Single-project CLI generator layout (existing). No new directories at the repository root; all changes are edits to existing generator/schema/doc/test files plus one new test fixture and one new test spec, following the codebase's existing file organisation.

## Complexity Tracking

*No Constitution Check violations — this section is not applicable.*
