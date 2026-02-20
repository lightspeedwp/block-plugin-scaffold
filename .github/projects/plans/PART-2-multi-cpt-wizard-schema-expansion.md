# Multi-CPT Wizard & Schema Expansion Plan (Part 2)

> **For Claude:** This is Part 2 of the WordPress Standards Compliance plan. Execute after completing Part 1.

**Goal:** Expand the plugin generator to support multiple custom post types, taxonomies, fields, bidirectional relationships, and context-specific mustache variables for blocks, patterns, and templates.

**Architecture:** Enhance the mustache variable system, expand JSON schema for multi-CPT configuration, update generator script to handle multiple post types with their own blocks/patterns/templates, and implement validation for complex relationships.

**Tech Stack:** WordPress 6.5+, PHP 8.0+, Secure Custom Fields, Node.js 18+, Mustache.js, JSON Schema (Draft 2020-12), Ajv validator

---

## PHASE 7: Mustache Variable System Expansion

### Task 7.1: Expand Mustache Variables Registry Schema

**Files:**
- Modify: `.github/schemas/mustache-variables-registry.schema.json`
- Reference: Existing variable categories

**Step 1: Read current schema**

```bash
cat .github/schemas/mustache-variables-registry.schema.json
```

**Step 2: Add category enumeration**

Update the `mustacheVariable` definition to include predefined categories:

```json
{
  "$defs": {
    "mustacheVariable": {
      "type": "object",
      "required": ["name", "category", "files", "count", "description", "exampleValue"],
      "properties": {
        "name": {
          "type": "string",
          "description": "The mustache variable name (without {{ }})",
          "minLength": 1
        },
        "category": {
          "type": "string",
          "description": "The category this variable belongs to",
          "enum": [
            "plugin",
            "post-type",
            "taxonomy",
            "field",
            "block",
            "pattern",
            "template",
            "style",
            "meta",
            "i18n",
            "build"
          ]
        },
        "description": {
          "type": "string",
          "description": "Human-readable description of what this variable represents"
        },
        "exampleValue": {
          "type": "string",
          "description": "Example value for documentation purposes"
        },
        "transformations": {
          "type": "array",
          "description": "Available transformations (e.g., upper, lowerCase, pascalCase)",
          "items": {
            "type": "string",
            "enum": ["upper", "lowerCase", "pascalCase", "camelCase", "kebabCase", "snakeCase"]
          }
        },
        "required": {
          "type": "boolean",
          "description": "Whether this variable is required in all generated plugins",
          "default": false
        },
        "files": {
          "type": "array",
          "items": {"type": "string"},
          "minItems": 1
        },
        "count": {
          "type": "integer",
          "minimum": 1
        }
      }
    }
  }
}
```

**Step 3: Add validation for multi-CPT variables**

Add new property to track variable scope:

```json
"scope": {
  "type": "string",
  "description": "Scope of variable usage",
  "enum": ["global", "per-cpt", "per-taxonomy", "per-block", "per-pattern", "per-template"]
}
```

**Step 4: Commit**

```bash
git add .github/schemas/mustache-variables-registry.schema.json
git commit -m "feat: expand mustache registry schema with categories and scopes"
```

---

### Task 7.2: Define Complete Mustache Variable Taxonomy

**Files:**
- Create: `docs/MUSTACHE-VARIABLES.md`

**Step 1: Create comprehensive variable documentation**

```markdown
# Mustache Variables Reference

Complete reference for all mustache template variables used in the scaffold.

## Variable Categories

### Plugin-Level Variables (Global Scope)

Variables that apply to the entire plugin.

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{slug}}` | plugin | string | `tour-operator` | Plugin slug (kebab-case) |
| `{{name}}` | plugin | string | `Tour Operator` | Plugin display name |
| `{{description}}` | plugin | string | `Tour booking and management` | Plugin description |
| `{{namespace}}` | plugin | string | `Tour_Operator` | PHP namespace (PascalCase with underscores) |
| `{{namespace|lowerCase}}` | plugin | string | `tour_operator` | Lowercase namespace for paths |
| `{{namespace|upper}}` | plugin | string | `TOUR_OPERATOR` | Uppercase for constants |
| `{{textdomain}}` | plugin | string | `tour-operator` | i18n text domain |
| `{{version}}` | plugin | semver | `1.0.0` | Plugin version |
| `{{author}}` | plugin | string | `LightSpeed` | Plugin author |
| `{{author_uri}}` | plugin | URL | `https://lightspeedwp.agency` | Author website |
| `{{plugin_uri}}` | plugin | URL | `https://example.com/plugins/tour-operator` | Plugin homepage |
| `{{license}}` | plugin | SPDX | `GPL-3.0-or-later` | License identifier |
| `{{license_uri}}` | plugin | URL | `https://www.gnu.org/licenses/gpl-3.0.html` | License URL |
| `{{requires_wp}}` | plugin | semver | `6.5` | Minimum WordPress version |
| `{{requires_php}}` | plugin | semver | `8.0` | Minimum PHP version |
| `{{requires_plugins}}` | plugin | string | `secure-custom-fields` | Required plugins (comma-separated) |

**Usage in PHP:**

```php
<?php
/**
 * Plugin Name: {{name}}
 * Version:     {{version}}
 * Text Domain: {{textdomain}}
 */

namespace {{namespace|lowerCase}}\classes;

define( '{{namespace|upper}}_VERSION', '{{version}}' );
```

### Custom Post Type Variables (Per-CPT Scope)

Variables specific to each custom post type. When multiple CPTs exist, these are indexed.

**Primary CPT (First in Array):**

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{cpt_slug}}` | post-type | string | `tour` | CPT slug (max 20 chars) |
| `{{cpt_name_singular}}` | post-type | string | `Tour` | Singular name |
| `{{cpt_name_plural}}` | post-type | string | `Tours` | Plural name |
| `{{cpt_description}}` | post-type | string | `Tour packages and itineraries` | CPT description |
| `{{cpt_supports}}` | post-type | array | `'title', 'editor', 'thumbnail'` | Supported features |
| `{{cpt_has_archive}}` | post-type | boolean | `true` | Enable archive page |
| `{{cpt_public}}` | post-type | boolean | `true` | Public queryability |
| `{{cpt_menu_icon}}` | post-type | string | `dashicons-palmtree` | Dashicon class |
| `{{cpt_menu_position}}` | post-type | integer | `20` | Admin menu position |
| `{{cpt_hierarchical}}` | post-type | boolean | `false` | Page-like vs post-like |
| `{{cpt_rewrite_slug}}` | post-type | string | `tours` | URL slug |

**Secondary CPTs (Indexed):**

When config has multiple `custom_post_types`, use indexed variables:

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{cpt_slug_0}}` | post-type | string | `tour` | First CPT slug |
| `{{cpt_slug_1}}` | post-type | string | `accommodation` | Second CPT slug |
| `{{cpt_slug_2}}` | post-type | string | `destination` | Third CPT slug |
| `{{cpt_name_singular_0}}` | post-type | string | `Tour` | First CPT singular |
| `{{cpt_name_singular_1}}` | post-type | string | `Accommodation` | Second CPT singular |

**Usage in PHP (inc/class-post-types.php):**

```php
<?php
namespace {{namespace|lowerCase}}\classes;

class Post_Types {
    public function register_post_types() {
        // Primary CPT
        register_post_type( '{{cpt_slug}}', array(
            'labels' => array(
                'name' => __( '{{cpt_name_plural}}', '{{textdomain}}' ),
                'singular_name' => __( '{{cpt_name_singular}}', '{{textdomain}}' ),
            ),
            'public' => {{cpt_public}},
            'has_archive' => {{cpt_has_archive}},
            'supports' => array( {{cpt_supports}} ),
            'menu_icon' => '{{cpt_menu_icon}}',
        ) );

        // Secondary CPTs (if configured)
        {{#cpt_additional}}
        register_post_type( '{{slug}}', array(
            'labels' => array(
                'name' => __( '{{name_plural}}', '{{textdomain}}' ),
                'singular_name' => __( '{{name_singular}}', '{{textdomain}}' ),
            ),
            // ... configuration
        ) );
        {{/cpt_additional}}
    }
}
```

### Taxonomy Variables (Per-Taxonomy Scope)

Variables for custom taxonomies attached to CPTs.

