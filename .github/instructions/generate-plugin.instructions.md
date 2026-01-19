# ⚠️ WARNING: Strict Mustache Placeholder Enforcement

All contributors must use the correct mustache placeholders in all template files, folders, and code. Do not use generic placeholders (like `{{slug}}`) where a more specific one is required (e.g., `{{cpt_slug}}`, `{{taxonomy1_slug}}`).

**Never hard-code plugin-specific values** in the scaffold. All identifiers, class names, translation domains, and meta keys must use the appropriate placeholder as defined in `scripts/mustache-variables-registry.json`.

The mustache registry is updated automatically by running:

```sh
node scripts/scan-mustache-variables.js --update-registry
```

If you add, rename, or remove placeholders, always update the registry and review the change report in `scripts/reports/`.

See `docs/GENERATE_PLUGIN.md` for more details and the latest warning.

**Failure to follow these rules will break plugin generation and may result in lost work.**

---
name: Plugin Generator Instructions
description: >-
  Rules and standards for using mustache template values in scaffold plugin
  generation
applyTo: '**'
references:
  - ../custom-instructions.md
---

# Plugin Generator Instructions

You are a scaffold generation assistant. Follow our mustache-driven plugin generator patterns to produce multi-block plugins that align with LightSpeed conventions. Avoid hard-coding values or bypassing the generator workflows unless explicitly requested.

## Overview

Use this guide when running or updating the plugin generator. It explains how to use mustache placeholders, detect repository mode, and keep generated plugins aligned with the scaffold. It does not cover block development or release workflows.

## General Rules

- Always detect whether you are in scaffold mode or template mode before generation.
- Use only mustache `{{variable}}` placeholders; never hard-code values.
- Keep output paths confined to the documented `generated-plugins/` or in-place mode.
- Respect `.gitignore`/`.distignore`; never commit generated artefacts from the scaffold repo.
- Keep variables localised, namespaced, and consistent across all file types.

## Detailed Guidance

## Repository Context Detection (CRITICAL)

**Before generating any plugin, you MUST determine the repository context:**

### Scenario 1: Scaffold Repository (Generator Mode)
- **Repository:** `lightspeedwp/multi-block-plugin-scaffold`
- **Detection:** Check git remote or ask user
- **Output Location:** `output-plugin/` or `generated-plugins/<slug>/`
- **Command:** `node scripts/generate-plugin.js --config plugin-config.json`
- **Behavior:** Creates new folder, leaves scaffold untouched
- **Git Ignore:** Output folders are excluded via `.gitignore`

### Scenario 2: New Repository (Template Mode)
- **Repository:** User's own repository (created from scaffold template)
- **Detection:** Check git remote or ask user
- **Output Location:** Current directory (in-place replacement)
- **Command:** `node scripts/generate-plugin.js --config plugin-config.json --in-place`
- **Behavior:** Replaces all `{{mustache}}` variables in current directory
- **Confirmation:** Requires user confirmation before proceeding (destructive operation)

### How to Detect Repository Context

**Ask the user explicitly:**
> "Are you running this generator in the `lightspeedwp/multi-block-plugin-scaffold` repository, or in a new repository created from the template?"

**Or check git remote:**
```bash
git remote get-url origin
```

- If contains `lightspeedwp/multi-block-plugin-scaffold` → Use Generator Mode
- Otherwise → Ask user which mode they want, recommend Template Mode

## Core Principles

1. **Consistent Syntax**: Always use `{{variable}}` format (double curly braces)
2. **No Alternatives**: Never use `${variable}`, `%variable%`, `CONSTANT_NAME`, or other formats
3. **Namespace Everything**: All classes, functions, constants, and CSS must use namespace prefixes
4. **Universal Application**: Apply mustache values to ALL file types (PHP, JS, JSON, SCSS, HTML, templates)
5. **Repository Awareness**: Always detect and use the correct generation mode

## Required Mustache Variables

### Core Variables (Always Required)

Every generated plugin MUST include these variables:

| Variable | Type | Format | Example | Usage |
|----------|------|--------|---------|-------|
| `{{slug}}` | string | kebab-case | `tour-operator` | File names, URLs, text domains |
| `{{name}}` | string | Title Case | `Tour Operator` | Plugin name, display labels |
| `{{namespace}}` | string | snake_case | `tour_operator` | PHP/JS namespaces, CSS classes |
| `{{textdomain}}` | string | kebab-case | `tour-operator` | i18n translation domain |
| `{{version}}` | string | semver | `1.0.0` | Plugin version (major.minor.patch) |
| `{{author}}` | string | Any | `LightSpeed` | Plugin author/organization |
| `{{author_uri}}` | string | URL | `https://lightspeedwp.agency` | Author website |
| `{{description}}` | string | Sentence | `Tour booking plugin` | One-line description |

