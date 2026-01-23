---
description: >-
  Guidance for extending the multi-block plugin scaffold with placeholders and
  generator hooks
applyTo: '**'
version: '1.0'
last_updated: '2025-12-11'
references:
  - ../custom-instructions.md
---

# Block Plugin Scaffolding – Instructions for Copilot

You are a scaffold extension assistant. Follow our multi-block plugin scaffold patterns to add placeholders and generation hooks safely. Avoid hard-coding values, inventing new template conventions, or conflating plugin scaffolding with block themes.

## Overview

Use this guide when extending the scaffold templates, generator placeholders, or plugin skeleton. It focuses on keeping extensions reusable and consistent. It does not cover block implementation details or release workflows.

## General Rules

- Preserve mustache placeholders; never hard-code plugin-specific values.
- Keep template changes minimal and backwards compatible with the generator.
- Avoid adding new directories or file types without updating generator configs and docs.
- Keep PHP namespaced and prefixed; keep JS/CSS scoped to plugin namespace.
- Document new placeholders in the registry and tests.

## Detailed Guidance

These instructions describe how to extend the **multi-block plugin scaffold** in this repository so that a generated plugin has **placeholders** for:

- Block templates (via the plugin template API)
- Block bindings
- Block patterns (already mostly scaffolded, just clarify usage)
- Plugin-scoped styles (block style variations / section styles)

> ⚠️ Important
> This is a **plugin**, not a block theme. Only themes get automatic theme.json + `templates/` + `parts/` handling. For plugins we must register things explicitly via WordPress APIs and/or filters.

The repository uses mustache-style placeholders like `{{namespace}}`, `{{slug}}`, `{{textdomain}}`, `{{name}}`. Do **not** hard-code values; keep the placeholders so the scaffold remains reusable.

---

## 1. Conventions to follow

1. **Namespaces and class location**

   - Follow the pattern used in `inc/class-patterns.php`:
     - Namespace: `{{namespace|lowerCase}}\classes`
     - Guard: `if ( ! defined( 'ABSPATH' ) ) { exit; }`
   - New classes go into `inc/` and are named:

     - `class Block_Templates`
     - `class Block_Bindings`
     - `class Block_Styles`

2. **Plugin dir constant**

   - Reuse the constant already used in `class-patterns.php`:
     - `{{namespace|upper}}_DIR`
   - Use this constant when resolving plugin-relative directories (e.g. `templates/`, `styles/`).

3. **Hooking**

   - Follow the “instance class + constructor hooks” pattern from `class-patterns.php`:
     - Add actions in `__construct()`, e.g.:

       ```php
       public function __construct() {
           add_action( 'init', array( $this, 'register_block_templates' ) );
       }
       ```

   - The plugin bootstrap file is responsible for doing `new \{{namespace|lowerCase}}\classes\Block_Templates();` etc.

---

## 2. Block templates scaffolding (plugin-side)

### 2.1. Files & structure

1. Create a new class file:

   - `inc/class-block-templates.php`

2. Create a templates directory and README:

   - `templates/`
   - `templates/README.md` explaining that these files are **plugin-registered templates** (not theme templates) and are consumed via `register_block_template()`.

3. Add at least one **example template** file:

   - `templates/example-archive.html`
   - Content should be simple block markup, e.g. a group with a heading and post-template.

### 2.2. Class implementation

In `inc/class-block-templates.php`:

- Add the namespace + guard.
- Define `Block_Templates` with:

```php
<?php
namespace {{namespace|lowerCase}}\classes;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Plugin block templates registration.
 */
class Block_Templates {

    /**
     * Constructor.
     */
    public function __construct() {
        add_action( 'init', array( $this, 'register_block_templates' ) );
    }

    /**
     * Register plugin block templates via the WP 6.7+ API.
     *
     * @return void
     */
    public function register_block_templates() {
        if ( ! function_exists( 'register_block_template' ) ) {
            return; // Pre-6.7: no-op.
        }

        $templates_dir = {{namespace|upper}}_DIR . 'templates/';

        $template_file = $templates_dir . 'example-archive.html';

        if ( file_exists( $template_file ) ) {
            register_block_template(
                '{{slug}}//example-archive',
                array(
                    'title'       => __( '{{name}} Example Archive', '{{textdomain}}' ),
                    'description' => __( 'Example archive template registered by the plugin.', '{{textdomain}}' ),
                    'post_types'  => array( 'post' ),
                    'content'     => file_get_contents( $template_file ),
                )
            );
        }
    }
}
```


Notes:

* Don’t add template parts here – there’s no clean plugin API yet. We just support **full templates** as placeholders.
* Keep this implementation minimal and commented so users can extend it.

### **2.3. Template parts placeholder**

Add a directory for future template parts:

* `template-parts/README.md` with a short explanation:

  * Template parts are still primarily a theme concern.
  * Plugin authors can either ship them as patterns or let themes provide actual `wp_template_part` files.
  * This dir exists as a **documentation placeholder**, not something the scaffold wires up.

No PHP registration code is required yet; just document the limitation.

---

## **3\. Block bindings scaffolding**

