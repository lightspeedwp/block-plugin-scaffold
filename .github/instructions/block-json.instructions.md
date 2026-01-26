---
file_type: instructions
applyTo: '**/block.json'
description: Comprehensive block.json configuration standards for WordPress block plugins
license: GPL-3.0-or-later
references:
  - ../custom-instructions.md
---

> ⚠️ **Scope Notice**: These instructions are intended for **WordPress block plugin repositories** within the `lightspeedwp` GitHub organisation. They should **not** be applied to the `lightspeedwp/.github` community health repository, as that repository does not contain WordPress code.

# block.json Configuration Guidelines for Block Plugins

You are a block metadata architect. Follow our multi-block plugin block.json conventions to describe, register, and ship blocks consistently. Avoid custom registration code paths or inline script/style handles that bypass the shared block.json-first workflow.

## Overview

The `block.json` file is the canonical way to register blocks in WordPress. This document provides comprehensive guidance for block plugin development following WordPress best practices.

## General Rules

- Keep block definitions block.json-first; do not register blocks via bespoke PHP/JS entry points.
- Names must be namespaced and stable; avoid renaming without deprecation and migration.
- Reference built assets via `file:./build/...` paths that the shared build pipeline emits.
- Document attributes and supports clearly; prefer explicit defaults and strict types.
- Keep descriptions, titles, and keywords localised and accurate.

## Detailed Guidance

### Core Structure

### Required Fields

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "namespace/block-name",
  "title": "Block Title",
  "category": "widgets",
  "icon": "smiley",
  "description": "A clear description of what this block does",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "version": "1.0.0",
  "textdomain": "plugin-textdomain"
}
```

### Essential Properties

- **`name`**: Namespaced block identifier (e.g., `myplugin/my-block`)
- **`title`**: Human-readable block title (translatable)
- **`description`**: Clear explanation of block purpose and functionality
- **`category`**: One of: text, media, design, widgets, theme, embed
- **`keywords`**: Array of searchable terms (max 3 recommended)
- **`supports`**: Feature flags for block capabilities

## Attributes System

### Attribute Definition

```json
{
  "attributes": {
    "content": {
      "type": "string",
      "source": "html",
      "selector": "p",
      "default": ""
    },
    "alignment": {
      "type": "string",
      "default": "left"
    },
    "mediaId": {
      "type": "number",
      "default": 0
    },
    "mediaUrl": {
      "type": "string",
      "default": ""
    },
    "showTitle": {
      "type": "boolean",
      "default": true
    }
  }
}
```

### Attribute Types

- **string**: Text content
- **number**: Numeric values
- **boolean**: True/false flags
- **array**: Collections of values
- **object**: Structured data

### Attribute Sources

- **`attribute`**: HTML attribute value
- **`text`**: Inner text content
- **`html`**: Inner HTML content
- **`query`**: Complex nested data
- **`meta`**: Post meta value

### Best Practices for Attributes

- Provide sensible defaults for all attributes
- Use strict typing (avoid `any` type)
- Validate and sanitize on save
- Document expected data structures
- Keep attribute names semantic and clear

## Block Supports

### Standard Supports

```json
{
  "supports": {
    "align": ["left", "center", "right", "wide", "full"],
    "alignWide": true,
    "anchor": true,
    "className": true,
    "color": {
      "background": true,
      "text": true,
      "gradients": true,
      "link": true
    },
    "spacing": {
      "margin": true,
      "padding": true,
      "blockGap": true
    },
    "typography": {
      "fontSize": true,
      "lineHeight": true,
      "fontFamily": true,
      "fontWeight": true
    },
    "customClassName": true,
    "html": false,
    "inserter": true,
    "multiple": true,
    "reusable": true,
    "lock": true
  }
}
```

### Support Recommendations

- Enable `anchor` for deep linking capability
- Disable `html` for security (unless needed)
- Use `multiple: false` for singleton blocks
- Enable spacing/typography for flexibility
- Consider `lock` for pattern stability

## Editor and View Scripts

### Script Registration

```json
{
  "editorScript": "file:./build/index.js",
  "editorStyle": "file:./build/index.css",
  "script": "file:./build/frontend.js",
  "style": "file:./build/style.css",
  "viewScript": "file:./build/view.js"
}
```

### Script Types

- **`editorScript`**: Block editor JavaScript
- **`editorStyle`**: Block editor CSS
- **`script`**: Both editor and frontend JavaScript
- **`style`**: Both editor and frontend CSS
- **`viewScript`**: Frontend-only JavaScript

### Best Practices

- Separate editor and frontend assets
- Minimize frontend bundle size
- Use `viewScript` for interactive blocks
- Lazy load heavy dependencies
- Follow WordPress script dependencies

## Block Variations

### Variation Definition

```json
{
  "variations": [
    {
      "name": "variation-name",
      "title": "Variation Title",
      "description": "What makes this variation different",
      "icon": "star-filled",
      "isDefault": false,
      "attributes": {
        "style": "outlined",
        "size": "large"
      },
      "innerBlocks": [["core/heading", { "level": 2 }], ["core/paragraph"]],
      "scope": ["block", "inserter", "transform"]
    }
  ]
}
```

### Variation Scopes

- **`block`**: Available in block toolbar
- **`inserter`**: Appears in block inserter
- **`transform`**: Available via block transform

## Block Patterns & Templates

### Example Property

```json
{
  "example": {
    "attributes": {
      "content": "Sample content for preview",
      "alignment": "center"
    },
    "innerBlocks": [
      {
        "name": "core/paragraph",
        "attributes": {
          "content": "This is how the block looks"
        }
      }
    ]
  }
}
```

### Uses Context

```json
{
  "usesContext": ["postId", "postType", "queryId"],
  "providesContext": {
    "namespace/customValue": "customAttribute"
  }
}
```

## Parent and Ancestor

### Limiting Block Usage

```json
{
  "parent": ["core/group", "core/columns"],
  "ancestor": ["namespace/container-block"]
}
```

## Internationalization

### Translation Support

```json
{
  "textdomain": "plugin-textdomain",
  "title": "Block Title",
  "description": "Block description",
  "keywords": ["keyword1", "keyword2"]
}
```

### i18n Best Practices

- Use consistent textdomain across plugin
- Translate all user-facing strings
- Avoid string concatenation
- Test with RTL languages
- Provide translator context when needed

## Accessibility Considerations

### Block Title & Description

- Use clear, descriptive titles
- Explain block purpose in description
- Include accessibility keywords
- Limit control complexity
- Provide helpful error messages

### ARIA and Semantic HTML

- Use semantic HTML in `save` function
- Provide appropriate ARIA attributes
- Ensure keyboard accessibility
- Test with screen readers
- Follow WCAG 2.2 AA standards

## Render Callback (Dynamic Blocks)

### WordPress 6.5+ File-based Rendering (RECOMMENDED)

**This is the PRIMARY method** for dynamic blocks in WordPress 6.5+. Use `render` property in block.json:

```json
{
  "render": "file:./render.php"
}
```

**render.php** receives these variables automatically:
- `$attributes` - Block attributes array
- `$content` - Block inner content (for dynamic InnerBlocks)
- `$block` - WP_Block instance with context and metadata

```php
<?php
/**
 * Dynamic block rendering template
 *
 * @package {{namespace}}
 * @var array    $attributes Block attributes
 * @var string   $content    Block inner content
 * @var WP_Block $block      Block instance
 */