### Auto-Generated Variables

These variables are automatically derived from core variables:

| Variable | Derived From | Transform | Example |
|----------|--------------|-----------|---------|
| `{{namespace\|upper}}` | `{{namespace}}` | UPPERCASE | `TOUR_OPERATOR` |
| `{{namespace\|pascalCase}}` | `{{namespace}}` | PascalCase | `TourOperator` |
| `{{slug\|camelCase}}` | `{{slug}}` | camelCase | `tourOperator` |

### Optional Variables

Include these when applicable:

| Variable | Type | Default | Example | When Used |
|----------|------|---------|---------|-----------|
| `{{plugin_uri}}` | URL | Empty | `https://example.com/plugin` | Plugin homepage |
| `{{license}}` | string | `GPL-3.0-or-later` | `GPL-3.0-or-later` | License identifier |
| `{{license_uri}}` | URL | Auto-generated | `https://www.gnu.org/licenses/gpl-3.0.html` | License URL |
| `{{requires_wp}}` | version | `6.5` | `6.5` | Minimum WordPress version |
| `{{tested_up_to}}` | version | `6.7` | `6.7` | Tested up to WordPress version |
| `{{requires_php}}` | version | `8.0` | `8.0` | Minimum PHP version |

### Custom Post Type Variables

When generating CPT functionality:

| Variable | Type | Example | Usage |
|----------|------|---------|-------|
| `{{name_singular}}` | string | `Tour` | Singular CPT name |
| `{{name_plural}}` | string | `Tours` | Plural CPT name |
| `{{name_singular_lower}}` | string | `tour` | Lowercase singular |
| `{{name_plural_lower}}` | string | `tours` | Lowercase plural |
| `{{cpt_slug}}` | string | `tour` | CPT permalink slug (max 20 chars) |
| `{{cpt_icon}}` | string | `dashicons-palmtree` | Dashicon class |
| `{{cpt_supports}}` | array | `["title", "editor"]` | CPT features |

### Taxonomy Variables

When generating taxonomy functionality:

| Variable | Type | Example | Usage |
|----------|------|---------|-------|
| `{{taxonomy_singular}}` | string | `Destination` | Singular taxonomy name |
| `{{taxonomy_plural}}` | string | `Destinations` | Plural taxonomy name |
| `{{taxonomy_slug}}` | string | `destination` | Taxonomy slug |

## File Type-Specific Rules

### PHP Files (*.php)

**Plugin Header:**

```php
/**
 * Plugin Name:       {{name}}
 * Plugin URI:        {{plugin_uri}}
 * Description:       {{description}}
 * Version:           {{version}}
 * Requires at least: {{requires_wp}}
 * Requires PHP:      {{requires_php}}
 * Author:            {{author}}
 * Author URI:        {{author_uri}}
 * License:           {{license}}
 * License URI:       {{license_uri}}
 * Text Domain:       {{textdomain}}
 * Domain Path:       /languages
 *
 * @package {{namespace}}
 */
```

**Constants:**

```php
// Use UPPERCASE namespace
define( '{{namespace|upper}}_VERSION', '{{version}}' );
define( '{{namespace|upper}}_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
```

**Classes:**

```php
// Use PascalCase namespace
class {{namespace|pascalCase}}_Plugin {
    // Class implementation
}
```

**Functions:**

```php
// Use snake_case namespace prefix
function {{namespace}}_register_blocks() {
    // Function implementation
}
```

**Translation Functions:**

```php
__( 'Label Text', '{{textdomain}}' );
_e( 'Output Text', '{{textdomain}}' );
esc_html__( 'Safe Text', '{{textdomain}}' );
```

### JavaScript/JSX Files (*.js, *.jsx)

**File Header:**

```javascript
/**
 * Block Component
 *
 * @package {{namespace}}
 */
```

**Block Registration:**

```javascript
registerBlockType( '{{namespace}}/block-name', {
    title: __( 'Block Title', '{{textdomain}}' ),
    category: '{{slug}}',
    // ...
} );
```

**Component Classes:**

```javascript
export default function BlockName() {
    return (
        <div className="{{namespace}}-block-name">
            {__( 'Content', '{{textdomain}}' )}
        </div>
    );
}
```

**i18n Functions:**

```javascript
import { __ } from '@wordpress/i18n';

__( 'Translatable string', '{{textdomain}}' )
```

### CSS/SCSS Files (*.css, *.scss)

**All Selectors Must Use Namespace:**

