# Feature Specification: Functional-Only Generation Mode (Post Type & Taxonomy Exclusion)

**Feature Branch**: `feat/generator-functional-only-mode`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "Add a 'functional-only' generation mode to the block-plugin-scaffold's generate-plugin agent and wizard, letting a user exclude all custom-post-type (CPT) and taxonomy scaffolding when they only want block/functional enhancements (no custom content model). Requirements: (1) explicit opt-out flag in plugin-config.json/wizard distinct from omitting post_types; (2) generator must also skip currently-unconditional CPT-oriented static files (patterns/{{slug}}-* content-display patterns, scf-json/group_{{slug}}_example.json), not just the already-guarded per-post-type generator functions; (3) the conversational wizard (generate-plugin.agent.md Stage 2/3) must ask up front whether the user wants a content model at all, before asking CPT/taxonomy detail questions, and skip those stages entirely when the answer is functional-only; (4) CPT-specific JS hooks/components and the collection block are candidates for exclusion; (5) must not affect generic/functional generation (block registration, build tooling, core inc/ classes); (6) update plugin-config.schema.json, post-types.schema.json, and docs (JSON-POST-TYPES.md, generate-plugin.agent.md); (7) existing CPT-based generation must remain fully backward compatible when the flag is absent or true. Linear LS-3727 is a related include/exclude toggle pattern in a different tool (theme-agent-builder), used as UX precedent only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose functional-only mode during the conversational wizard (Priority: P1)

As a plugin author who only needs new blocks, block bindings, or options-page functionality — with no new content type — I want the generate-plugin agent to ask me up front whether I need a custom content model, and skip all custom-post-type and taxonomy questions when I say no, so I'm not forced to answer irrelevant discovery questions or invent a CPT I don't need.

**Why this priority**: This is the primary interaction the feature exists to change. Without it, users still have to navigate CPT/taxonomy discovery stages (or know to manually omit fields from a hand-written config) to get a functional-only plugin. This is the smallest slice that delivers the core value.

**Independent Test**: Start the generate-plugin agent conversation, answer "no content model / functional only" at the first content-model question, and confirm the agent proceeds directly from Plugin Identity to Blocks/Additional Features without ever asking a post type, taxonomy, or content-field question.

**Acceptance Scenarios**:

1. **Given** a user starting the generate-plugin agent, **When** the agent reaches content-model discovery, **Then** it asks a single clear question ("Does this plugin need a custom content type — post type or taxonomy — or is it purely functional, e.g. new blocks or settings?") before asking any post-type-specific question.
2. **Given** the user answers "functional only," **When** the agent continues, **Then** it skips Stage 2 (Custom Post Type), Stage 3 (Taxonomies), Stage 4 (Custom Fields tied to a post type), and Stage 5 (Repeater Fields) entirely and proceeds to the remaining generic stages.
3. **Given** the user answers that they do want a content model, **When** the agent continues, **Then** the existing Stage 2-5 discovery behaves exactly as it does today (no regression).

---

### User Story 2 - Generated plugin contains no content-model artefacts in functional-only mode (Priority: P1)

As a plugin author who selected functional-only mode, I want the generated plugin folder to contain no post-type/taxonomy registration files, no example content-model field group, and no content-display pattern files, so the plugin I ship doesn't carry unused, confusing scaffolding that references a content type I never defined.

**Why this priority**: Asking the right question is only useful if the generator output actually honours the answer. Today, even when `post_types` is omitted, some static content-model files are still copied into every generated plugin unconditionally — this story closes that gap, which is the concrete bug/gap driving the request.

**Independent Test**: Generate a plugin with the functional-only flag set (or the wizard answer "no") and inspect the output directory; confirm none of the post-type/taxonomy JSON files, the example field group, or the content-display pattern files are present, while block files, build config, and core `inc/` classes are present and unchanged.

**Acceptance Scenarios**:

1. **Given** a plugin config with the functional-only flag set, **When** the plugin is generated, **Then** no `scf-json/post-type-*.json`, `scf-json/taxonomy-*.json`, or `scf-json/group_{{slug}}_example.json` files are created.
2. **Given** a plugin config with the functional-only flag set, **When** the plugin is generated, **Then** none of the content-display pattern files (`patterns/{{slug}}-grid.php`, `-archive.php`, `-card.php`, `-featured.php`, `-meta.php`, `-single.php`, `-slider.php`) are copied into the output.
3. **Given** a plugin config with the functional-only flag set, **When** the plugin is generated, **Then** the content-model-dependent JS hooks (`usePostType`, `useTaxonomies`, `useCollection`), the `TaxonomyFilter` and `PostSelector` components, and the collection block are excluded from the output, since they have no content type to operate against.
4. **Given** a plugin config where the functional-only flag is absent or explicitly `false`/not set to "exclude", **When** the plugin is generated, **Then** output is identical to current behaviour (full backward compatibility) — all existing post-type/taxonomy generation and static file copying proceeds as it does today.

---

### User Story 3 - Explicit, unambiguous configuration flag (Priority: P2)

As a maintainer authoring or automating a `plugin-config.json` (e.g. via CI or a saved config file, not the interactive wizard), I want an explicit flag that states functional-only intent, rather than relying on `post_types` simply being empty or absent, so that the config's intent is self-documenting and won't accidentally change behaviour later if defaulting logic is added for `post_types`.

**Why this priority**: This protects the feature's correctness over time and supports non-interactive/config-driven use, but the wizard conversation (Story 1) and generator behaviour (Story 2) deliver the primary user value on their own; this is a robustness/clarity layer on top.

**Independent Test**: Author a `plugin-config.json` with the new flag set and no wizard involved; run the generator directly against that file and confirm functional-only output per Story 2's acceptance scenarios.

**Acceptance Scenarios**:

1. **Given** a `plugin-config.json` with the new flag explicitly set to request functional-only generation, **When** the config is validated against the schema, **Then** validation succeeds and the flag is recognised as a valid, documented property.
2. **Given** a `plugin-config.json` where the flag is present and set to request a content model (or is absent, preserving today's default), **When** the config is validated, **Then** `post_types`/`taxonomies` are processed exactly as they are today.
3. **Given** a `plugin-config.json` where the flag requests functional-only generation but `post_types` or `taxonomies` entries are also present, **When** the config is validated, **Then** the system flags this as a configuration conflict and reports it clearly rather than silently generating a partial or contradictory plugin.

---

### Edge Cases

- What happens when a config sets the functional-only flag but also includes non-empty `post_types` or `taxonomies` arrays? (Treated as a validation conflict per Story 3, Scenario 3 — the system must surface this rather than guess.)
- What happens when a user changes their mind mid-wizard after already answering "functional only"? The wizard's existing summary/confirmation step (already part of the documented flow) must show the functional-only choice so it can be corrected before generation.
- What happens to a plugin previously generated with a content model that is later regenerated/re-run with the functional-only flag? Regeneration is out of scope for this feature — it only governs first-time generation output; removing content-model artefacts from an already-generated plugin is a manual/separate concern.
- What happens if the wizard is run in a non-interactive mode (config file or mock/dry-run) that doesn't ask questions at all? The flag must be respected identically whether set via the interactive wizard or supplied directly in a config file.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The generate-plugin agent conversation MUST ask a single, explicit content-model question ("do you need a custom post type or taxonomy, or is this plugin purely functional?") immediately after Plugin Identity (Stage 1) and before any post-type, taxonomy, custom-field, or repeater-field question.
- **FR-002**: When the user indicates functional-only, the agent MUST skip Stage 2 (Custom Post Type), Stage 3 (Taxonomies), Stage 4 (Custom Fields), and Stage 5 (Repeater Field Configuration) in full, proceeding directly to the remaining generic stages (Blocks/Templates/Additional Features).
- **FR-003**: The plugin configuration format MUST support an explicit, named flag indicating functional-only intent, distinct from and independent of whether `post_types`/`taxonomies` arrays happen to be empty.
- **FR-004**: When the functional-only flag is set, the generator MUST NOT produce any of: `scf-json/post-type-*.json`, `scf-json/taxonomy-*.json`, `scf-json/group_{{slug}}_example.json`, or any per-post-type block duplication.
- **FR-005**: When the functional-only flag is set, the generator MUST NOT copy the content-display pattern files (`patterns/{{slug}}-grid.php`, `-archive.php`, `-card.php`, `-featured.php`, `-meta.php`, `-single.php`, `-slider.php`) into the generated plugin output.
- **FR-006**: When the functional-only flag is set, the generator MUST exclude the content-model-dependent JS hooks (`usePostType`, `useTaxonomies`, `useCollection`), the `TaxonomyFilter` and `PostSelector` components, and the collection block from the generated plugin output.
- **FR-007**: When the functional-only flag is absent, or explicitly set to request a content model, the generator MUST behave exactly as it does today — full backward compatibility, with no change to existing output for existing configs.
- **FR-008**: The generator MUST NOT alter generic/functional generation regardless of the flag's value: block registration/index generation, build tooling output (webpack, package.json, composer.json), and the core `inc/` classes (core, block-bindings, block-styles, options, helper-functions) MUST be generated identically in both modes.
- **FR-009**: The system MUST validate configuration and reject (with a clear, actionable error) any config that sets the functional-only flag while also supplying non-empty `post_types` or `taxonomies` — this is a contradictory configuration, not a valid combination.
- **FR-010**: The plugin configuration schema(s) MUST document the new flag, including its name, allowed values, default value, and its interaction with `post_types`/`taxonomies`.
- **FR-011**: The generate-plugin agent documentation and the post-type/taxonomy JSON documentation MUST describe the new content-model question, the functional-only flag, and which files/generation steps are skipped as a result.
- **FR-012**: The wizard's existing pre-generation summary/confirmation step MUST clearly state whether the plugin will be generated in functional-only mode or with a content model, so the user can catch and correct a wrong answer before files are written.

### Key Entities

- **Plugin Configuration (`plugin-config.json`)**: The generation input. Gains one new top-level property (the functional-only/content-model flag) alongside the existing `post_types`, `taxonomies`, and `fields` arrays; the new flag and those arrays are mutually exclusive in intent.
- **Generated Plugin Output**: The scaffolded plugin directory tree. In functional-only mode, its content-model-related subset (specific `scf-json/*`, `patterns/*`, and content-model JS hooks/components/blocks) is entirely absent; all other generated files are unaffected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user running the conversational wizard for a functional-only plugin answers the content-model question and reaches the generation summary without being asked any post-type, taxonomy, content-field, or repeater question.
- **SC-002**: 100% of content-model-specific files (post-type JSON, taxonomy JSON, example field group, content-display patterns, content-model JS hooks/components/collection block) are absent from plugins generated in functional-only mode, verified by directory inspection after generation.
- **SC-003**: 100% of plugins generated from existing configs that do not set the new flag produce byte-for-byte identical output to the current (pre-feature) generator, confirming no regression.
- **SC-004**: A config that combines the functional-only flag with non-empty `post_types`/`taxonomies` is rejected with a clear error message before any files are written, in 100% of cases.

## Assumptions

- The functional-only flag is additive to the existing configuration format; no existing field is renamed or removed.
- "Functional-only" is scoped to this generator's own content-model output (SCF-driven post types/taxonomies and their directly dependent static files, hooks, components, and blocks). It does not extend to unrelated optional features (options page, REST API, block bindings) which remain independently selectable as they are today, since they are not "post type or taxonomy" scaffolding.
- Because the content-model-dependent JS hooks (`usePostType`, `useTaxonomies`, `useCollection`), `TaxonomyFilter`/`PostSelector` components, and the collection block have no content type to operate against without a post type, they are excluded by default in functional-only mode rather than offered as a separate, further-granular toggle. This keeps the feature to a single yes/no decision rather than a matrix of content-model sub-choices.
- Regenerating or retrofitting an already-generated plugin to remove content-model artefacts after the fact is out of scope; this feature governs first-time generation only.
- The Linear issue LS-3727 (theme-agent-builder / Tour Operator template include/exclude toggle) is a UX precedent for an include/exclude selection pattern in a sibling tool, not a shared implementation or the same feature; no direct dependency exists between the two.
