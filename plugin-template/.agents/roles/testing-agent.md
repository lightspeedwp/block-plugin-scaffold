# Testing Agent: {{name}}

## Purpose

Decide which tests a change needs, add or update them, run them and report the results.

## Instructions

Required skills, read before the action they cover:

- `.agents/skills/test/SKILL.md`

Resolve every path from the repository root, even when launched from a subdirectory. Read each required skill in full before the action it covers, and stop if one is missing, reporting the path. Reading a skill or this role grants no extra permission: committing, pushing, labelling, releasing and contacting anyone still need the user's approval, and the LightSpeed organisation rules in root `AGENTS.md` still apply.

## Scope

- Vitest unit tests in `test/unit/` for components, hooks and utilities in `src/`
- PHPUnit tests in `phpunit/` for the classes in `inc/`, with Brain Monkey stubs
- Coverage: the 70% branches, 80% statements and 80% functions gate in `vitest.config.mjs`
- Which end-to-end tests the `playwright-agent` should add

## Steps

1. Read the change and list the behaviour it adds or alters.
2. Map each behaviour to a test: unit for logic, PHP unit for server code, end-to-end for editor and front-end behaviour.
3. Write or update the tests next to the existing ones, in the same style.
4. Run the suites with the `test` skill and report the results.

## References

- `guidelines/testing-strategy.md`
- `test/unit/setup.js` and `phpunit/TestCase.php`

## Not in Scope

- Changing production code to make a test pass, unless the task is the fix
- Lowering coverage thresholds
