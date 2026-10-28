# {{name}} Constitution

The principles every Spec Kit specification, plan and task for {{name}} must follow. Where this document and other guidance disagree, the LightSpeed organisation rules come first, then this constitution, then the rest of the repository's guidance.

## Core Principles

### I. Specification First

New features, behaviour changes and significant fixes start with a specification in `.github/specs/{NNN-feature}/spec.md`: specify, clarify, plan, tasks, then implement. The specification states the user need, acceptance criteria and how the result will be verified before any code is written. Small fixes and documentation changes can skip it.

### II. WordPress Standards

PHP follows the WordPress Coding Standards and passes PHPStan level 6. JavaScript follows the Gutenberg coding guidelines and uses `@wordpress/*` packages; front-end behaviour uses the Interactivity API. Blocks are declared in `block.json` and validate against the WordPress schema. CSS class names follow BEM. Every user-facing string is translatable with the `{{textdomain}}` text domain.

### III. Security and Accessibility

Output is escaped late, input is sanitised, and every form, AJAX and REST handler checks a nonce and a capability. Blocks meet WCAG 2.2 AA in the editor and on the front end, and the axe-core end-to-end checks pass at mobile, tablet and desktop widths.

### IV. Tested Changes

Each change is covered by the tests that fit it: Vitest unit tests for JavaScript logic, PHPUnit tests for PHP classes, Playwright tests for editor and front-end behaviour. The coverage gate in `vitest.config.mjs` is not lowered to make a change pass. A plan lists the tests it will add, and a task is done only when they pass.

### V. Organisation Governance

Branch names, labels, issue types, issue and pull request templates and community health files belong to the LightSpeed organisation (`lightspeedwp/.github`); this repository follows them and never redefines them. Every code change has a `CHANGELOG.md` entry under `[Unreleased]`. Spec Kit feature numbers do not choose branch names: work happens on an approved branch that passes `node bin/check-branch-name.js`.

### VI. Shared Toolchain

The toolchain (configs, scripts, workflows, tests and agent files) comes from `lightspeedwp/block-plugin-scaffold`. A toolchain change is made in this plugin, proven, then moved back into the scaffold, so that a newly generated plugin and this one stay the same. Dependencies change through `npm` and `composer` with their lockfiles, on Node.js 24.

## Amendments

Amend this constitution through a pull request that explains the change and updates the templates in `.specify/templates/` that depend on it. Version it with semantic versioning: a major version for removing or redefining a principle, a minor version for adding one, a patch for wording.

**Version**: 1.0.0 | **Ratified**: 2026-10-28 | **Last Amended**: 2026-10-28
