---
name: "Specification to Plugin Config Converter"
description: Convert content model specifications (tables, markdown docs) into valid plugin-config.json files for the multi-block plugin scaffold generator
category: content-modeling
version: 1.0.0
author: LightSpeed
tags: [plugin-generation, content-model, custom-post-types, taxonomies, configuration]
---

# Specification to Plugin Config Converter Skill

## Purpose

This skill converts content model specifications from various formats (Markdown tables, spreadsheets, documentation) into properly formatted `plugin-config.json` files that work with the multi-block plugin scaffold generator.

## When to Use This Skill

Use this skill when:
- Converting content model specifications into plugin configurations
- Parsing tables of custom post types, taxonomies, and fields
- Transforming business requirements into technical plugin configs
- Creating multi-post-type plugin configurations from documentation
- Migrating legacy single-CPT configs to the new multi-post-type array format

## Input Requirements

The skill expects specification documents containing:

### 1. Custom Post Types Table

Columns needed:
- **CPT Key/Slug** (required): Machine-readable slug (lowercase, underscores)
- **Singular Label** (required): Human-readable singular name
- **Plural Label** (required): Human-readable plural name
- **Description**: Brief description of the post type's purpose
- **Supports**: Features like title, editor, thumbnail, excerpt, author, etc.
- **Has Archive**: Boolean indicating if archive pages are needed
- **REST API**: Boolean for REST API support
- **Icon**: Dashicon name (without "dashicons-" prefix)

### 2. Taxonomies Table

Columns needed:
- **Taxonomy Key/Slug** (required): Machine-readable slug
- **Singular/Plural Labels** (required): Human-readable names
- **Hierarchical**: Boolean (true for categories, false for tags)
- **Attached to CPTs**: Which post types use this taxonomy
- **Notes**: Additional context or validation rules

### 3. Fields Table (per CPT)

Columns needed:
- **Field Label** (required): Human-readable label shown in admin
- **Key** (required): Machine-readable field key (lowercase, underscores)
- **Type** (required): SCF field type (text, textarea, number, etc.)
- **Help/Validation**: Instructions, conditional logic, validation rules
- **Required**: Boolean indicating if field is mandatory
- **Default/Example**: Default value or example data

## Processing Steps

### Step 1: Parse Custom Post Types

```javascript
// Extract CPT data from specification
const postTypes = [];

for each CPT in specification {
  const postType = {
    slug: cpt.key,                    // Must be lowercase, underscores allowed
    singular: cpt.singular_label,
    plural: cpt.plural_label,
    supports: parseSupports(cpt.supports), // Convert to array
    has_archive: cpt.has_archive ?? true,
    public: cpt.rest_api ?? true,
    menu_icon: `dashicons-${cpt.icon}`,
    taxonomies: [],                   // To be populated in Step 2
    fields: []                        // To be populated in Step 3
  };
  postTypes.push(postType);
}
```

### Step 2: Parse and Assign Taxonomies

```javascript
// Extract taxonomy data and assign to appropriate CPTs
const taxonomies = {};

for each taxonomy in specification {
  const tax = {
    slug: taxonomy.key,
    singular: taxonomy.singular,
    plural: taxonomy.plural,
    hierarchical: taxonomy.hierarchical ?? true
  };
  
  // Determine which post types get this taxonomy
  const attachedCPTs = parseCPTList(taxonomy.attached_to);
  
  // Add to each relevant post type
  for each cpt in attachedCPTs {
    postTypes[cpt].taxonomies.push(tax);
  }
}
```

### Step 3: Parse and Assign Fields

```javascript
// Extract field data for each CPT
for each cpt in postTypes {
  const fieldSpec = findFieldsForCPT(cpt.slug);
  
  for each field in fieldSpec {
    const fieldConfig = {
      name: field.key,
      label: field.label,
      type: mapFieldType(field.type),
      required: field.required ?? false,
      instructions: field.help || field.validation
    };
    
    // Add type-specific properties
    if (field.type === 'number') {
      fieldConfig.min = field.min;
      fieldConfig.max = field.max;
      fieldConfig.default_value = field.default;
    }
    
    if (field.type === 'select') {
      fieldConfig.choices = parseChoices(field.choices);
    }
    
    cpt.fields.push(fieldConfig);
  }
}
```

### Step 4: Build Complete Config

```javascript
const pluginConfig = {
  slug: deriveSlug(specification.plugin_name),
  name: specification.plugin_name,
  description: specification.description,
  author: specification.author || "LightSpeed",
  author_uri: specification.author_uri || "https://developer.lsdev.biz",
  version: "1.0.0",
  textdomain: deriveSlug(specification.plugin_name),
  namespace: deriveSlug(specification.plugin_name).replace(/-/g, '_'),
  requires_wp: "6.5",
  requires_php: "8.0",
  license: "GPL-2.0-or-later",
  post_types: postTypes
};
```

## Field Type Mapping

Map specification field types to SCF field types:

| Spec Type | SCF Type | Notes |
|-----------|----------|-------|
| Text, String | `text` | Single line input |
| Textarea, Long Text | `textarea` | Multi-line input |
| Rich Text, WYSIWYG | `wysiwyg` | Visual editor |
| Number, Integer | `number` | Numeric input with min/max |
| Date | `date_picker` | Date selection |
| DateTime, Timestamp | `date_time_picker` | Date and time |
| Boolean, True/False | `true_false` | Checkbox |
| Dropdown, Select | `select` | Dropdown menu |
| Radio | `radio` | Radio buttons |
| Checkbox List | `checkbox` | Multiple checkboxes |
| Image, Media | `image` | Image uploader |
| File, Upload | `file` | File uploader |
| Gallery | `gallery` | Multiple images |
| URL, Link | `url` | URL field |
| Email | `email` | Email field |
| Relationship, Link to | `relationship` | Link to other posts |
| Repeater, Group | `repeater` | Repeating fields |
| Color | `color_picker` | Color selector |

## Validation Rules

### Slug Validation
- Plugin slug: `^[a-z][a-z0-9-]{1,48}[a-z0-9]$` (hyphens)
- CPT slug: `^[a-z][a-z0-9_]{0,18}[a-z0-9]$` (underscores, max 20 chars)
- Taxonomy slug: `^[a-z][a-z0-9_]{0,30}[a-z0-9]$` (underscores, max 32 chars)
- Field key: `^[a-z][a-z0-9_]*$` (underscores only)

### Required Fields
- Plugin level: `slug`, `name`, `author`
- Post type level: `slug`, `singular`, `plural`
- Taxonomy level: `slug`, `singular`, `plural`
- Field level: `name`, `label`, `type`

## Output Format

The generated config must be valid JSON following the plugin-config.schema.json:

```json
{
  "slug": "plugin-slug",
  "name": "Plugin Name",
  "description": "Description",
  "author": "Author Name",
  "author_uri": "https://example.com",
  "version": "1.0.0",
  "textdomain": "plugin-slug",
  "namespace": "plugin_slug",
  "requires_wp": "6.5",
  "requires_php": "8.0",
  "license": "GPL-2.0-or-later",
  "post_types": [
    {
      "slug": "cpt_slug",
      "singular": "Post Type",
      "plural": "Post Types",
      "supports": ["title", "editor", "thumbnail"],
      "has_archive": true,
      "public": true,
      "menu_icon": "dashicons-admin-post",
      "taxonomies": [
        {
          "slug": "taxonomy_slug",
          "singular": "Category",
          "plural": "Categories",
          "hierarchical": true
        }
      ],
      "fields": [
        {
          "name": "field_key",
          "label": "Field Label",
          "type": "text",
          "required": false,
          "instructions": "Help text"
        }
      ]
    }
  ]
}
```

## Usage Example

**Input Specification:**
```markdown
| CPT Key | Singular | Plural | Supports | Icon |
|---------|----------|--------|----------|------|
| event | Event | Events | title,editor,thumbnail | calendar |

| Taxonomy | Type | Attached To |
|----------|------|-------------|
| event_category | Hierarchical | event |

| Field | Key | Type | Required |
|-------|-----|------|----------|
| Event Date | event_date | Date | Yes |
```

**Command:**
```bash
# Parse specification and generate config
Convert specification to plugin config:
- Plugin: Event Manager (event-manager)
- Output: /path/to/plugins/event-manager-config.json
```

**Output File:** `event-manager-config.json`

## Best Practices

1. **Slug Consistency**: Derive namespace and textdomain from the main plugin slug
2. **Icon Selection**: Use appropriate dashicons that represent the content type
3. **Field Organization**: Group related fields logically within each post type
4. **Taxonomy Sharing**: Reuse taxonomies across post types where it makes sense
5. **Validation**: Include clear instructions for required fields
6. **Defaults**: Set sensible defaults for common field types
7. **Documentation**: Add inline comments for complex field configurations

## Common Patterns

### Shared Taxonomies
When multiple post types need the same taxonomy:
```json
"taxonomies": [
  {
    "slug": "topic",
    "singular": "Topic",
    "plural": "Topics",
    "hierarchical": true
  }
]
```

### Author/Contributor Fields
For content with multiple authors:
```json
{
  "name": "authors",
  "label": "Authors",
  "type": "repeater",
  "required": true,
  "instructions": "Add author details"
}
```

### Publication Workflow
For content requiring approval:
```json
{
  "name": "publication_status",
  "label": "Publication Status",
  "type": "select",
  "choices": {
    "draft": "Draft",
    "review": "In Review",
    "approved": "Approved",
    "published": "Published"
  }
}
```

## Error Handling

If specification is incomplete:
1. Prompt for missing required fields
2. Suggest reasonable defaults
3. Flag validation issues
4. Generate partial config with TODOs

## Related Resources

- [Plugin Config Schema](/.github/schemas/plugin-config.schema.json)
- [Generate Plugin Agent](/.github/agents/generate-plugin.agent.md)
- [SCF Field Types Documentation](/docs/scf-field-types.md)
- [WordPress Dashicons Reference](https://developer.wordpress.org/resource/dashicons/)

## Version History

- **1.0.0** (2026-01-21): Initial skill creation with multi-post-type array support