**Primary Taxonomy:**

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{tax_slug}}` | taxonomy | string | `destination` | Taxonomy slug (max 32 chars) |
| `{{tax_singular}}` | taxonomy | string | `Destination` | Singular name |
| `{{tax_plural}}` | taxonomy | string | `Destinations` | Plural name |
| `{{tax_hierarchical}}` | taxonomy | boolean | `true` | Category-like vs tag-like |
| `{{tax_public}}` | taxonomy | boolean | `true` | Public queryability |
| `{{tax_rewrite_slug}}` | taxonomy | string | `destinations` | URL slug |
| `{{tax_show_admin_column}}` | taxonomy | boolean | `true` | Show in admin column |
| `{{tax_attached_to}}` | taxonomy | string | `{{cpt_slug}}` | Attached CPT slug |

**Secondary Taxonomies (Indexed):**

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{tax_slug_0}}` | taxonomy | string | `destination` | First taxonomy |
| `{{tax_slug_1}}` | taxonomy | string | `tour_type` | Second taxonomy |
| `{{tax_singular_0}}` | taxonomy | string | `Destination` | First tax singular |
| `{{tax_singular_1}}` | taxonomy | string | `Tour Type` | Second tax singular |

**Usage in PHP (inc/class-taxonomies.php):**

```php
<?php
register_taxonomy( '{{tax_slug}}', array( '{{cpt_slug}}' ), array(
    'labels' => array(
        'name' => __( '{{tax_plural}}', '{{textdomain}}' ),
        'singular_name' => __( '{{tax_singular}}', '{{textdomain}}' ),
    ),
    'hierarchical' => {{tax_hierarchical}},
    'show_in_rest' => true,
    'rewrite' => array( 'slug' => '{{tax_rewrite_slug}}' ),
) );
```

### Block Variables (Per-Block Scope)

Variables for custom blocks, generated per CPT.

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{block_slug}}` | block | string | `tour-card` | Block slug (without namespace) |
| `{{block_name}}` | block | string | `Tour Card` | Block display name |
| `{{block_namespace}}` | block | string | `{{slug}}/{{cpt_slug}}-card` | Full block name |
| `{{block_category}}` | block | string | `{{slug}}` | Block category |
| `{{block_icon}}` | block | string | `palmtree` | Dashicon name |
| `{{block_description}}` | block | string | `Display tour in card layout` | Block description |
| `{{block_keywords}}` | block | array | `'tour', 'card', 'preview'` | Search keywords |
| `{{block_supports}}` | block | object | See below | Block supports config |

**Block Types:**

For each CPT, generate these block types:

1. `{{cpt_slug}}-card` - Single post card
2. `{{block_slug}}-collection` - Query loop variant
3. `{{cpt_slug}}-featured` - Featured post display
4. `{{cpt_slug}}-slider` - Carousel/slider

**Usage in block.json:**

```json
{
  "name": "{{slug}}/{{cpt_slug}}-card",
  "title": "{{cpt_name_singular}} Card",
  "category": "{{slug}}",
  "icon": "{{cpt_menu_icon}}",
  "description": "Display a {{cpt_name_singular|lowerCase}} in card layout",
  "keywords": ["{{cpt_slug}}", "card", "{{cpt_name_singular|lowerCase}}"],
  "textdomain": "{{textdomain}}"
}
```

### Pattern Variables (Per-Pattern Scope)

Variables for block patterns, generated per CPT.

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{pattern_slug}}` | pattern | string | `tour-card` | Pattern slug |
| `{{pattern_name}}` | pattern | string | `Tour Card` | Pattern display name |
| `{{pattern_namespace}}` | pattern | string | `{{slug}}/{{cpt_slug}}-card` | Full pattern name |
| `{{pattern_description}}` | pattern | string | `Card layout for tour` | Pattern description |
| `{{pattern_categories}}` | pattern | array | `'{{slug}}', 'posts'` | Pattern categories |
| `{{pattern_keywords}}` | pattern | array | `'tour', 'card'` | Search keywords |
| `{{pattern_block_types}}` | pattern | array | `'core/post-template'` | Target blocks |
| `{{pattern_post_types}}` | pattern | array | `'{{cpt_slug}}'` | Applicable post types |
| `{{pattern_viewport_width}}` | pattern | integer | `400` | Preview width |

**Pattern Types Per CPT:**

1. `{{cpt_slug}}-card` - Card layout
2. `{{cpt_slug}}-grid` - Grid layout
3. `{{cpt_slug}}-meta` - Post meta display
4. `{{cpt_slug}}-featured` - Featured display
5. `{{cpt_slug}}-archive` - Archive layout
6. `{{cpt_slug}}-single` - Single post layout
7. `{{cpt_slug}}-slider` - Slider layout

**Usage in patterns/{{cpt_slug}}-card.php:**

```php
<?php
return array(
    'title'         => __( '{{cpt_name_singular}} Card', '{{textdomain}}' ),
    'description'   => __( 'Card layout for {{cpt_name_singular|lowerCase}}', '{{textdomain}}' ),
    'categories'    => array( '{{slug}}' ),
    'keywords'      => array( '{{cpt_slug}}', 'card' ),
    'postTypes'     => array( '{{cpt_slug}}' ),
    'blockTypes'    => array( 'core/post-template' ),
    'viewportWidth' => 400,
    'content'       => '<!-- pattern content -->',
);
```

### Template Variables (Per-Template Scope)

Variables for block templates and template parts.

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{template_name}}` | template | string | `single-tour` | Template file name |
| `{{template_title}}` | template | string | `Single Tour` | Template display name |
| `{{template_description}}` | template | string | `Single tour template` | Template description |
| `{{template_post_types}}` | template | array | `'{{cpt_slug}}'` | Applicable post types |

**Template Types Per CPT:**

1. `single-{{cpt_slug}}.html` - Single post template
2. `archive-{{cpt_slug}}.html` - Archive template
3. `{{cpt_slug}}-header.html` - Template part (header)
4. `{{cpt_slug}}-meta.html` - Template part (meta)
5. `{{cpt_slug}}-sidebar.html` - Template part (sidebar)

**Usage in templates/single-{{cpt_slug}}.html:**

```html
<!-- wp:template-part {"slug":"header","area":"header"} /-->

<!-- wp:group {"tagName":"main"} -->
<main class="wp-block-group">
    <!-- wp:post-title {"level":1} /-->

    <!-- wp:template-part {"slug":"{{cpt_slug}}-meta","area":"uncategorized"} /-->

    <!-- wp:post-content /-->
</main>
<!-- /wp:group -->
```

### Field Variables (Per-Field Scope)

Variables for custom fields using Secure Custom Fields.

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{field_name}}` | field | string | `price` | Field name (snake_case) |
| `{{field_label}}` | field | string | `Price per Person` | Field display label |
| `{{field_type}}` | field | string | `number` | SCF field type |
| `{{field_key}}` | field | string | `field_price` | Unique field key |
| `{{field_instructions}}` | field | string | `Enter price in USD` | Help text |
| `{{field_required}}` | field | boolean | `true` | Required field |
| `{{field_default}}` | field | mixed | `0` | Default value |

**Usage in inc/class-fields.php:**

```php
<?php
acf_add_local_field_group( array(
    'key' => 'group_{{cpt_slug}}_details',
    'title' => '{{cpt_name_singular}} Details',
    'fields' => array(
        array(
            'key' => 'field_{{cpt_slug}}_{{field_name}}',
            'label' => '{{field_label}}',
            'name' => '{{field_name}}',
            'type' => '{{field_type}}',
            'required' => {{field_required}},
            'instructions' => '{{field_instructions}}',
        ),
    ),
    'location' => array(
        array(
            array(
                'param' => 'post_type',
                'operator' => '==',
                'value' => '{{cpt_slug}}',
            ),
        ),
    ),
) );
```

### Relationship Variables

Variables for bidirectional post relationships.

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{rel_source_cpt}}` | field | string | `tour` | Source CPT slug |
| `{{rel_target_cpt}}` | field | string | `accommodation` | Target CPT slug |
| `{{rel_field_name}}` | field | string | `related_accommodations` | Field name on source |
| `{{rel_field_label}}` | field | string | `Related Accommodations` | Field label on source |
| `{{rel_reverse_field}}` | field | string | `related_tours` | Field name on target |
| `{{rel_reverse_label}}` | field | string | `Related Tours` | Field label on target |

**Usage for bidirectional relationships:**

```php
<?php
// On Tour CPT
array(
    'key' => 'field_tour_accommodations',
    'label' => 'Related Accommodations',
    'name' => 'related_accommodations',
    'type' => 'relationship',
    'post_type' => array( 'accommodation' ),
    'bidirectional' => 'related_tours',
),

