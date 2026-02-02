# ⚠️ WARNING: Strict Mustache Placeholder Enforcement

All template files, folders, and code **must** use the correct mustache placeholders as defined in `scripts/mustache-variables-registry.json`. Do not use generic placeholders (like `{{slug}}`) where a more specific one is required (e.g., `{{cpt_slug}}`, `{{taxonomy1_slug}}`).

**Do not hard-code any plugin-specific values** in the scaffold. All identifiers, class names, translation domains, and meta keys must use the appropriate placeholder. This ensures the generator can produce multi-entity plugins without manual intervention.

The mustache registry is updated automatically by running:

```sh
node scripts/scan-mustache-variables.js --update-registry
```

If you add, rename, or remove placeholders, always update the registry and review the change report in `scripts/reports/`.

**Failure to follow these rules will break plugin generation and may result in lost work.**

---

title: Plugin Generation Guide
description: Comprehensive guide to generating WordPress multi-block plugins from the scaffold
category: Development
type: Guide
audience: Developers
date: 2025-12-05
---

This guide explains the complete plugin generation system for creating WordPress multi-block plugins with custom post types, taxonomies, and Secure Custom Fields integration.

## Overview

The Multi-Block Plugin Scaffold uses a **mustache template system** to generate customised WordPress plugins. All template files contain placeholder variables in the format `{{variable}}` that are replaced with your specific values during generation.

The scaffold includes three complementary generation methods:

1. **AI-Assisted Generation** - Interactive prompt-based workflow
2. **Agent-Based Generation** - Conversational agent specification
3. **CLI Script** - Direct command-line generation

All methods use the same **mustache template system** under the hood.

## Generator Components

The generator system consists of three main components that work together:

### 1. Generator Prompt (`.github/prompts/generate-plugin.prompt.md`)

Structured prompt template for AI-assisted plugin generation with:

- Multi-stage discovery process
- Stage-by-stage requirement gathering
- Generation command templates
- Comprehensive workflow guidance

### 2. Plugin Generator Agent (`.github/agents/generate-plugin.agent.md`)

Interactive agent specification defining:

- Conversation flow and validation rules
- Contextual help and examples
- Error handling and edge cases
- Integration with generator scripts

### 3. Generator Script (`.github/agents/generate-plugin.agent.js`)

Executable implementation that:

- Processes mustache templates
- Validates configuration schemas
- Performs file system operations
- Generates complete plugin structure
- Creates SCF field groups and block files

## Configuration Schema System

The plugin generator uses a JSON Schema-based configuration system to ensure valid, consistent plugin configurations.

### Schema Files

All schema files are stored in `.github/schemas/` directory:

- **`plugin-config.schema.json`** - JSON Schema defining all configuration options
- **`plugin-config.example.json`** - Example configuration with realistic values (kept in `scripts/fixtures/`)

### Schema Structure

The plugin configuration schema (`plugin-config.schema.json`) defines:

1. **Required Fields** - Mandatory configuration options (slug, name, author)
2. **Optional Fields** - Additional customization options
3. **Validation Rules** - Patterns, constraints, and formats
4. **Field Descriptions** - Documentation for each property
5. **Default Values** - Sensible defaults for optional fields
6. **Examples** - Sample values for guidance

### Using Configuration Files

You can provide configuration via JSON file:

```bash
# Create your configuration file
cp scripts/fixtures/plugin-config.example.json my-plugin-config.json

# Edit with your values
nano my-plugin-config.json

# Generate plugin (outputs all post types, taxonomies, and field groups as individual files in scf-json/)
node scripts/generate-plugin.js --config my-plugin-config.json
```

### Validating Configuration

Validate your configuration before generation:

```bash
# Validate configuration file
node scripts/validation/validate-plugin-config.js my-plugin-config.json

# Validate schema only
node scripts/validation/validate-plugin-config.js --schema-only
```

The validator checks:

- ✅ JSON syntax validity
- ✅ Schema compliance
- ✅ Field type validation
- ✅ WordPress compatibility
- ✅ Best practices
- ⚠️ Warnings for potential issues
- ℹ️ Suggestions for improvements

## Mustache Template System

### What are Mustache Templates?

Mustache is a logic-less template syntax that uses double curly braces `{{variable}}` as placeholders. During generation, these placeholders are replaced with actual values.

**Example:**

```php
// Template file
Plugin Name: {{name}}
Description: {{description}}
Author: {{author}}
```

```php
// After generation with values: name="Tour Operator", description="Tour booking plugin", author="LightSpeed"
Plugin Name: Tour Operator
Description: Tour booking plugin
Author: LightSpeed
```

### CRITICAL: Use Specific Placeholders for Multiple CPTs/Taxonomies/Fields

**WARNING:** When building plugins that support multiple custom post types (CPTs), taxonomies, or custom fields, you MUST use specific mustache placeholders for each entity. Do NOT use generic placeholders like `{{slug}}`, `{{cpt_slug}}`, or `{{taxonomy_slug}}` in your templates or code. Instead, use numbered or uniquely named placeholders for each entity, such as `{{cpt_slug}}`, `{{cpt2_slug}}`, `{{taxonomy1_slug}}`, `{{taxonomy2_slug}}`, `{{field1_name}}`, etc.

**Why?**

- The scaffold now supports generating plugins with multiple CPTs, taxonomies, and fields. Using generic placeholders will result in incorrect or ambiguous replacements during generation.
- Each placeholder must map to a unique entity in your plugin config (see below for config structure).
- This applies to ALL files: PHP, JS, block.json, SCF JSON, patterns, templates, and documentation.

**Example:**

