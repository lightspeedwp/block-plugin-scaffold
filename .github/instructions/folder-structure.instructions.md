---
name: Folder Structure Instructions
description: Repository folder organization and file placement rules
applyTo: '**'
references:
  - ../custom-instructions.md
---

# Folder Structure Instructions

You are a repository layout steward. Follow our multi-block plugin scaffold conventions to place assets, code, and generated files correctly. Avoid inventing new top-level directories or scattering build artefacts outside the prescribed structure.

## Overview

Use this guide when creating, moving, or auditing files. It covers where to place source, tests, docs, generated assets, and automation in the multi-block plugin scaffold. It does not replace coding standards or release processes.

## General Rules

- Edit source in `src/` and PHP in `inc/`; never hand-edit `build/`.
- Keep generated artefacts out of version control except what ships in releases.
- Reuse existing directories; avoid inventing new top-level folders without approval.
- Store docs in `docs/` with frontmatter; keep temporary artefacts in `tmp/` (ignored).
- Align placement with `.distignore`, build scripts, and generator expectations.

## Detailed Guidance

## Core Principle

**Every file has a designated place based on its purpose and lifecycle.**

## Primary Directories

### Source Code

**`src/`** - Uncompiled source files

- Block implementations
- React components
- Custom hooks
- SCSS stylesheets
- Utility functions
- **Compiled to**: `build/` during build
- **Shipped**: No (excluded via `.distignore`)

**`inc/`** - PHP classes and includes

- Custom post types
- Taxonomies
- Field registrations
- Block bindings
- Options pages
- **Shipped**: Yes
- **Naming**: `class-{feature}.php`

### Distribution Files

**`patterns/`** - Block patterns

- PHP pattern files
- **Naming**: `{{slug}}-{pattern-name}.php`
- **Shipped**: Yes

**`templates/`** - Block templates

- HTML block templates
- **Naming**: `{type}-{{slug}}.html`
- **Shipped**: Yes

**`parts/`** - Template parts

- Reusable template components
- **Naming**: `{{slug}}-{part-name}.html`
- **Shipped**: Yes

**`scf-json/`** - SCF field groups

- JSON field definitions
- **Naming**: `group_{{slug}}_{feature}.json`
- **Shipped**: Yes

**`styles/`** - Block style library

- Subfolders: `blocks/`, `sections/`, `colors/`, `typography/`, `presets/`
- Each JSON file exports style metadata (`scope`, `blocks`, `name`, `label`, `style_data`)
- Used by `inc/class-block-styles.php` to auto-register block variations
- **Shipped**: Yes

**`generated-plugins/`** - Sample generator output

- Each subdirectory (e.g., `tour-operator/`) is a generated plugin snapshot used for testing and documentation.
- Regenerate with `node scripts/generate-plugin.js` if the scaffold changes.
- Keep these folders in `.gitignore` and do not edit them manually unless updating generated examples.

### Build & Development

### Build & Development

**`bin/`** - Shell scripts and entry points

- Shell scripts (`.sh` files only)
- WordPress test environment setup
- **Shipped**: No
- **Executable**: Yes (`chmod +x`)
- **Note**: JavaScript build scripts go in `scripts/`, not here

**`scripts/`** - Node.js build and utility scripts

- JavaScript build and automation scripts
- Configuration and validation scripts
- **Examples**: `build.js`, `update-version.js`, `validate-plugin-config.js`, `dry-run-config.js`
- **Shipped**: No
- **Executable**: Yes (`chmod +x` for scripts meant to run directly)

**`tests/`** - Test files

- Unit tests
- Integration tests
- E2E tests
- Test fixtures
- **Shipped**: No
- **Structure**: Mirrors `src/` and `inc/`

**`docs/`** - Documentation

- Developer guides
- API references
- Architecture docs
- Governance documents
- **Shipped**: No (excluded via `.distignore`)
- **Format**: Markdown with frontmatter

### Infrastructure

**`.github/`** - GitHub configuration

- `agents/` - AI agent specs and implementations
- `instructions/` - AI/Copilot rules
- `prompts/` - AI prompt templates
- `workflows/` - GitHub Actions CI/CD
- `projects/` - Planning outcomes (active/completed/plans folders)
- **Shipped**: No

### Runtime Data

**`logs/`** - Log files

- Test logs
- Build logs
- Agent logs
- Error traces
- **Git**: Ignored
- **Shipped**: No
- **Naming**: `<source>-<type>-<timestamp>.log`

**`tmp/`** - Temporary files

- Build artifacts
- Test fixtures
- Working directories
- Cache files
- **Git**: Ignored
- **Shipped**: No
- **Safe to delete**: Yes

**`.github/reports/`** - Analysis reports