// On Accommodation CPT
array(
    'key' => 'field_accommodation_tours',
    'label' => 'Related Tours',
    'name' => 'related_tours',
    'type' => 'relationship',
    'post_type' => array( 'tour' ),
    'bidirectional' => 'related_accommodations',
),
```

### Style Variables

Variables for block styles (JSON-based).

| Variable | Category | Type | Example | Description |
|----------|----------|------|---------|-------------|
| `{{style_name}}` | style | string | `card` | Style name |
| `{{style_label}}` | style | string | `Card Style` | Style display label |
| `{{style_block_types}}` | style | array | `'core/post-template'` | Target blocks |

**Usage in styles/blocks/{{cpt_slug}}-card.json:**

```json
{
  "name": "{{style_name}}",
  "label": "{{style_label}}",
  "blockTypes": ["{{slug}}/{{cpt_slug}}-card"],
  "styles": [
    {
      "selector": ".wp-block-{{slug}}-{{cpt_slug}}-card.is-style-{{style_name}}",
      "rules": {
        "display": "grid",
        "gap": "var(--wp--preset--spacing--40)"
      }
    }
  ]
}
```

## Variable Transformations

Mustache supports these transformations:

| Transform | Input | Output | Usage |
|-----------|-------|--------|-------|
| `upper` | `Tour_Operator` | `TOUR_OPERATOR` | Constants |
| `lowerCase` | `Tour_Operator` | `tour_operator` | Paths, functions |
| `pascalCase` | `tour-operator` | `TourOperator` | Class names |
| `camelCase` | `tour-operator` | `tourOperator` | JS variables |
| `kebabCase` | `Tour Operator` | `tour-operator` | Slugs, CSS |
| `snakeCase` | `Tour Operator` | `tour_operator` | PHP functions |

**Usage:**

```
{{namespace|upper}}       → TOUR_OPERATOR
{{namespace|lowerCase}}   → tour_operator
{{slug|camelCase}}        → tourOperator
{{cpt_name_singular|lowerCase}} → tour
```

## Scope Hierarchy

Variables flow from global to specific:

```
plugin (global)
  └─ cpt (per post type)
      ├─ taxonomy (per CPT taxonomy)
      ├─ field (per CPT field)
      ├─ block (per CPT block)
      ├─ pattern (per CPT pattern)
      └─ template (per CPT template)
```

Each level inherits from parent scope and can override.
```

**Step 2: Commit**

```bash
git add docs/MUSTACHE-VARIABLES.md
git commit -m "docs: create comprehensive mustache variables reference"
```

---

### Task 7.3: Update Validation Script for Multi-CPT Variables

**Files:**
- Modify: `scripts/validate-mustache-registry.js`

**Step 1: Add TODO implementations**

Complete the TODO items listed in the script:

```javascript
/**
 * Check for duplicate variable names across different scopes
 *
 * @param {Object} registry - Registry data
 * @return {Array} Array of duplicate warnings
 */
function checkDuplicates(registry) {
    const duplicates = [];
    const seen = new Map();

    for (const [varName, varData] of Object.entries(registry.variables)) {
        const key = varName.replace(/_\d+$/, ''); // Remove index suffix

        if (seen.has(key) && varData.scope !== seen.get(key).scope) {
            duplicates.push({
                variable: varName,
                scope: varData.scope,
                conflicts: seen.get(key).name,
            });
        }

        seen.set(key, { name: varName, scope: varData.scope });
    }

    return duplicates;
}

/**
 * Verify file paths exist
 *
 * @param {Object} registry - Registry data
 * @return {Array} Array of missing file warnings
 */
function verifyFilePaths(registry) {
    const missing = [];

    for (const [varName, varData] of Object.entries(registry.variables)) {
        for (const filePath of varData.files) {
            const fullPath = path.join(__dirname, '..', filePath);

            if (!fs.existsSync(fullPath)) {
                missing.push({
                    variable: varName,
                    file: filePath,
                });
            }
        }
    }

    return missing;
}

/**
 * Validate category distribution
 *
 * @param {Object} registry - Registry data
 * @return {Object} Category statistics
 */
function validateCategories(registry) {
    const categories = {};

    for (const varData of Object.values(registry.variables)) {
        if (!categories[varData.category]) {
            categories[varData.category] = 0;
        }
        categories[varData.category]++;
    }

    return categories;
}

/**
 * Check for orphaned variables
 *
 * @param {Object} registry - Registry data
 * @return {Array} Array of potentially orphaned variables
 */
function checkOrphanedVariables(registry) {
    const orphaned = [];

    for (const [varName, varData] of Object.entries(registry.variables)) {
        // Variables with count > 0 but empty files array
        if (varData.count > 0 && varData.files.length === 0) {
            orphaned.push({
                variable: varName,
                count: varData.count,
            });
        }

        // Variables defined but never used
        if (varData.count === 0) {
            orphaned.push({
                variable: varName,
                reason: 'defined but not used',
            });
        }
    }

    return orphaned;
}

/**
 * Verify count matches files array
 *
 * @param {Object} registry - Registry data
 * @return {Array} Array of count mismatch warnings
 */
function verifyCountMatches(registry) {
    const mismatches = [];

    for (const [varName, varData] of Object.entries(registry.variables)) {
        // This is a simplified check - actual count includes all occurrences
        // across all files, not just number of files
        if (varData.count < varData.files.length) {
            mismatches.push({
                variable: varName,
                expectedMin: varData.files.length,
                actual: varData.count,
            });
        }
    }

    return mismatches;
}
```

**Step 2: Update main function to run additional checks**

Replace the TODO section in `main()`:

```javascript
// Additional validation checks
console.log('🔬 Running additional validation checks...\n');

// Check for duplicates
const duplicates = checkDuplicates(registry);
if (duplicates.length > 0) {
    console.warn('⚠️  Potential duplicate variable names across scopes:');
    duplicates.forEach((dup) => {
        console.warn(`  - ${dup.variable} (${dup.scope}) conflicts with ${dup.conflicts}`);
    });
    console.warn('');
}

// Verify file paths
const missing = verifyFilePaths(registry);
if (missing.length > 0) {
    console.error('❌ Missing files referenced in registry:');
    missing.forEach((item) => {
        console.error(`  - ${item.variable}: ${item.file}`);
    });
    console.error('');
    process.exit(1);
}

// Category distribution
console.log('📊 Category Distribution:');
const categories = validateCategories(registry);
Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
        console.log(`  - ${cat}: ${count} variable(s)`);
    });
console.log('');

// Check for orphaned variables
const orphaned = checkOrphanedVariables(registry);
if (orphaned.length > 0) {
    console.warn('⚠️  Potentially orphaned variables:');
    orphaned.forEach((item) => {
        const reason = item.reason || `count=${item.count}, files=0`;
        console.warn(`  - ${item.variable}: ${reason}`);
    });
    console.warn('');
}

// Verify counts
const mismatches = verifyCountMatches(registry);
if (mismatches.length > 0) {
    console.warn('⚠️  Count mismatches (count < number of files):');
    mismatches.forEach((item) => {
        console.warn(`  - ${item.variable}: expected ≥${item.expectedMin}, got ${item.actual}`);
    });
    console.warn('');
}

console.log('✅ All additional validation checks completed\n');
```

**Step 3: Add module exports**

```javascript
module.exports = {
    validateRegistry,
    loadJson,
    checkDuplicates,
    verifyFilePaths,
    validateCategories,
    checkOrphanedVariables,
    verifyCountMatches,
};
```

**Step 4: Commit**

```bash
git add scripts/validate-mustache-registry.js
git commit -m "feat: implement complete validation checks for mustache registry"
```

---

## PHASE 8: Multi-CPT Plugin Configuration Schema

### Task 8.1: Expand plugin-config.schema.json for Multi-CPT Support

**Files:**
- Modify: `.github/schemas/plugin-config.schema.json`
- Reference: WordPress CPT registration requirements
- Reference: SCF field group structure

**Step 1: Read current schema**

```bash
cat .github/schemas/plugin-config.schema.json
```

**Step 2: Add custom_post_types array structure**