```json
{
  "cpts": [
    { "slug": "tour", "name": "Tour" },
    { "slug": "package", "name": "Package" }
  ],
  "taxonomies": [
    { "slug": "destination", "name": "Destination" },
    { "slug": "feature", "name": "Feature" }
  ]
}
```

**Template usage:**

```php
// GOOD (use specific):
register_post_type( '{{cpt_slug}}', ... );

// GOOD:
register_taxonomy( '{{taxonomy_slug}}', ... );
```

**Enforcement:**

- All template files MUST use specific placeholders for each CPT, taxonomy, and field.
- The plugin config file MUST define arrays for CPTs, taxonomies, and fields, with unique keys for each.
- The generator will throw an error if generic placeholders are detected in templates.
- See [Generator Instructions](.github/instructions/generate-plugin.instructions.md) for full variable naming rules.

---

### How Mustache Values Work

#### Standard Placeholders

All files in the scaffold use consistent mustache placeholder syntax:

| Placeholder | Usage | Example Value | Where Used |
|------------|-------|---------------|------------|
| `{{slug}}` | Plugin identifier | `tour-operator` | File names, URLs, function prefixes |
| `{{name}}` | Display name | `Tour Operator` | Plugin headers, UI labels |
| `{{namespace}}` | PHP/JS namespace | `tour_operator` | Classes, constants, CSS |
| `{{textdomain}}` | i18n domain | `tour-operator` | Translation functions |
| `{{version}}` | Version number | `1.0.0` | Plugin header, package.json |
| `{{author}}` | Author name | `LightSpeed` | Plugin header, credits |
| `{{description}}` | Plugin description | `Tour booking plugin` | Plugin header, README |
| `{{license}}` | License type | `GPL-3.0-or-later` | Plugin header, composer.json |

#### Extended Placeholders

Additional placeholders for specific use cases:

| Placeholder | Purpose | Example | Auto-Generated From |
|------------|---------|---------|-------------------|
| `{{name_singular}}` | Singular CPT name | `Tour` | User input or `{{name}}` |
| `{{name_plural}}` | Plural CPT name | `Tours` | User input or `{{name}}` |
| `{{name_singular_lower}}` | Lowercase singular | `tour` | `{{name_singular}}` |
| `{{name_plural_lower}}` | Lowercase plural | `tours` | `{{name_plural}}` |
| `{{plugin_uri}}` | Plugin URL | `https://example.com/plugin` | User input |
| `{{author_uri}}` | Author URL | `https://example.com` | User input |
| `{{license_uri}}` | License URL | `https://www.gnu.org/licenses/gpl-2.0.html` | Auto-generated from `{{license}}` |
| `{{requires_wp}}` | Min WordPress | `6.5` | User input or default |
| `{{requires_php}}` | Min PHP | `8.0` | User input or default |
| `{{tested_up_to}}` | Tested WordPress | `6.7` | User input or default |

#### Filters (Transformations)

Mustache supports filters that transform values:

| Filter | Purpose | Example Input | Example Output |
|--------|---------|---------------|----------------|
| `{{namespace\|upper}}` | UPPERCASE | `tour_operator` | `TOUR_OPERATOR` |
| `{{namespace\|pascalCase}}` | PascalCase | `tour_operator` | `TourOperator` |
| `{{slug\|camelCase}}` | camelCase | `tour-operator` | `tourOperator` |

**Usage in code:**

```php
// PHP constants use UPPERCASE
define( '{{namespace|upper}}_VERSION', '{{version}}' );
// Output: define( 'TOUR_OPERATOR_VERSION', '1.0.0' );

// PHP classes use PascalCase
class {{namespace|pascalCase}}_Plugin {
// Output: class TourOperator_Plugin {
```

### Where Mustache Values Are Used

The mustache template system is used consistently across all file types in the scaffold. See [Generator Instructions](.github/instructions/generate-plugin.instructions.md) for the complete implementation reference.

#### Core PHP Files

Main plugin file `{{slug}}.php` uses placeholders for headers and constants:

```php
/**
 * Plugin Name:       {{name}}
 * Description:       {{description}}
 * Version:           {{version}}
 * Author:            {{author}}
 * Text Domain:       {{textdomain}}
 * @package {{namespace}}
 */
define( '{{namespace|upper}}_VERSION', '{{version}}' );
```

#### JavaScript/React Files

Block registration and components use namespace and textdomain:

```javascript
/**
 * @package {{namespace}}
 */
export default function PostSelector( { postType = '{{cpt_slug}}' } ) {
    return (
        <div className="{{namespace}}-post-selector">
            {__( 'Select Post', '{{textdomain}}' )}
        </div>
    );
}
```

#### CSS/SCSS Files

Styles use namespace for all class names and CSS custom properties:

```scss
:root {
    --{{namespace}}-primary-color: #333;
}

.{{namespace}}-slider {
    transition: transform var(--{{namespace}}-transition);
}
```

#### Configuration Files

JSON configuration files (`package.json`, `composer.json`, `block.json`) use placeholders:

```json
{
    "name": "{{namespace}}/{{slug}}",
    "version": "{{version}}",
    "textdomain": "{{textdomain}}"
}
```

## Operational Modes

### 🔍 CRITICAL: Choose the Right Mode

The scaffold supports two operational modes depending on **where you're running it**:

#### Generator Mode (Default) - For Scaffold Repository

**Use when**: You are working in the `lightspeedwp/multi-block-plugin-scaffold` repository itself.

**Scenario:**

- You cloned or are contributing to the scaffold repository
- You want to test plugin generation
- You want to create multiple different plugins
- You're experimenting with configurations

**Behavior:**

- Creates new plugin in `output-plugin/` or `generated-plugins/<slug>/`
- Leaves scaffold directory completely unchanged
- Output folders are excluded via `.gitignore`
- Can generate multiple plugins safely
- No confirmation needed (non-destructive)

