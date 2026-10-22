# Quickstart: Validating Scaffold Toolchain Modernisation

**Feature**: [spec.md](./spec.md) | **Contracts**: [contracts/](./contracts/)

Use these scenarios to prove each user story works end to end. Run them from the repository root on Node 22 or later.

## Prerequisites

```bash
nvm use
```

```bash
npm ci
```

```bash
composer install
```

---

## Scenario A — The test plugin works out of the box (US1)

Run this in the hand-fixed test plugin (`$TEST_PLUGIN`, tasks T005–T015), and again in the regenerated copy (T037).

```bash
cd "$TEST_PLUGIN" && npm install && npm run build && npm run lint:js && npm run lint:css && npm run lint:pkg && npm run test:unit
```

```bash
cd "$TEST_PLUGIN" && npm run env:start && npm run test:e2e
```

```bash
cd "$TEST_PLUGIN" && composer install && composer run lint
```

**Expected**:

- Every command exits with code 0, and the install reports no `ERESOLVE` warnings.
- `package.json` matches [generated-package-manifest.md](./contracts/generated-package-manifest.md).
- `build/blocks/*/` each contain `index.js` and `index.asset.php`, and each `dependencies` array lists `wp-*` handles. The bundles contain no React or WordPress package source.
- No scaffold-only files are present (`.github/skills`, `.github/spec`, the scaffold's workflows and similar). `.github/workflows/ci.yml` is the plugin's own workflow.
- `tests/js` and `tests/e2e` contain the starter tests, and both test commands run them.
- The root contains exactly one each of `eslint.config.cjs`, `.stylelintrc.json`, `.prettierrc.js`, `.npmpackagejsonlintrc.json` and `playwright.config.js`.

## Scenario B — The generation check catches a broken template (US2)

```bash
npm run check:generation
```

**Expected**: Both fixtures pass all 8 steps in [generation-check.md](./contracts/generation-check.md).

Then, on a throwaway branch, change one `devDependencies` range in `scripts/toolchain/standard-toolchain.json` to `"^999.0.0"` and run the check again.

**Expected**: Step 3 (install) fails for both fixtures and the command exits with code 1. Revert the change.

Then add the literal text `{{plugin-name}}` (a hyphenated tag the generator does not replace) to the scaffold's `readme.txt` and run the check again.

**Expected**: Step 2 fails and reports the file, line and `{{plugin-name}}`. Revert the change.

## Scenario C — The scaffold's own toolchain (US3)

```bash
ls -a | grep -E 'eslint|stylelint|prettier|jest|npmpackagejsonlint|playwright'
```

**Expected**: One file per tool, as listed in [research.md R4](./research.md#r4-config-file-formats).

```bash
npm ls puppeteer-core
```

**Expected**: Empty.

```bash
ls .husky/pre-commit && git config core.hooksPath
```

**Expected**: The hook file exists and the path is `.husky/_`, set up automatically by `npm ci` through `prepare`.

Stage a JavaScript file containing `var x = 1` (an unused variable) and run `git commit`.

**Expected**: lint-staged blocks the commit.

```bash
npm run lint:pkg && npm run lint:pkg-json && npm run zip && npm run plugin-zip
```

**Expected**: The new aliases and the deprecated ones all succeed.

## Scenario D — Modern APIs are available (US4)

In `$TEST_PLUGIN` (tasks T016–T017), add `src/blocks/<block>/view.js` containing `import { store } from '@wordpress/interactivity';`, then set `"viewScriptModule": "file:./view.js"` in that block's `block.json`.

```bash
npm run build
```

**Expected**: The build succeeds with no new install. `build/blocks/<block>/view.asset.php` lists `@wordpress/interactivity` as a module dependency.

## Scenario E — Documentation and instructions (US5)

```bash
grep -rnE "lint:pkg-json|plugin-zip|puppeteer|\.eslintrc|\.prettier\.config\.cjs|\.jest\.config\.cjs" README.md DEVELOPMENT.md docs .github/instructions
```

**Expected**: Matches only in deprecation notes.

## Scenario F — Round-trip proof (FR-027)

After the move-back (tasks T018–T034), regenerate from the updated scaffold with the same config:

```bash
node scripts/generate-plugin.js --config "$TEST_CONFIG" --output-dir /tmp/rt
```

```bash
node scripts/toolchain/compare-toolchain.js "$TEST_PLUGIN" /tmp/rt/<slug>
```

**Expected**: 0 differences in toolchain files (SC-009). Then run Scenario A in `/tmp/rt/<slug>` with no edits.