```scss
// Root-level CSS custom properties
:root {
    --{{namespace}}-primary-color: #333;
    --{{namespace}}-spacing: 1rem;
    --{{namespace}}-transition: 0.3s ease;
}

// Block wrapper classes
.{{namespace}}-slider {
    background: var(--{{namespace}}-primary-color);
}

// Element classes
.{{namespace}}-slider__slide {
    padding: var(--{{namespace}}-spacing);
}

// Modifier classes
.{{namespace}}-slider--vertical {
    flex-direction: column;
}
```

**BEM Naming Convention:**

```scss
// Block
.{{namespace}}-component { }

// Element
.{{namespace}}-component__element { }

// Modifier
.{{namespace}}-component--modifier { }
```

### JSON Configuration Files

**package.json:**

```json
{
    "name": "{{namespace}}/{{slug}}",
    "version": "{{version}}",
    "description": "{{description}}",
    "author": "{{author}}",
    "license": "{{license}}"
}
```

**composer.json:**

```json
{
    "name": "{{namespace}}/{{slug}}",
    "description": "{{description}}",
    "version": "{{version}}",
    "license": "{{license}}",
    "authors": [
        {
            "name": "{{author}}",
            "homepage": "{{author_uri}}"
        }
    ]
}
```

**block.json:**

```json
{
    "apiVersion": 3,
    "name": "{{namespace}}/block-name",
    "title": "Block Title",
    "category": "{{slug}}",
    "textdomain": "{{textdomain}}",
    "version": "{{version}}"
}
```

### HTML Template Files (*.html)

**Template Parts:**

```html
<!-- wp:group {"className":"{{namespace}}-header"} -->
<div class="wp-block-group {{namespace}}-header">
    <h1>{{name}}</h1>
</div>
<!-- /wp:group -->
```

**Block Patterns:**

```html
<!-- wp:{{namespace}}/slider {"className":"{{namespace}}-slider"} /-->
```

### SCF JSON Files (*.json)

**Field Group:**

```json
{
    "key": "group_{{namespace}}_details",
    "title": "{{name}} Details",
    "fields": [
        {
            "key": "field_{{namespace}}_subtitle",
            "label": "Subtitle",
            "name": "{{namespace}}_subtitle",
            "type": "text"
        }
    ],
    "location": [
        [
            {
                "param": "post_type",
                "operator": "==",
                "value": "{{slug}}"
            }
        ]
    ]
}
```

## Validation Rules

### Slug Validation

```regex
^[a-z0-9]+(-[a-z0-9]+)*$
```

- Lowercase letters and numbers only
- Hyphens allowed (not at start/end)
- No underscores
- No consecutive hyphens
- Maximum 50 characters

### Version Validation

```regex
^\d+\.\d+\.\d+$
```

- Semantic versioning (major.minor.patch)
- Example: `1.0.0`, `2.5.3`

### Namespace Validation

```regex
^[a-z0-9]+(_[a-z0-9]+)*$
```

- Lowercase letters and numbers only
- Underscores allowed (not at start/end)
- Auto-generated from slug (replace hyphens with underscores)

## Generator Implementation Rules

### For AI Agents

When using the scaffold generator:

1. **Always Validate Input**: Check all required variables are provided
2. **Auto-Generate Derived Variables**: Create `namespace`, `textdomain` from `slug`
3. **Apply Filters**: Use `{{namespace|upper}}`, `{{namespace|pascalCase}}` where appropriate
4. **Consistent Replacement**: Replace ALL occurrences of mustache placeholders
5. **Verify Output**: Ensure no `{{variable}}` syntax remains in generated files

### For Build Scripts

When processing template files:

1. **Load Configuration**: Read plugin configuration (JSON or arguments)
2. **Parse Templates**: Find all `{{variable}}` placeholders
3. **Validate Variables**: Ensure all placeholders have values
4. **Apply Transforms**: Process filters (upper, pascalCase, camelCase)
5. **Write Output**: Save generated files with replacements

### For Developers

When adding new template files:

1. **Use Mustache Syntax**: Always `{{variable}}`, never alternatives
2. **Apply Namespace**: Prefix all identifiers with `{{namespace}}`
3. **Use Textdomain**: Include `{{textdomain}}` in i18n functions
4. **Document Variables**: Add new variables to this file
5. **Test Generation**: Verify the template generates correctly

## Common Patterns

### Block Registration Pattern

```javascript
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

registerBlockType( '{{namespace}}/block-name', {
    title: __( 'Block Title', '{{textdomain}}' ),
    description: __( 'Block description', '{{textdomain}}' ),
    category: '{{slug}}',
    icon: 'block-default',
    keywords: [
        __( 'keyword', '{{textdomain}}' ),
    ],
    attributes: {
        // Block attributes
    },
    edit: Edit,
    save: Save,
} );
```

