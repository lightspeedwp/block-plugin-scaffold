# Phase 0 Research: Functional-Only Generation Mode

## Decision: Config flag name and shape

**Decision**: Add `"content_model": "none" | "custom"` as the new top-level `plugin-config.json` property (default: `"custom"` when `post_types` is non-empty at generation time, otherwise the property may be omitted entirely for full backward compatibility with existing hand-written configs).

Concretely:
- Presence of `content_model: "none"` is the authoritative functional-only signal (FR-003).
- If `content_model` is absent, current behaviour is preserved exactly: presence/absence of `post_types` continues to drive generation as it does today (FR-007).
- If `content_model: "none"` is set alongside a non-empty `post_types` or `taxonomies` array, this is a validation error (FR-009) — see Contracts.

**Rationale**: A plain boolean (`skip_post_types: true`) was the description's suggested option, but a string enum leaves room to grow (e.g. a future `"minimal"` tier) without a second breaking flag, costs nothing extra to implement now, and reads more clearly in a wizard summary ("Content model: none") than a double-negative boolean. It also avoids naming collision/confusion with the existing `post_types`/`taxonomies` arrays, satisfying the "distinct from omitting post_types" requirement.

**Alternatives considered**:
- `skip_post_types: boolean` — simplest, matches the codebase's existing length-guard convention style, but reads as a negative/exclusion-only flag and doesn't name what *is* being included (blocks/functional features), which is why the agent-doc question in FR-001 is phrased affirmatively ("functional only" vs "content model").
- `mode: "functional" | "content-model"` at the top of the whole config — rejected as too broad a rename; this feature only concerns the content-model subsystem, not overall generation mode (blocks/options-page/etc. remain independently selectable regardless of this flag, per spec Assumptions).

## Decision: Where the generator reads the flag

**Decision**: Resolve `content_model` inside `applyDefaults()` (scripts/generate-plugin.js, ~line 283) immediately alongside the existing `post_types`/`taxonomies` normalization, producing a single derived boolean `fullConfig.isFunctionalOnly` that every downstream guard checks (replacing/augmenting the existing `fullConfig.post_types && fullConfig.post_types.length > 0` checks).

**Rationale**: `applyDefaults()` already owns legacy-field normalization and is the single place every other generator function reads its config from (`generatePerCPTBlocks`, `generatePostTypeJSONFiles`, `generateTaxonomySCFGroups`, `generateSCFFieldGroup`, and the `copyDirWithReplacement` call site). Centralising the derived flag there means every guard becomes `if (!fullConfig.isFunctionalOnly && ...)`, a minimal, consistent diff, and avoids re-deriving the flag in multiple call sites.

**Alternatives considered**: Checking `config.content_model === 'none'` inline at each of the ~5 call sites — rejected as more error-prone (easy to miss one site, as happened historically with the unconditional `copyDirWithReplacement` call this feature is fixing).

## Decision: How to exclude the static content-model files from `copyDirWithReplacement`

**Decision**: `copyDirWithReplacement` (or its caller) gains an `excludePatterns` option; when `fullConfig.isFunctionalOnly` is true, the generator call site passes the known content-model static paths (`patterns/{{slug}}-grid.php`, `-archive.php`, `-card.php`, `-featured.php`, `-meta.php`, `-single.php`, `-slider.php`, `scf-json/group_{{slug}}_example.json`, plus the JS hook/component/block paths from FR-006) as exclusions, rather than post-filtering the output tree after copy.

**Rationale**: Exclude-before-write avoids ever creating-then-deleting files (simpler to test, no risk of a stray file surviving a partial failure), and keeps the "what gets generated" decision co-located with the other content-model guards added in the same change.

**Alternatives considered**: Post-generation cleanup pass (`rm` matching files after full copy) — rejected: extra pass, extra risk surface, and inconsistent with FR-004/FR-005's "MUST NOT produce" wording (implies never-created, not created-then-removed).

## Decision: Validation conflict rule (FR-009) location

**Decision**: Implement the "functional-only + non-empty post_types/taxonomies" conflict check in `scripts/validation/validate-plugin-config.js` (existing config validator), returning the same structured error format the validator already uses for other `plugin-config.json` problems, in addition to — not instead of — the JSON Schema-level `not`/`if`/`then` constraint added to `plugin-config.schema.json`.

**Rationale**: The schema-level constraint gives static/CI validators (schema-only tooling, editors with JSON Schema support) a chance to catch the conflict without running the generator; the script-level check gives a clear, actionable, human-readable error message at generation time (schema validation errors are often cryptic to end users). Both are cheap to add and the codebase already validates at both layers for other rules.

**Alternatives considered**: Schema-only — rejected, error messages from raw AJV schema violations are poor UX for a wizard-completing end user (FR-009 requires "clear, actionable" error, spec SC-004).

## Decision: Conversational wizard insertion point

**Decision**: Insert the new content-model question in `.github/agents/generate-plugin.agent.md` as an explicit step between "Stage 1: Plugin Identity" and "Stage 2: Custom Post Type (CPT)", with a one-line branch instruction ("If functional-only, skip directly to Stage 6: Blocks Configuration / Stage 7: Templates & Patterns") added to the doc's stage list, plus a parallel update to the "Conversation Flow Example" section so the documented example transcript reflects the new question.

**Rationale**: The doc is the literal source of truth the conversational agent follows (there is no separate machine-readable question list driving Stages 2–5 per the earlier codebase survey — `scripts/lib/wizard.js` only handles identity fields). Editing the doc's stage sequence directly is the correct and only mechanism to change agent behaviour for this conversational flow, consistent with how Stages 1–8 are already defined purely in prose/table form.

**Alternatives considered**: Building a new machine-readable question schema (e.g. `scripts/agents/generate-plugin.questions.js`) to drive Stage skipping — noted by the earlier survey as worth inspecting, but out of scope: no such mechanism currently exists for Stages 2–5, and introducing one would be a much larger refactor unrelated to this feature's goal (this feature only needs to *add a skip*, not restructure how the conversational agent is driven).

## Decision: Test strategy

**Decision**: Add one Jest spec (`generate-plugin.functional-only.test.js`) using the existing dry-run/mock generation harness (`npm run test:dry-run` infrastructure already in the repo) with two fixture configs — one with `content_model: "none"`, one with a populated `post_types` array (existing default) — asserting on the resulting output file tree (presence/absence lists per FR-004–FR-008), plus a validation-layer unit test asserting FR-009's conflict rejection.

**Rationale**: The repo already has dry-run infrastructure (`scripts/dry-run/*`, `npm run test:dry-run`) purpose-built for asserting generated output without touching a real filesystem outside test scope — reusing it is both idiomatic and the lowest-effort path to SC-002/SC-003/SC-004 verification.

**Alternatives considered**: E2E generation + manual directory diff — unnecessarily slow for what is fundamentally a config-to-file-list mapping; reserved for later manual smoke-testing per quickstart.md, not as the primary automated test.

## Outstanding items

None — all Technical Context fields resolved; no `[NEEDS CLARIFICATION]` markers remain from the spec.
