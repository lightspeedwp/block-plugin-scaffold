# Testing Strategy

What each kind of test in {{name}} should cover. The `test` skill (`.agents/skills/test/SKILL.md`) describes how to run them.

| Layer | Tool | Location | Covers |
| --- | --- | --- | --- |
| JavaScript unit | Vitest, Testing Library | `test/unit/` | Utilities, hooks and components on their own |
| PHP unit | PHPUnit, Brain Monkey | `phpunit/` | Classes and helpers in `inc/`, with WordPress functions stubbed |
| End-to-end | Playwright, wp-env | `test/e2e/` | Blocks in the editor and on the front end, in a real WordPress |
| Static | ESLint, Stylelint, PHPCS, PHPStan, Ajv | `npm run lint`, `composer run lint`, `composer run phpstan` | Standards, types and `block.json` schema |

## Coverage

- `npm run test:unit` fails below 70% branches, 80% statements or 80% functions for the files the tests load. Do not lower the thresholds; add tests.
- Every block has an end-to-end test that inserts it and checks it renders on the front end, and is included in the accessibility scan.
- Every PHP class has unit tests for its public methods, including what it does when a dependency (such as Secure Custom Fields) is missing.

## What to Test

For each change, cover:

- the expected behaviour;
- empty, missing and invalid input;
- error states the user can see;
- escaping and capability checks, for PHP that outputs or saves data;
- keyboard use and screen reader output, for anything interactive.

## Writing Tests

- Test behaviour, not implementation: query by role and label, not by class name.
- Each test sets up and removes its own data; end-to-end tests delete only what they created.
- Keep tests next to the existing ones for the same code, in the same style.
- A test that fails for a reason outside the change is reported, not skipped or deleted.
