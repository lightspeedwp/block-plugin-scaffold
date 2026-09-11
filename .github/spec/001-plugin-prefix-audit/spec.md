# Feature Specification: Plugin Prefix Audit

**Feature Branch**: `refactor/core-plugin-prefix-audit`

**Created**: 2026-09-11

**Status**: Draft

**Input**: User description: "Audit: Block Plugin Scaffold - identify unreplaced default prefixes. Identify all locations in the Block Plugin Scaffold where the default prefix (e.g. 'example-plugin') has not been replaced with the project's actual plugin slug/namespace, across PHP, JS, SCSS, JSON config, and pattern files. Audit checklist: scope defined, areas/components listed, audit tools/standards referenced, risks/findings documented, remediation actions mapped. Acceptance criteria: audit scope and checklist completed; findings and risks documented; remediation actions assigned and tracked; documentation/changelog updated if applicable. Linear issue: LS-3726."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Locate every unreplaced default prefix (Priority: P1)

As a maintainer preparing to hand off or release a project generated from the Block Plugin Scaffold, I want a complete, categorized list of every place the scaffold's default prefix (`example-plugin` and its case/format variants) still appears, so that I can confirm which occurrences are legitimate (test fixtures, generator templates, documentation examples) and which are leftover placeholders that should have been replaced during generation.

**Why this priority**: Without a complete inventory, unreplaced prefixes ship into client projects, causing naming collisions, inconsistent branding, and broken assumptions about the plugin's slug/namespace. This is the foundational deliverable the rest of the audit depends on.

**Independent Test**: Can be fully tested by running the audit against the current repository state and confirming the resulting findings list accounts for every match of the default prefix pattern across PHP, JS, SCSS, JSON, and pattern files, with each match classified as "intentional" or "unreplaced".

**Acceptance Scenarios**:

1. **Given** the scaffold's source tree, **When** the audit is run, **Then** every file containing the default prefix is listed with its path, line context, and a classification (intentional template placeholder vs. unreplaced/leftover).
2. **Given** a file that is an intentional generator template or test fixture, **When** it is reviewed, **Then** it is excluded from the "unreplaced" remediation list and recorded as intentional with a rationale.

---

### User Story 2 - Document risks and remediation actions (Priority: P2)

As a maintainer, I want each unreplaced-prefix finding paired with a risk note and a concrete remediation action, so that follow-up work can be assigned and tracked without re-investigating the same code.

**Why this priority**: An inventory without remediation guidance shifts the investigation burden onto whoever picks up the follow-up work, slowing down the fix.

**Independent Test**: Can be fully tested by reviewing the audit output and confirming every "unreplaced" finding has an associated risk statement and a specific remediation action (e.g., "replace with `{{slug}}` token", "update generator script").

**Acceptance Scenarios**:

1. **Given** an unreplaced-prefix finding, **When** it is recorded, **Then** it includes a risk statement (what breaks or degrades if left unfixed) and a remediation action.
2. **Given** the full set of findings, **When** the audit concludes, **Then** remediation actions are grouped by area/component so they can be assigned as discrete follow-up tasks.

---

### User Story 3 - Produce an auditable, checklist-driven report (Priority: P3)

As a reviewer, I want the audit's scope, checklist, and findings recorded in a standard format, so that I can verify the audit was thorough and sign off on it as part of the PR.

**Why this priority**: Consistent audit reporting is required by the org's audit PR template and Definition of Done, and makes the audit repeatable for future scaffold changes.

**Independent Test**: Can be fully tested by confirming the audit checklist items (scope defined, areas/components listed, tools/standards referenced, risks/findings documented, remediation actions mapped) are all checked off with supporting content in the PR/documentation.

**Acceptance Scenarios**:

1. **Given** the audit is complete, **When** the PR is opened, **Then** the PR description includes the audit scope, checklist status, and a summary of findings and remediation actions.
2. **Given** the audit checklist, **When** reviewed, **Then** every item is either completed or explicitly marked not applicable with a reason.

### Edge Cases

- What happens when the default prefix appears inside a binary or generated/build artifact (e.g. `node_modules`, `vendor`, compiled `build/` output)? These are out of scope and MUST be excluded from findings.
- How does the audit handle case-format variants (`example-plugin`, `Example_Plugin`, `EXAMPLE_PLUGIN`, `example_plugin`, `ExamplePlugin`)? Resolved by FR-002a: a match is only counted if it forms a complete token (see FR-002a); a match found only as a substring of a longer, unrelated identifier is a false positive and is excluded, with a one-line note of why.
- How does the audit treat files that intentionally document or demonstrate the default prefix for onboarding purposes (e.g. README usage examples)? Resolved by FR-002: these fall under the "intentional" classification.
- What happens when a file cannot be confidently classified as either "intentional" or "unreplaced"? Resolved by FR-002b: it is recorded as a third classification, "needs-review", with the specific ambiguity stated, rather than being forced into one of the other two.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The audit MUST enumerate every file under the repository (excluding `node_modules`, `vendor`, `.git`, and build output directories) containing the default prefix or its case/format variants.
- **FR-002**: The audit MUST classify each occurrence into exactly one of three classifications:
  - **"intentional"**: the file is under `tests/`, `scripts/` (generator/build tooling), `.github/schemas/examples/`, or is documentation that explicitly demonstrates the placeholder for onboarding purposes.
  - **"unreplaced"**: the occurrence is in any other location (e.g. `inc/`, `src/`, `patterns/`, root-level `package.json`/`composer.json` non-documentation fields, non-example `.github/schemas/*.schema.json`) and is a leftover default that should reflect the consuming project's actual slug/namespace.
  - **"needs-review"** (see FR-002b): the occurrence cannot be confidently placed in either category above.
