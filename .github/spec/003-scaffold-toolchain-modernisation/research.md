# Research: Scaffold Toolchain Modernisation

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-10-19

This file records the decisions that turn the source document (_WordPress Scaffold Package Plan_) into a plan for this repository. Each decision states what was chosen, why, and what else was considered. Version numbers were checked against the npm registry on 2026-10-19 and must be checked again when each phase is implemented.

---

## R1. Where the template tags live

**Decision**: Keep the scaffold's root `package.json` on resolvable example values (`example-plugin`, `Example Author`). Do not adopt the source document's `{{slug}}` manifest. The generator keeps replacing the example values and writes a fresh manifest for each generated plugin.

**Rationale**: The source document's main worry is that template tags in `package.json` stop `npm install` working on the raw scaffold. This repository already avoids that by using example values, and the constitution (Principle V) names those example identifiers as intentional placeholders. Switching to template tags would break `npm ci` in every existing CI job and gain nothing.

**Alternatives considered**:

- _Template tags in the root manifest, filled with test values before CI_: this is the source document's approach. Rejected, because it makes the scaffold uninstallable without an extra step and adds a moving part to every job.
- _A separate `package.json.mustache` template next to the real manifest_: rejected, because it creates two manifests that drift apart. See R2 for the single source of truth.

**Still needed**: Config files that _do_ contain template tags (for example, the `{{namespace}}` class pattern in `.stylelint.config.cjs`) are covered by R6.

---

## R2. One source of truth for the generated manifest

**Decision**: Add a `scripts/toolchain/standard-toolchain.json` file that lists the standard dependencies with version ranges, the standard command aliases and the config presets. `generatePackageJson()` reads it, merges in the plugin's metadata from its config, and writes the manifest. A unit test checks that every range in the file matches the scaffold's own `package.json`, so the two cannot drift apart.

**Rationale**: Today the generator hard-codes `'@wordpress/scripts': '31.1.0'` with a comment saying it must match the root manifest. Nothing enforces that comment. A data file and a drift test make the rule enforceable, and they give the theme scaffold a format it can copy for the shared alias map.

**Alternatives considered**:

- _Copy the root `package.json` and strip the scaffold-only entries_: rejected, because the scaffold carries many tools a client plugin should not get (Lighthouse CI, size-limit, ajv, gray-matter, the release scripts). A denylist would need updating every time the scaffold adds a tool.
- _A shared npm package (for example `@lightspeedwp/scaffold-toolchain`) used by both scaffolds_: worth doing later, once both scaffolds have settled. For now it is rejected as more release overhead than the problem needs (AGENTS.md: "prefer minimal, modular solutions").

---

## R3. Version ranges: current stable majors, not the source document's numbers

**Decision**: Fix every WordPress package to a caret range on its **current stable major** when each phase is implemented. Never set a range lower than what the scaffold already uses. A snapshot from 2026-10-19:

| Package                                           | Source document | Scaffold today | Current stable |
| ------------------------------------------------- | --------------- | -------------- | -------------- |
| `@wordpress/scripts`                              | ^30.0.0         | 31.1.0         | 36.1.0         |
| `@wordpress/eslint-plugin`                        | ^20.0.0         | ^22.21.0       | 27.1.0         |
| `@wordpress/stylelint-config`                     | ^23.0.0         | ^23.27.0       | 26.1.0         |
| `@wordpress/prettier-config`                      | ^4.0.0          | ^4.35.0        | 4.57.0         |
| `@wordpress/npm-package-json-lint-config`         | ^2.0.0          | not used       | 5.57.0         |
| `@wordpress/jest-preset-default`                  | ^14.0.0         | ^12.35.0       | 14.2.0         |
| `@wordpress/jest-console`                         | ^6.0.0          | ^8.35.0        | 9.3.0          |
| `@wordpress/e2e-test-utils-playwright`            | ^1.0.0          | ^1.35.0        | 3.0.0          |
| `@wordpress/babel-preset-default`                 | ^8.0.0          | ^8.35.0        | 9.0.0          |
| `@wordpress/dependency-extraction-webpack-plugin` | ^6.0.0          | (via scripts)  | 6.57.0         |
| `@wordpress/components`                           | ^28.0.0         | 30.9.0         | 42.0.0         |
| `@wordpress/block-editor`                         | ^15.0.0         | ^15.8.0        | 18.1.0         |
| `@wordpress/interactivity`                        | ^6.0.0          | not used       | 7.0.0          |
| `@wordpress/interactivity-router`                 | ^6.0.0          | not used       | 2.57.0         |
| `@wordpress/dataviews`                            | ^4.9.1          | not used       | 20.0.0         |
| `lint-staged`                                     | ^15.0.0         | ^16.2.7        | 17.6.0         |
| `husky`                                           | ^9.0.0          | ^9.1.7         | 9.1.7          |
| `@playwright/test`                                | n/a             | 1.57.0         | 1.64.1         |

