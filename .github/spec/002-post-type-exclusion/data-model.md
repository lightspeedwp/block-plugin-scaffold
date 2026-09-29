# Phase 1 Data Model: Functional-Only Generation Mode

## Entity: Plugin Configuration (`plugin-config.json`)

Existing entity, gains one new field.

| Field | Type | Required | Notes |
|---|---|---|---|
| `content_model` | `"none" \| "custom"` (string enum) | No (default behaviour unchanged if absent) | New in this feature. `"none"` = functional-only mode (FR-003). `"custom"` = explicit content-model mode (equivalent to today's default when `post_types` is populated). Absence preserves pre-feature behaviour exactly (FR-007). |
| `post_types` | array (existing) | No | MUST be empty or absent when `content_model === "none"` (FR-009). Unchanged otherwise. |
| `taxonomies` | array (existing) | No | MUST be empty or absent when `content_model === "none"` (FR-009). Unchanged otherwise. |
| `fields` | array (existing) | No | Unaffected directly; naturally empty in functional-only mode since fields are declared per post type. |

**Validation rules**:
- `content_model === "none"` AND (`post_types.length > 0` OR `taxonomies.length > 0`) → configuration error (FR-009), surfaced both as a JSON Schema constraint and a validator-script error message.
- `content_model` absent → no new validation behaviour; existing rules apply unchanged.

**Derived value** (not persisted, computed at generation time in `applyDefaults()`):

| Derived field | Type | Computed as |
|---|---|---|
| `fullConfig.isFunctionalOnly` | boolean | `config.content_model === 'none'` |

## Entity: Generated Plugin Output (file tree)

Not a data entity in the traditional sense, but the feature's primary observable artefact. Modelled here as a set membership rule rather than a schema.

| File/path group | Present when `isFunctionalOnly === true`? | Present when `isFunctionalOnly === false` (today's behaviour)? |
|---|---|---|
| `scf-json/post-type-*.json` | No | Per existing `post_types` guard (unchanged) |
| `scf-json/taxonomy-*.json` | No | Per existing `taxonomies`/`post_types` guard (unchanged) |
| `scf-json/group_{{slug}}_example.json` | No (newly guarded) | Yes (unchanged) |
| `patterns/{{slug}}-grid.php`, `-archive.php`, `-card.php`, `-featured.php`, `-meta.php`, `-single.php`, `-slider.php` | No (newly guarded) | Yes (unchanged) |
| `src/hooks/usePostType.js`, `useTaxonomies.js`, `useCollection.js` | No (newly guarded) | Yes (unchanged) |
| `src/components/TaxonomyFilter/*`, `src/components/PostSelector/*` | No (newly guarded) | Yes (unchanged) |
| `src/blocks/{{block_slug}}-collection/*` | No (newly guarded) | Yes (unchanged) |
| Block registration/index (`generateSrcIndexFile()` output), build tooling, `inc/*.php` core classes | Yes (unaffected) | Yes (unaffected) |

## State transitions

None — `content_model` is a single generation-time input, not a stateful/mutable entity. Regenerating an existing plugin with a different `content_model` value is explicitly out of scope (spec Edge Cases: "regeneration is out of scope").