- Migration reports
- Audit results
- Performance benchmarks
- **Git**: Tracked
- **Shipped**: No

## File Placement Rules

### When Creating New Files

**PHP Class File**:

- **Location**: `inc/`
- **Naming**: `class-{feature}.php`
- **Example**: `inc/class-post-types.php`

**React Component**:

- **Location**: `src/components/`
- **Naming**: `PascalCase.js`
- **Example**: `src/components/PostSelector.js`

**Block**:

- **Location**: `src/blocks/{{slug}}-{block-name}/`
- **Files**: `block.json`, `edit.js`, `save.js`, `render.php`, `style.scss`, `editor.scss`
- **Example**: `src/blocks/{{slug}}-collection/`

**Test File**:

- **Location**: Mirrors source (`tests/js/`, `tests/php/`)
- **Naming**: `{source-file}.test.js` or `test-{feature}.php`
- **Example**: `tests/js/components/PostSelector.test.js`

**Documentation**:

- **Location**: `docs/`
- **Naming**: `UPPERCASE.md` or `lowercase.md`
- **Frontmatter**: Required
- **Example**: `docs/ARCHITECTURE.md`

**Build Script**:

- **Location**: `bin/`
- **Naming**: `{purpose}.js` or `{purpose}.sh`
- **Executable**: Yes
- **Example**: `bin/build.js`

**Agent Spec**:

- **Location**: `.github/agents/`
- **Naming**: `{agent-name}.agent.md` (spec), `{agent-name}.agent.js` (implementation)
- **Example**: `.github/agents/scaffold-generator.agent.md`

**Workflow**:

- **Location**: `.github/workflows/`
- **Naming**: `{purpose}.yml`
- **Example**: `.github/workflows/code-quality.yml`

**Log File**:

- **Location**: `logs/`
- **Naming**: `<source>-<type>-<timestamp>.log`
- **Example**: `logs/test-unit-2025-12-07T10-30-00.log`
- **Created by**: Scripts/tests automatically

**Temporary File**:

- **Location**: `tmp/{category}/`
- **Subdirectories**: `build/`, `test/`, `cache/`, `agents/`
- **Example**: `tmp/test/fixture-data.json`
- **Cleanup**: Script should clean up after use

**Report**:

- **Location**: `.github/reports/`
- **Format**: Markdown with date and context
- **Example**: `.github/reports/STYLELINT-MIGRATION.md`

## Naming Conventions

### PHP

**Functions**:

```php
{{namespace}}_{function_name}
```

**Classes**:

```php
// File: inc/class-feature.php
class {{namespace|pascalCase}}_Feature {}
```

**Constants**:

```php
{{namespace|upper}}_{CONSTANT_NAME}
```

### JavaScript

**Components**:

```javascript
// File: src/components/ComponentName.js
export default function ComponentName() {}
```

**Utilities**:

```javascript
// File: src/utils/utilityName.js
export function utilityName() {}
```

**Blocks**:

```javascript
// File: src/blocks/{{slug}}-block-name/edit.js
registerBlockType( '{{namespace}}/block-name', {} );
```

### CSS/SCSS

**Class Names** (BEM):

```css
.{{namespace}}-component
.{{namespace}}-component__element
.{{namespace}}-component--modifier
```

**Files**:

- `style.scss` - Frontend styles
- `editor.scss` - Editor styles
- `_variables.scss` - Variables
- `_mixins.scss` - Mixins

### Markdown

**Documentation**:

- Root docs: `UPPERCASE.md` (e.g., `README.md`, `CONTRIBUTING.md`)
- Nested docs: `UPPERCASE.md` (prefer) or `lowercase.md`
- Index files: Always `README.md`

**Frontmatter Required**:

```yaml
---
title: Document Title
description: Short description
category: Category
type: Type
audience: Audience
date: YYYY-MM-DD
---
```

## Directory Exclusions

### Git (`.gitignore`)

Never commit:

- `node_modules/`
- `vendor/`
- `build/`
- `logs/`
- `tmp/`
- `*.log`
- `.env` files
- `.dry-run-backup/`

### Distribution (`.distignore`)

Never ship:

- `.git/`
- `.github/`
- `src/`
- `tests/`
- `docs/`
- `bin/`
- `logs/`
- `tmp/`
- `.github/reports/`
- `node_modules/`
- `vendor/`
- All config files
- All markdown except `README.md` and `CHANGELOG.md`

## Logging Requirements

### All Tests Must Log

**JavaScript Tests**:

```javascript
const fs = require('fs');
const path = require('path');

// Create logs directory
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file with timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const logFile = path.join(logsDir, `test-unit-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log function
function log(level, message) {
  const entry = `[${new Date().toISOString()}] [${level}] ${message}\n`;
  logStream.write(entry);
  console.log(entry.trim());
}