### **3.1. Files**

Create:

* `inc/class-block-bindings.php`

### **3.2. Class implementation**

Implement a single example binding source for “post meta” values.

```php
<?php
namespace {{namespace|lowerCase}}\classes;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Block bindings registration.
 */
class Block_Bindings {

    /**
     * Constructor.
     */
    public function __construct() {
        add_action( 'init', array( $this, 'register_sources' ) );
    }

    /**
     * Register bindings sources.
     *
     * @return void
     */
    public function register_sources() {
        if ( ! function_exists( 'register_block_bindings_source' ) ) {
            return;
        }

        register_block_bindings_source(
            '{{slug}}/post-meta',
            array(
                'label'              => __( '{{name}} Post Meta', '{{textdomain}}' ),
                'get_value_callback' => array( $this, 'get_post_meta_value' ),
                'uses_context'       => array( 'postId' ),
            )
        );
    }

    /**
     * Example binding: fetch a scalar post meta value.
     *
     * @param array $args    Binding arguments (expects 'key').
     * @param array $context Binding context (expects 'postId').
     * @return string|null
     */
    public function get_post_meta_value( $args, $context ) {
        if ( empty( $args['key'] ) || empty( $context['postId'] ) ) {
            return null;
        }

        $meta = get_post_meta( (int) $context['postId'], $args['key'], true );

        if ( is_scalar( $meta ) ) {
            return (string) $meta;
        }

        return null;
    }
}
```

Document in comments how this source can be used from `block.json` via the `metadata.bindings` property.

---

## **4\. Block patterns (confirm & lightly document)**

Patterns are already scaffolded via:

* `inc/class-patterns.php`
* `patterns/*.php`

Tasks:

1. **Leave the existing registration logic intact**, just ensure:

   * The constructor hooks into `'init'` (it already does).
   * `$patterns_dir` uses `{{namespace|upper}}_DIR . 'patterns/'`.



2. In `patterns/README.md`, add a short section clarifying:

   * Patterns are **plugin-registered** using `register_block_pattern()` from each PHP file.

   * `class-patterns.php` is responsible for:

     * Registering the plugin’s pattern category: slug `{{slug}}`.
     * Loading all PHP files in `patterns/` on `init`.

No major code changes are needed; just ensure the doc explains how to add new patterns.

---

## **5. Styles / section styles scaffolding**

### **5.1. Files & directories**

The scaffold now stores block styles and design tokens in JSON so the definitions stay editable and versioned. Keep this structure intact:

* `inc/class-block-styles.php` – Scans `styles/` on `init`, loads every JSON definition, and registers each `scope: block` style via `register_block_style()`.
* `styles/blocks/` – Block-specific variations (e.g., `button-primary.json`, `button-rounded.json`, `heading-serif.json`).
* `styles/sections/` – Section/hero tokens for patterns (`content-section.json`, `hero-section.json`).
* `styles/typography/`, `styles/colors/`, `styles/presets/` – Typographic tokens, palettes, and preset bundles used for documentation or future theme.json exports.

Each JSON asset should define:

- `scope` (defaults to `block`) to describe what the definition targets.
- `blocks` (array or string) listing the block slugs that should receive the style.
- `name` and `label` for the style.
- `style_data` for colours/typography/spacings that WordPress uses internally.
- Optional `class_name` or `style_handle`.

Files can expose an object or a numeric array; the loader handles both shapes. Choose a consistent naming convention and keep the JSON free from PHP logic.

### **5.2. Class implementation**

`inc/class-block-styles.php` already performs this: it resolves `{{namespace|upper}}_DIR . 'styles/'`, collects every `.json` file, decodes it, and flattens the definitions. For each definition with `scope === 'block'`, it calls `register_block_style()` with the translated `label`, the provided `name`, and any `style_data`.

When extending the class, keep the same pattern — avoid duplicating style metadata in PHP. Add new JSON files and let the loader pick them up automatically rather than hard-coding more styles in PHP.

### **5.3. Example JSON references**

The repository ships with concrete JSON examples you can emulate:

- `styles/blocks/button-primary.json` – Primary button skin with spacing and colour tokens.
- `styles/blocks/button-rounded.json` – Rounded button variant with border and accent colours.
- `styles/blocks/heading-serif.json` – Serif heading treatment that tweaks typography.
- `styles/sections/content-section.json` and `styles/sections/hero-section.json` – Section tokens documenting padding and backgrounds.
- `styles/colors/palette.json` and `styles/dark.json` – Colour palettes and dark-mode presets.
- `styles/typography/serif-titles.json` and `styles/presets/dark.json` – Typography tokens and preset bundles.

Add new files to the appropriate folder whenever you need new style variations or tokens. They will be registered without additional PHP code.

---

## **6\. Wiring everything in the main plugin file**

Locate the **main plugin bootstrap file** (the one with the plugin header that currently wires up `{{namespace|lowerCase}}\classes\Patterns`).

Add instantiations for the new classes, for example:

```php
// Existing:
new \{{namespace|lowerCase}}\classes\Patterns();

// New:
new \{{namespace|lowerCase}}\classes\Block_Templates();
new \{{namespace|lowerCase}}\classes\Block_Bindings();
new \{{namespace|lowerCase}}\classes\Block_Styles();
```

Ensure these are only instantiated once and that the `inc/*.php` files are already being loaded (e.g. via a simple autoloader or `require_once`).

---

## **7\. Quick sanity checks**

After implementation, the generated plugin for a real project should:

1. **Patterns**

   * Show a new pattern category `{{name}}` in the block inserter.
   * Provide at least one example pattern.



2. **Block styles**

   * Show the `{{name}} Section Highlight` style under core/group & core/columns.



3. **Block bindings**

   * Show `{{name}} Post Meta` as a binding source in the block bindings UI (when available).
   * Correctly pull meta values for a test block using the binding.



4. **Templates**

   * In a WP 6.7+ site, show an “Example Archive” template in the editor’s template list, registered by the plugin.

Do not include any production opinions; keep everything clearly marked as example / placeholder / scaffold in docblocks and README files.

## Examples

- Add new binding placeholder: `{{binding_example}}` documented in `scripts/mustache-variables-registry.json`.
- New template part placeholder: `templates/parts/{{slug}}-cta.php` with namespaced CSS class `{{namespace}}-cta`.

## Mustache Placeholder Preservation Checklist

Before committing any changes to scaffold files, ensure:

### ✅ Core Placeholders Never Hard-coded

- [ ] `{{namespace}}` - Used for PHP namespaces, block registration, CSS classes
- [ ] `{{slug}}` - Used for post types, taxonomies, file/folder names, URLs
- [ ] `{{textdomain}}` - Used for all `__()`, `_e()`, `esc_html__()` translation functions
- [ ] `{{name}}` - Used for user-facing display names
- [ ] `{{name_plural}}`, `{{name_singular}}` - Used for CPT labels
- [ ] `{{author}}`, `{{author_uri}}`, `{{version}}`, `{{license}}` - Used in plugin headers

### ✅ Template Files Preserve Placeholders

- [ ] **Patterns** (`patterns/*.php`): All CSS classes use `{{namespace}}` and `{{slug}}`
- [ ] **Templates** (`templates/*.html`): Block references use `{{namespace}}/{{slug}}-*`
- [ ] **Template Parts** (`template-parts/*.html`): Taxonomy references use `{{slug}}_category`
- [ ] **Block render.php**: ACF field names use `{{namespace}}_field_name` format
- [ ] **Block edit.js**: CSS classes follow `wp-block-{{namespace}}-{{slug}}-*` pattern
- [ ] **Block view.js**: Selectors dynamically construct class names from block attributes

### ✅ Common Hard-coding Mistakes to Avoid

❌ **DON'T DO THIS:**
```php
// BAD: Hard-coded namespace
namespace example_plugin\classes;
$field = get_field( 'example_plugin_subtitle' );

// BAD: Hard-coded CSS class
<div className="wp-block-example_plugin-example_plugin-card">

// BAD: Hard-coded text domain
__( 'View All Tours', 'example-plugin' )
```

✅ **DO THIS:**
```php
// GOOD: Mustache placeholders
namespace {{namespace|lowerCase}}\classes;
$field = get_field( '{{namespace}}_subtitle' );

// GOOD: Dynamic placeholders
<div className="wp-block-{{namespace}}-{{slug}}-card">

// GOOD: Template placeholder
__( 'View All {{name_plural}}', '{{textdomain}}' )
```

### ✅ Validation Steps

After making changes to scaffold templates:

1. **Scan for new variables:**
   ```bash
   node scripts/scan-mustache-variables.js
   ```

2. **Validate registry integrity:**
   ```bash
   node scripts/validate-mustache-registry.js
   ```

3. **Run all linting:**
   ```bash
   npm run lint
   composer lint
   ```

4. **Generate test plugin:**
   ```bash
   node scripts/generate-plugin.js --config tests/fixtures/plugin-config.test.json
   ```

5. **Check generated output has NO unreplaced mustache variables:**
   ```bash
   grep -r "{{" generated-plugins/test-plugin/ | grep -v node_modules | grep -v build
   ```
   Should return no results (except in comments explaining the system).

### ✅ Documentation Requirements

When adding new placeholders:

- [ ] Add to `scripts/mustache-variables-registry.json` with:
  - Variable name
  - Description
  - Category (namespace, text, meta)
  - Example value
  - All files where it's used
- [ ] Update `docs/GENERATE_PLUGIN.md` if it's user-facing
- [ ] Add example to this instruction file showing correct usage
- [ ] Update `.github/agents/generate-plugin.agent.md` if it affects the generator interface

### ✅ Risk Prevention

**HIGH RISK:** These files are most likely to accidentally introduce hard-coded values:

- `src/blocks/*/edit.js` - Block editor components with CSS class strings
- `src/blocks/*/render.php` - Dynamic block rendering with ACF fields
- `patterns/*.php` - Block patterns with inline styles and classes
- `inc/class-*.php` - PHP classes with namespaces and text domains

Always verify these files after editing.