**Command:**

```bash
node scripts/generate-plugin.js --config my-config.json
```

**Workflow:**

1. Clone the scaffold repository
2. Create your plugin configuration file
3. Run generator (default mode, no flags)
4. Find generated plugin in `output-plugin/` or `generated-plugins/<slug>/`
5. Manually move/copy the plugin to your WordPress installation
6. Scaffold remains pristine for next generation

**Output Location:**

```
multi-block-plugin-scaffold/
├── ... (scaffold files unchanged)
└── output-plugin/              ← Generated plugin here (gitignored)
    ├── tour-operator.php
    ├── package.json
    └── ...
```

---

#### Template Mode (`--in-place`) - For New Repository

**Use when**: You created a NEW repository from the scaffold template.

**Scenario:**

- You used "Use this template" on GitHub to create `yourname/my-plugin`
- You cloned your new repository
- You want to transform the scaffold INTO your actual plugin
- You're creating ONE plugin from the template

**Behavior:**

- Processes files IN-PLACE in current directory
- Replaces ALL `{{mustache}}` variables throughout codebase
- Renames files and folders to match your slug
- **⚠️ PERMANENT CHANGE**: Cannot be undone without Git
- Requires user confirmation (y/N prompt)
- Transforms scaffold into your plugin

**Command:**

```bash
node scripts/generate-plugin.js --config my-config.json --in-place
```

**Workflow:**

1. Create new repository from scaffold template on GitHub
2. Clone YOUR new repository
3. Create your plugin configuration file
4. Run generator with `--in-place` flag
5. Confirm the destructive operation (y/N)
6. Scaffold is transformed into your plugin
7. Commit and push to YOUR repository

**Before:**

```
my-awesome-plugin/              ← Your new repo
├── {{slug}}.php                ← Mustache variables everywhere
├── inc/
│   └── class-{{namespace}}.php
└── ...
```

**After:**

```
my-awesome-plugin/              ← Same repo, transformed
├── my-awesome-plugin.php       ← All variables replaced
├── inc/
│   └── class-my-awesome-plugin.php
└── ...
```

---

### How to Choose the Right Mode

**Ask yourself:**

1. **What repository am I in?**

   ```bash
   git remote get-url origin
   ```

   - If shows `lightspeedwp/multi-block-plugin-scaffold` → Use **Generator Mode** (default)
   - If shows your own repo (e.g., `yourname/my-plugin`) → Use **Template Mode** (`--in-place`)

2. **What's my goal?**
   - Test/experiment with scaffold → **Generator Mode**
   - Create ONE plugin for production → **Template Mode**
   - Create multiple different plugins → **Generator Mode**

3. **Can I commit the output?**
   - Output folder in `.gitignore` → **Generator Mode**
   - Want to commit transformed plugin → **Template Mode**

## Generation Methods

### Method 1: Template Mode (In-Place Processing)

Use the scaffold as a GitHub template and process it directly:

```bash
# Interactive mode with confirmation
node scripts/generate-plugin.js --in-place

# With configuration file
node scripts/generate-plugin.js --in-place --config plugin-config.json

# Skip confirmation (automation only - use with caution)
node scripts/generate-plugin.js --in-place --yes
```

**Process:**

1. Prompts for plugin configuration (or reads from config file)
2. **Displays confirmation warning** about in-place modification
3. Waits for user confirmation (y/N)
4. Processes all files in the scaffold directory
5. Replaces mustache variables throughout
6. Renames files/directories to match your slug
7. Reports completion with next steps

**⚠️ Important Notes:**

- Always use on a fresh clone or template repository
- Cannot be undone without version control
- Confirmation prompt defaults to "No" for safety
- Use `--yes` flag only in automated workflows you trust

### Method 2: Generator Mode (Default)

Create a new plugin in a separate output directory:

```bash
# Interactive mode - prompts for all configuration
node scripts/generate-plugin.js

# With configuration file
node scripts/generate-plugin.js --config plugin-config.json

# With inline arguments
node scripts/generate-plugin.js \
  --slug tour-operator \
  --name "Tour Operator" \
  --description "Tour booking and display plugin" \
  --author "LightSpeed" \
  --author-uri "https://developer.lsdev.biz"
```

**Process:**

1. Reads configuration from prompts, file, or arguments
2. Validates configuration against schema
3. Creates `generated-plugins/<slug>/` directory
4. Copies and processes all scaffold files
5. Replaces mustache variables
6. Renames files/directories
7. Leaves scaffold directory unchanged

**Output Location:**

```bash
generated-plugins/
└── tour-operator/        # Your generated plugin
    ├── tour-operator.php
    ├── package.json
    ├── composer.json
    └── ... (complete plugin structure)
```

**Best for:**

- Creating multiple plugins from the same scaffold
- Keeping scaffold repository clean
- Testing different configurations
- CI/CD pipelines
- Advanced users comfortable with CLI tools

### Method 3: AI-Assisted Generation (Recommended)

Use the workspace prompt for an interactive, guided experience:

```text
@workspace /generate-plugin
```

**Process:**

1. The AI assistant loads the generation prompt template
2. Guides you through 7 discovery stages
3. Collects all required information interactively
4. Validates input at each stage
5. Confirms configuration before generation
6. Generates the complete plugin structure (uses generator mode by default)
7. Provides post-generation setup instructions

**Benefits:**

- Interactive question-and-answer flow
- Contextual help and examples
- Validation at each step
- Smart defaults for common configurations
- Best for first-time users
- Can use either template or generator mode

**Stages:**

1. **Plugin Identity** - Name, slug, description, author
2. **Custom Post Type** - CPT configuration and features
3. **Taxonomies** - Category and tag structures
4. **Custom Fields** - SCF field group definitions
5. **Blocks** - Which blocks to generate
6. **Templates & Patterns** - Template and pattern selection
7. **Version & Compatibility** - WordPress/PHP requirements

