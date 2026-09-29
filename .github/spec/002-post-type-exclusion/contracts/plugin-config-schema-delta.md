# Contract: `plugin-config.json` schema delta

This is the external interface change: the config file contract consumed by (a) the conversational generate-plugin agent, (b) automation/CI invoking the generator non-interactively with `--config`, and (c) any editor/tooling with JSON Schema support against `.github/schemas/plugin-config.schema.json`.

## Added property

```jsonc
{
  "properties": {
    "content_model": {
      "type": "string",
      "enum": ["none", "custom"],
      "description": "Whether this plugin defines a custom content model (post types/taxonomies) or is functional-only (blocks/settings, no post types or taxonomies). Omit to preserve legacy behaviour driven solely by the presence of `post_types`.",
      "default": "custom"
    }
  }
}
```

## Added cross-field constraint

```jsonc
{
  "if": {
    "properties": { "content_model": { "const": "none" } },
    "required": ["content_model"]
  },
  "then": {
    "properties": {
      "post_types": { "maxItems": 0 },
      "taxonomies": { "maxItems": 0 }
    }
  }
}
```

Equivalent validator-script check (`scripts/validation/validate-plugin-config.js`) MUST produce a human-readable error, e.g.:

```text
Configuration error: "content_model" is set to "none" (functional-only) but "post_types" contains 1 entr(y/ies).
Remove the post_types/taxonomies entries, or set "content_model" to "custom" (or omit it) to keep them.
```

## Backward compatibility guarantee

- Any existing `plugin-config.json` that does not set `content_model` validates and generates identically to pre-feature behaviour (no new required property, no default that changes existing runs' output).
- `content_model: "custom"` with a populated `post_types` array is equivalent to today's default (undefined `content_model`) — explicit opt-in for clarity, not a behaviour change.

## Consumers of this contract

| Consumer | How it uses the flag |
|---|---|
| `generate-plugin.agent.md` conversational wizard | Writes `content_model: "none"` into the config it assembles when the user answers "functional only" to the new up-front question (FR-001/FR-002). |
| `scripts/generate-plugin.js` (`applyDefaults()`) | Reads `content_model`, derives `fullConfig.isFunctionalOnly`, gates all content-model generation (FR-004–FR-008). |
| `scripts/validation/validate-plugin-config.js` | Enforces the conflict rule (FR-009). |
| `.github/schemas/plugin-config.schema.json` | Documents the property and schema-level conflict constraint (FR-010). |
| CI / non-interactive `--config` runs | Can set the flag directly without going through the conversational wizard (spec User Story 3). |
