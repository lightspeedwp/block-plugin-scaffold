---
name: test
description: Runs and triages the {{name}} plugin's tests (Vitest unit, Playwright end-to-end against wp-env, PHPUnit) and reports the results.
metadata:
  category: quality
  tags: testing, vitest, playwright, phpunit, wp-env
---

# Test

Run the tests that cover a change, read the failures and report what passed, what failed and what could not run.

## Operation Boundary

Read `package.json`, `composer.json` and the runner configs before choosing commands. Running tests writes `coverage/`, `artifacts/` and caches, and `npm run env:start` starts WordPress, so run them only as part of a task that asks for it. A missing dependency, browser or Docker is a prerequisite to report, not permission to install it. Do not change tests or lower thresholds to make a run pass.

## Suites

| Suite | Command | Location | Notes |
| --- | --- | --- | --- |
| JavaScript unit | `npm run test:unit` | `test/unit/` | Vitest in jsdom. Fails below 70% branches, 80% statements or 80% functions (`vitest.config.mjs`). |
| PHP unit | `composer run test` | `phpunit/` | PHPUnit with Brain Monkey; no WordPress install needed. CI runs PHP 8.4 and 8.5. |
| End-to-end | `npm run env:start`, then `npm run test:e2e` | `test/e2e/` | Playwright with `@wordpress/e2e-test-utils-playwright`. Add `-- --runtime=playground` to `env:start` without Docker. `accessibility.spec.js` runs axe-core at three widths. |

Run one file with `npm run test:unit -- test/unit/utils/query.test.js`, `vendor/bin/phpunit phpunit/CoreTest.php` or `npm run test:e2e -- test/e2e/blocks.spec.js`.

## Steps

1. Pick the suites the change touches: `src/` → unit and end-to-end; `inc/` or the main plugin file → PHP unit and end-to-end; `block.json` → end-to-end.
2. Run them, and keep the exact command and exit code.
3. For each failure, read the assertion and the code under test before suggesting a fix. Say whether the test or the code is wrong.
4. Stop wp-env when you started it (`npm run env:stop`).

## Report

List each suite as passed, failed (with the failing test names and the cause) or not run (with the reason). Never describe a suite you did not run as passing.

See `guidelines/testing-strategy.md` for what each kind of test should cover.
