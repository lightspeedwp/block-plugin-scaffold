# Feature Specification: Scaffold Toolchain Modernisation

**Feature Branch**: `documentation/003-scaffold-toolchain-modernisation`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Take the 'WordPress Scaffold Package Plan' Google Doc (Comprehensive Architectural Strategy for Modernizing LightSpeed WordPress Scaffold Toolchains) and plan what needs to happen on the block plugin scaffold."

**Source document**: [WordPress Scaffold Package Plan](https://docs.google.com/document/d/1kgs7pj9Sxfom4vtA5UBVMIkMY57rqx_EKV2H43Qa8KA/edit) — covers both `block-theme-scaffold` and `block-plugin-scaffold`. This spec covers **only the plugin scaffold** (this repository). The theme scaffold gets its own spec and pull request, as the source document requires.

## Context

The source document proposes a standard toolchain for LightSpeed scaffolds: one canonical package manifest, official WordPress lint, format and test configurations, a standard set of command aliases, Playwright-based end-to-end testing, pre-commit hooks, and a CI step that proves a generated project installs and builds.

Comparing the document with this repository shows four differences that shape the plan:

1. **The scaffold's own manifest does not use template tags.** The root `package.json` already uses resolvable example values (`example-plugin`, `Example Author`) so `npm install` works on the raw repository. The generator replaces those values. The document's "Mustache tags break `npm install`" problem therefore does not apply to the root manifest. It does apply to some config files, for example the `{{namespace}}` pattern in `.stylelint.config.cjs`.
2. **Generated plugins receive a minimal, hand-written manifest.** `generatePackageJson()` in `scripts/generate-plugin.js` writes seven scripts and four devDependencies, with versions hard-coded in the generator. A generated plugin therefore lacks the lint, format, test and package-lint tooling that the scaffold itself uses.
3. **The document's version numbers are out of date.** For example, it proposes `@wordpress/scripts ^30` and `@wordpress/components ^28`; the repository already uses `31.1.0` and `30.9.0`, and the current stable releases are newer still. Copying the document's numbers would be a downgrade.
4. **The repository has toolchain drift.** It has duplicate lint and format config files (`.eslintrc.cjs` and `.eslint.config.cjs`, `.prettierrc.js` and `.prettier.config.cjs`, `jest.config.js` and `.jest.config.cjs`), a deprecated Puppeteer dependency, no `playwright.config.*`, no Husky install hook, a custom package-lint config that does not extend the WordPress one, and a `scripts/utils/placeholders.js` file copied from the theme scaffold (`{{theme_slug}}`).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Generated plugin works out of the box (Priority: P1)

A LightSpeed developer generates a new client plugin from the scaffold. Without editing any configuration, they install dependencies and then build, lint, format-check and unit-test the plugin with the standard commands, and every command succeeds.

**Why this priority**: The scaffold exists to produce client plugins. Today a generated plugin cannot run most of the quality checks the agency requires, so every project re-creates the tooling by hand and drifts from the standard. This is the core value of the source document.

**Independent Test**: Generate a plugin from the example config into an empty folder, install dependencies, and run the standard commands for build, JavaScript lint, style lint, package lint and unit tests. All of them exit successfully, with no peer-dependency errors.

**Acceptance Scenarios**:

1. **Given** a valid plugin config, **When** the developer generates a plugin, **Then** the generated package manifest holds the plugin's own name, version, description, author, licence, homepage, issue-tracker URL and repository URL, with no unresolved template tags and no scaffold example values.
2. **Given** a freshly generated plugin, **When** the developer installs dependencies, **Then** installation completes without peer-dependency conflicts.
3. **Given** a freshly generated plugin with dependencies installed, **When** the developer runs each standard command (build, start, format, JavaScript lint, style lint, package lint, unit tests, end-to-end tests, package update, distribution ZIP), **Then** each command exists under the same name as in every other LightSpeed scaffold, and build, lint and unit tests exit successfully.
4. **Given** a freshly generated plugin, **When** the developer opens the project root, **Then** it contains exactly one config file each for JavaScript linting, style linting, formatting, package linting and end-to-end tests, and each one extends the official WordPress preset.
5. **Given** a freshly generated plugin, **When** the developer builds it, **Then** every block's compiled script has a generated dependency descriptor, and the plugin loads its scripts from that descriptor instead of a hand-maintained dependency list.

---

### User Story 2 - Scaffold changes are proven against a generated plugin (Priority: P1)

A scaffold maintainer opens a pull request against `develop`. CI generates a throwaway plugin from a fixture config, installs it, builds it, lints it and runs its unit tests. If any step fails, the pull request is blocked before a broken template can reach client projects.

**Why this priority**: Without this gate, a change to the generator or templates can pass the scaffold's own CI and still produce broken plugins. This is the "generation validation pipeline" from the source document, and it is what keeps User Story 1 true over time.

**Independent Test**: Add a deliberate break to the generator's manifest output (for example, an invalid dependency range) on a test branch. The new CI job fails at the install or build step and names the failing command. Reverting the break makes the job pass.

**Acceptance Scenarios**:

1. **Given** a pull request that changes the generator or templates, **When** CI runs, **Then** a job generates a plugin from a committed fixture config and runs install, build, all lint commands and unit tests against the output.
2. **Given** a generated plugin that still contains an unresolved template tag or a scaffold example value in its metadata, **When** the CI job runs, **Then** it fails and reports the file and the leftover value.
3. **Given** the scaffold's own config files that contain template tags (for example, a namespace pattern in the style-lint config), **When** the scaffold's own lint jobs run, **Then** those files are given test values first, so the scaffold repository itself never fails on template syntax.

---

### User Story 3 - Scaffold repository uses the same standard toolchain (Priority: P2)

A maintainer working on the scaffold itself uses the same command names, config files and pre-commit hooks as a generated plugin. They can no longer edit the wrong one of two duplicate config files, and they do not install deprecated testing packages.

**Why this priority**: The scaffold is the reference implementation. If its own toolchain drifts from what it generates, maintainers test against a different setup from the one clients receive. This is lower than P1 because it does not change client output directly.

**Independent Test**: In a fresh clone, install dependencies; the pre-commit hook is installed automatically. Stage a file with a lint error and try to commit; the commit is blocked. Run the standard commands; each one works and uses the single config file for its tool.

**Acceptance Scenarios**:

1. **Given** a fresh clone, **When** the maintainer installs dependencies, **Then** the pre-commit hook is installed without any extra step.
2. **Given** a staged JavaScript, style or PHP file with a fixable lint error, **When** the maintainer commits, **Then** only the staged files are checked, fixable issues are fixed, and unfixable ones block the commit.
3. **Given** the repository root, **When** a maintainer lists config files, **Then** each tool has exactly one config file, and every removed duplicate is recorded in the change rationale.
4. **Given** the scaffold's dependency list, **When** it is reviewed, **Then** it contains no deprecated Puppeteer-based testing packages, and end-to-end tests run through the WordPress Playwright utilities with a committed Playwright config.
5. **Given** the scaffold's command list, **When** compared with the standard alias table, **Then** every standard alias exists with the standard name. Existing non-standard names (for example `lint:pkg-json`, `plugin-zip`) remain only as documented, deprecated aliases for one release.

---

### User Story 4 - Modern WordPress APIs are ready to use (Priority: P3)

A developer building a client feature that needs reactive frontend state (for example, a filterable tour gallery) or an admin data screen (for example, an import log table) finds the Interactivity API and DataViews packages already available in the generated plugin, with a short guide on when to use each.

**Why this priority**: These capabilities matter for upcoming client work (tour-operator features, importers), but no current block depends on them. Making them available and documented is enough for now; reference blocks can follow as separate features.

**Independent Test**: In a generated plugin, add a block view script that imports the Interactivity API, and an admin script that imports DataViews. Both build without adding any dependency, and the built scripts load the shared WordPress copies instead of bundling their own.

**Acceptance Scenarios**:

1. **Given** a generated plugin, **When** a developer imports the Interactivity API or its router in a block's frontend script, **Then** the build succeeds with no extra install step and the script is loaded as a module.
2. **Given** a generated plugin, **When** a developer imports DataViews in an admin script, **Then** the build succeeds with no extra install step.
3. **Given** the scaffold documentation, **When** a developer looks for guidance on frontend interactivity or admin data screens, **Then** a short guide explains when to use each package and links to the official handbook.

---

### User Story 5 - Team and AI assistants follow the new standard (Priority: P3)

A developer, or an AI coding assistant working in a generated plugin, reads the repository instructions and is directed to the standard commands, config files and modern block patterns, not the old ones.

**Why this priority**: Phase 4 of the source document. Without it, people and AI tools keep using the old patterns. It has the lowest priority because it adds no new capability.

**Independent Test**: Search the documentation and the instruction files for removed command names, removed config files and deprecated test packages; nothing is found except in the changelog and deprecation notes.

**Acceptance Scenarios**:

1. **Given** the updated documentation, **When** a developer follows the setup guide in a fresh generated plugin, **Then** every command in the guide exists and succeeds.
2. **Given** the instruction files under `.github/instructions/`, **When** an AI assistant reads them, **Then** they reference the standard command aliases, the single config files and the WordPress Playwright utilities.

---

### Edge Cases

- **Optional metadata is missing from the plugin config** (for example, no homepage or repository URL): the generated manifest leaves the optional field out instead of writing an empty string or a scaffold example value, and package lint still passes.
- **A slug is not a valid package name** (uppercase letters, spaces): the generator rejects it with a clear message before writing any files, instead of producing a manifest that fails install.
- **Re-running the generator in place** (`--in-place`) on an already generated plugin: dependency ranges and scripts are brought up to the standard without discarding dependencies the client project added.
- **An upstream WordPress package publishes a new major version** that breaks the standard: generated plugins keep resolving to the locked major range, and the scaffold CI catches the break when the range is deliberately raised.
- **CI runs with no network access to the package registry**: the generation job fails with a clear install error rather than reporting a false pass.
- **The functional-only generation mode** (no post types, from spec 002): the generated manifest and toolchain are identical, and the generation check covers this mode as well.
- **End-to-end tests need a running WordPress**: the generation check in CI runs build, lint and unit tests only; end-to-end tests run in the existing job that starts the local WordPress environment.

## Requirements _(mandatory)_

### Functional Requirements

**Generated plugin manifest (US1)**

- **FR-001**: The generator MUST write a package manifest for each generated plugin that holds all metadata fields (name, version, description, author, licence, keywords, homepage, issue tracker, repository) taken from the plugin config, with no unresolved template tags and no scaffold example values.
- **FR-002**: Dependency and devDependency versions in the generated manifest MUST be fixed semantic-version ranges taken from one maintained source of truth in the scaffold, never template tags and never hard-coded inside generator logic.
- **FR-003**: Every capability in the source document's plugin toolchain MUST be available in a generated plugin: build runner, dependency extraction, transpilation preset, JavaScript lint, style lint, format, package lint, unit-test preset and console helper, Playwright end-to-end utilities, pre-commit hook and staged-file runner. So must the standard runtime packages: block editor, components, element, data, API fetch, core data, Interactivity API and its router, DataViews, accessibility announcements, URL utilities and style engine. A tool that the build runner already provides MUST be listed directly only when a config file in the plugin imports it by name. The Standard Toolchain Definition MUST record which tools are provided this way.
- **FR-004**: The generated manifest MUST expose the standard command aliases: `start`, `build`, `format`, `lint:js`, `lint:css`, `lint:pkg`, `test:unit`, `test:e2e`, `packages-update`, `zip`. The scaffold MUST keep these names identical to the theme scaffold's.
- **FR-005**: A generated plugin MUST contain exactly one config file each for JavaScript lint, style lint, formatting, package lint and Playwright end-to-end tests. Each MUST extend the official WordPress preset, with project-specific overrides kept to a minimum.
- **FR-006**: A generated plugin's compiled block and editor scripts MUST be enqueued using the generated asset dependency descriptor, so WordPress-provided packages are never bundled into plugin output.
- **FR-007**: A generated plugin MUST pass its own package lint, JavaScript lint, style lint, build and unit tests immediately after generation and install, with no manual edits.

**Generation validation in CI (US2)**

- **FR-008**: The scaffold MUST provide a single command that generates a plugin from a committed fixture config into a temporary folder and runs install, build, all lint commands and unit tests against it, reporting each step's result.
- **FR-009**: The scaffold's CI MUST run that command on every pull request to `develop` and `main`, and the job MUST be a required check.
- **FR-010**: The generation check MUST fail if the generated output contains any unresolved template tag or scaffold example value in its manifest, plugin header or readme metadata.
- **FR-011**: The generation check MUST cover both the default generation mode and the functional-only mode (spec 002).
- **FR-012**: Scaffold config files that contain template tags MUST be given test values from the plugin scaffold's own placeholder map before the scaffold's own lint jobs read them. The placeholder map MUST contain plugin-scaffold variables, not theme-scaffold ones.

**Scaffold repository alignment (US3)**

- **FR-013**: The scaffold repository MUST keep exactly one config file per tool. Duplicates MUST be removed after confirming which file each tool actually loads.
- **FR-014**: The scaffold MUST remove deprecated Puppeteer-based testing dependencies and MUST provide a committed Playwright config that extends the WordPress end-to-end preset, with the base URL taken from an environment variable and defaulting to the local WordPress environment.
- **FR-015**: Installing dependencies in the scaffold MUST install the pre-commit hook automatically. The hook MUST run lint and format only on staged files.
- **FR-016**: The scaffold MUST expose every standard command alias from FR-004. Any existing alias that is renamed MUST remain for one release as a deprecated alias that calls the new name, and the deprecation MUST be recorded in the changelog.
- **FR-017**: The scaffold's package-lint config MUST extend the WordPress package-lint preset. The scaffold-specific rules (for example, the allowed package scope) MUST be kept as overrides.
- **FR-018**: Every WordPress package in the scaffold's own manifest MUST use a fixed range on the current stable major version. No package may be downgraded to match the source document's example numbers.

**Modern API readiness (US4)**

- **FR-019**: The build MUST support block frontend scripts loaded as modules, so the Interactivity API and its router can be used without extra build configuration.
- **FR-020**: The scaffold documentation MUST include a short guide on when to use the Interactivity API (frontend state) and DataViews (admin data screens), with links to the official handbook.

**Documentation and AI instructions (US5)**

- **FR-021**: The setup and development documentation (`README.md`, `DEVELOPMENT.md`, `docs/GENERATE_PLUGIN.md`) MUST describe the standard command aliases and single config files.
- **FR-022**: The instruction files under `.github/instructions/` that cover JavaScript, testing and block development MUST reference the standard commands, the WordPress Playwright utilities and current block-editor hooks, and MUST NOT reference removed config files or deprecated test packages.

**Change control**

- **FR-023**: The work MUST be delivered as separate pull requests per phase against `develop`, each with a changelog entry and a short rationale.

### Key Entities

- **Standard Toolchain Definition**: The single maintained list of packages, version ranges, command aliases and config file presets that both the scaffold and every generated plugin must follow. Kept in the scaffold and read by the generator.
- **Generated Plugin Manifest**: The package manifest written into each generated plugin. It combines the plugin's metadata from its config with the Standard Toolchain Definition.
- **Command Alias Map**: The standard command names and what each one runs. Shared with the theme scaffold.
- **Generation Fixture**: A committed plugin config used only by the CI generation check, with one variant per generation mode.
- **Placeholder Map**: The table of template tags and the test values that replace them when the scaffold lints its own templated files.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of plugins generated from the committed fixtures install, build, lint and pass unit tests with zero manual edits.
- **SC-002**: A developer can go from running the generator to a successful first build and lint in under 5 minutes on a standard development machine, excluding download time.
- **SC-003**: 0 unresolved template tags or scaffold example values appear in the metadata of any generated plugin, as verified by the CI generation check.
- **SC-004**: Every pull request to `develop` that breaks plugin generation is blocked by CI before merge. Measured by a seeded break on a test branch failing the required check.
- **SC-005**: The scaffold repository root has exactly one config file per tool, down from three duplicated pairs today.
- **SC-006**: All 10 standard command aliases exist with identical names in the plugin scaffold, in every generated plugin and in the theme scaffold.
- **SC-007**: Generated plugin script bundles contain no copies of WordPress-provided packages, as verified by the dependency descriptor listing them as external.
- **SC-008**: Documentation and instruction files contain 0 references to removed command names, removed config files or deprecated test packages, outside the changelog and deprecation notes.

## Assumptions

- **Scope**: This spec covers the plugin scaffold only. The theme scaffold is updated in a separate spec and pull request, and the shared command alias names are agreed between the two.
- **Version numbers**: The source document's version numbers are examples. The fixed ranges are set at implementation time to the current stable major of each package, and must never be lower than what the scaffold already uses (see [research.md](./research.md)).
- **Build engine**: The plugin stays on `@wordpress/scripts`. The newer esbuild-based `@wordpress/build` is still pre-1.0 and is out of scope; it is noted for a future review.
- **Root manifest**: The scaffold's root `package.json` keeps its resolvable example values. It does not switch to template tags, because the generator already replaces the example values and the repository must stay installable.
- **Runtime packages**: The Interactivity API and DataViews are added as standard runtime packages, even though no current block uses them. Because WordPress provides these packages at runtime, they add no weight to plugin bundles, only to the local install.
- **Reference blocks**: Example blocks that use the Interactivity API or DataViews are out of scope and can follow as separate features.
- **Existing tools**: Existing scaffold-only tooling (dry-run scripts, schema validation, Lighthouse, size-limit, release scripts) stays in the scaffold and is not added to generated plugins.
- **Node version**: Generated plugins require the same minimum Node.js and npm versions as the current `@wordpress/scripts` release. The scaffold's `engines` field and CI matrix are updated to match. At the time of writing, that release requires Node 22.22 or later, so the Node 18 and 20 CI targets are retired.
- **Config file formats**: Where the source document shows a legacy config format (for example `.eslintrc.json`), the current format that the WordPress presets support is used instead. The source document's intent is kept: one file per tool, extending the official preset.