// Use in tests
beforeAll(() => log('INFO', 'Test suite starting'));
afterAll(() => logStream.end());
```

**PHP Tests**:

```php
<?php
// Create logs directory
$logsDir = __DIR__ . '/../logs';
if (!is_dir($logsDir)) {
    mkdir($logsDir, 0755, true);
}

// Create log file with timestamp
$timestamp = date('Y-m-d\TH-i-s');
$logFile = $logsDir . "/test-phpunit-{$timestamp}.log";

// Log function
function test_log($level, $message) {
    global $logFile;
    $entry = sprintf("[%s] [%s] %s\n", date('c'), $level, $message);
    file_put_contents($logFile, $entry, FILE_APPEND);
    echo $entry;
}

// Use in tests
test_log('INFO', 'PHPUnit test starting');
```

### Log Levels

Use standard levels:

- **ERROR** - Test failures, exceptions
- **WARN** - Warnings, deprecated usage
- **INFO** - Test progress, suite info
- **DEBUG** - Detailed debugging info

### Log Naming

Format: `<source>-<type>-<timestamp>.log`

Examples:

- `test-unit-2025-12-07T10-30-00.log`
- `test-e2e-2025-12-07T14-15-30.log`
- `build-webpack-2025-12-07T09-00-00.log`

## Temporary File Management

### Using `tmp/` Directory

**Create subdirectory**:

```javascript
const tmpDir = path.join(__dirname, '../tmp/my-script');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}
```

**Use it**:

```javascript
const tempFile = path.join(tmpDir, 'temp-data.json');
fs.writeFileSync(tempFile, JSON.stringify(data));
```

**Clean up**:

```javascript
// When done
fs.rmSync(tmpDir, { recursive: true, force: true });
```

### Temporary File Rules

1. **Always use `tmp/` directory** - Never create temp files in other locations
2. **Create subdirectories** - `tmp/build/`, `tmp/test/`, etc.
3. **Clean up after use** - Remove files when script completes
4. **Handle missing directory** - Create `tmp/` if it doesn't exist
5. **Use absolute paths** - Avoid relative path confusion

## Best Practices

### 1. Every File in Right Place

✅ **Good**:

- Source → `src/`
- Tests → `tests/`
- Docs → `docs/`
- Logs → `logs/`
- Temp → `tmp/`

❌ **Bad**:

- Mixing source and tests
- Docs in root
- Logs in random places
- Temp files scattered

### 2. Mirror Test Structure

```text
src/blocks/{{slug}}-collection/edit.js
tests/js/blocks/{{slug}}-collection.test.js
```

### 3. Namespace Everything

PHP, JavaScript, CSS - all use `{{namespace}}` prefix:

```php
{{namespace}}_function()
```

```javascript
'{{namespace}}/block-name'
```

```css
.{{namespace}}-class
```

### 4. Document in Proximity

- README in major directories
- Frontmatter in all markdown
- Comments in complex code
- Usage in bin/ scripts

### 5. Proper Exclusions

Check both `.gitignore` and `.distignore`:

- Git → Development files
- Distribution → Everything except runtime files

## Examples

- New block files: `src/blocks/gallery/block.json`, `src/blocks/gallery/edit.tsx`, `src/blocks/gallery/style.scss`.
- Dynamic PHP helper: `inc/class-gallery-endpoint.php`.
- Playwright tests mirroring blocks: `tests/e2e/blocks/gallery.spec.ts`.
- Docs for new feature: `docs/FEATURE-GALLERY.md`.

## Validation

### Before Committing

Check file is in correct location:

```bash
# Source files in src/
ls src/

# Tests mirror src/
ls tests/js/
ls tests/php/

# Docs in docs/
ls docs/

# No logs or tmp in Git
git status | grep -E "logs/|tmp/"  # Should be empty
```

### Before Building

Ensure proper exclusions:

```bash
# Check .distignore
cat .distignore

# Test plugin ZIP doesn't include dev files
npm run plugin-zip
unzip -l *.zip | grep -E "src/|tests/|docs/"  # Should be empty
```

## Summary

✅ **Designated Places** - Every file type has a specific location

✅ **Clear Naming** - Consistent conventions for all file types

✅ **Proper Exclusions** - Git and distribution correctly configured

✅ **Logging Required** - All tests must output to `logs/`

✅ **Temporary Management** - Use `tmp/` for ephemeral files

✅ **Mirror Structures** - Tests mirror source directories

✅ **Namespace Everything** - Consistent prefixing across all code

Follow these rules to maintain a clean, organized, and maintainable repository structure.