### Method 4: Agent-Based Generation

Request the scaffold generator agent directly:

```text
Generate a new multi-block plugin from scaffold
```

Or be more specific:

```text
Create a tour operator plugin with tours CPT, destination taxonomy, and booking fields
```

**Features:**

- Conversational interface
- Can infer requirements from description
- Validates configuration automatically
- Follows agent specification in `.github/agents/generate-plugin.agent.md`
- Best for experienced users who know their requirements

### Method 5: Agent-Driven Workflow

For advanced users and automated workflows, the scaffold supports direct agent interaction through the GitHub Copilot coding agent:

```text
#github-pull-request_copilot-coding-agent
Generate a complete tour operator plugin with:
- Tours custom post type
- Destination taxonomy
- Booking fields using core APIs
- Collection and slider blocks
- Archive and single templates
```

**Agent-Driven Process:**

1. **Request Analysis** - Agent analyzes requirements and maps to scaffold capabilities
2. **Configuration Generation** - Creates plugin-config.json with all settings
3. **Validation** - Runs schema validation and compatibility checks
4. **Generation** - Executes plugin generation with full logging
5. **Branch Creation** - Creates feature branch for the new plugin
6. **Pull Request** - Opens PR with generated plugin for review
7. **Post-Generation Setup** - Provides installation and development instructions

**Benefits:**

- **Full Automation** - Complete plugin generation without manual steps
- **Quality Assurance** - Built-in validation and testing
- **Version Control** - Automatic branching and PR creation
- **Documentation** - Comprehensive commit messages and PR descriptions
- **Integration** - Works with existing CI/CD pipelines

**Supported Agent Commands:**

```text
#github-pull-request_copilot-coding-agent
Create a [plugin-type] plugin with [features]
Generate [specific-plugin] using scaffold
Build plugin for [use-case] with [requirements]
```

**Example Requests:**

```text
#github-pull-request_copilot-coding-agent
Create a portfolio plugin with projects CPT, skills taxonomy, and gallery blocks
```

```text
#github-pull-request_copilot-coding-agent
Generate an events plugin with event CPT, venue taxonomy, and calendar blocks using core APIs only
```

### Method 6: CLI Script

Run the generator script directly from the command line:

```bash
node scripts/generate-plugin.js
```

**Interactive Mode:**

```bash
# Prompts for all required information
node scripts/generate-plugin.js
```

**Configuration File Mode** (Recommended):

```bash
# Start with example configuration
cp scripts/fixtures/plugin-config.example.json my-plugin.json

# Edit your configuration
nano my-plugin.json

# Validate configuration
node scripts/validation/validate-plugin-config.js my-plugin.json

# Generate plugin
node scripts/generate-plugin.js --config my-plugin.json
```

## Post-Generation Workflow

### 1. Review Generated Files

```bash
cd output-plugin/
tree -L 2
```

Expected structure:

```text
tour-operator/
├── tour-operator.php         # Main plugin file (slug-based name)
├── package.json              # Node dependencies
├── composer.json             # PHP dependencies
├── inc/                      # PHP classes
├── src/                      # Source files
│   ├── blocks/               # Block implementations
│   ├── components/           # Shared React components
│   ├── hooks/                # Custom React hooks
│   └── scss/                 # Stylesheets
├── patterns/                 # Block patterns
└── scf-json/                 # SCF field groups
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Composer dependencies
composer install
```

### 3. Build the Plugin

```bash
# Development build with watch mode
npm run start

# Production build
npm run build
```

### 4. Configure Field Groups

Edit generated SCF field group files in `scf-json/`:

```bash
# Example field group
scf-json/group_tour_operator_details.json
```

Add custom fields following the [SCF Fields Reference](.github/instructions/scf-fields.instructions.md).

### 5. Run Tests

```bash
# All tests
npm run test

# JavaScript unit tests
npm run test:unit

# PHP tests
composer run test

# E2E tests
npm run test:e2e
```

### 6. Run Linting

```bash
# All linters
npm run lint

# JavaScript
npm run lint:js

# CSS/SCSS
npm run lint:css

# PHP
composer run lint
```

### 7. Start Development Environment

```bash
# Start wp-env
npm run env:start

# Plugin is automatically activated
# Access at http://localhost:8888
```

### 8. Prepare for Release (Generated Plugins Only)

**⚠️ This step applies ONLY to plugins generated in a NEW repository (not the scaffold itself).**

After generating your plugin and setting up development, you'll eventually want to release it. The generated plugin includes a complete release workflow with the `release.agent.md` file (with all `{{mustache}}` placeholders already replaced).

#### When to Use the Release Agent

Use the release agent when you're ready to:

- Create your first release (v1.0.0)
- Prepare subsequent releases (bug fixes, features, breaking changes)
- Validate release readiness before tagging

#### Release Preparation Steps

1. **Verify all mustache placeholders were replaced during generation**:

   ```bash
   # Should return no results
   grep -r "{{" . --exclude-dir={node_modules,vendor,generated-plugins}
   ```

2. **Run the release validation**:

   ```bash
   # Full validation suite
   npm run release:validate

   # Quick status check
   npm run release:status
   ```

3. **Follow the release process**:

   - See [docs/RELEASE_PROCESS.md](RELEASE_PROCESS.md) in your generated plugin
   - The release agent (`.github/agents/release.agent.md`) provides automated validation
   - Use Git Flow for release branches (develop → release/X.Y.Z → main)

#### Key Differences: Scaffold vs Generated Plugin Releases

