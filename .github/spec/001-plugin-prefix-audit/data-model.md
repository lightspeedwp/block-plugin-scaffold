# Phase 1 Data Model: Plugin Prefix Audit

This feature has no application data model (no database, no runtime entities). The "entities" below describe the shape of the audit report content only.

## Finding

Represents a single occurrence of the default prefix pattern in the repository.

| Field | Type | Description |
|---|---|---|
| `file` | string (path) | Repo-relative path of the file containing the occurrence |
| `excerpt` | string | Short line/snippet showing the match in context |
| `area` | enum | One of: `php-core`, `js-build-tooling`, `scss`, `json-config-schema`, `patterns`, `docs-other` |
| `classification` | enum | `intentional`, `unreplaced`, or `needs-review` (see spec FR-002/FR-002b) |
| `risk` | string | Present only when `classification = unreplaced`; what breaks or degrades if left unfixed |
| `remediation` | string | Present only when `classification = unreplaced`; concrete next action (e.g. "replace with `{{slug}}` token", "update generator script") |
| `ambiguity_note` | string | Present only when `classification = needs-review`; one-line description of why it couldn't be confidently classified (spec FR-002b) |

Validation rules (from spec FR-002/FR-002a/FR-002b/FR-003):
- Every `Finding` MUST have a `classification` of exactly one of the three values above.
- Every `unreplaced` `Finding` MUST have both `risk` and `remediation` populated (non-empty).
- `intentional` findings MAY omit `risk`/`remediation` but SHOULD carry a short rationale instead (why it's intentional).
- `needs-review` findings MUST have `ambiguity_note` populated (non-empty).
- A candidate match that is a substring of a longer, unrelated identifier (not a complete token per FR-002a) is a false positive: it is excluded from `Finding`s entirely and instead noted once in the Audit Report's `scope` field.

## Audit Report

The committed document aggregating all findings.

| Field | Type | Description |
|---|---|---|
| `scope` | string | What was searched (paths included/excluded, prefix pattern variants) |
| `checklist` | list of {item, status} | The LS-3726 audit checklist items and their completion status |
| `findings` | list of `Finding`, grouped by `area` | The full finding set |
| `remediation_summary` | list of {area, action, count} | Remediation actions grouped by area/component for follow-up assignment |

No state transitions apply — the report is a point-in-time snapshot generated once per audit run.