Replace single CPT fields with array-based structure:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://github.com/lightspeedwp/multi-block-plugin-scaffold/schemas/plugin-config.schema.json",
  "title": "Plugin Configuration Schema",
  "description": "Configuration schema for generating WordPress plugins from scaffold",
  "type": "object",
  "required": ["slug", "name", "custom_post_types"],
  "properties": {
    "slug": {
      "type": "string",
      "description": "Plugin slug (kebab-case, lowercase, hyphens only)",
      "pattern": "^[a-z][a-z0-9-]*[a-z0-9]$",
      "minLength": 3,
      "maxLength": 50
    },
    "name": {
      "type": "string",
      "description": "Plugin display name",
      "minLength": 3,
      "maxLength": 100
    },
    "description": {
      "type": "string",
      "description": "Plugin description (one-line summary)",
      "maxLength": 250
    },
    "version": {
      "type": "string",
      "description": "Plugin version (semver format)",
      "pattern": "^\\d+\\.\\d+\\.\\d+(-[a-z0-9.]+)?(\\+[a-z0-9.]+)?$",
      "default": "1.0.0"
    },
    "author": {
      "type": "string",
      "description": "Plugin author name",
      "minLength": 1
    },
    "author_uri": {
      "type": "string",
      "description": "Author website URL",
      "format": "uri"
    },
    "plugin_uri": {
      "type": "string",
      "description": "Plugin homepage URL",
      "format": "uri"
    },
    "textdomain": {
      "type": "string",
      "description": "i18n text domain (defaults to slug)",
      "pattern": "^[a-z][a-z0-9-]*[a-z0-9]$"
    },
    "namespace": {
      "type": "string",
      "description": "PHP namespace (PascalCase with underscores)",
      "pattern": "^[A-Z][A-Za-z0-9_]*$"
    },
    "license": {
      "type": "string",
      "description": "SPDX license identifier",
      "default": "GPL-3.0-or-later",
      "enum": [
        "GPL-2.0-or-later",
        "GPL-3.0-or-later",
        "MIT",
        "Apache-2.0",
        "BSD-3-Clause",
        "proprietary"
      ]
    },
    "requires_wp": {
      "type": "string",
      "description": "Minimum WordPress version",
      "pattern": "^\\d+\\.\\d+(\\.\\d+)?$",
      "default": "6.5"
    },
    "requires_php": {
      "type": "string",
      "description": "Minimum PHP version",
      "pattern": "^\\d+\\.\\d+(\\.\\d+)?$",
      "default": "8.0"
    },
    "requires_plugins": {
      "type": "array",
      "description": "Required plugin dependencies (slugs)",
      "items": {
        "type": "string",
        "pattern": "^[a-z][a-z0-9-]*[a-z0-9]$"
      },
      "default": ["secure-custom-fields"]
    },
    "custom_post_types": {
      "type": "array",
      "description": "Array of custom post types to generate",
      "minItems": 1,
      "maxItems": 10,
      "items": {
        "$ref": "#/$defs/customPostType"
      }
    },
    "global_taxonomies": {
      "type": "array",
      "description": "Global taxonomies shared across multiple CPTs",
      "items": {
        "$ref": "#/$defs/taxonomy"
      }
    },
    "blocks": {
      "type": "object",
      "description": "Block generation configuration",
      "properties": {
        "enabled": {
          "type": "boolean",
          "description": "Enable block generation",
          "default": true
        },
        "types": {
          "type": "array",
          "description": "Block types to generate per CPT",
          "items": {
            "type": "string",
            "enum": ["card", "collection", "featured", "slider", "grid", "list"]
          },
          "default": ["card", "collection", "featured", "slider"]
        },
        "category": {
          "type": "string",
          "description": "Custom block category slug",
          "pattern": "^[a-z][a-z0-9-]*[a-z0-9]$"
        }
      }
    },
    "patterns": {
      "type": "object",
      "description": "Pattern generation configuration",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": true
        },
        "types": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["card", "grid", "meta", "featured", "archive", "single", "slider"]
          },
          "default": ["card", "grid", "meta", "featured", "archive", "single"]
        }
      }
    },
    "templates": {
      "type": "object",
      "description": "Template generation configuration",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": true
        },
        "generate_single": {
          "type": "boolean",
          "description": "Generate single post templates per CPT",
          "default": true
        },
        "generate_archive": {
          "type": "boolean",
          "description": "Generate archive templates per CPT",
          "default": true
        },
        "template_parts": {
          "type": "array",
          "description": "Template parts to generate per CPT",
          "items": {
            "type": "string",
            "enum": ["header", "meta", "sidebar", "footer", "content"]
          },
          "default": ["header", "meta", "sidebar"]
        }
      }
    }
  },
  "$defs": {
    "customPostType": {
      "type": "object",
      "description": "Custom post type configuration",
      "required": ["slug", "singular", "plural"],
      "additionalProperties": false,
      "properties": {
        "slug": {
          "type": "string",
          "description": "CPT slug (max 20 characters, lowercase, underscores only)",
          "pattern": "^[a-z][a-z0-9_]{0,18}[a-z0-9]$",
          "minLength": 2,
          "maxLength": 20
        },
        "singular": {
          "type": "string",
          "description": "Singular name for CPT",
          "minLength": 1,
          "maxLength": 50
        },
        "plural": {
          "type": "string",
          "description": "Plural name for CPT",
          "minLength": 1,
          "maxLength": 50
        },
        "description": {
          "type": "string",
          "description": "CPT description",
          "maxLength": 250
        },
        "public": {
          "type": "boolean",
          "description": "Whether CPT is publicly queryable",
          "default": true
        },
        "has_archive": {
          "type": "boolean",
          "description": "Enable archive page for CPT",
          "default": true
        },
        "hierarchical": {
          "type": "boolean",
          "description": "Page-like (true) or post-like (false) structure",
          "default": false
        },
        "menu_icon": {
          "type": "string",
          "description": "Dashicon class name",
          "pattern": "^dashicons-[a-z0-9-]+$",
          "default": "dashicons-admin-post"
        },
        "menu_position": {
          "type": "integer",
          "description": "Admin menu position (5-100)",
          "minimum": 5,
          "maximum": 100,
          "default": 20
        },
        "supports": {
          "type": "array",
          "description": "Supported features",
          "items": {
            "type": "string",
            "enum": [
              "title",
              "editor",
              "thumbnail",
              "excerpt",
              "custom-fields",
              "revisions",
              "page-attributes",
              "post-formats",
              "author",
              "comments",
              "trackbacks"
            ]
          },
          "default": ["title", "editor", "thumbnail", "excerpt", "custom-fields", "revisions"]
        },
        "rewrite": {
          "type": "object",
          "description": "URL rewrite configuration",
          "properties": {
            "slug": {
              "type": "string",
              "description": "Custom URL slug",
              "pattern": "^[a-z][a-z0-9-/]*[a-z0-9]$"
            },
            "with_front": {
              "type": "boolean",
              "description": "Prepend front base to permalink",
              "default": true
            },
            "feeds": {
              "type": "boolean",
              "description": "Enable feeds",
              "default": true
            },
            "pages": {
              "type": "boolean",
              "description": "Enable pagination",
              "default": true
            }
          }
        },
        "capability_type": {
          "type": "string",
          "description": "Base capability type",
          "default": "post",
          "enum": ["post", "page"]
        },
        "taxonomies": {
          "type": "array",
          "description": "Taxonomies specific to this CPT",
          "items": {
            "$ref": "#/$defs/taxonomy"
          }
        },
        "fields": {
          "type": "array",
          "description": "Custom fields for this CPT",
          "items": {
            "$ref": "#/$defs/field"
          }
        },
        "relationships": {
          "type": "array",
          "description": "Bidirectional relationships with other CPTs",
          "items": {
            "$ref": "#/$defs/relationship"
          }
        },
        "template": {
          "type": "array",
          "description": "Block template for new posts",
          "items": {
            "type": "array",
            "description": "Block definition [blockName, attributes, innerBlocks]",
            "minItems": 1,
            "maxItems": 3
          }
        },
        "template_lock": {
          "type": "string",
          "description": "Template lock setting",
          "enum": ["all", "insert", "contentOnly", false],
          "default": false
        }
      }
    },
    "taxonomy": {
      "type": "object",
      "description": "Taxonomy configuration",
      "required": ["slug", "singular", "plural"],
      "additionalProperties": false,
      "properties": {
        "slug": {
          "type": "string",
          "description": "Taxonomy slug (max 32 characters, lowercase, underscores only)",
          "pattern": "^[a-z][a-z0-9_]{0,30}[a-z0-9]$",
          "minLength": 2,
          "maxLength": 32
        },
        "singular": {
          "type": "string",
          "description": "Singular name",
          "minLength": 1
        },
        "plural": {
          "type": "string",
          "description": "Plural name",
          "minLength": 1
        },
        "description": {
          "type": "string",
          "description": "Taxonomy description"
        },
        "hierarchical": {
          "type": "boolean",
          "description": "Category-like (true) or tag-like (false)",
          "default": true
        },
        "public": {
          "type": "boolean",
          "description": "Public queryability",
          "default": true
        },
        "show_admin_column": {
          "type": "boolean",
          "description": "Show column in admin list view",
          "default": true
        },
        "show_in_quick_edit": {
          "type": "boolean",
          "description": "Show in quick edit panel",
          "default": true
        },
        "rewrite": {
          "type": "object",
          "properties": {
            "slug": {
              "type": "string",
              "pattern": "^[a-z][a-z0-9-/]*[a-z0-9]$"
            },
            "with_front": {
              "type": "boolean",
              "default": true
            },
            "hierarchical": {
              "type": "boolean",
              "default": false
            }
          }
        }
      }
    },
    "field": {
      "type": "object",
      "description": "Custom field (SCF) configuration",
      "required": ["name", "label", "type"],
      "additionalProperties": true,
      "properties": {
        "name": {
          "type": "string",
          "description": "Field name (snake_case, lowercase, underscores)",
          "pattern": "^[a-z][a-z0-9_]*$"
        },
        "label": {
          "type": "string",
          "description": "Field display label"
        },
        "type": {
          "type": "string",
          "description": "SCF field type",
          "enum": [
            "text",
            "textarea",
            "number",
            "range",
            "email",
            "url",
            "password",
            "select",
            "checkbox",
            "radio",
            "button_group",
            "true_false",
            "image",
            "file",
            "gallery",
            "wysiwyg",
            "oembed",
            "date_picker",
            "date_time_picker",
            "time_picker",
            "color_picker",
            "icon_picker",
            "google_map",
            "post_object",
            "page_link",
            "relationship",
            "taxonomy",
            "user",
            "link",
            "group",
            "repeater",
            "flexible_content",
            "clone",
            "message",
            "accordion",
            "tab"
          ]
        },
        "instructions": {
          "type": "string",
          "description": "Helper text shown below field"
        },
        "required": {
          "type": "boolean",
          "description": "Is field required",
          "default": false
        },
        "default_value": {
          "description": "Default field value (type varies)"
        },
        "placeholder": {
          "type": "string",
          "description": "Placeholder text"
        },
        "prepend": {
          "type": "string",
          "description": "Text prepended to input"
        },
        "append": {
          "type": "string",
          "description": "Text appended to input"
        },
        "conditional_logic": {
          "type": "array",
          "description": "Conditional display logic",
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "field": {
                  "type": "string",
                  "description": "Field key to check"
                },
                "operator": {
                  "type": "string",
                  "enum": ["==", "!=", ">", "<", ">=", "<=", "contains", "!contains", "matches", "!matches"],
                  "default": "=="
                },
                "value": {
                  "description": "Value to compare against"
                }
              }
            }
          }
        },
        "wrapper": {
          "type": "object",
          "description": "Field wrapper configuration",
          "properties": {
            "width": {
              "type": "string",
              "description": "Field width percentage",
              "pattern": "^\\d+%?$"
            },
            "class": {
              "type": "string",
              "description": "Custom CSS class"
            },
            "id": {
              "type": "string",
              "description": "Custom HTML ID"
            }
          }
        }
      }
    },
    "relationship": {
      "type": "object",
      "description": "Bidirectional post relationship configuration",
      "required": ["target_cpt", "field_name", "reverse_field_name"],
      "additionalProperties": false,
      "properties": {
        "target_cpt": {
          "type": "string",
          "description": "Target CPT slug",
          "pattern": "^[a-z][a-z0-9_]{0,18}[a-z0-9]$"
        },
        "field_name": {
          "type": "string",
          "description": "Relationship field name on source CPT",
          "pattern": "^[a-z][a-z0-9_]*$"
        },
        "field_label": {
          "type": "string",
          "description": "Field label on source CPT"
        },
        "reverse_field_name": {
          "type": "string",
          "description": "Relationship field name on target CPT",
          "pattern": "^[a-z][a-z0-9_]*$"
        },
        "reverse_field_label": {
          "type": "string",
          "description": "Field label on target CPT"
        },
        "min": {
          "type": "integer",
          "description": "Minimum number of related posts",
          "minimum": 0,
          "default": 0
        },
        "max": {
          "type": "integer",
          "description": "Maximum number of related posts",
          "minimum": 0,
          "default": 0
        },
        "return_format": {
          "type": "string",
          "description": "Return format for field values",
          "enum": ["object", "id"],
          "default": "object"
        },
        "filters": {
          "type": "array",
          "description": "Search/filter options in relationship field",
          "items": {
            "type": "string",
            "enum": ["search", "post_type", "taxonomy"]
          },
          "default": ["search", "post_type"]
        }
      }
    }
  }
}
```

**Step 3: Create example multi-CPT configuration**

Create: `.github/schemas/examples/multi-cpt-plugin-config.example.json`

```json
{
  "$schema": "../plugin-config.schema.json",
  "slug": "tour-operator",
  "name": "Tour Operator",
  "description": "Comprehensive tour booking and accommodation management plugin for travel agencies",
  "version": "1.0.0",
  "author": "LightSpeed",
  "author_uri": "https://lightspeedwp.agency",
  "plugin_uri": "https://lightspeedwp.agency/plugins/tour-operator",
  "namespace": "Tour_Operator",
  "textdomain": "tour-operator",
  "license": "GPL-3.0-or-later",
  "requires_wp": "6.5",
  "requires_php": "8.0",
  "requires_plugins": ["secure-custom-fields"],

  "custom_post_types": [
    {
      "slug": "tour",
      "singular": "Tour",
      "plural": "Tours",
      "description": "Tour packages and itineraries",
      "public": true,
      "has_archive": true,
      "hierarchical": false,
      "menu_icon": "dashicons-palmtree",
      "menu_position": 20,
      "supports": ["title", "editor", "thumbnail", "excerpt", "custom-fields", "revisions"],
      "rewrite": {
        "slug": "tours",
        "with_front": false,
        "feeds": true,
        "pages": true
      },
      "taxonomies": [
        {
          "slug": "destination",
          "singular": "Destination",
          "plural": "Destinations",
          "description": "Tour destinations and regions",
          "hierarchical": true,
          "show_admin_column": true,
          "rewrite": {
            "slug": "destinations",
            "hierarchical": true
          }
        },
        {
          "slug": "tour_type",
          "singular": "Tour Type",
          "plural": "Tour Types",
          "description": "Categories of tours (adventure, cultural, etc.)",
          "hierarchical": true,
          "show_admin_column": true
        }
      ],
      "fields": [
        {
          "name": "price",
          "label": "Price per Person",
          "type": "number",
          "instructions": "Enter price in USD",
          "required": true,
          "default_value": 0,
          "prepend": "$",
          "min": 0,
          "step": 0.01
        },
        {
          "name": "duration_days",
          "label": "Duration (Days)",
          "type": "number",
          "instructions": "Total tour duration in days",
          "required": true,
          "default_value": 1,
          "min": 1,
          "max": 365
        },
        {
          "name": "max_participants",
          "label": "Maximum Participants",
          "type": "number",
          "instructions": "Maximum number of participants per tour",
          "default_value": 10,
          "min": 1
        },
        {
          "name": "difficulty_level",
          "label": "Difficulty Level",
          "type": "select",
          "choices": {
            "easy": "Easy",
            "moderate": "Moderate",
            "challenging": "Challenging",
            "expert": "Expert"
          },
          "default_value": "moderate"
        },
        {
          "name": "included_items",
          "label": "What's Included",
          "type": "wysiwyg",
          "toolbar": "basic",
          "media_upload": false
        },
        {
          "name": "gallery",
          "label": "Tour Gallery",
          "type": "gallery",
          "instructions": "Upload tour photos",
          "min": 0,
          "max": 20,
          "preview_size": "medium",
          "library": "all"
        }
      ],
      "relationships": [
        {
          "target_cpt": "accommodation",
          "field_name": "related_accommodations",
          "field_label": "Related Accommodations",
          "reverse_field_name": "related_tours",
          "reverse_field_label": "Related Tours",
          "min": 0,
          "max": 5,
          "return_format": "object",
          "filters": ["search"]
        },
        {
          "target_cpt": "destination",
          "field_name": "featured_destinations",
          "field_label": "Featured Destinations",
          "reverse_field_name": "featured_in_tours",
          "reverse_field_label": "Featured in Tours",
          "max": 3
        }
      ],
      "template": [
        ["{{slug}}/tour-card"],
        ["core/paragraph", {"placeholder": "Describe the tour..."}]
      ],
      "template_lock": false
    },
    {
      "slug": "accommodation",
      "singular": "Accommodation",
      "plural": "Accommodations",
      "description": "Hotels, lodges, and other accommodation options",
      "public": true,
      "has_archive": true,
      "menu_icon": "dashicons-building",
      "menu_position": 21,
      "supports": ["title", "editor", "thumbnail", "excerpt", "custom-fields"],
      "taxonomies": [
        {
          "slug": "accommodation_type",
          "singular": "Accommodation Type",
          "plural": "Accommodation Types",
          "description": "Types of accommodation (hotel, lodge, resort, etc.)",
          "hierarchical": true,
          "show_admin_column": true
        },
        {
          "slug": "amenity",
          "singular": "Amenity",
          "plural": "Amenities",
          "description": "Available amenities and facilities",
          "hierarchical": false,
          "show_admin_column": true
        }
      ],
      "fields": [
        {
          "name": "star_rating",
          "label": "Star Rating",
          "type": "select",
          "choices": {
            "1": "1 Star",
            "2": "2 Stars",
            "3": "3 Stars",
            "4": "4 Stars",
            "5": "5 Stars"
          },
          "default_value": "3"
        },
        {
          "name": "room_count",
          "label": "Number of Rooms",
          "type": "number",
          "min": 1,
          "default_value": 10
        },
        {
          "name": "nightly_rate",
          "label": "Nightly Rate",
          "type": "number",
          "instructions": "Average nightly rate in USD",
          "prepend": "$",
          "step": 0.01
        },
        {
          "name": "check_in_time",
          "label": "Check-in Time",
          "type": "time_picker",
          "display_format": "g:i a",
          "return_format": "H:i:s",
          "default_value": "15:00:00"
        },
        {
          "name": "check_out_time",
          "label": "Check-out Time",
          "type": "time_picker",
          "display_format": "g:i a",
          "return_format": "H:i:s",
          "default_value": "11:00:00"
        },
        {
          "name": "address",
          "label": "Address",
          "type": "google_map",
          "center_lat": 0,
          "center_lng": 0,
          "zoom": 14,
          "height": 400
        }
      ]
    },
    {
      "slug": "destination",
      "singular": "Destination",
      "plural": "Destinations",
      "description": "Travel destinations and regions",
      "public": true,
      "has_archive": true,
      "hierarchical": true,
      "menu_icon": "dashicons-location",
      "menu_position": 22,
      "supports": ["title", "editor", "thumbnail", "excerpt", "custom-fields", "page-attributes"],
      "fields": [
        {
          "name": "country",
          "label": "Country",
          "type": "text",
          "required": true
        },
        {
          "name": "region",
          "label": "Region",
          "type": "text"
        },
        {
          "name": "best_time_to_visit",
          "label": "Best Time to Visit",
          "type": "text",
          "placeholder": "e.g., April to October"
        },
        {
          "name": "timezone",
          "label": "Timezone",
          "type": "text",
          "placeholder": "e.g., UTC+2"
        },
        {
          "name": "featured_image_gallery",
          "label": "Destination Images",
          "type": "gallery",
          "min": 1,
          "max": 10
        }
      ]
    }
  ],

  "global_taxonomies": [
    {
      "slug": "travel_season",
      "singular": "Travel Season",
      "plural": "Travel Seasons",
      "description": "Seasonal classifications for tours and destinations",
      "hierarchical": false,
      "show_admin_column": true
    }
  ],

  "blocks": {
    "enabled": true,
    "types": ["card", "collection", "featured", "slider"],
    "category": "tour-operator"
  },

  "patterns": {
    "enabled": true,
    "types": ["card", "grid", "meta", "featured", "archive", "single", "slider"]
  },

  "templates": {
    "enabled": true,
    "generate_single": true,
    "generate_archive": true,
    "template_parts": ["header", "meta", "sidebar"]
  }
}
```

**Step 4: Validate example configuration**

```bash
# Install ajv-cli if not already installed
npm install -g ajv-cli

