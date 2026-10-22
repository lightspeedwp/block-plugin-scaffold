# Contract: Standard Command Aliases

**Applies to**: the plugin scaffold root, every generated plugin, and (by agreement) the theme scaffold.

**Source**: The source document's _Master Workflow Commands and Script Mapping_ table, corrected for the current `@wordpress/scripts` command names ([research.md R10](../research.md#r10-command-aliases)).

Every alias below MUST exist under exactly this name. What an alias runs may differ between the scaffold and a generated plugin only where the _Scaffold_ column says so.

| Alias             | Generated plugin runs        | Scaffold runs                                      | Expected result                                                         |
| ----------------- | ---------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| `start`           | `wp-scripts start`           | `wp-scripts start`                                 | Watches the source and rebuilds with source maps                        |
| `build`           | `wp-scripts build`           | `node scripts/build.js` (wraps `wp-scripts build`) | Minified bundles plus a `*.asset.php` file for each entry point         |
| `format`          | `wp-scripts format`          | `wp-scripts format`                                | Prettier formats the source using the WordPress config                  |
| `lint:js`         | `wp-scripts lint-js`         | `wp-scripts lint-js`                               | ESLint, exit code 0 when clean                                          |
| `lint:css`        | `wp-scripts lint-style`      | `wp-scripts lint-style --allow-empty-input`        | Stylelint, exit code 0 when clean                                       |
| `lint:pkg`        | `wp-scripts lint-pkg-json`   | `wp-scripts lint-pkg-json`                         | npm-package-json-lint with the WordPress config                         |
| `test:unit`       | `wp-scripts test-unit-js`    | `wp-scripts test-unit-js`                          | Jest with the WordPress preset                                          |
| `test:e2e`        | `wp-scripts test-playwright` | `wp-scripts test-playwright`                       | Playwright against `WP_BASE_URL`, defaulting to `http://localhost:8888` |
| `packages-update` | `wp-scripts packages-update` | `wp-scripts packages-update`                       | Updates `@wordpress/*` packages within their ranges                     |
| `zip`             | `wp-scripts plugin-zip`      | `wp-scripts plugin-zip`                            | A distribution ZIP containing only production files                     |

## Supporting aliases (not part of the cross-scaffold standard)

| Alias                    | Where         | Runs                                                      |
| ------------------------ | ------------- | --------------------------------------------------------- |
| `lint`                   | both          | `npm run lint:js && npm run lint:css && npm run lint:pkg` |
| `test`                   | both          | `npm run test:unit`                                       |
| `prepare`                | both          | `husky`                                                   |
| `env:start` / `env:stop` | both          | `wp-env start` / `wp-env stop`                            |
| `check:generation`       | scaffold only | `node scripts/toolchain/check-generation.js`              |

## Deprecated aliases (removed one release after this change)

| Old alias       | Calls              | Deprecation note                              |
| --------------- | ------------------ | --------------------------------------------- |
| `lint:pkg-json` | `npm run lint:pkg` | Recorded in `CHANGELOG.md` under _Deprecated_ |
| `plugin-zip`    | `npm run zip`      | Recorded in `CHANGELOG.md` under _Deprecated_ |

## Verification

- A unit test reads `scripts/toolchain/standard-toolchain.json` and checks that every standard alias appears in the root `package.json` and in a generated manifest.
- `npm run check:generation` runs `build`, `lint:js`, `lint:css`, `lint:pkg` and `test:unit` in a generated plugin.