- **FR-002a**: A match only counts as an occurrence of the default prefix if it forms a complete token (e.g. a full path segment, a full identifier, or a full string value) — not merely a substring inside a longer, unrelated identifier. Matches that are substrings of a longer unrelated identifier are false positives, MUST be excluded from findings, and MUST be noted with a one-line reason in the audit report's Scope section (so the exclusion is visible, not silent).
- **FR-002b**: When a file cannot be confidently classified as "intentional" or "unreplaced" under FR-002's criteria, it MUST be recorded as "needs-review" with a one-line note of the specific ambiguity, rather than being forced into one of the other two classifications.
- **FR-003**: The audit MUST record, for each "unreplaced" finding, the file path, a short excerpt/line reference, a risk statement, and a proposed remediation action.
- **FR-004**: The audit MUST group findings by area/component (e.g. PHP core classes, JS/build tooling, SCSS, JSON config/schemas, block patterns) to support assigning follow-up work.
- **FR-005**: The audit output MUST be committed to the repository as `.github/spec/001-plugin-prefix-audit/audit-report.md` (per plan.md's Structure Decision) so it is reviewable in the PR and referenceable from the linked Linear issue.
- **FR-006**: The audit report MUST reference and confirm the 5 audit-content checklist items from the LS-3726 issue template that this spec's deliverables satisfy: scope defined and agreed; areas/components listed; audit tools or standards referenced; risks and findings documented; remediation actions mapped. The remaining 3 LS-3726 checklist items — "PR description updated with relevant details," "Changelog entry prepared for PR (if applicable)," and "Labels/types match org standards" — are PR-process items, not audit-content items; they are satisfied by the PR itself (see tasks T016/T018), not by the audit report's content, and are out of this FR's scope.
- **FR-007**: The audit MUST NOT modify source code, and MUST NOT perform remediation (actually replacing unreplaced prefixes), as part of this change. Remediation is out of scope here and is tracked as separate follow-up action items generated from the audit report's Remediation Summary.

### Key Entities

- **Finding**: A single occurrence of the default prefix pattern — file path, line/excerpt, classification (intentional/unreplaced/needs-review), area/component, risk statement, remediation action.
- **Audit Report**: The committed document aggregating all findings, the audit scope (including excluded false positives per FR-002a), checklist status, and a remediation action summary grouped by area/component.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of files containing the default prefix pattern are accounted for in the audit report (classified as intentional, unreplaced, or needs-review — see FR-002).
- **SC-002**: Every "unreplaced" finding has a documented risk statement and remediation action, with zero findings left unclassified.
- **SC-003**: The audit checklist (per LS-3726, FR-006) is fully completed with no unchecked items at PR submission.
- **SC-004**: A reviewer who did not author the report can, for any given "unreplaced" finding, identify its risk and remediation action from the audit report alone — verified by a PR reviewer explicitly confirming this in the PR review (e.g. a review comment or approval note referencing the report), without needing to re-search the codebase or ask the author for context.

## Assumptions

- "Default prefix" refers to `example-plugin` and its common case/format variants (`Example_Plugin`, `EXAMPLE_PLUGIN`, `example_plugin`, `ExamplePlugin`) used throughout the scaffold as the placeholder plugin slug/namespace.
- Occurrences inside `node_modules`, `vendor`, `.git`, and build/dist output are out of scope since they are not part of the maintained source.
- Test fixtures and generator templates that intentionally reference `example-plugin` (to be replaced by the scaffold's own generation tooling for downstream consumers) are "intentional" per FR-002. This audit does NOT verify that the generator tooling actually performs that replacement correctly for a downstream consumer — that verification is explicitly out of scope for this change and is not asserted as validated; it would require a separate follow-up (e.g. running the generator end-to-end and diffing its output), tracked as its own action item if pursued.
- This audit produces findings and remediation recommendations; it does not itself implement the replacements (per FR-007). Actual replacement work is out of scope for this change.
- The audit report is committed as a markdown document under the repository (exact location decided during planning) so it is linkable from the PR and the Linear issue.
