# Implementation Plan: Plugin Prefix Audit

**Branch**: `refactor/core-plugin-prefix-audit` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `.github/spec/001-plugin-prefix-audit/spec.md`

## Summary

Audit the Block Plugin Scaffold repository for every occurrence of the default plugin prefix (`example-plugin` and its case/format variants) across PHP, JS, SCSS, JSON config, and pattern files. Classify each occurrence as an intentional generator/test placeholder or an unreplaced leftover, then produce a single committed audit report grouping findings by area/component with a risk statement and remediation action per unreplaced finding. No source-code remediation is performed in this change — only the audit and its report (per FR-007 / Assumptions in the spec).

## Technical Context

**Language/Version**: PHP 8.x (WordPress plugin), Node.js/JS (build tooling), Bash (audit scripting)

**Primary Dependencies**: `grep`/`rg` for pattern search, existing repo tooling only — no new runtime dependencies

**Storage**: N/A (audit output is a static markdown report committed to the repo)

**Testing**: N/A — this is a documentation/audit deliverable; no new automated tests are introduced. Existing PHP (`tests/php`) and JS (`*.test.js`, `tests/e2e`) suites are used only to confirm the audit did not require any code change (none is in scope) and continue to pass.

**Target Platform**: Repository source tree (`block-plugin-scaffold`), no runtime/deployment target

**Project Type**: Single project — audit/documentation task against the existing WordPress block-plugin scaffold repo

**Performance Goals**: N/A

**Constraints**: Audit MUST NOT modify plugin source behavior; MUST exclude `node_modules`, `vendor`, `.git`, and build/dist output from findings

**Scale/Scope**: Whole-repository text search across PHP/JS/SCSS/JSON/pattern files (see `find`/`grep` scope in research.md)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unpopulated template (all principle names/descriptions are placeholders; no version has been ratified). There are no ratified project principles to check this feature against, so this gate has nothing to enforce. No violations to record in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
.github/spec/001-plugin-prefix-audit/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── checklists/
    └── requirements.md   # Spec quality checklist (/speckit-specify output)
```

No `tasks.md` yet (created by `/speckit-tasks`, not this command). No `contracts/` — this feature has no external interface (API, CLI contract, schema) to document; the audit report itself is the only deliverable artifact.

### Source Code (repository root)

```text
block-plugin-scaffold/            # existing WordPress block-plugin scaffold (unchanged structure)
├── inc/                          # PHP core classes — searched for unreplaced prefix
├── src/                          # JS components/hooks/utils — searched for unreplaced prefix
├── patterns/                     # block pattern templates — searched for unreplaced prefix
├── .github/schemas/              # JSON config/schemas — searched for unreplaced prefix
├── scripts/                      # generator/build tooling — searched, and reviewed for whether
│                                  # it correctly replaces the default prefix during generation
├── tests/                        # PHP + JS test fixtures — searched, expected to intentionally
│                                  # reference the default prefix
└── .github/spec/001-plugin-prefix-audit/
    └── audit-report.md           # NEW: the committed audit deliverable (Phase 1 output, see data-model.md)
```

**Structure Decision**: No new application code paths are introduced. The only new artifact is the audit report at `.github/spec/001-plugin-prefix-audit/audit-report.md`, colocated with this feature's spec/plan for traceability from the Linear issue and PR. The audit itself is performed as a repository-wide text search (documented in research.md) rather than new tooling, matching FR-007's constraint that this change is audit-only.

## Complexity Tracking

Not applicable — no Constitution violations (see Constitution Check above).