$alignment = $attributes['alignment'] ?? 'left';
$post_id = $block->context['postId'] ?? get_the_ID();

?>
<div class="wp-block-{{namespace}}-custom-block align<?php echo esc_attr( $alignment ); ?>">
    <?php echo wp_kses_post( $content ); ?>
</div>
```

### Legacy PHP Callback (WordPress < 6.5 - DEPRECATED)

**Only use if you need to support WordPress versions before 6.5.** Register callback in PHP:

```php
register_block_type( 'namespace/block-name', array(
    'render_callback' => 'namespace_render_block_callback',
) );

function namespace_render_block_callback( $attributes, $content, $block ) {
    return sprintf(
        '<div class="wp-block-namespace-block">%s</div>',
        wp_kses_post( $content )
    );
}
```

### Version Compatibility Matrix

| WordPress Version | Render Method | Support Status |
|-------------------|---------------|----------------|
| **6.5+** | `"render": "file:./render.php"` | ✅ Recommended |
| **6.0 - 6.4** | `render_callback` in PHP | ⚠️ Legacy support |
| **< 6.0** | `render_callback` in PHP | ❌ Not scaffold target |

**Scaffold Standard:** Always use `"render": "file:./render.php"` in block.json. This is cleaner, more maintainable, and aligns with WordPress core direction.

### Dynamic Block Best Practices

- Validate and sanitize attributes
- Escape all output
- Use efficient queries
- Cache when appropriate
- Handle edge cases gracefully

## Performance Optimization

### Bundle Splitting

- Separate editor and frontend code
- Use dynamic imports for heavy features
- Minimize dependencies
- Tree-shake unused code
- Optimize images and assets

### Lazy Loading

- Load view scripts only when needed
- Use Intersection Observer for visibility
- Defer non-critical JavaScript
- Preload critical resources

## Validation & Testing

### Schema Validation

```bash
# Validate block.json against schema
npm run lint:block-json
```

### Testing Checklist

- [ ] Block inserts without errors
- [ ] Attributes save and load correctly
- [ ] Supports work as expected
- [ ] Variations display properly
- [ ] Accessibility requirements met
- [ ] RTL layout works correctly
- [ ] Mobile responsive
- [ ] Performance acceptable

## Examples

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "tour-operator/card",
  "title": "Tour Card",
  "category": "widgets",
  "description": "Display tour highlights with image, title, and price.",
  "keywords": ["tour", "card", "travel"],
  "attributes": {
    "title": { "type": "string", "default": "" },
    "price": { "type": "number", "default": 0 },
    "imageId": { "type": "number", "default": 0 }
  },
  "supports": {
    "spacing": { "margin": true, "padding": true },
    "typography": { "fontSize": true },
    "anchor": true,
    "html": false
  },
  "editorScript": "file:./build/tour-card.js",
  "style": "file:./build/tour-card.css"
}
```

Avoid adding inline script URLs or omitting defaults; keep the block portable across themes.

## Security

### Input Sanitization

- Validate all attribute values
- Sanitize HTML content
- Escape output appropriately
- Check user capabilities
- Use nonces for AJAX requests

### Output Escaping

```php
// Text content
echo esc_html( $text );

// HTML content
echo wp_kses_post( $html );

// Attributes
echo esc_attr( $attribute );

// URLs
echo esc_url( $url );
```

## Validation

- Validate `block.json` against the schema (IDE validation or `npx ajv validate -s https://schemas.wp.org/trunk/block.json -d path/to/block.json`).
- Run `npm run lint` to catch JSON and JS/TS issues referenced by the block.
- Run `npm test` (or targeted block tests) after schema or attribute changes.
- Build assets with `npm run build` to ensure referenced file handles are produced.
