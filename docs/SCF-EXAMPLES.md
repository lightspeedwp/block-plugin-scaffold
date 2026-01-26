---
title: SCF Field Examples
description: Complete examples of Secure Custom Fields (SCF) field group definitions
category: Reference
type: Examples
audience: Developers
date: 2026-01-26
---

# SCF Field Examples

This directory contains comprehensive examples of Secure Custom Fields (SCF) field group definitions. These examples demonstrate all available field types and their configuration options.

## ⚠️ Important Note

**These are example files for documentation and reference purposes only.** They are not used by the plugin scaffold directly. When generating a plugin, your actual field groups will be created in the `scf-json/` directory based on your plugin configuration.

## 🎯 Default Taxonomy Fields

All taxonomies registered by the plugin automatically include these meta fields (registered via `class-taxonomy-meta.php`):

| Field | Type | Description | Access Method |
|-------|------|-------------|---------------|
| `thumbnail_id` | integer | Attachment ID for taxonomy thumbnail | `Taxonomy_Meta::get_meta($term_id, 'thumbnail_id')` |
| `thumbnail` | string | URL for taxonomy thumbnail image | `Taxonomy_Meta::get_thumbnail_url($term_id, 'medium')` |
| `subtitle` | string | Subtitle/tagline for taxonomy term | `Taxonomy_Meta::get_subtitle($term_id)` |

These fields are:
- Registered for all custom taxonomies defined in post-type JSON files
- Available in the REST API (`show_in_rest => true`)
- Properly sanitized and validated
- Accessible without needing SCF field groups

**Usage Example:**
```php
$term_id = get_queried_object_id();
$thumbnail_url = \{{namespace}}\classes\Taxonomy_Meta::get_thumbnail_url( $term_id, 'large' );
$subtitle = \{{namespace}}\classes\Taxonomy_Meta::get_subtitle( $term_id );
```

---

## Available Examples

### Basic Fields
**File:** [group_example_basic_fields.json](group_example_basic_fields.json)

Demonstrates fundamental text-based field types:
- `text` - Single line text input
- `textarea` - Multi-line text input
- `email` - Email address field with validation
- `url` - URL field with validation
- `number` - Numeric input with min/max/step
- `password` - Masked password input

**Use cases:** Contact information, metadata, simple data entry

---

### Choice Fields
**File:** [group_example_choice_fields.json](group_example_choice_fields.json)

Demonstrates selection and toggle field types:
- `select` - Dropdown selection (single or multiple)
- `checkbox` - Multiple checkbox options
- `radio` - Radio button options (single selection)
- `button_group` - Visual button group selection
- `true_false` - Toggle switch for boolean values

**Use cases:** Status flags, categories, preferences, settings

---

### Content Fields
**File:** [group_example_content_fields.json](group_example_content_fields.json)

Demonstrates rich content and media field types:
- `wysiwyg` - Rich text editor with formatting toolbar
- `oembed` - Embed media from URLs (YouTube, Vimeo, etc.)
- `image` - Single image upload with preview
- `file` - File upload with size constraints
- `gallery` - Multiple image upload and management

**Use cases:** Article content, media libraries, document management

---

### Date & Time Fields
**File:** [group_example_date_time_fields.json](group_example_date_time_fields.json)

Demonstrates temporal and visual selection fields:
- `date_picker` - Calendar date selection
- `date_time_picker` - Combined date and time selection
- `time_picker` - Time selection
- `color_picker` - Color selection with hex/rgba values

**Use cases:** Event scheduling, publication dates, theme customization

---

### Relational Fields
**File:** [group_example_relational_fields.json](group_example_relational_fields.json)

Demonstrates fields that link to other WordPress content:
- `link` - Link field with URL, title, and target
- `post_object` - Select individual posts/pages
- `page_link` - Select and link to pages
- `relationship` - Select multiple related posts
- `taxonomy` - Select and create taxonomy terms
- `user` - Select WordPress users

**Use cases:** Related content, author selection, content relationships

---

### Advanced Fields
**File:** [group_example_advanced_fields.json](group_example_advanced_fields.json)

Demonstrates complex container and layout fields:
- `group` - Group multiple fields together
- `repeater` - Repeating sets of fields
- `flexible_content` - Dynamic layout with multiple layouts
- `tab` - Organize fields into tabs
- `message` - Display informational text

**Use cases:** Complex data structures, dynamic content sections, organized UIs

---

### Taxonomy Fields
**File:** [group_example_taxonomy_fields.json](group_example_taxonomy_fields.json)

Demonstrates custom fields attached to taxonomy terms:
- `thumbnail_id` - Featured image for taxonomy term (uses default field)
- `subtitle` - Short tagline/description (uses default field)
- `wysiwyg` - Rich text extended description
- `color_picker` - Color coding for terms
- `text` - Icon classes or identifiers
- `number` - Custom ordering/sorting

**Use cases:** Enhanced taxonomy terms, category metadata, term branding

**Important:** The `thumbnail_id` and `subtitle` fields shown in this example use the default field names that are automatically registered by the `Taxonomy_Meta` class. This ensures consistency and provides built-in getter methods.

**Location rules:** Use `"param": "taxonomy"` with taxonomy slug as value