**Rationale**: The source document's numbers are illustrative and already behind; several would be downgrades. For example, `@wordpress/interactivity-router ^6` does not exist: the package is on 2.x. The document's intent is fixed ranges and reproducible builds, and that is kept.

**Alternatives considered**: _Exact pins everywhere_: rejected for generated plugins, because client projects need patch and minor fixes via `npm run packages-update`. The scaffold's `package-lock.json` already gives the scaffold itself reproducible installs.

**Risk**: Jumping `@wordpress/scripts` from 31 to 36 is the biggest change in this plan. It brings a new Node engine (R8), the ESLint 9/10 flat config (R4) and Jest 30. It is isolated in its own phase (Phase 2 of the plan) so a regression can be reverted without undoing the other work.

---

## R4. Config file formats

**Decision**: Use one file per tool, each extending the WordPress preset:

| Tool                  | File                              | Extends                                                         |
| --------------------- | --------------------------------- | --------------------------------------------------------------- |
| ESLint                | `eslint.config.cjs` (flat config) | `@wordpress/eslint-plugin` flat recommended config              |
| Stylelint             | `.stylelintrc.json`               | `@wordpress/stylelint-config` (SCSS variant)                    |
| Prettier              | `.prettierrc.js`                  | `@wordpress/prettier-config` (PHP and SCSS overrides kept)      |
| npm-package-json-lint | `.npmpackagejsonlintrc.json`      | `@wordpress/npm-package-json-lint-config`                       |
| Playwright            | `playwright.config.js`            | `@wordpress/scripts/config/playwright.config.js`                |
| Jest                  | `jest.config.js`                  | `@wordpress/jest-preset-default` (through `@wordpress/scripts`) |

**Rationale**: `@wordpress/eslint-plugin` 27 has ESLint `^9 || ^10` as a peer dependency. ESLint 10 removes the legacy `.eslintrc.*` format, so the source document's `.eslintrc.json` would stop working. The other formats follow the source document, apart from Prettier, where a `.js` file is needed to keep the existing PHP and SCSS overrides.

**Duplicate files today**: `.eslintrc.cjs` and `.eslint.config.cjs`; `.prettierrc.js` and `.prettier.config.cjs`; `jest.config.js` and `.jest.config.cjs`; plus `.eslint.config.cjs`, `.stylelint.config.cjs`, `.postcss.config.cjs` and `.npmpackagejsonlintrc.cjs`. A file name that starts with a dot and ends in `.config.cjs` is not on most tools' default search list, so some of these files may never load. Task T003 records which file each tool actually loads (with `--print-config` or the tool's debug output) before anything is deleted, so no rule is lost by accident.

**Alternatives considered**: _Keep the legacy `.eslintrc` format through `ESLINT_USE_FLAT_CONFIG=false`_: rejected. The flag is removed in ESLint 10, so this would only postpone the work.

---

## R5. Which packages a generated plugin lists directly

**Decision**: A generated plugin's manifest lists:

- **devDependencies**: `@wordpress/scripts`, `@wordpress/env`, `@wordpress/eslint-plugin`, `@wordpress/stylelint-config`, `@wordpress/prettier-config`, `@wordpress/npm-package-json-lint-config`, `@wordpress/e2e-test-utils-playwright`, `@playwright/test`, `@wordpress/jest-console`, `husky`, `lint-staged`, plus anything the copied `webpack.config.js` imports by name (today: `copy-webpack-plugin` and `glob`).
- **dependencies**: `@wordpress/a11y`, `@wordpress/api-fetch`, `@wordpress/block-editor`, `@wordpress/blocks`, `@wordpress/components`, `@wordpress/core-data`, `@wordpress/data`, `@wordpress/dataviews`, `@wordpress/element`, `@wordpress/i18n`, `@wordpress/interactivity`, `@wordpress/interactivity-router`, `@wordpress/style-engine`, `@wordpress/url`.
- **Provided by the build runner and not listed**: `@wordpress/dependency-extraction-webpack-plugin`, `@wordpress/babel-preset-default`, `@wordpress/jest-preset-default`, `npm-package-json-lint`, `@babel/core`. These are recorded under `providedBy: "@wordpress/scripts"` in `standard-toolchain.json`, and are moved to the direct list only if a config file imports them by name.

**Rationale**: `@wordpress/scripts` already includes the dependency extraction plugin, the Babel preset, the Jest preset and npm-package-json-lint, and its `lint-pkg-json`, `test-unit-js` and `build` commands use them. Listing them again means a second version range that can conflict with the one `@wordpress/scripts` expects. That is the peer-dependency drift the source document wants to remove. Every capability in the source document's table is still present (spec FR-003).

The configs that _are_ listed directly are the ones the plugin's own config files import by name (`eslint.config.cjs` imports `@wordpress/eslint-plugin`, and so on).

**Alternatives considered**: _List everything in the source document's table_: rejected, for the duplicate-range reason above. Constitution Principle V asks for minimal dependencies with a justification for each one.

---

## R6. Filling template tags in the scaffold's own config files

**Decision**: Fix `scripts/utils/placeholders.js` so it holds the **plugin** scaffold's variables (`{{slug}}`, `{{namespace}}`, `{{textdomain}}`, `{{name}}`, `{{author}}` and so on), taken from `scripts/mustache-variables-registry.json`, with values that match the root manifest's example values. Add a `prelint` step (`scripts/toolchain/fill-placeholders.js --check`) that writes filled copies of templated config files to a temporary location for the scaffold's own lint run. Prefer removing template tags from config files where a generic value works. For example, the Stylelint class pattern can match any `wp-block-*` namespace instead of `wp-block-{{namespace}}-*`.

**Rationale**: `placeholders.js` is a copy of the theme scaffold's file: its header names `block-theme-scaffold` and its keys are `{{theme_slug}}` and similar. It cannot fill this repository's templates. The first choice is to make config files tag-free, so nothing needs filling. The fill step handles whatever has to stay templated.

**Alternatives considered**: _`sed -i 's/{{slug}}/test-build/g'` in the CI YAML_: this is the source document's example. Rejected, because it edits tracked files in place, misses tags it does not list, and cannot be run locally the same way.

---

## R7. Generation check design

**Decision**: Add `scripts/toolchain/check-generation.js` and expose it as `npm run check:generation`. For each fixture in `tests/fixtures/generation/` (default mode, functional-only mode), it:

1. generates into a fresh temporary folder (`os.tmpdir()`), never inside the repository. The generator currently always writes to `generated-plugins/<slug>` (`outputBaseDir` in `scripts/generate-plugin.js`), so a new `--output-dir <path>` flag is added, defaulting to the current behaviour;
2. scans the manifest, the main plugin file header and `readme.txt` for unresolved `{{…}}` tags and for scaffold example values (`example-plugin`, `example_plugin`, `Example Author`, `Example Plugin`), failing on any match and reporting the file and value;
3. runs `npm install --no-audit --no-fund`, then `build`, `lint:js`, `lint:css`, `lint:pkg` and `test:unit` in that folder;
4. prints a pass or fail table and exits non-zero on the first failure, keeping the folder for debugging when `--keep` is passed.

