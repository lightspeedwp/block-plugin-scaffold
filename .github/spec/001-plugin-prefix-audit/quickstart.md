# Quickstart: Validating the Plugin Prefix Audit

## Prerequisites

- Checked out on `refactor/core-plugin-prefix-audit`
- `grep`/`ripgrep` available locally (no other tooling required)

## Reproduce the search that backs the audit report

```bash
grep -rIln \
  -e 'example-plugin' -e 'Example_Plugin' -e 'EXAMPLE_PLUGIN' \
  -e 'example_plugin' -e 'ExamplePlugin' \
  --exclude-dir=node_modules --exclude-dir=vendor --exclude-dir=.git \
  --exclude-dir=build --exclude-dir=dist \
  .
```

**Expected outcome**: The file list matches (or is a superset consciously narrowed by) the files enumerated in `audit-report.md`'s findings section — every file in this output is either listed as a finding or explicitly excluded with a stated reason (e.g., build artifact).

## Validate classification completeness

`audit-report.md` may group several `intentional` files under one bullet for brevity (e.g. all `scripts/` generator files in one line), so counting bullets alone undercounts files — count file paths (each is backtick-quoted) instead:

```bash
grep -oE '`[^`]+`' .github/spec/001-plugin-prefix-audit/audit-report.md | sort -u | wc -l
```

**Expected outcome**: manually cross-check this against the search's file list (minus the self-referential spec-kit artifacts excluded in the report's Scope section — see Scope) and against the report's own stated totals in its Summary paragraph (intentional / unreplaced / needs-review counts, per spec FR-002/FR-002b's three classifications). No file should be omitted, double-counted, or left unclassified.

## Validate remediation completeness

Open `audit-report.md` and confirm every finding classified `unreplaced` has a non-empty `- Risk: ...` and `- Remediation: ...` line beneath it (per data-model.md validation rules).

## Validate the checklist

Confirm every LS-3726 audit checklist item (scope defined and agreed; areas/components listed; audit tools or standards referenced; risks and findings documented; remediation actions mapped) is checked off in `audit-report.md`'s checklist section, or explicitly marked not applicable with a reason.

## Out of scope for this validation

This audit does not change plugin behavior, so there is nothing to run/build/test beyond the checks above — the existing PHP (`composer test` / `tests/php`) and JS (`npm test`) suites are unaffected and do not need to be re-run specifically for this feature, though they should still pass as part of normal CI.