**Helper functions available:**
```php
// Get thumbnail URL at any size
$thumbnail = \{{namespace}}\classes\Taxonomy_Meta::get_thumbnail_url( $term_id, 'large' );

// Get subtitle
$subtitle = \{{namespace}}\classes\Taxonomy_Meta::get_subtitle( $term_id );

// Get any meta field
$value = \{{namespace}}\classes\Taxonomy_Meta::get_meta( $term_id, 'thumbnail_id' );
```

---

## Field Group Structure

All SCF field group JSON files follow this structure:

```json
{
  "key": "group_unique_identifier",
  "title": "Field Group Title",
  "description": "Optional description of field group purpose",
  "fields": [
    {
      "key": "field_unique_key",
      "name": "field_name",
      "label": "Field Label",
      "type": "field_type",
      "required": 0,
      "wrapper": {
        "width": "100",
        "class": "",
        "id": ""
      }
    }
  ],
  "location": [
    [
      {
        "param": "post_type",
        "operator": "==",
        "value": "post"
      }
    ]
  ],
  "menu_order": 0,
  "position": "normal",
  "style": "default",
  "label_placement": "top",
  "instruction_placement": "label",
  "hide_on_screen": [],
  "active": true
}
```

## Location Rules

Field groups can be displayed based on various conditions:

```json
"location": [
  [
    {
      "param": "post_type",
      "operator": "==",
      "value": "custom_post_type"
    }
  ]
]
```

**Available parameters:**
- `post_type` - Show for specific post types
- `post_template` - Show for specific page templates
- `post_status` - Show for specific post statuses
- `post_format` - Show for specific post formats
- `post_category` - Show for specific categories
- `post_taxonomy` - Show for specific taxonomy terms
- `taxonomy` - Show for specific taxonomy edit screens (e.g., `"category"`, `"post_tag"`, custom taxonomies)
- `page_template` - Show for specific page templates
- `page_type` - Show for front page, posts page, etc.
- `page_parent` - Show for child pages of specific parent
- `user_role` - Show for specific user roles
- `user_form` - Show on user add/edit forms

**Taxonomy term field groups:**
```json
"location": [
  [
    {
      "param": "taxonomy",
      "operator": "==",
      "value": "magazine_issue"
    }
  ]
]
```

**Multiple conditions (AND):**
```json
"location": [
  [
    {
      "param": "post_type",
      "operator": "==",
      "value": "product"
    },
    {
      "param": "post_category",
      "operator": "==",
      "value": "featured"
    }
  ]
]
```

**Multiple condition groups (OR):**
```json
"location": [
  [
    {
      "param": "post_type",
      "operator": "==",
      "value": "post"
    }
  ],
  [
    {
      "param": "post_type",
      "operator": "==",
      "value": "page"
    }
  ]
]
```

## Wrapper Settings

Control field width and styling:

```json
"wrapper": {
  "width": "50",    // Percentage width (0-100)
  "class": "custom-class",  // Custom CSS class
  "id": "custom-id"         // Custom HTML ID
}
```

## Common Field Properties

Properties available to most field types:

| Property | Type | Description |
|----------|------|-------------|
| `key` | string | Unique identifier for the field |
| `name` | string | Field name used for storage |
| `label` | string | Display label shown in admin |
| `type` | string | Field type (text, select, image, etc.) |
| `required` | boolean | Whether field is required (0 or 1) |
| `instructions` | string | Help text displayed below field |
| `default_value` | mixed | Default value for field |
| `placeholder` | string | Placeholder text for input fields |
| `conditional_logic` | array | Rules for conditional display |
| `wrapper` | object | Width, class, and ID settings |

## Using in Your Plugin

When generating a plugin with the scaffold:

1. **Define fields in plugin config** - Specify fields in your `plugin-config.json`
2. **Generator creates SCF JSON** - Field groups are automatically created in `scf-json/`
3. **Customize as needed** - Edit generated JSON files following these examples
4. **Test thoroughly** - Verify fields display and save correctly

## Field Type Reference

For complete documentation on all field types and their properties, see:
- [SCF Fields Instructions](../.github/instructions/scf-fields.instructions.md)
- [Plugin Generation Guide](GENERATE_PLUGIN.md#secure-custom-fields-scf-integration)

## Best Practices

1. **Use meaningful keys** - Prefix with your plugin namespace
2. **Set required appropriately** - Only require truly essential fields
3. **Add instructions** - Help editors understand field purpose
4. **Organize with tabs** - Use tabs for large field groups
5. **Use conditional logic** - Show/hide fields based on other values
6. **Set sensible defaults** - Provide default values where appropriate
7. **Test data validation** - Verify field validation works as expected

## Migration Notes

If moving from ACF to SCF:
- Field keys and names can remain the same
- Data structure is compatible
- Location rules use same format
- Most field types have 1:1 mapping

## Related Documentation

- [JSON-based Content Model](JSON-POST-TYPES.md)
- [Generate Plugin Guide](GENERATE_PLUGIN.md)
- [SCF Fields Reference](../.github/instructions/scf-fields.instructions.md)
- [Specification to Config Converter](../.github/skills/spec-to-config.skill.md)

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-23
