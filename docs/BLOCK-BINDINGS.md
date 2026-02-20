# Block Bindings System

This document explains how to use the block bindings system in the scaffold plugin.

## Overview

The block bindings system allows you to display custom field (post meta) values in WordPress blocks with optional prefix text. There are two main ways to use it:

1. **Using Block Bindings with Core Blocks** - Apply bindings to core blocks like Paragraph
2. **Using Field Display Blocks** - Use dedicated field display blocks generated per post type

## Components

### 1. Block Bindings PHP Class (`inc/class-block-bindings.php`)

This class handles:
- Registering the `{{slug}}/post-meta` binding source
- Retrieving post meta values for bound blocks
- Rendering prefix text on the frontend for paragraph blocks

**Key Methods:**
- `get_post_meta_value()` - Retrieves meta values for blocks
- `render_paragraph_prefix_block()` - Adds prefix text to paragraph blocks on frontend

### 2. Paragraph Prefix JavaScript (`src/js/blocks/paragraph-prefix.js`)

This script enhances paragraph blocks with:
- Inspector controls for prefix text and bold option
- Visual prefix display in the editor using CSS pseudo-elements
- Custom attributes (`prefix`, `prefixBold`) for paragraph blocks

**Features:**
- Only shows controls when block has bindings
- Automatically adds space after prefix if needed
- Renders prefix with optional bold styling

### 3. Field Display Blocks (`src/blocks/{{block_slug}}-field-display/`)

Dedicated blocks generated per post type that:
- Display a specific custom field value
- Support prefix text with bold option
- Provide fallback text when field is empty
- Include both editor and frontend rendering

## Usage

### Method 1: Using Block Bindings with Paragraph Blocks

1. Add a **Paragraph** block to your template or pattern
2. In the block's **Advanced** settings, add binding metadata:

```json
{
  "metadata": {
    "bindings": {
      "content": {
        "source": "{{slug}}/post-meta",
        "args": {
          "key": "your_field_key"
        }
      }
    }
  }
}
```

3. In the **{{name}}** panel (appears when binding is set):
   - Enter **Prefix Text** (e.g., "Price:", "From:")
   - Toggle **Bold Prefix** if you want the prefix bold

**Example in Pattern PHP:**

```php
<!-- wp:paragraph {
  "metadata": {
    "bindings": {
      "content": {
        "source": "{{slug}}/post-meta",
        "args": {
          "key": "price"
        }
      }
    }
  },
  "prefix": "From:",
  "prefixBold": true,
  "className": "product-price"
} /-->
```

### Method 2: Using Field Display Blocks

1. Add a **{{cpt_name}} Field Display** block
2. Configure in the Inspector Controls:
   - **Field Key**: The meta key to display (e.g., `price`, `location`)
   - **Prefix Text**: Optional text before the value
   - **Bold Prefix**: Make prefix bold
   - **Fallback Text**: Text to show if field is empty

**Example:**

```
<!-- wp:{{slug}}/webinar-field-display {
  "fieldKey": "event_date",
  "prefix": "Date:",
  "prefixBold": true,
  "fallbackText": "Date TBA"
} /-->
```

## How It Works

### Editor (Block Editor)

1. **Paragraph Blocks with Bindings:**
   - JavaScript filter detects bindings and adds inspector controls
   - CSS pseudo-element (::before) displays prefix in editor
   - Block binding API fetches actual field value

2. **Field Display Blocks:**
   - React component fetches post meta using `useEntityProp`
   - Displays formatted value with prefix in editor
   - Inspector controls allow configuration

### Frontend (Rendered Output)

1. **Paragraph Blocks:**
   - Block binding API replaces content with field value
   - PHP filter (`render_paragraph_prefix_block`) adds prefix
   - Output: `<p><strong>From:</strong> $2,499</p>`

2. **Field Display Blocks:**
   - `render.php` callback generates HTML
   - Fetches post meta and formats with prefix
   - Output: `<div class="wp-block-{{slug}}-{{block_slug}}-field-display"><p><strong>Date:</strong> 2026-03-15</p></div>`

## Generated Blocks Per Post Type

For each post type (e.g., `webinar`, `digital_magazine`), the generator creates:

- `{{slug}}/webinar-field-display` - Display any webinar custom field
- `{{slug}}/digital-magazine-field-display` - Display any digital magazine custom field

These blocks:
- Inherit post context automatically
- Work in Query Loop blocks
- Support WordPress block styling (colors, typography, spacing)

## Best Practices

1. **Choose the Right Method:**
   - Use **paragraph bindings** for simple inline field displays
   - Use **field display blocks** for more structured field presentations

2. **Prefix Guidelines:**
   - Keep prefixes short and descriptive
   - Add punctuation (: or -) at the end
   - Use bold for emphasis on labels

3. **Fallback Text:**
   - Always provide fallback text for optional fields
   - Use clear messaging (e.g., "TBA", "Not specified")

4. **Block Organization:**
   - Group related fields in sections
   - Use consistent styling across field displays
   - Test both editor and frontend rendering

## Extending the System

### Adding Custom Field Types

To support special field types (dates, arrays, etc.), extend the `get_post_meta_value()` method in `class-block-bindings.php`:

```php
// Handle date fields
if ( in_array( $key, array( 'event_date', 'publish_date' ) ) ) {
    $value = wp_date( 'F j, Y', $value );
}

// Handle taxonomy terms
if ( $key === 'categories' ) {
    $terms = get_the_terms( $post_id, 'category' );
    $value = implode( ', ', wp_list_pluck( $terms, 'name' ) );
}
```

### Custom Prefix Rendering

To customize prefix rendering, modify the `render_paragraph_prefix_block()` method or add additional CSS classes.

## Troubleshooting

**Prefix not showing in editor:**
- Check that paragraph-prefix.js is enqueued
- Verify block has bindings metadata
- Clear browser cache

**Field value not displaying:**
- Confirm field key matches post meta key exactly
- Check post has the custom field set
- Verify post ID is correct in context

**Styling issues:**
- Check theme.json for color/typography settings
- Verify block supports are enabled
- Inspect CSS specificity conflicts

## Reference

- [WordPress Block Bindings API](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/)
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [SCF (Secure Custom Fields)](https://github.com/secureCustomFields/secure-custom-fields)