# Validate example against schema
ajv validate \
  -s .github/schemas/plugin-config.schema.json \
  -d .github/schemas/examples/multi-cpt-plugin-config.example.json
```

Expected output: `valid`

**Step 5: Commit**

```bash
git add .github/schemas/plugin-config.schema.json
git add .github/schemas/examples/multi-cpt-plugin-config.example.json
git commit -m "feat: expand plugin config schema to support multiple CPTs with relationships"
```

---

### Task 8.2: Update Generate Plugin Script for Multi-CPT Support

**Files:**
- Modify: `scripts/generate-plugin.js`
- Reference: Mustache.js documentation
- Reference: Updated schema

**Step 1: Read current generator script**

```bash
head -100 scripts/generate-plugin.js
```

**Step 2: Add multi-CPT processing functions**

Add after existing functions:

```javascript
/**
 * Process multi-CPT configuration
 *
 * Transforms array of CPTs into indexed variables for template processing
 *
 * @param {Object} config - Plugin configuration
 * @return {Object} Enhanced config with indexed CPT variables
 */
function processMultiCPT(config) {
    if (!config.custom_post_types || !Array.isArray(config.custom_post_types)) {
        throw new Error('Configuration must include custom_post_types array');
    }

    // Primary CPT (first in array) gets non-indexed variables
    const primaryCPT = config.custom_post_types[0];

    // Add primary CPT variables to root config
    Object.assign(config, {
        cpt_slug: primaryCPT.slug,
        cpt_name_singular: primaryCPT.singular,
        cpt_name_plural: primaryCPT.plural,
        cpt_description: primaryCPT.description || '',
        cpt_public: primaryCPT.public !== false,
        cpt_has_archive: primaryCPT.has_archive !== false,
        cpt_hierarchical: primaryCPT.hierarchical || false,
        cpt_menu_icon: primaryCPT.menu_icon || 'dashicons-admin-post',
        cpt_menu_position: primaryCPT.menu_position || 20,
        cpt_supports: formatArrayForPHP(primaryCPT.supports || ['title', 'editor']),
        cpt_rewrite_slug: primaryCPT.rewrite?.slug || primaryCPT.slug,
    });

    // Add indexed variables for all CPTs
    config.custom_post_types.forEach((cpt, index) => {
        config[`cpt_slug_${index}`] = cpt.slug;
        config[`cpt_name_singular_${index}`] = cpt.singular;
        config[`cpt_name_plural_${index}`] = cpt.plural;
        config[`cpt_description_${index}`] = cpt.description || '';
    });

    // Flag for additional CPTs (beyond primary)
    config.cpt_additional = config.custom_post_types.slice(1);

    return config;
}

