# Quickstart: Validating Functional-Only Generation Mode

Prerequisites: repo dependencies installed (`npm ci`), working from the repo root of `block-plugin-scaffold`.

## Scenario A — Functional-only config generates no content-model files

1. Create a minimal functional-only config (or use the fixture added under `tests/fixtures/plugin-config.functional-only.json` per [plan.md](./plan.md)'s Project Structure):

   ```json
   {
     "slug": "my-functional-plugin",
     "name": "My Functional Plugin",
     "author": "LightSpeed",
     "content_model": "none"
   }
   ```

2. Run the generator in dry-run/generator mode:

   ```bash
   node scripts/generate-plugin.js --config tests/fixtures/plugin-config.functional-only.json
   ```

3. Expected outcome, inspecting `generated-plugins/my-functional-plugin/`:
   - No `scf-json/post-type-*.json` or `scf-json/taxonomy-*.json` files.
   - No `scf-json/group_{{slug}}_example.json` equivalent file.
   - No `patterns/my-functional-plugin-grid.php` (nor `-archive`, `-card`, `-featured`, `-meta`, `-single`, `-slider`).
   - No `src/hooks/usePostType.js`, `useTaxonomies.js`, `useCollection.js`.
   - No `src/components/TaxonomyFilter/`, `src/components/PostSelector/`.
   - No `src/blocks/my-functional-plugin-collection/`.
   - Block registration index, build config (`webpack.config.js`, `package.json`, `composer.json`), and `inc/*.php` core classes ARE present and match a normal generation run.

   Validates: spec Success Criteria SC-002.

## Scenario B — Existing content-model config is unaffected (regression check)

1. Use an existing/representative config with a populated `post_types` array and no `content_model` field (or `content_model: "custom"`).
2. Generate as in Scenario A.
3. Expected outcome: output is identical to a generation run from before this feature shipped (diff generated output against a pre-feature baseline generation of the same config, if one is available, or against the currently-checked-in generator behaviour for existing fixtures).

   Validates: spec Success Criteria SC-003.

## Scenario C — Conflicting config is rejected

1. Create a config with `content_model: "none"` AND a non-empty `post_types` array.
2. Run the generator (or just the validator: `node scripts/validation/validate-plugin-config.js --config <path>` if it supports standalone invocation, else via the generator's built-in validation step).
3. Expected outcome: generation aborts before any files are written, with an error message naming both `content_model` and `post_types` and explaining the conflict (per [contracts/plugin-config-schema-delta.md](./contracts/plugin-config-schema-delta.md)).

   Validates: spec Success Criteria SC-004, FR-009.

## Scenario D — Conversational wizard asks the content-model question first

1. Start the generate-plugin agent conversation (per `.github/agents/generate-plugin.agent.md`) in an interactive session.
2. After providing Stage 1 (Plugin Identity) answers, confirm the very next question is the content-model question (not a CPT-detail question).
3. Answer "functional only".
4. Confirm the agent proceeds directly to Blocks/Templates/Additional Features stages, never asking about post type name, taxonomies, fields, or repeaters.
5. Confirm the pre-generation summary explicitly states "Content model: none" (or equivalent) before asking for final confirmation.

   Validates: spec User Story 1 acceptance scenarios 1–2, FR-001, FR-002, FR-012.

## Automated coverage

Scenarios A–C should be encoded as the Jest spec `generate-plugin.functional-only.test.js` (see [research.md](./research.md) Test strategy decision) and run via:

```bash
npm run test:unit
npm run test:dry-run
```

Scenario D is a conversational/manual check (no machine-readable question driver exists for these stages per research.md) and should be re-verified manually whenever `generate-plugin.agent.md`'s stage ordering changes.