A new `generation-check` job in `.github/workflows/ci-cd.yml` runs it on Node 22 and 24, caching the npm download cache. It is added to the required checks for `develop` and `main`.

**Rationale**: Spec FR-008 to FR-011. The same command runs locally and in CI, which the source document's inline `sed` step cannot do. End-to-end tests are left out because they need a running WordPress; the existing `e2e` job covers them.

**Alternatives considered**: _Generating into `generated-plugins/` in the repository_: rejected, because that folder holds hand-made output and the check must not touch it.

---

## R8. Node engine and CI matrix

**Decision**: Set `engines.node` to `>=22.22.0` and `engines.npm` to `>=10.0.0` in the root manifest and in generated manifests. Change `.nvmrc` to `22` and the CI Node matrix to `[22.x, 24.x]`.

**Rationale**: `@wordpress/scripts` 36 declares `node: ^22.22.2 || ^24.15.0 || >=26.0.0`. The current CI matrix (`18.x`, `20.x`) and `engines` (`>=18.0.0`) would fail or warn on install. The constitution's _Technology & Tooling Constraints_ section states Node 18+, so it needs a PATCH amendment (see the plan's Complexity Tracking table).

---

## R9. Pre-commit hooks

**Decision**: Add `"prepare": "husky"` to the root manifest and commit `.husky/pre-commit` running `npx lint-staged`. Keep the `lint-staged` map in `package.json`. Generated plugins get the same `prepare` script and hook file.

**Rationale**: `husky` and `lint-staged` are already installed, but nothing installs the hook, so it never runs. Husky 9 needs only the `prepare` script and the hook file.

---

## R10. Command aliases

**Decision**: Add the standard aliases from the [command alias contract](./contracts/command-aliases.md). Rename where needed:

| Standard alias | Runs                                                   | Scaffold today               | Action                                                                |
| -------------- | ------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------- |
| `lint:pkg`     | `wp-scripts lint-pkg-json`                             | `lint:pkg-json`              | Add; keep the old name as a deprecated alias for one release          |
| `zip`          | `wp-scripts plugin-zip`                                | `plugin-zip`                 | Add; keep the old name as a deprecated alias for one release          |
| `test:e2e`     | `wp-scripts test-playwright`                           | `playwright test tests/e2e/` | Change what it runs                                                   |
| `build`        | `wp-scripts build` (scaffold: `node scripts/build.js`) | same                         | Keep the scaffold's wrapper; generated plugins use `wp-scripts build` |

**Rationale**: The source document maps `test:e2e` to `wp-scripts test-e2e-js`. In `@wordpress/scripts`, the Playwright runner is `test-playwright`; `test-e2e` is the deprecated Puppeteer runner. `lint:pkg` uses `wp-scripts lint-pkg-json`, which runs npm-package-json-lint with the WordPress config (R5).

---

## R11. Build engine (`@wordpress/build`)

**Decision**: Out of scope. Stay on `@wordpress/scripts` (webpack).

**Rationale**: `@wordpress/build` is at 0.25.0 (pre-1.0) and the source document describes it only as a direction. Moving the build engine during the same work as the version jump in R3 would mix two large risks. Review it again when the package reaches 1.0.

---

## R12. Interactivity API module support

**Decision**: Check that `wp-scripts build --experimental-modules` (or the stable equivalent in the chosen `@wordpress/scripts` release) emits `viewScriptModule` assets for blocks that declare one in `block.json`. Document `viewScriptModule` as the way to use the Interactivity API. No current block is converted.

**Rationale**: Spec FR-019 and User Story 4. The existing `view.js` files in `src/blocks/collection` use classic scripts, and converting them is a separate feature.

---

## R13. Puppeteer removal

**Decision**: Remove `puppeteer-core` from devDependencies after checking that no script, test or config file imports it (`grep -r "puppeteer" scripts tests`). If something does, move it to Playwright in the same task.

**Rationale**: The source document marks the Puppeteer-based `@wordpress/e2e-tests` route as deprecated. The repository already runs end-to-end tests with Playwright, so `puppeteer-core` looks like a leftover.