/**
 * Process taxonomies for CPTs
 *
 * @param {Object} config - Plugin configuration
 * @return {Object} Enhanced config with taxonomy variables
 */
function processTaxonomies(config) {
    const allTaxonomies = [];

    // Collect taxonomies from all CPTs
    config.custom_post_types.forEach((cpt) => {
        if (cpt.taxonomies && Array.isArray(cpt.taxonomies)) {
            cpt.taxonomies.forEach((tax) => {
                allTaxonomies.push({
                    ...tax,
                    attached_to: cpt.slug,
                });
            });
        }
    });

    // Add global taxonomies
    if (config.global_taxonomies && Array.isArray(config.global_taxonomies)) {
        allTaxonomies.push(...config.global_taxonomies.map(tax => ({
            ...tax,
            attached_to: 'all',
        })));
    }

    // Primary taxonomy variables
    if (allTaxonomies.length > 0) {
        const primaryTax = allTaxonomies[0];
        config.tax_slug = primaryTax.slug;
        config.tax_singular = primaryTax.singular;
        config.tax_plural = primaryTax.plural;
        config.tax_hierarchical = primaryTax.hierarchical !== false;
        config.tax_attached_to = primaryTax.attached_to;
    }

    // Indexed taxonomy variables
    allTaxonomies.forEach((tax, index) => {
        config[`tax_slug_${index}`] = tax.slug;
        config[`tax_singular_${index}`] = tax.singular;
        config[`tax_plural_${index}`] = tax.plural;
    });

    config.all_taxonomies = allTaxonomies;

    return config;
}

/**
 * Process relationships
 *
 * @param {Object} config - Plugin configuration
 * @return {Object} Enhanced config with relationship variables
 */