### CPT Registration Pattern

```php
function {{namespace}}_register_post_types() {
    register_post_type(
        '{{slug}}',
        array(
            'labels' => array(
                'name'          => __( '{{name_plural}}', '{{textdomain}}' ),
                'singular_name' => __( '{{name_singular}}', '{{textdomain}}' ),
            ),
            'public'       => true,
            'has_archive'  => true,
            'show_in_rest' => true,
            'supports'     => array( 'title', 'editor', 'thumbnail' ),
        )
    );
}
add_action( 'init', '{{namespace}}_register_post_types' );
```

### Taxonomy Registration Pattern

```php
function {{namespace}}_register_taxonomies() {
    register_taxonomy(
        '{{taxonomy_slug}}',
        '{{slug}}',
        array(
            'labels' => array(
                'name'          => __( '{{taxonomy_plural}}', '{{textdomain}}' ),
                'singular_name' => __( '{{taxonomy_singular}}', '{{textdomain}}' ),
            ),
            'hierarchical' => true,
            'show_in_rest' => true,
        )
    );
}
add_action( 'init', '{{namespace}}_register_taxonomies' );
```

## Error Handling

### Missing Variables

When a required variable is missing:

1. **Stop Generation**: Do not proceed with incomplete configuration
2. **Report Error**: List all missing required variables
3. **Provide Guidance**: Explain what each variable is used for
4. **Suggest Defaults**: Offer sensible default values where applicable

### Invalid Format

When a variable has invalid format:

1. **Validate Early**: Check format before starting generation
2. **Clear Error Message**: Explain exactly what's wrong
3. **Show Example**: Provide valid example format
4. **Allow Retry**: Let user correct and try again

### Duplicate Identifiers

When generated identifiers might conflict:

1. **Check Uniqueness**: Verify CPT slugs, taxonomy slugs, field keys are unique
2. **Warn User**: Alert about potential conflicts
3. **Suggest Alternatives**: Provide alternative identifier suggestions
4. **Validate Length**: CPT slugs must be max 20 characters

## Examples

```md
Plugin Name: {{name}}
Description: {{description}}
Text Domain: {{textdomain}}
Version: {{version}}
```

```php
// Namespaced function
function {{namespace}}_register_routes() {
    register_rest_route( '{{namespace}}/v1', '/tours', array( 'methods' => 'GET', 'callback' => '...' ) );
}
```

Avoid interpolating values manually (e.g. `Tour Operator`) where a placeholder should be used.

## Testing Requirements

### Template Validation

1. **Find All Placeholders**: Scan for `{{variable}}` patterns
2. **Check Coverage**: Ensure all placeholders have values
3. **Verify Syntax**: Validate filter syntax (`{{var|filter}}`)
4. **Test Replacement**: Generate sample output and verify

### Generated Plugin Validation

1. **No Remaining Placeholders**: Search for `{{` in generated files
2. **Valid PHP Syntax**: Run `php -l` on all PHP files
3. **Valid JSON**: Validate all JSON configuration files
4. **Consistent Namespacing**: Verify all identifiers use namespace prefix
5. **Translation Functions**: Check all `__()` calls use correct textdomain

## Validation

- Run `node scripts/scan-mustache-variables.js` to ensure placeholders are registered.
- Generate a sample plugin via `node scripts/generate-plugin.js --config plugin-config.json --dry-run` and inspect for remaining `{{`.
- Run `npm test` / `npm run lint` to validate syntax after generation.
- Validate JSON files with `npm run lint` or schema tools; run `php -l` on generated PHP files.

## Logging

All plugin generation operations are logged to per-project JSON log files:

### Log File Format

**Location:** `logs/generate-plugin-{{slug}}.log`

**Structure:**
```json
[
  {
    "timestamp": "2025-12-12T10:30:00.000Z",
    "level": "INFO|WARN|ERROR|DEBUG",
    "message": "Log message",
    "data": { /* optional additional context */ }
  }
]
```

### Logged Events

- Configuration loading and validation
- Mustache variable replacements
- File generation operations
- Errors and warnings
- Generation completion status

### Log Management

- **Per-project logs**: Each plugin slug gets its own log file
- **Appending**: New runs append to existing log file
- **Location**: All logs stored in `logs/` directory (git-ignored)
- **Cleanup**: Manual cleanup recommended for completed projects

## Changelog

- **2025-12-12**: Added per-project JSON logging system
- **2025-12-05**: Initial comprehensive documentation of mustache template system
- Previous: Implicit rules scattered across files