| Aspect | Scaffold Release | Generated Plugin Release |
|--------|------------------|--------------------------|
| **File to Follow** | `RELEASE_PROCESS_SCAFFOLD.md` | `RELEASE_PROCESS.md` |
| **Release Agent** | `release-scaffold.agent.md` | `release.agent.md` |
| **Mustache Variables** | ✅ Must be preserved | ❌ Should be replaced |
| **Version Files** | `VERSION`, `package.json`, `composer.json` | `VERSION`, `package.json`, `composer.json`, plugin header |
| **Testing** | Dry-run mode, generator validation | Full test suite, build validation |

#### Scaffold-Specific Files Removed During Generation

The generator automatically removes these scaffold-specific files from your new plugin:

- `.github/agents/release-scaffold.agent.md` ❌ (removed)
- `docs/RELEASE_PROCESS_SCAFFOLD.md` ❌ (removed)
- `scripts/generate-plugin.js` ❌ (removed)
- All mustache template infrastructure ❌ (removed)

Your generated plugin retains:

- `.github/agents/release.agent.md` ✅ (with placeholders replaced)
- `docs/RELEASE_PROCESS.md` ✅ (with placeholders replaced)
- Complete release workflow and validation ✅

#### Example Release Workflow

```bash
# 1. Ensure you're in your GENERATED plugin repo (not the scaffold)
cd my-awesome-plugin/

# 2. Update version files
# Edit VERSION, package.json, composer.json, plugin header

# 3. Validate release readiness
npm run release:validate

# 4. Create release branch
git checkout -b release/1.0.0

# 5. Commit version updates
git commit -am "chore: prepare release v1.0.0"

# 6. Follow RELEASE_PROCESS.md for merge and tagging
```

**⚠️ Important**: Never run the release agent from the scaffold repository on a generated plugin, or vice versa. Each has its own release workflow designed for its specific context.

## Build Scripts

### `bin/build.js`

Main build script coordinating webpack and asset compilation:

```bash
npm run build
```

### `bin/update-version.js`

Updates version across all files:

```bash
node scripts/update-version.js 1.2.0
```

Updates: `package.json`, `composer.json`, main plugin file, all `block.json` files, README.md

## Complete Mustache Variable Reference

### Core Variables (Always Required)

```javascript
{
  "slug": "tour-operator",              // URL-safe identifier
  "name": "Tour Operator",              // Human-readable name
  "namespace": "tour_operator",         // PHP/JS namespace (auto-generated)
  "textdomain": "tour-operator",        // i18n domain (auto-generated)
  "description": "Tour booking plugin", // One-line description
  "author": "LightSpeed",               // Author/org name
  "author_uri": "https://lsdev.biz",    // Author website
  "version": "1.0.0"                    // Semantic version
}
```

### Plugin Metadata Variables

```javascript
{
  "plugin_uri": "https://example.com/plugins/tour-operator",
  "license": "GPL-2.0-or-later",
  "license_uri": "https://www.gnu.org/licenses/gpl-2.0.html",
  "requires_wp": "6.5",
  "tested_up_to": "6.7",
  "requires_php": "8.0"
}
```

### Custom Post Type Variables

```javascript
{
  "name_singular": "Tour",
  "name_plural": "Tours",
  "name_singular_lower": "tour",
  "name_plural_lower": "tours",
  "cpt_slug": "tour",
  "cpt_icon": "dashicons-palmtree",
  "cpt_supports": ["title", "editor", "thumbnail"]
}
```

### Taxonomy Variables

```javascript
{
  "taxonomy_singular": "Destination",
  "taxonomy_plural": "Destinations",
  "taxonomy_slug": "destination"
}
```

## Logging & Debugging

### Log Files

Every plugin generation creates a detailed JSON log file:

**Location:** `logs/generate-plugin-{{slug}}.log`

**Format:** JSON array of log entries

**Example:**

```json
[
  {
    "timestamp": "2025-12-12T10:30:00.000Z",
    "level": "INFO",
    "message": "Plugin generator starting",
    "data": {
      "nodeVersion": "v20.10.0",
      "mode": "generator"
    }
  },
  {
    "timestamp": "2025-12-12T10:30:01.000Z",
    "level": "INFO",
    "message": "Configuration validated successfully",
    "data": {
      "slug": "tour-operator",
      "name": "Tour Operator",
      "version": "1.0.0"
    }
  }
]
```

### What Gets Logged

- **Configuration**: All config values used for generation
- **Validation**: Schema validation results and errors
- **File Operations**: Files created, modified, or copied
- **Errors**: Detailed error messages with stack traces
- **Completion**: Final status and output directory

### Viewing Logs

**Pretty print with jq:**

```bash
cat logs/generate-plugin-tour-operator.log | jq '.'
```

**Filter by level:**

```bash
cat logs/generate-plugin-tour-operator.log | jq '.[] | select(.level=="ERROR")'
```

**Get last entry:**

```bash
cat logs/generate-plugin-tour-operator.log | jq '.[-1]'
```

### Log Management

- **Per-project**: Each plugin slug gets its own log file
- **Appending**: New runs add to existing log
- **Location**: All logs in `logs/` directory (git-ignored)
- **Cleanup**: Manually remove old logs as needed

---

## Troubleshooting

### Using Log Files for Debugging

When troubleshooting issues, always check the log file first:

```bash
# Check if generation completed
cat logs/generate-plugin-my-plugin.log | jq '.[] | select(.message | contains("completed"))'

# Find errors
cat logs/generate-plugin-my-plugin.log | jq '.[] | select(.level=="ERROR")'

# See what files were processed
cat logs/generate-plugin-my-plugin.log | jq '.[] | select(.message | contains("file"))'
```

### Common Issues

**Validation Errors:**