function processRelationships(config) {
    const allRelationships = [];

    config.custom_post_types.forEach((cpt) => {
        if (cpt.relationships && Array.isArray(cpt.relationships)) {
            cpt.relationships.forEach((rel) => {
                allRelationships.push({
                    source_cpt: cpt.slug,
                    target_cpt: rel.target_cpt,
                    field_name: rel.field_name,
                    field_label: rel.field_label || `Related ${rel.target_cpt}`,
                    reverse_field_name: rel.reverse_field_name,
                    reverse_field_label: rel.reverse_field_label || `Related ${cpt.slug}`,
                    min: rel.min || 0,
                    max: rel.max || 0,
                    return_format: rel.return_format || 'object',
                    filters: rel.filters || ['search'],
                });
            });
        }
    });

    config.all_relationships = allRelationships;

    return config;
}

/**
 * Generate block files for each CPT
 *
 * @param {Object} config - Plugin configuration
 * @param {string} outputDir - Output directory
 */
async function generateBlocksForCPTs(config, outputDir) {
    if (!config.blocks || !config.blocks.enabled) {
        return;
    }

    const blockTypes = config.blocks.types || ['card', 'collection', 'featured', 'slider'];

    for (const cpt of config.custom_post_types) {
        for (const blockType of blockTypes) {
            const blockSlug = `${cpt.slug}-${blockType}`;
            const blockDir = path.join(outputDir, 'src', 'blocks', blockSlug);

            // Create block directory
            await fs.ensureDir(blockDir);

            // Generate block files
            const blockContext = {
                ...config,
                block_slug: blockSlug,
                block_name: `${cpt.singular} ${capitalize(blockType)}`,
                block_namespace: `${config.slug}/${blockSlug}`,
                block_category: config.blocks.category || config.slug,
                block_icon: cpt.menu_icon || 'dashicons-admin-post',
                cpt_slug: cpt.slug,
                cpt_name_singular: cpt.singular,
                cpt_name_plural: cpt.plural,
            };

            // Generate block.json
            await generateFromTemplate(
                path.join(__dirname, '../src/blocks/{{slug}}-card/block.json'),
                path.join(blockDir, 'block.json'),
                blockContext
            );

            // Generate edit.js
            await generateFromTemplate(
                path.join(__dirname, '../src/blocks/{{slug}}-card/edit.js'),
                path.join(blockDir, 'edit.js'),
                blockContext
            );

            // Generate save.js
            await generateFromTemplate(
                path.join(__dirname, '../src/blocks/{{slug}}-card/save.js'),
                path.join(blockDir, 'save.js'),
                blockContext
            );

            // Generate index.js
            await generateFromTemplate(
                path.join(__dirname, '../src/blocks/{{slug}}-card/index.js'),
                path.join(blockDir, 'index.js'),
                blockContext
            );

            // Generate style.scss
            await generateFromTemplate(
                path.join(__dirname, '../src/blocks/{{slug}}-card/style.scss'),
                path.join(blockDir, 'style.scss'),
                blockContext
            );

            // Generate editor.scss
            await generateFromTemplate(
                path.join(__dirname, '../src/blocks/{{slug}}-card/editor.scss'),
                path.join(blockDir, 'editor.scss'),
                blockContext
            );

            console.log(`✅ Generated block: ${blockSlug}`);
        }
    }
}

/**
 * Generate patterns for each CPT
 *
 * @param {Object} config - Plugin configuration
 * @param {string} outputDir - Output directory
 */
async function generatePatternsForCPTs(config, outputDir) {
    if (!config.patterns || !config.patterns.enabled) {
        return;
    }

    const patternTypes = config.patterns.types || ['card', 'grid', 'meta'];

    for (const cpt of config.custom_post_types) {
        for (const patternType of patternTypes) {
            const patternSlug = `${cpt.slug}-${patternType}`;
            const patternFile = path.join(outputDir, 'patterns', `${patternSlug}.php`);

            const patternContext = {
                ...config,
                pattern_slug: patternSlug,
                pattern_name: `${cpt.singular} ${capitalize(patternType)}`,
                pattern_namespace: `${config.slug}/${patternSlug}`,
                cpt_slug: cpt.slug,
                cpt_name_singular: cpt.singular,
                cpt_name_plural: cpt.plural,
            };

            await generateFromTemplate(
                path.join(__dirname, '../patterns/{{slug}}-card.php'),
                patternFile,
                patternContext
            );

            console.log(`✅ Generated pattern: ${patternSlug}.php`);
        }
    }
}

/**
 * Generate templates for each CPT
 *
 * @param {Object} config - Plugin configuration
 * @param {string} outputDir - Output directory
 */
async function generateTemplatesForCPTs(config, outputDir) {
    if (!config.templates || !config.templates.enabled) {
        return;
    }

    for (const cpt of config.custom_post_types) {
        const templateContext = {
            ...config,
            cpt_slug: cpt.slug,
            cpt_name_singular: cpt.singular,
            cpt_name_plural: cpt.plural,
        };

        // Generate single template
        if (config.templates.generate_single) {
            await generateFromTemplate(
                path.join(__dirname, '../templates/single-{{slug}}.html'),
                path.join(outputDir, 'templates', `single-${cpt.slug}.html`),
                templateContext
            );
            console.log(`✅ Generated template: single-${cpt.slug}.html`);
        }

        // Generate archive template
        if (config.templates.generate_archive && cpt.has_archive) {
            await generateFromTemplate(
                path.join(__dirname, '../templates/archive-{{slug}}.html'),
                path.join(outputDir, 'templates', `archive-${cpt.slug}.html`),
                templateContext
            );
            console.log(`✅ Generated template: archive-${cpt.slug}.html`);
        }

        // Generate template parts
        const templateParts = config.templates.template_parts || [];
        for (const partType of templateParts) {
            await generateFromTemplate(
                path.join(__dirname, '../template-parts/{{slug}}-meta.html'),
                path.join(outputDir, 'template-parts', `${cpt.slug}-${partType}.html`),
                templateContext
            );
            console.log(`✅ Generated template part: ${cpt.slug}-${partType}.html`);
        }
    }
}

/**
 * Format array for PHP output
 *
 * @param {Array} arr - Array to format
 * @return {string} PHP-formatted array string
 */
function formatArrayForPHP(arr) {
    return arr.map(item => `'${item}'`).join(', ');
}

