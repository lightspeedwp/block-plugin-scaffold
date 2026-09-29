# Generate Plugin Prompt

## Goal

Guide the user through the interactive wizard that collects the plugin identity, custom post type, taxonomies, blocks, and Secure Custom Fields (SCF) definitions needed to generate a new WordPress plugin from the scaffold.

## Wizard Flow

1. **Plugin Identity**
   - Required: `{{name}}`, `{{slug}}`, `{{author}}`, `{{author_uri}}`, `{{description}}`, `{{version}}`, `{{license}}`
   - Derived: `{{namespace}}` (slug with underscores), `{{textdomain}}` (slug), `{{license_uri}}`
2. **Custom Post Type**
   - Required: `{{name_singular}}`, `{{name_plural}}`, `{{cpt_slug}}`
   - Options: supports (title, editor, thumbnail, excerpt, revisions)
3. **Taxonomies**
   - Collect each taxonomy slug, singular/plural labels, and whether it is hierarchical.
4. **Blocks & Templates**
   - List required blocks (`card`, `collection`, `slider`, `featured`, etc.)
   - Identify templates (single, archive) and any SCF field groups.

## Mustache Values

The wizard produces a config JSON that populates `{{mustache}}` tokens throughout the scaffold. Key placeholders include:

- `{{name}}`, `{{slug}}`, `{{namespace}}`, `{{textdomain}}`
- `{{author}}`, `{{author_uri}}`, `{{license}}`, `{{license_uri}}`
- `{{cpt_slug}}`, `{{name_plural}}`, `{{taxonomy_slug}}`
- `{{version}}`, `{{requires_wp}}`, `{{requires_php}}`, `{{requires_php}}`

Ensure the generated config matches `.github/schemas/plugin-config.schema.json` so `npm run validate:config` passes before generation.

## Outputs

- `generated-plugins/<slug>/`: fully rendered plugin with replaced placeholders.
- `tmp/dry-run-release/`: sanitized release docs for dry-run validation.
- `logs/`: JSON logs per generation (see `scripts/lib/logger.js`).

## Dry-run & Validation

- Run `npm run validate:config` and `npm run validate:schemas` to confirm schema compliance.
- Use `npm run dry-run` before `npm run build` to replace placeholders for SCSS/JS linting.
- After dry runs, run `npm run dry-run:release` or `npm run dry-run:release-scaffold` to exercise the release agents with sanitized docs.