- Slug format: Use `my-plugin-name` (lowercase, hyphens only)
- Version format: Use `1.0.0` (major.minor.patch)
- Check log file for detailed validation errors

**Generation Errors:**

- Template not found: Run from scaffold directory
- Directory exists: Remove `generated-plugins/<slug>/` or use `--force`
- Check log file for stack traces

**Build Errors:**

- Node.js version: Use Node.js 18+ or run `nvm use`
- Webpack errors: Run `npm install` again

**SCF Field Errors:**

- Invalid JSON: Validate syntax and field types
- Duplicate keys: Ensure all field keys are unique

## Best Practices

### Naming Conventions

- **Plugin Slug:** Lowercase, hyphens, under 50 chars (`tour-operator`)
- **CPT Slug:** Max 20 chars, singular (`tour` not `tours`)
- **Namespace:** Auto-generated, underscores (`tour_operator`)
- **Text Domain:** Matches slug (`tour-operator`)

### Field Naming

- **Field Keys:** Prefix with slug (`tour_operator_subtitle`)
- **Field Labels:** Human-readable, title case ("Subtitle", "Price per Person")

## Secure Custom Fields (SCF) Integration

The scaffold supports Secure Custom Fields (SCF) as a **secondary option** for complex custom field requirements that cannot be met with WordPress core APIs. **Always prefer WordPress core APIs first** - SCF should only be used when core functionality is insufficient for your use case.

### When to Use SCF

SCF is justified when you need:

- **Complex field relationships** (repeaters, flexible content)
- **Advanced field types** (date/time pickers, color pickers, maps)
- **Conditional logic** between fields
- **Custom validation rules** beyond WordPress core
- **Rich media management** (galleries, file uploads with restrictions)

**Avoid SCF for:**

- Simple text/number fields (use core post meta APIs)
- Basic taxonomy relationships (use core taxonomy APIs)
- Standard content fields (use core editor features)

### Field Types Supported

SCF provides these advanced field types when core APIs are insufficient:

- **Text** - text, textarea, wysiwyg, email, url, password
- **Content** - image, file, gallery, oembed
- **Choice** - select, checkbox, radio, button_group, true_false
- **Relational** - link, post_object, relationship, taxonomy, user
- **jQuery** - google_map, date_picker, date_time_picker, time_picker, color_picker
- **Layout** - message, accordion, tab, group, repeater, flexible_content

### Field Group Management

When SCF is required, the scaffold provides:

- **Local JSON** - Field groups stored in `scf-json/` directory
- **Schema Validation** - JSON Schema validation for all field groups
- **Options Pages** - Automatic options page registration
- **Block Bindings** - Integration with WordPress 6.5+ Block Bindings API

### Example Field Groups

Generate example field groups demonstrating SCF field types (use only when core APIs insufficient):

```bash
node scripts/generate-plugin.js --with-example-fields
```

See [SCF Fields Reference](.github/instructions/scf-fields.instructions.md) for complete documentation.

### SCF JSON Handling & Validation

All Secure Custom Fields configurations are driven by JSON stored in `scf-json/`. The generator copies the sample files, and new group files are expected to follow the `group_{{slug}}_*.json` pattern so field definitions remain version-controlled and repeatable.

- **Local JSON integration** is performed by `inc/class-scf-json.php`, which hooks `acf/settings/save_json` and `acf/settings/load_json` so SCF always loads field groups from `scf-json/` and saves exports back there. This class also lazily creates the directory during bootstrap, keeping the path consistent across environments.
- **Schema validation** is provided by `inc/class-scf-json-validator.php`, which reads `scf-json/schema/scf-field-group.schema.json` and validates each JSON file before registration. Validation results include errors and warnings that agents can surface for faster fixes.
- **Recommended workflow**: author SCF groups in JSON, commit the files alongside your plugin, and run `vendor/bin/phpunit tests/php/test-scf-json-schema-validation.php` (or `composer run test`) to confirm the schema passes. Refer to the schema file when adding complex repeaters, flexible content, or conditional logic so your data stays compatible with the generator.

Because these classes are instantiated from `inc/class-core.php`, once the plugin is active all JSON files are immediately available without manual imports. Keep SCF usage targeted to cases where WordPress core APIs cannot deliver the required UI or validation, and rely on the JSON validator plus `.github/prompts/block-plugin-refactor-alt.prompt.md` when you need Phase 6-style reviews of new groups.

## Custom Post Types & Taxonomies

### Supported CPT Features

The generator supports all standard WordPress CPT features:

- title, editor, author, thumbnail, excerpt
- trackbacks, custom-fields, comments, revisions
- page-attributes, post-formats

### Taxonomy Types

- **Hierarchical** - Like categories (parent/child structure)
- **Non-hierarchical** - Like tags (flat list)

### Automatic Registration

Custom post types and taxonomies are automatically registered via:

- `inc/class-post-types.php` - CPT registration
- `inc/class-taxonomies.php` - Taxonomy registration
- `inc/class-block-templates.php` - Block template assignments

## Block Categories

The generator supports these block categories:

- `text` - Text-based blocks (paragraphs, headings, lists)
- `media` - Media blocks (images, videos, audio)
- `design` - Design and layout blocks
- `widgets` - Widget-style blocks (search, categories, tags)
- `theme` - Theme-specific blocks (site logo, navigation)
- `embed` - Embed blocks for external content

## Block Styles Library

Block styles are defined entirely via JSON so new variations remain editable and versioned. The bootstrap class `inc/class-block-styles.php` scans the `styles/` folder for JSON definitions, and registers each style via `register_block_style()` automatically on `init`.

Current directories:

- `styles/blocks/` – Block-specific variations such as `button-primary.json`, `button-rounded.json`, and `heading-serif.json`.
- `styles/sections/` – Section-level wrappers and hero/feature skinning (`content-section.json`, `hero-section.json`).
- `styles/typography/` – Typography token sets (e.g. serif headings).
- `styles/colors/` – Named colour palettes (`palette.json`, `dark.json`).
- `styles/presets/` – Global presets for modes such as dark/light theming.

Each JSON file exposes `scope`, `blocks`, `name`, `label`, and `style_data` (or token definitions) so the loader can register the style and keep the logic outside PHP. When generating a plugin, update or add JSON files as needed rather than hard-coding styles in `inc/class-block-styles.php`.

## Development Workflow Integration

### Pre-Commit Hooks

The generator integrates with Husky pre-commit hooks:

1. **Generation** - Use any generation method
2. **Customisation** - Modify generated files
3. **Validation** - Automatic linting and tests
4. **Commit** - Hooks validate before commit

### Linting Standards

Generated plugins follow all LightSpeed coding standards:

- **ESLint** - JavaScript/JSX with WordPress rules
- **Prettier** - Code formatting
- **PHPCS** - PHP WordPress coding standards
- **Stylelint** - CSS/SCSS linting
- **PHPStan** - PHP static analysis

### Development Assistant

Works alongside the [Development Assistant](.github/agents/development-assistant.agent.md):

- **Generator** creates initial structure
- **Assistant** helps with ongoing development:
  - Code review and suggestions
  - Block development
  - Custom post type management
  - Field group configuration
  - Testing strategies

## Configuration Schemas

The generator validates all configuration:

### Plugin Schema

```javascript
{
  name: String,           // Required
  slug: String,           // Required (kebab-case)
  description: String,
  author: String,
  authorUri: String,
  version: String,        // Semver (e.g., 1.0.0)
  textdomain: String,     // Auto-generated from slug
}
```

### Block Schema

```javascript
{
  title: String,          // Required
  slug: String,           // Required
  description: String,
  category: String,       // text, media, design, widgets, theme, embed
  icon: String,           // Dashicon name
  keywords: Array,
  attributes: Object,
  supports: Object,
}
```

### Custom Post Type Schema

```javascript
{
  name: String,           // Required
  slug: String,           // Required (max 20 chars)
  singular: String,
  plural: String,
  public: Boolean,
  has_archive: Boolean,
  supports: Array,        // title, editor, thumbnail, etc.
  taxonomies: Array,
}
```

### Taxonomy Schema

```javascript
{
  name: String,           // Required
  slug: String,           // Required
  singular: String,
  plural: String,
  hierarchical: Boolean,  // true=categories, false=tags
  post_types: Array,
}
```

### Field Group Schema

```javascript
{
  title: String,          // Required
  key: String,            // Required (unique)
  fields: Array,          // Field definitions
  location: Array,        // Location rules
}
```

## Error Handling

Comprehensive error handling for:

- **Validation Errors** - Invalid input caught early with helpful messages
- **File System Errors** - Prevents overwriting existing projects
- **Template Errors** - Validates mustache templates before processing
- **Configuration Errors** - Ensures all required settings provided
- **Schema Errors** - Validates CPT, taxonomy, and field schemas
- **JSON Errors** - Validates all JSON files before writing

## Testing

The generator system includes tests:

```bash
# All tests
npm run test

# Generator-specific tests
npm run test:agents

# Validate generated plugin
cd output-plugin
npm run lint
npm run test
```

## Configuration Schema Reference

The complete schema documentation is available in `.github/schemas/plugin-config.schema.json`.

### Three-Array Structure (Recommended)

As of version 1.1.0, the plugin generator supports a new three-array structure that separates concerns and enables better reusability:

**Benefits:**

- **Separation of Concerns**: Post types, taxonomies, and fields are defined in dedicated top-level arrays
- **Reusability**: Taxonomies can be shared across multiple post types without duplication
- **Maintainability**: Easier to update taxonomy or field definitions in one place
- **Clarity**: Explicit relationships via slug references instead of nested objects
- **Scalability**: Better suited for plugins with many post types and shared taxonomies

**Structure Overview:**

```json
{
  "post_types": [/* Array of post type definitions */],
  "taxonomies": [/* Array of taxonomy definitions */],
  "fields": [/* Array of field group definitions */]
}
```

**Key Differences from Legacy Format:**

| Aspect | New Format | Legacy Format |
|--------|-----------|---------------|
| **Taxonomies** | Top-level array with `post_types` property | Embedded in each post type |
| **Fields** | Top-level array with `post_type` + `field_group` | Embedded in each post type |
| **References** | Post types reference taxonomies by slug | Taxonomies duplicated in each post type |
| **Sharing** | Easy - one taxonomy, many post types | Hard - must duplicate taxonomy definition |

### Key Configuration Sections

### Core Configuration

```json
{
  "slug": "plugin-name",              // Required: URL-safe identifier
  "name": "Plugin Name",              // Required: Display name
  "author": "Your Name",              // Required: Author name
  "description": "Plugin description", // Optional: Brief description
  "version": "1.0.0",                 // Optional: Starting version
  "namespace": "plugin_name",         // Auto-generated from slug
  "textdomain": "plugin-name"         // Auto-generated from slug
}
```

### Post Types Configuration (New Format)

The plugin now supports a three-array structure for better organization and reusability:

```json
{
  "post_types": [
    {
      "slug": "item",                   // Max 20 chars
      "singular": "Item",               // Display name singular
      "plural": "Items",                // Display name plural
      "supports": [                     // CPT features
        "title",
        "editor",
        "thumbnail"
      ],
      "has_archive": true,              // Enable archive page
      "public": true,                   // Publicly queryable
      "menu_icon": "dashicons-admin-post",
      "taxonomies": [                   // Array of taxonomy slugs (references taxonomies array)
        "category",
        "tag"
      ]
    }
  ]
}
```

