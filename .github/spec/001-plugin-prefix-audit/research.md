# Phase 0 Research: Plugin Prefix Audit

## Decision: Search method and pattern set

**Decision**: Use `grep -rIl` (or `rg`) across the repository root, excluding `node_modules`, `vendor`, `.git`, and build/dist output directories, with a pattern set covering the default prefix's case/format variants: `example-plugin`, `Example_Plugin`, `EXAMPLE_PLUGIN`, `example_plugin`, `ExamplePlugin`.

**Rationale**: The scaffold has no existing lint rule or custom tool for this; a plain recursive text search is sufficient to enumerate candidate files, and is fast enough to re-run repeatedly as findings are classified. Restricting to case/format variants of one known placeholder token avoids false positives from unrelated identifiers.

**Alternatives considered**:
- A custom Node/PHP script performing AST-aware search — rejected as unnecessary complexity for a one-time (or infrequently re-run) audit; plain text search already surfaces every file needing manual classification.
- Restricting search to specific file extensions only — rejected because the spec explicitly requires PHP, JS, SCSS, JSON, and pattern (`.php` pattern templates) coverage, and a broader search catches config/docs files that also need classification (e.g. `composer.json`, `package.json`).

## Decision: Classification criteria (intentional vs. unreplaced)

**Decision**: A finding is "intentional" when it lives in `tests/`, `scripts/` (generator/build tooling), `.github/schemas/examples/`, or documentation that explicitly demonstrates the placeholder for onboarding purposes. Every other occurrence — particularly in `inc/`, `src/`, `patterns/`, root-level `package.json`/`composer.json` metadata fields not used as documentation, and `.github/schemas/*.schema.json` (non-example) — is "unreplaced" pending manual confirmation.

**Rationale**: Matches the existing repository convention already established by the prior commits on this branch (`da53948`, `23e5aaa`) which replaced prefix usage in `inc/`, `src/`, and config files while leaving test fixtures and generator scripts referencing `example-plugin` intentionally (since those simulate/validate the generation process itself).

**Alternatives considered**: Treating all occurrences as findings requiring remediation regardless of location — rejected because it would flag hundreds of legitimate test-fixture lines as defects, diluting the report's usefulness (per spec Edge Cases and Assumptions).

## Decision: Report location and format

**Decision**: Commit the audit report as `.github/spec/001-plugin-prefix-audit/audit-report.md`, a single markdown document grouping findings by area/component (PHP core, JS/build tooling, SCSS, JSON config/schemas, patterns), each with file path, excerpt, classification, risk, and remediation action.

**Rationale**: Keeps the audit deliverable colocated with its spec/plan for traceability, linkable from the PR description and the Linear issue (LS-3726), consistent with FR-005.

**Alternatives considered**: Posting findings only as PR/issue comments — rejected, not durable or diffable, and harder for a future maintainer to consult independent of the PR discussion.
