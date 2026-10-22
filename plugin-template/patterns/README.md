---
title: Pattern Slug Convention
category: Documentation
created: 2025-12-18
description: Explains the unique slug convention for block patterns in this plugin scaffold.
---

# Pattern Slug Convention

## Purpose

To ensure all block pattern slugs are unique, descriptive, and compatible with multi-post-type or multi-feature plugins, this scaffold uses a structured slug format.

## Slug Format

```
{{slug}}/{{post_type}}-{pattern-purpose}
```

- `{{slug}}`: The plugin namespace (e.g., `tour-operator`)
- `{{post_type}}`: The relevant post type (e.g., `tour`, `item`, `event`)
- `{pattern-purpose}`: The pattern's function (e.g., `single`, `card`, `archive`, `meta`, `grid`, `featured`, `slider`)

### Examples

- `tour-operator/tour-single` — Single view for the `tour` post type
- `tour-operator/item-card` — Card for the `item` post type
- `tour-operator/event-archive` — Archive grid for the `event` post type

## Usage in Pattern Files

- The `slug` property in each pattern's PHP file **must** use this format.
- All internal references (e.g., `<!-- wp:pattern {"slug":"..."} /-->`) must match the new slug.
- Avoid using only `{{slug}}/{{slug}}-{pattern}` as it is not unique enough for complex plugins.

## Migration Guidance

- Update all pattern files and references to use the new format.
- Use the most specific post type or feature relevant to the pattern.
- If a pattern is generic, use a shared or default post type (e.g., `item`).

## Rationale

This convention prevents slug collisions, improves discoverability, and supports scalable plugin architectures.

---

_Last updated: 2025-12-18_