/**
 * Capitalize first letter
 *
 * @param {string} str - String to capitalize
 * @return {string} Capitalized string
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
```

**Step 3: Update main generation function**

Modify the main `generatePlugin` function to call new processors:

```javascript
async function generatePlugin(configPath, options = {}) {
    console.log('🚀 Starting plugin generation...\n');

    // Load and validate configuration
    const config = await loadAndValidateConfig(configPath);

    // Process multi-CPT configuration
    console.log('📦 Processing multi-CPT configuration...');
    processMultiCPT(config);
    processTaxonomies(config);
    processRelationships(config);
    console.log('✅ Configuration processed\n');

    // Determine output directory
    const outputDir = options.inPlace
        ? process.cwd()
        : path.join(process.cwd(), 'generated-plugins', config.slug);

    // Generate base plugin files
    console.log('📝 Generating base plugin files...');
    await generateBaseFiles(config, outputDir);
    console.log('✅ Base files generated\n');

    // Generate blocks for each CPT
    console.log('🧱 Generating blocks for CPTs...');
    await generateBlocksForCPTs(config, outputDir);
    console.log('✅ Blocks generated\n');

    // Generate patterns for each CPT
    console.log('🎨 Generating patterns for CPTs...');
    await generatePatternsForCPTs(config, outputDir);
    console.log('✅ Patterns generated\n');

    // Generate templates for each CPT
    console.log('📄 Generating templates for CPTs...');
    await generateTemplatesForCPTs(config, outputDir);
    console.log('✅ Templates generated\n');

    // Run post-generation tasks
    console.log('🔧 Running post-generation tasks...');
    await runPostGeneration(outputDir);
    console.log('✅ Post-generation complete\n');

    console.log(`✨ Plugin generated successfully at: ${outputDir}\n`);
}
```

**Step 4: Test multi-CPT generation**

```bash
node scripts/generate-plugin.js \
  --config .github/schemas/examples/multi-cpt-plugin-config.example.json \
  --output generated-plugins/tour-operator
```

Expected: Plugin generated with:
- 3 CPTs (tour, accommodation, destination)
- Multiple blocks per CPT (12 blocks total)
- Multiple patterns per CPT (21 patterns total)
- Templates for each CPT (6 templates total)
- Bidirectional relationships configured

**Step 5: Commit**

```bash
git add scripts/generate-plugin.js
git commit -m "feat: add multi-CPT support to plugin generator"
```

---

## PHASE 9: Update Generator Instructions and Documentation

### Task 9.1: Update generate-plugin.instructions.md

**Files:**
- Modify: `.github/instructions/generate-plugin.instructions.md`

**Step 1: Add multi-CPT wizard section**

```markdown
## Multi-CPT Plugin Generation

### Configuration Structure

Multi-CPT plugins require `custom_post_types` array in configuration:

```json
{
  "slug": "tour-operator",
  "name": "Tour Operator",
  "custom_post_types": [
    {
      "slug": "tour",
      "singular": "Tour",
      "plural": "Tours",
      "taxonomies": [...],
      "fields": [...],
      "relationships": [...]
    },
    {
      "slug": "accommodation",
      "singular": "Accommodation",
      "plural": "Accommodations"
    }
  ]
}
```

### Primary vs Secondary CPTs

**Primary CPT (First in Array):**
- Gets non-indexed variables: `{{cpt_slug}}`, `{{cpt_name_singular}}`
- Used as default in shared contexts
- Primary blocks/patterns generated first

**Secondary CPTs:**
- Get indexed variables: `{{cpt_slug_1}}`, `{{cpt_name_singular_1}}`
- Generate complete block/pattern/template suites
- Can relate to primary or other secondary CPTs

### Bidirectional Relationships

Configure relationships between CPTs using `relationships` array:

```json
{
  "slug": "tour",
  "relationships": [
    {
      "target_cpt": "accommodation",
      "field_name": "related_accommodations",
      "field_label": "Related Accommodations",
      "reverse_field_name": "related_tours",
      "reverse_field_label": "Related Tours",
      "min": 0,
      "max": 5
    }
  ]
}
```

**Generated Output:**

On Tour CPT:
```php
array(
    'key' => 'field_tour_related_accommodations',
    'name' => 'related_accommodations',
    'type' => 'relationship',
    'post_type' => array( 'accommodation' ),
    'bidirectional' => 'related_tours',
)
```

On Accommodation CPT (automatically):
```php
array(
    'key' => 'field_accommodation_related_tours',
    'name' => 'related_tours',
    'type' => 'relationship',
    'post_type' => array( 'tour' ),
    'bidirectional' => 'related_accommodations',
)
```

### Custom Fields Per CPT

Each CPT can have its own `fields` array:

```json
{
  "slug": "tour",
  "fields": [
    {
      "name": "price",
      "label": "Price per Person",
      "type": "number",
      "required": true,
      "prepend": "$"
    },
    {
      "name": "duration_days",
      "label": "Duration (Days)",
      "type": "number",
      "required": true,
      "min": 1
    }
  ]
}
```

### Taxonomies Per CPT

Each CPT can have CPT-specific taxonomies:

```json
{
  "slug": "tour",
  "taxonomies": [
    {
      "slug": "destination",
      "singular": "Destination",
      "plural": "Destinations",
      "hierarchical": true
    }
  ]
}
```

**Plus Global Taxonomies:**

```json
{
  "global_taxonomies": [
    {
      "slug": "featured",
      "singular": "Featured Item",
      "plural": "Featured Items",
      "hierarchical": false
    }
  ]
}
```

Global taxonomies apply to all CPTs.

### Block Generation

Generator creates these block types per CPT:
1. `{cpt-slug}-card` - Single post card display
2. `{cpt-slug}-collection` - Query loop variant
3. `{cpt-slug}-featured` - Featured post showcase
4. `{cpt-slug}-slider` - Carousel/slider layout

**Control Generation:**

```json
{
  "blocks": {
    "enabled": true,
    "types": ["card", "collection", "featured"],
    "category": "tour-operator"
  }
}
```

### Pattern Generation

Generator creates these pattern types per CPT:
1. `{cpt-slug}-card` - Card layout for post template
2. `{cpt-slug}-grid` - Grid layout
3. `{cpt-slug}-meta` - Post meta display
4. `{cpt-slug}-featured` - Featured display
5. `{cpt-slug}-archive` - Archive page layout
6. `{cpt-slug}-single` - Single post layout
7. `{cpt-slug}-slider` - Slider/carousel layout

**Control Generation:**

```json
{
  "patterns": {
    "enabled": true,
    "types": ["card", "grid", "meta", "single"]
  }
}
```

### Template Generation

Generator creates per CPT:
- `single-{cpt-slug}.html` - Single post template
- `archive-{cpt-slug}.html` - Archive template (if `has_archive: true`)
- `{cpt-slug}-header.html` - Template part
- `{cpt-slug}-meta.html` - Template part
- `{cpt-slug}-sidebar.html` - Template part

**Control Generation:**

```json
{
  "templates": {
    "enabled": true,
    "generate_single": true,
    "generate_archive": true,
    "template_parts": ["header", "meta", "sidebar"]
  }
}
```

### Example: Generate Multi-CPT Plugin

```bash
# Create configuration file
cat > plugin-config.json <<EOF
{
  "slug": "tour-operator",
  "name": "Tour Operator",
  "custom_post_types": [
    {
      "slug": "tour",
      "singular": "Tour",
      "plural": "Tours",
      "menu_icon": "dashicons-palmtree",
      "taxonomies": [
        {
          "slug": "destination",
          "singular": "Destination",
          "plural": "Destinations",
          "hierarchical": true
        }
      ],
      "fields": [
        {
          "name": "price",
          "label": "Price",
          "type": "number"
        }
      ],
      "relationships": [
        {
          "target_cpt": "accommodation",
          "field_name": "related_accommodations",
          "reverse_field_name": "related_tours"
        }
      ]
    },
    {
      "slug": "accommodation",
      "singular": "Accommodation",
      "plural": "Accommodations",
      "menu_icon": "dashicons-building"
    }
  ]
}
EOF

# Generate plugin
node scripts/generate-plugin.js --config plugin-config.json

# Output structure:
# generated-plugins/tour-operator/
# ├── src/blocks/
# │   ├── tour-card/
# │   ├── tour-collection/
# │   ├── tour-featured/
# │   ├── tour-slider/
# │   ├── accommodation-card/
# │   ├── accommodation-collection/
# │   ├── accommodation-featured/
# │   └── accommodation-slider/
# ├── patterns/
# │   ├── tour-card.php
# │   ├── tour-grid.php
# │   ├── accommodation-card.php
# │   └── accommodation-grid.php
# ├── templates/
# │   ├── single-tour.html
# │   ├── archive-tour.html
# │   ├── single-accommodation.html
# │   └── archive-accommodation.html
# └── inc/
#     ├── class-post-types.php (registers tour & accommodation)
#     ├── class-taxonomies.php (registers destination)
#     └── class-fields.php (registers fields & relationships)
```

### Validation

After generation, validate:

```bash
cd generated-plugins/tour-operator

# Validate PHP syntax
find inc -name "*.php" -exec php -l {} \;

# Validate JSON schemas
find . -name "*.json" -exec jsonlint {} \;

# Validate relationships
grep -r "bidirectional" inc/class-fields.php
# Should show both directions of each relationship

# Check block registration
grep -r "registerBlockType" src/blocks/*/index.js
# Should show all generated blocks
```
```

**Step 2: Commit**

```bash
git add .github/instructions/generate-plugin.instructions.md
git commit -m "docs: add multi-CPT wizard documentation to generator instructions"
```

---

## Summary

This plan (Part 2) expands the scaffold to support:

✅ **Mustache Variable System:**
- Comprehensive variable taxonomy
- Category-based organization
- Per-CPT, per-taxonomy, per-block scoping
- Indexed variables for multiple instances
- Complete validation

✅ **Multi-CPT Configuration:**
- JSON schema for complex configurations
- Multiple post types per plugin
- CPT-specific taxonomies
- Custom fields per CPT
- Bidirectional relationships
- Global and local taxonomies

✅ **Generator Enhancements:**
- Multi-CPT processing
- Automatic block generation per CPT
- Pattern generation per CPT
- Template generation per CPT
- Relationship configuration
- Complete validation

✅ **Documentation:**
- Complete mustache variable reference
- Multi-CPT wizard guide
- Relationship configuration examples
- Validation procedures

**Next Steps:**
1. Execute this plan task-by-task using `superpowers:executing-plans`
2. Test generator with multi-CPT configurations
3. Validate all generated output
4. Update remaining instruction files
5. Create comprehensive examples

**Plan complete and saved to: `.github/projects/plans/PART-2-multi-cpt-wizard-schema-expansion.md`**
