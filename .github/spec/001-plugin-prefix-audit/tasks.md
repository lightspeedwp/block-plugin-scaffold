---
description: "Task list template for feature implementation"
---

# Tasks: Plugin Prefix Audit

**Input**: Design documents from `.github/spec/001-plugin-prefix-audit/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — this is an audit/documentation deliverable, not application code (per plan.md Technical Context). No test tasks are included.

**Organization**: Tasks are grouped by user story to enable independent verification of each story's slice of the audit report.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files/sections, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single deliverable file: `.github/spec/001-plugin-prefix-audit/audit-report.md`, built up incrementally across phases. No application source paths are touched (audit is read-only per FR-007).

---

## Phase 1: Setup

**Purpose**: Establish the audit report skeleton and confirm the search scope before any classification work begins.

- [X] T001 Create `.github/spec/001-plugin-prefix-audit/audit-report.md` with a header (title, date, linked Linear issue LS-3726, linked spec.md) and empty section stubs for Scope, Checklist, Findings (by area), and Remediation Summary
- [X] T002 Run the repository-wide search from quickstart.md (`grep -rIln -e 'example-plugin' -e 'Example_Plugin' -e 'EXAMPLE_PLUGIN' -e 'example_plugin' -e 'ExamplePlugin' --exclude-dir=node_modules --exclude-dir=vendor --exclude-dir=.git --exclude-dir=build --exclude-dir=dist .`) and save the raw file list as the working candidate list for classification
- [X] T003 [P] Write the Scope section of `audit-report.md`: paths/patterns searched, exclusions applied (`node_modules`, `vendor`, `.git`, build/dist), and the prefix variants covered (per research.md Decision: Search method and pattern set)

**Checkpoint**: Candidate file list exists and the report's Scope section documents exactly how it was produced.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Every candidate file must be classified intentional/unreplaced before risk/remediation (US2) or report assembly (US3) can proceed.

**⚠️ CRITICAL**: No User Story 2 or 3 work can begin until every candidate file has a classification.

- [X] T004 For each file in the T002 candidate list, first discard any match that is only a substring of a longer, unrelated identifier (not a complete token per spec FR-002a) as a false positive, noting it once in the report's Scope section; then apply the classification rule from spec FR-002: files under `tests/`, `scripts/`, `.github/schemas/examples/`, or onboarding documentation are `intentional`; other occurrences (`inc/`, `src/`, `patterns/`, root-level `package.json`/`composer.json` non-documentation fields, non-example `.github/schemas/*.schema.json`) are `unreplaced`; anything that cannot be confidently placed in either is `needs-review` with a one-line ambiguity note (spec FR-002b)
- [X] T005 Record each classified file as a Finding entry (file, excerpt, area, classification, and `ambiguity_note` if `needs-review`) in `.github/spec/001-plugin-prefix-audit/audit-report.md`, per the Finding fields defined in data-model.md — area MUST be one of `php-core`, `js-build-tooling`, `scss`, `json-config-schema`, `patterns`, `docs-other`
- [X] T006 Cross-check that every file from the T002 candidate list has exactly one classification recorded (no omissions, no duplicates), per data-model.md validation rule "Every Finding MUST have a classification of exactly one of the three values"

**Checkpoint**: Every candidate file is classified and recorded as a Finding — User Stories 1, 2, and 3 can now proceed.

---

## Phase 3: User Story 1 - Locate every unreplaced default prefix (Priority: P1) 🎯 MVP

**Goal**: A categorized, complete findings list in the audit report, grouped by area/component, distinguishing intentional placeholders from unreplaced leftovers.

**Independent Test**: Run the search command from quickstart.md and confirm every resulting file appears in the audit report's findings, each with a classification — no file left unaccounted for (Spec §SC-001).

### Implementation for User Story 1

- [X] T007 [US1] Group the Finding entries recorded in T005 by `area` under the audit report's Findings section headings (PHP core, JS/build tooling, SCSS, JSON config/schemas, patterns, docs/other) in `.github/spec/001-plugin-prefix-audit/audit-report.md`
- [X] T008 [US1] For each `intentional` Finding, add a one-line rationale (why it's intentional — e.g. "test fixture simulating generator output") next to its entry, per Spec §Acceptance Scenario 2 (User Story 1)
- [X] T009 [US1] Run the quickstart.md "Reproduce the search" and "Validate classification completeness" commands against the completed report and confirm the file counts match with none left unclassified

**Checkpoint**: User Story 1 is independently complete — the report fully inventories and classifies every occurrence (Spec §SC-001).

---

## Phase 4: User Story 2 - Document risks and remediation actions (Priority: P2)

**Goal**: Every `unreplaced` Finding carries a risk statement and a concrete remediation action, and remediation actions are grouped for follow-up assignment.

**Independent Test**: Review the audit report and confirm every `unreplaced` Finding has non-empty Risk and Remediation fields, and a Remediation Summary groups actions by area (Spec §SC-002).

### Implementation for User Story 2

- [X] T010 [US2] For each `unreplaced` Finding from Phase 3, add a Risk statement (what breaks/degrades if left unfixed) in `.github/spec/001-plugin-prefix-audit/audit-report.md`, per data-model.md's required `risk` field
- [X] T011 [US2] For each `unreplaced` Finding, add a Remediation action (concrete next step, e.g. "replace with `{{slug}}` token", "update generator script in scripts/") in the same report, per data-model.md's required `remediation` field
- [X] T012 [US2] [P] Build the Remediation Summary section (`{area, action, count}` per data-model.md's Audit Report entity) grouping remediation actions by area/component so they can be assigned as discrete follow-up tasks (Spec §FR-004, Acceptance Scenario 2 of User Story 2)

**Checkpoint**: User Story 2 is independently complete — every unreplaced finding is actionable without re-investigation (Spec §SC-002, SC-004).

---

## Phase 5: User Story 3 - Produce an auditable, checklist-driven report (Priority: P3)

**Goal**: The audit report documents its own checklist status against the LS-3726 issue's audit checklist, ready for a PR reviewer to sign off.

**Independent Test**: Confirm every LS-3726 checklist item (scope defined and agreed; areas/components listed; audit tools or standards referenced; risks and findings documented; remediation actions mapped) is checked off or explicitly marked not applicable with a reason (Spec §SC-003).

### Implementation for User Story 3

- [X] T013 [US3] Fill the Checklist section of `.github/spec/001-plugin-prefix-audit/audit-report.md` with the five LS-3726 audit checklist items and mark each satisfied (referencing the report section that satisfies it) or explicitly not-applicable with a reason, per Spec §FR-006
- [X] T014 [US3] Walk through `.github/spec/001-plugin-prefix-audit/checklists/audit.md` (requirements-quality checklist) and resolve/clarify any items that materially affect report content before finalizing (e.g. CHK005 classification boundary, CHK012 substring false positives)
- [X] T015 [US3] Write a short summary paragraph at the top of the audit report (scope, total findings, intentional vs. unreplaced counts, top remediation groups) suitable for pasting into the PR description, per Spec §Acceptance Scenario 1 of User Story 3

**Checkpoint**: All three user stories complete — the audit report is reviewable end-to-end and satisfies the LS-3726 Definition of Done's audit-specific items.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency pass and PR preparation.

- [X] T016 [P] Update `CHANGELOG.md` with an entry for the audit (per LS-3726 DoD "Documentation/changelog updated (if applicable)"), or note explicitly why no entry is needed if the audit produces no user-facing change
- [X] T017 Re-run the full quickstart.md validation sequence (search reproduction, classification completeness, remediation completeness, checklist) against the finished `audit-report.md` and confirm no gaps remain
- [ ] T018 Confirm the branch `refactor/core-plugin-prefix-audit` and PR reference LS-3726, that the PR description links to `audit-report.md`, and that PR/issue labels match org standards (`type:audit`, `area:core`, per LS-3726's existing labels), per LS-3726 DoD ("PR uses correct branch prefix (audit/)" — note: this repo's PR will use `refactor/` per prior explicit decision — flag this deviation in the PR description)
- [ ] T020 Before requesting review, add a note in the PR description explicitly asking the reviewer to confirm SC-004: that they can identify risk + remediation for any given unreplaced finding using only `audit-report.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (needs the T002 candidate list) — BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational (Phase 2) completion
  - US1 has no dependency on US2/US3
  - US2 depends on US1's Findings existing (T005/T007) to attach risk/remediation to
  - US3 depends on US1 (findings) and US2 (remediation) content to summarize and checklist against
- **Polish (Phase 6)**: Depends on all three user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependency on other stories (MVP)
- **User Story 2 (P2)**: Builds on User Story 1's Finding entries (needs `unreplaced` findings to exist first) — not independently startable before US1, but independently *verifiable* once its own fields are added
- **User Story 3 (P3)**: Builds on User Story 1 and 2's content to produce the summary and checklist sign-off — not independently startable before US1/US2, but independently *verifiable* once its own sections are added

### Parallel Opportunities

- T003 (Scope section) can run in parallel with T002 (search) once the search command itself is finalized
- Within Phase 2, classification (T004) for different areas of the file list can be split across contributors, then merged before T006's cross-check
- T012 (Remediation Summary) can be built in parallel with finishing T010/T011 for the last few findings, since it only aggregates counts once most findings are in
- T016 (changelog) can run in parallel with T017/T018 (final validation and PR prep)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch in parallel:
Task: "Create audit-report.md skeleton with section stubs"
Task: "Run repository-wide grep search and save candidate file list"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (classify every candidate file — CRITICAL, blocks all stories)
3. Complete Phase 3: User Story 1 (grouped, classified findings list)
4. **STOP and VALIDATE**: Run quickstart.md's search-reproduction and classification-completeness checks
5. This alone satisfies the core audit inventory need even before risk/remediation detail is added

### Incremental Delivery

1. Setup + Foundational → candidate list fully classified
2. Add User Story 1 → validate independently → inventory complete (MVP)
3. Add User Story 2 → validate independently → every unreplaced finding actionable
4. Add User Story 3 → validate independently → report is PR-ready with checklist sign-off
5. Polish → changelog, final validation, PR prep

## Notes

- [P] tasks = different files/sections, no dependencies
- [Story] label maps task to specific user story for traceability
- This audit produces zero application-code changes (per FR-007) — every task edits only `audit-report.md`, the checklist, or `CHANGELOG.md`
- Verify quickstart.md checks pass before considering a phase checkpoint complete
- Commit after each phase checkpoint
- Avoid: reclassifying a file without updating its Finding entry everywhere it's referenced (Findings list, Remediation Summary, report summary paragraph)

---

## Phase 7: Convergence

**Purpose**: Close gaps found by `/speckit-converge` between the feature's spec/plan/constitution and the current state of the feature's artifacts, appended after the constitution was ratified to v1.0.0 subsequent to this plan's original Constitution Check.

- [X] T019 Re-evaluate plan.md's Constitution Check section against the now-ratified constitution v1.0.0 (Principles I-V) and update it to state actual compliance, or record any justified violation in Complexity Tracking, per Constitution Governance (contradicts)

---

## Phase 8: Convergence

**Purpose**: Close gaps found by a second `/speckit-converge` pass, run after `/speckit-implement` produced `audit-report.md` and after the `/speckit-analyze` remediation (F1-F4) was applied.

- [X] T021 Rewrite quickstart.md's "Validate classification completeness" commands to match audit-report.md's actual bullet-list format (not a markdown table) and to count all three classifications (`intentional`, `unreplaced`, `needs-review`) per spec FR-002/FR-002b (contradicts)
- [X] T022 Add a `summary` field to the Audit Report entity's field list in data-model.md, matching the summary paragraph audit-report.md actually has (per tasks.md T015) (partial)

---

## Phase 9: Convergence

**Purpose**: Close a gap found by a third `/speckit-converge` pass, run after T021/T022 landed.

- [X] T023 Reword quickstart.md's "Validate remediation completeness" section to match audit-report.md's actual bulleted `Risk:`/`Remediation:` line format instead of "row"/"columns" table language, per data-model.md validation rules (contradicts)
