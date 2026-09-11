# Audit Report: Plugin Prefix Audit

**Date**: 2026-09-11
**Linked issue**: [LS-3726](https://linear.app/lightspeedwp/issue/LS-3726/audit-block-plugin-scaffold-identify-unreplaced-default-prefixes) — audit: Block Plugin Scaffold - identify unreplaced default prefixes
**Spec**: [spec.md](./spec.md)

## Summary

This audit searched the entire repository for the scaffold's default prefix (`example-plugin` and its case/format variants) and classified every occurrence. Of **51 files** matched by the search, **8 are this feature's own spec-kit artifacts** (self-referential — including this report itself — they discuss the audit, they are not scaffold source subject to replacement) and are excluded from classification below. Of the remaining **43 files**, **33 are intentional** (test fixtures, generator/build tooling, documented examples) and **10 are unreplaced** — genuine leftover defaults, three of which are functionality-breaking (a broken Composer autoload mapping, a broken webpack entry-point import, and an unreplaced package identity). Zero files were classified `needs-review`, and zero false-positive substring matches were found (FR-002a).

**Top remediation groups**: `json-config-schema` (3 unreplaced: `package.json`, `composer.json`, the SCF schema's `$id`) and `patterns` (6 unreplaced: all pattern docblock headers except the one that already uses the `{{name}}` token correctly).

## Scope

**Searched**: entire repository, all file types, for the tokens `example-plugin`, `Example_Plugin`, `EXAMPLE_PLUGIN`, `example_plugin`, `ExamplePlugin` (FR-001, spec Assumptions).

**Command** (per quickstart.md):

```bash
grep -rIln -e 'example-plugin' -e 'Example_Plugin' -e 'EXAMPLE_PLUGIN' \
  -e 'example_plugin' -e 'ExamplePlugin' \
  --exclude-dir=node_modules --exclude-dir=vendor --exclude-dir=.git \
  --exclude-dir=build --exclude-dir=dist .
```

**Excluded directories**: `node_modules`, `vendor`, `.git`, `build`, `dist` (FR-001).

**Excluded as self-referential** (not scaffold source; these are this feature's own planning artifacts — including this report itself — which necessarily discuss "example-plugin" as their subject matter): `.github/spec/001-plugin-prefix-audit/{spec.md,plan.md,research.md,quickstart.md,tasks.md,audit-report.md,checklists/audit.md}`, `.specify/memory/constitution.md` (8 files).

**False positives (FR-002a)**: none found — every match found is a complete-token occurrence (a full slug, namespace, identifier, or string value), not a substring inside a longer unrelated identifier.

**Needs-review (FR-002b)**: none — every remaining file classified cleanly as intentional or unreplaced under the FR-002 directory/role rule.

## Checklist (LS-3726 audit-content items, per spec FR-006)

- [x] **Scope defined and agreed** — see Scope section above.
- [x] **Areas/components listed** — findings grouped below by `php-core`, `js-build-tooling`, `json-config-schema`, `patterns`, `docs-other` (no `scss` matches this run).
- [x] **Audit tools or standards referenced** — `grep -rIln` per research.md's Decision, classification rule per spec FR-002/FR-002a/FR-002b.
- [x] **Risks and findings documented** — see Findings and Remediation Summary below.
- [x] **Remediation actions mapped** — see Remediation Summary below.

(The remaining 3 LS-3726 checklist items — PR description updated, changelog entry, labels/types — are PR-process items per FR-006, handled by the PR itself, not this report.)

## Findings

### json-config-schema

- `package.json` — **unreplaced**
  - Excerpt: `"name": "example-plugin"` (also: `bin`/`makepot` slugs, `homepage`/`repository`/`bugs` URLs, `"namespace": "example_plugin"`, semantic-release config — 9 occurrences total)
  - Risk: the published package name, slug, homepage/repo URLs, i18n textdomain/pot-generation commands, and release-tooling namespace all hardcode the scaffold's own identity. A generated project would ship with the scaffold's identity instead of its own, breaking npm package identity, i18n textdomain matching, and release tooling.
  - Remediation: replace every hardcoded value with the generator's `{{slug}}`/`{{namespace}}`/`{{name}}` mustache tokens, matching the templating already used in `inc/*.php` and `patterns/*.php`.

- `composer.json` — **unreplaced**
  - Excerpt: `"name": "example_plugin/example-plugin"`; `"psr-4": { "ExamplePlugin\\": "inc/" }`
  - Risk: **build-breaking**. Classes in `inc/*.php` already use the mustache token `{{namespace}}\classes` (correctly templated), but composer.json's PSR-4 autoload key is not templated — Composer's autoloader will not resolve any class in `inc/` for a generated plugin once `{{namespace}}` is substituted.
  - Remediation: change the PSR-4 key to a templated value (e.g. `{{namespace}}\\": "inc/"`) and replace the package `"name"` field the same way.

- `.github/schemas/scf-field-group.schema.json` — **unreplaced**
  - Excerpt: `"$id": "https://https://example.com/plugins/example-plugin/scf-json/schema/scf-field-group.schema.json"`
  - Risk: low — schema validation still functions, but the `$id` misrepresents this generic, scaffold-level schema as a per-plugin instance, and is inconsistent with living outside `.github/schemas/examples/`.
  - Remediation: change `$id` to a generic, scaffold-level identifier not tied to any specific plugin slug.

- `.github/schemas/examples/plugin-config.example.json` — intentional (explicitly under `.github/schemas/examples/`, an example fixture by design).

### patterns

- `patterns/{{slug}}-archive.php` — **unreplaced**
- `patterns/{{slug}}-card.php` — **unreplaced**
- `patterns/{{slug}}-featured.php` — **unreplaced**
- `patterns/{{slug}}-grid.php` — **unreplaced**
- `patterns/{{slug}}-meta.php` — **unreplaced**
- `patterns/{{slug}}-single.php` — **unreplaced**
  - Excerpt (each): docblock header hardcodes e.g. `* ExamplePlugin Archive Pattern`
  - Risk: generated plugins would ship pattern file headers displaying the scaffold's own example name instead of the consuming project's name — a branding/documentation inconsistency (not build-breaking), and inconsistent with the sibling file `{{slug}}-slider.php`, whose header correctly reads `{{name}} Slider Pattern`.
  - Remediation: replace the hardcoded `ExamplePlugin` in each docblock with the `{{name}}` token, matching `{{slug}}-slider.php`.

### js-build-tooling

- `src/index.js` — **unreplaced**
  - Excerpt: `import './blocks/example-plugin-card';` (also `-collection`, `-slider`, `-featured`)
  - Risk: **build-breaking**. These import paths don't match the actual block directory names (`src/blocks/{{block_slug}}-collection`, `{{block_slug}}-field-display`, `{{block_slug}}-slider`) — the webpack build fails with import errors, for the scaffold itself and any generated project.
  - Remediation: update the import paths in `src/index.js` to the same `{{block_slug}}`-based paths as the actual block directories.

- `scripts/blocks.test.js`, `scripts/components.test.js`, `scripts/dry-run/__tests__/dry-run-config.test.js`, `scripts/dry-run/__tests__/test-dry-run.js`, `scripts/dry-run/dry-run-config.js`, `scripts/generate-plugin.js`, `scripts/generate-plugin.test.js`, `scripts/lib/wizard.js`, `scripts/update-version.js`, `scripts/validation/__tests__/validate-plugin-config.test.js` — intentional (generator/build tooling under `scripts/`; e.g. `wizard.js`'s `slug: 'example-plugin'` is the wizard's own default value, and `generate-plugin.js`'s matches are comments describing its own replacement logic).
- `tests/e2e/collection.spec.js`, `tests/e2e/dry-run-e2e.spec.js`, `tests/e2e/post-type.spec.js`, `tests/e2e/slider.spec.js` — intentional (test fixtures under `tests/`).

### php-core

- `tests/bootstrap.php`, `tests/phpstan-bootstrap.php`, `tests/php/test-block-registration.php`, `tests/php/test-dry-run.php`, `tests/php/test-fields.php`, `tests/php/test-options.php`, `tests/php/test-plugin-main.php`, `tests/php/test-post-types.php`, `tests/php/test-scf-json-fixtures.php`, `tests/php/test-scf-json-meta.php`, `tests/php/test-scf-json-save-load.php`, `tests/php/test-scf-json-schema-validation.php`, `tests/php/test-scf-json.php`, `tests/php/test-taxonomies.php`, `tests/php/test-uninstall.php` — intentional (all under `tests/`).

### docs-other

- `.github/instructions/scaffold-extensions.instructions.md` — intentional (documentation demonstrating usage with example code).
- `.github/reports/SCAFFOLD-RELEASE-PREPARATION-2025-12-15.md` — intentional (historical point-in-time report documenting a past rename).
- `CHANGELOG.md` — intentional (historical changelog entry documenting a past rename, e.g. `wp-block-example_plugin-example_plugin-*` → `wp-block-{{namespace}}-{{slug}}-*`).

### scss

No matches found in this run.

## Remediation Summary

| Area | Action | Count |
|---|---|---|
| json-config-schema | Replace hardcoded plugin identity/namespace with `{{slug}}`/`{{namespace}}`/`{{name}}` tokens in `package.json`; template the PSR-4 autoload key in `composer.json` | 2 |
| json-config-schema | Change the SCF schema's `$id` to a generic, non-plugin-specific identifier | 1 |
| patterns | Replace hardcoded `ExamplePlugin` in pattern docblock headers with `{{name}}`, matching `{{slug}}-slider.php` | 6 |
| js-build-tooling | Fix `src/index.js` import paths to match actual `{{block_slug}}`-based block directory names | 1 |

**Total unreplaced findings**: 10 (3 build/autoload-breaking: `composer.json`, `src/index.js`, and — to a lesser extent — `package.json`'s i18n/release wiring; 6 cosmetic/branding: pattern docblocks; 1 low-risk identifier: SCF schema `$id`).
**Total intentional findings**: 33.
**Total needs-review findings**: 0.
