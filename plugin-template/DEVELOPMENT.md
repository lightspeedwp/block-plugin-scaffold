---
title: "{{name}} - Development Guide"
version: "{{version}}"
last_updated: "2024-10-18"
author: "{{author}}"
description: "Comprehensive development guide for {{name}}"
type: "documentation"
---

# Development Guide

This document provides comprehensive information for developers working on {{name}}.

## Prerequisites

- **Node.js** 24.18+ and npm 11.16+ (see `.nvmrc`)
- **PHP** 8.0+ with Composer
- **WordPress** 6.5+
- **Docker**, or nothing extra if you use the wp-env Playground runtime (below)

## Environment Setup

### 1. Clone and Install

```bash
git clone {{repository_url}}.git
cd {{slug}}
npm install
composer install
```

`npm install` also installs the pre-commit hook (Husky). Before each commit it checks, in order:

1. **Branch name**: no direct commits to `main`, `develop` or `release/*`, and the branch needs a type prefix such as `feat/`, `fix/`, `chore/`, `test/` or `docs/` (the list in `branch-types.yml` in `lightspeedwp/.github`).
2. **Changelog**: any `.php`, `.js`, `.jsx`, `.ts`, `.tsx` or `.scss` change needs a `CHANGELOG.md` entry in the same commit.
3. **Build**: `npm run build` runs when `src/` files are staged.
4. **lint-staged**: lints and formats the staged files, and validates staged `block.json` files against the block schema.

Use `git commit --no-verify` to skip the hook, for example for a repository's first commit on `main`.

### 2. WordPress Environment

We use `@wordpress/env`, which installs Secure Custom Fields alongside the plugin:

```bash
# Start WordPress (Docker)
npm run env:start

# Or without Docker, using WordPress Playground
npm run env:start -- --runtime=playground
```

The site runs at <http://localhost:8888> (admin: `admin` / `password`).

### 3. Commands

| Command | What it does |
| --- | --- |
| `npm run start` | Rebuilds on change, with source maps |
| `npm run build` | Production build, plus an `*.asset.php` file for each script |
| `npm run format` | Formats JS with the WordPress Prettier config |
| `npm run lint` | Runs `lint:js`, `lint:css`, `lint:pkg` and `lint:json` |
| `npm run lint:json` | Validates every `block.json` against the WordPress block schema (Ajv) |
| `npm run test:unit` | Vitest unit tests in `tests/js`, with a coverage gate |
| `npm run test:e2e` | Playwright tests in `tests/e2e` against wp-env, including axe-core checks |
| `npm run packages-update` | Updates `@wordpress/*` packages |
| `npm run zip` | Builds a distribution ZIP |
| `composer run lint` / `lint:fix` | PHPCS / PHPCBF with WordPress standards |
| `composer run phpstan` | PHPStan level 6 |
| `composer run test` | PHPUnit unit tests in `tests/php` |

### Configuration files