### Taxonomies Configuration (New Format)

Taxonomies are now defined in a separate top-level array for better reusability across post types:

```json
{
  "taxonomies": [
    {
      "slug": "category",               // Taxonomy slug
      "singular": "Category",           // Display name singular
      "plural": "Categories",           // Display name plural
      "hierarchical": true,             // true=categories, false=tags
      "post_types": [                   // Array of post type slugs
        "item",
        "portfolio"
      ]
    },
    {
      "slug": "tag",
      "singular": "Tag",
      "plural": "Tags",
      "hierarchical": false,
      "post_types": ["item"]
    }
  ]
}
```

### Fields Configuration (New Format)

Fields are now organized by post type in a top-level array:

```json
{
  "fields": [
    {
      "post_type": "item",              // Post type slug
      "field_group": [                  // Array of field definitions
        {
          "name": "price",              // Field key
          "label": "Price",             // Display label
          "type": "number",             // SCF field type
          "required": true,
          "instructions": "Enter price",
          "min": 0,
          "max": 10000
        },
        {
          "name": "description",
          "label": "Description",
          "type": "textarea",
          "required": false
        }
      ]
    }
  ]
}
```

### Legacy Format Support

The generator maintains backward compatibility with the old embedded format:

```json
{
  "post_types": [
    {
      "slug": "item",
      "singular": "Item",
      "plural": "Items",
      "taxonomies": [                   // Old format: embedded taxonomy objects
        {
          "slug": "category",
          "singular": "Category",
          "plural": "Categories",
          "hierarchical": true
        }
      ],
      "fields": [                       // Old format: embedded fields array
        {
          "name": "price",
          "label": "Price",
          "type": "number"
        }
      ]
    }
  ]
}
```

**Note:** Legacy embedded format is automatically converted to the new three-array structure during generation. The generator:

1. Extracts embedded taxonomies and fields from each post type
2. Deduplicates taxonomies (same slug = same taxonomy)
3. Creates top-level `taxonomies` and `fields` arrays
4. Replaces embedded arrays with slug references
5. Maintains full backward compatibility

You can mix formats, but using the new structure is recommended for new plugins.

### Custom Post Type Configuration (Legacy)

```json
{
  "cpt_slug": "item",                 // Max 20 chars
  "cpt_supports": [                    // CPT features
    "title",
    "editor",
    "thumbnail"
  ],
  "cpt_has_archive": true,             // Enable archive page
  "cpt_menu_icon": "dashicons-admin-post"
}
```

### Taxonomies Configuration

```json
{
  "taxonomies": [
    {
      "slug": "category",
      "singular": "Category",
      "plural": "Categories",
      "hierarchical": true            // Categories vs tags
    }
  ]
}
```

### Fields Configuration (SCF)

```json
{
  "fields": [
    {
      "name": "price",
      "label": "Price",
      "type": "number",
      "required": false,
      "instructions": "Enter the price"
    }
  ]
}
```

### Blocks Configuration

```json
{
  "blocks": ["collection", "slider"],
  "templates": ["single", "archive"]
}
```

For complete schema details, see:

- `.github/schemas/plugin-config.schema.json` - Full schema definition
- `scripts/fixtures/plugin-config.example.json` - Working example

## Related Documentation

- **[README.md](./README.md)** - Documentation index
- **[../.github/instructions/generate-plugin.instructions.md](../.github/instructions/generate-plugin.instructions.md)** - Mustache template rules
- **[../.github/instructions/schema-files.instructions.md](../.github/instructions/schema-files.instructions.md)** - Schema file standards
- **[../.github/instructions/scf-fields.instructions.md](../.github/instructions/scf-fields.instructions.md)** - SCF field types
- [Generator Instructions](.github/instructions/generate-plugin.instructions.md) - Rules for using mustache values
- [Plugin Generator Agent](.github/agents/generate-plugin.agent.md) - Agent specification
- [Generation Prompt](.github/prompts/generate-plugin.prompt.md) - Interactive prompt template
- [SCF Fields Reference](.github/instructions/scf-fields.instructions.md) - Field types and usage
- [Build Process](BUILD-PROCESS.md) - Detailed build documentation
- [API Reference](API-REFERENCE.md) - PHP and JavaScript APIs

## CLI Reference

WordPress Multi-Block Plugin Generator

Usage:
  node generate-plugin.js [options]

Modes:
  Interactive    No arguments - step-by-step wizard
  JSON File      --config <file> - load configuration from JSON file
  JSON Stdin     --json or pipe - read JSON from stdin
  Validate       --validate [file] - validate configuration without generating
  Schema         --schema - display JSON schema
  Help           --help - show this message

Options:
  -c, --config <file>    Load configuration from JSON file
  -o, --output <dir>     Output directory (default: ./generated-plugins)
  -f, --force            Overwrite existing output directory
  -v, --verbose          Verbose output
  --dry-run              Dry run (don't write files)
  --validate [file]      Validate configuration
  --schema               Display JSON schema
  --help                 Show this help message

Examples:

# Interactive mode

  node generate-plugin.js

# With config file

  node generate-plugin.js --config my-plugin.json

# From stdin

  echo '{"slug":"my-plugin","name":"My Plugin"}' | node generate-plugin.js --json

# Validate configuration

  node generate-plugin.js --validate my-plugin.json

# Display schema

  node generate-plugin.js --schema

For more information, see: docs/GENERATE_PLUGIN.md

## Support

For issues or questions:

1. Check this documentation
2. Review [SUPPORT.md](../SUPPORT.md)
3. Check [CONTRIBUTING.md](../CONTRIBUTING.md)
4. Open an issue on GitHub
