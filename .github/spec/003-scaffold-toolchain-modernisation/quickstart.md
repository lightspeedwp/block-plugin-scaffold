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

## Scenario A — A generated plugin works out of the box (US1)

```bash
node scripts/generate-plugin.js --config tests/fixtures/generation/default.json --output-dir /tmp
```

```bash
cd /tmp/lsx-gen-check && npm install && npm run build && npm run lint:js && npm run lint:css && npm run lint:pkg && npm run test:unit
```

**Expected**:

- Every command exits with code 0, and the install reports no `ERESOLVE` warnings.
- `package.json` matches [generated-package-manifest.md](./contracts/generated-package-manifest.md).
- `build/blocks/*/` each contain `index.js` and `index.asset.php`, and each `dependencies` array lists `wp-*` handles. The bundles contain no React or WordPress package source.
- The root contains exactly one each of `eslint.config.cjs`, `.stylelintrc.json`, `.prettierrc.js`, `.npmpackagejsonlintrc.json` and `playwright.config.js`.

## Scenario B — The generation check catches a broken template (US2)

```bash
npm run check:generation
```

**Expected**: Both fixtures pass all 8 steps in [generation-check.md](./contracts/generation-check.md).

Then, on a throwaway branch, change one `devDependencies` range in `scripts/toolchain/standard-toolchain.json` to `"^999.0.0"` and run the check again.

**Expected**: Step 3 (install) fails for both fixtures and the command exits with code 1. Revert the change.

Then add the literal text `{{slug}}` to the generated readme template and run the check again.

**Expected**: Step 2 fails and reports the file, line and `{{slug}}`. Revert the change.

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

In `/tmp/lsx-gen-check` from Scenario A, add `src/blocks/<block>/view.js` containing `import { store } from '@wordpress/interactivity';`, then set `"viewScriptModule": "file:./view.js"` in that block's `block.json`.

```bash
npm run build
```

**Expected**: The build succeeds with no new install. `build/blocks/<block>/view.asset.php` lists `@wordpress/interactivity` as a module dependency.

## Scenario E — Documentation and instructions (US5)

```bash
grep -rnE "lint:pkg-json|plugin-zip|puppeteer|\.eslintrc|\.prettier\.config\.cjs|\.jest\.config\.cjs" README.md DEVELOPMENT.md docs .github/instructions
```

**Expected**: Matches only in deprecation notes.