Config files use the names the Gutenberg repository uses, and the JS ones extend the `@wordpress/scripts` defaults: `eslint.config.mjs` (with the plugin's own additions in `tools/eslint/`), `.stylelintrc.js` (BEM class names), `prettier.config.mjs`, `vitest.config.mjs`, `playwright.config.js`, `phpcs.xml.dist` and `phpstan.neon`. `.stylelintignore`, `.jshintignore`, `.markdownlintignore`, `.markdownlint.json` and `.npmpackagejsonlintrc.json` set what each linter checks; `npm run lint:md:docs` lints the Markdown files. The code of conduct and support files are inherited from the LightSpeed organisation.

## Architecture

### Block Structure

The plugin follows WordPress block development best practices with multiple blocks:

```text
src/
├── index.js            # Main entry point - registers all blocks
├── blocks/slider/     # Generic block directory
│   ├── block.json      # Block metadata and configuration
│   ├── edit.js         # Editor component (React)
│   ├── save.js         # Frontend save component
│   ├── index.js        # Block registration
│   ├── render.php      # Server-side render callback
│   └── style.scss      # Block-specific styles
├── blocks/field-display/ # Another generic block
│   └── ...
├── blocks/{post-type}-collection/ # One per post type (content-model plugins only)
│   └── ...
└── shared/             # Shared between blocks
    ├── components/     # Shared React components
    ├── hooks/          # Shared hooks
    └── utils/          # Shared utilities
```

### Mustache Template System

All files use mustache-style placeholders for customization:

#### Variable Transforms

The build system supports these mustache transforms:

- `{{slug}}` - Original kebab-case
- `{{slug|snakeCase}}` - snake_case transformation
- `{{slug|pascalCase}}` - PascalCase transformation
- `{{slug|camelCase}}` - camelCase transformation
- `{{namespace|upper}}` - UPPERCASE transformation

#### File Naming

Template files use placeholder syntax:

- `{{slug}}.php` - Main plugin file
- `src/blocks/<block>/` - Block directory (e.g. `src/blocks/slider/`)

### Internationalization (i18n)

The plugin is fully prepared for internationalization:

#### JavaScript

```javascript
import { __ } from '@wordpress/i18n';

// Basic translation
const text = __( 'Hello World', '{{textdomain}}' );

// With context
const text = _x( 'Post', 'noun', '{{textdomain}}' );

// Pluralization
const text = _n( '%d item', '%d items', count, '{{textdomain}}' );
```

#### PHP

```php
// Basic translation
$text = __( 'Hello World', '{{textdomain}}' );

// Escaped output
echo esc_html__( 'Hello World', '{{textdomain}}' );

// With context
$text = _x( 'Post', 'noun', '{{textdomain}}' );
```

## Code Standards

### WordPress Coding Standards

We follow WordPress coding standards strictly:

#### PHP Standards

- **PSR-4** autoloading
- **WordPress PHP Coding Standards**
- **DocBlock** comments for all functions/classes
- **Type hints** where possible (PHP 8.0+)

#### JavaScript Standards

- **@wordpress/eslint-plugin** for linting
- **Prettier** for code formatting
- **JSDoc** comments for functions
- **React hooks** patterns

#### CSS/SCSS Standards

- **@wordpress/stylelint-config** for linting
- **BEM methodology** for CSS class naming
- **Mobile-first** responsive design
- **CSS custom properties** for theming

### File Organization

```text
src/
├── blocks/
│   ├── slider/             # Generic block: {{slug}}/slider
│   ├── field-display/      # Generic block: {{slug}}/field-display
│   └── collection/         # Template: rendered once per post type as
│                           # <post-type>-collection (content model only)
├── components/             # Shared React components
├── hooks/                  # Shared React hooks
├── utils/                  # Shared utilities
├── js/                     # Standalone front-end scripts
├── scss/                   # Global styles
└── index.js                # Imports every generated block
```

## Testing

### JavaScript Testing

Unit tests use Vitest and Testing Library. They live in `tests/js` and run in jsdom:

```bash
npm run test:unit
npm run test:unit -- --watch
```

```javascript
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkipLink from '../../../src/components/SkipLink/SkipLink';

describe( 'SkipLink', () => {
	test( 'links to the main content', () => {
		render( <SkipLink /> );

		expect(
			screen.getByRole( 'link', { name: 'Skip to main content' } )
		).toHaveAttribute( 'href', '#maincontent' );
	} );
} );
```

Import `describe`, `test`, `expect` and `vi` from `vitest`; there are no globals.

`npm run test:unit` also measures coverage of the files the tests load, and fails below 70% branches, 80% statements or 80% functions (`vitest.config.mjs`). The data goes to `coverage/lcov.info`.

### PHP Checks

```bash
composer run lint
composer run phpstan
composer run test
```

PHPUnit tests live in `tests/php` and end in `Test.php`. They extend `tests/php/TestCase.php`, which uses `yoast/phpunit-polyfills` and stubs WordPress functions with Brain Monkey, so they run without a WordPress install. CI runs them on PHP 8.4 and 8.5.

### End-to-End Testing

Playwright tests live in `tests/e2e` and use `@wordpress/e2e-test-utils-playwright`. They check that the editor loads, that every block can be inserted, and that blocks render on the front end. `tests/e2e/accessibility.spec.js` also checks, at mobile, tablet and desktop widths, that the blocks fit the screen and pass an axe-core WCAG 2.2 AA scan. Start wp-env first:

```bash
npm run env:start
npm run test:e2e
npm run test:e2e -- --debug
```

Tests run against `WP_BASE_URL`, which defaults to <http://localhost:8888>. Right after a fresh Playground start, the first run can fail with "Not logged in"; run it again.

## Build Process

### Development Build

```bash
npm run start
```

This starts webpack in watch mode with:

- Hot module replacement
- Source maps
- Development optimizations

### Production Build

```bash
npm run build
```

This creates optimized assets in `build/`:

- Minified JavaScript
- Compressed CSS
- Asset manifests
- Source maps (separate files)

### Build Configuration

`webpack.config.js` extends `@wordpress/scripts`:

- Each block is found through its `block.json`, which builds its scripts, styles and `viewScriptModule`, and copies its `render.php`.
- `tools/webpack/extra-entries.js` adds the shared `index` entry (`src/index.js`) and one entry per file in `src/js/`.
- `.browserslistrc` sets the supported browsers (the WordPress list), which Babel and Autoprefixer follow. Add PostCSS plugins in `postcss.config.mjs`; they run with the `@wordpress/scripts` preset.
- `tsconfig.json`, `tsconfig.build.json` (the shipped `src/` only) and `jsconfig.json` give editors type information for the JavaScript. TypeScript is not a build step.
- `--experimental-modules` (set in `build` and `start`) builds script modules for the Interactivity API.

WordPress packages are not bundled: each script's `*.asset.php` lists the handles it needs, and the PHP enqueues scripts with those dependencies. See [Interactivity API and DataViews](docs/INTERACTIVITY-AND-DATAVIEWS.md) for front-end state and admin data screens.

## Deployment

### Version Management

Use the version update script:

```bash
# Update to new version
node scripts/update-version.js 1.2.0
```

This updates version numbers in:

- `package.json`
- `composer.json`
- `{{plugin_slug}}.php`
- `src/*/block.json`
- `README.md`

### Changelog

Every pull request to `develop` or `main` needs a `CHANGELOG.md` entry under `[Unreleased]` ([Keep a Changelog](https://keepachangelog.com/en/1.1.0/)). The **Changelog** workflow (`.github/workflows/changelog.yml`) checks it. Docs-only and Dependabot pull requests are exempt, and the `meta:no-changelog` label skips the check, except on feature, bug, performance, security, release and hotfix pull requests.

### Creating Releases

1. Set the new version in the plugin header (`Version:`), `readme.txt` (`Stable tag:`) and `package.json`, and move the `[Unreleased]` entries under a `## [x.y.z]` heading in `CHANGELOG.md`.
2. Merge to `main`, then tag the release and push the tag:

   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

3. The **Release** workflow (`.github/workflows/release.yml`) checks that the tag matches all four versions, builds, packages the plugin and publishes a GitHub release with the zip, using the version's changelog section as the notes.

### Release Package

```bash
npm run build
node bin/package-release.js
```

This copies every file `.distignore` does not exclude into `dist/<slug>/`, which the release workflow zips. `.distignore` leaves out development files (`src/`, `tests/`, `bin/`), config files and dependencies (`node_modules/`, `vendor/`).

## Debugging

### PHP Debugging

Configure Xdebug in your environment and use the VSCode launch configuration:

1. Start Xdebug in your WordPress environment
2. Open VSCode
3. Set breakpoints in PHP files
4. Start debugging with F5

### JavaScript Debugging

Use browser developer tools or VSCode:

```javascript
// Add debugging statements
debugger; // Breakpoint in browser
```

### WordPress Debugging

Enable debugging in `wp-config.php`:

```php
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'SCRIPT_DEBUG', true );
```

## Performance

### JavaScript Optimization

- Use **React.memo()** for expensive components
- Implement **proper dependencies** in useEffect hooks
- **Code splitting** with dynamic imports
- **Tree shaking** to remove unused code

### CSS Optimization

- **Critical CSS** inlining for above-the-fold content
- **CSS purging** to remove unused styles
- **CSS custom properties** for efficient theming
- **Mobile-first** responsive design

### PHP Optimization

- **Transient caching** for expensive operations
- **Object caching** where available
- **Database query optimization**
- **Proper sanitization and validation**

## Troubleshooting

### Common Issues

#### Build Failures

1. **Reinstall**: `rm -rf node_modules && npm ci`
2. **Check Node version**: Must be 24.18+ (`nvm use`)
3. **Update WordPress packages**: `npm run packages-update`

#### WordPress Environment Issues

1. **Reset environment**: `npm run env:destroy && npm run env:start`
2. **Check ports**: Ensure 8888 is available
3. **Docker issues**: Restart Docker Desktop, or use `npm run env:start -- --runtime=playground`

#### Test Failures

1. **Update snapshots**: `npm run test:unit -- --update`
2. **E2E login errors**: re-run once after a fresh environment start
3. **Check database**: Ensure the PHP test database is configured

### Getting Help

1. Check existing [GitHub Issues]({{repository_url}}/issues)
2. Read [WordPress Block Editor Handbook](https://developer.wordpress.org/block-editor/)
3. Join [WordPress Slack](https://wordpress.slack.com) #core-editor channel
4. Review [LightSpeed Standards](https://github.com/lightspeedwp/.github)

## Contributing

See the LightSpeed [contributing guide](https://github.com/lightspeedwp/.github/blob/develop/CONTRIBUTING.md), which GitHub shows for every repository in the organisation.
