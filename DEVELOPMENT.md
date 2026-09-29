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

- **Node.js** 18.0+ and npm 8.0+
- **PHP** 8.0+ with Composer
- **WordPress** 6.0+ (for testing)
- **Git** for version control

## Environment Setup

### 1. Clone and Install

```bash
npm install
composer install
git clone https://github.com/{{author}}/{{plugin_slug}}.git
cd {{plugin_slug}}
npm install
composer install
```

### 2. WordPress Environment

We use `@wordpress/env` for local development:

```bash
# Start WordPress environment
npm run env:start

# Visit your site
open http://localhost:8888

# WordPress admin
open http://localhost:8888/wp-admin
# Username: admin
# Password: password
```

### 3. Development Workflow

```bash
# Start development with hot reload
npm run start

# In another terminal, watch for PHP changes
composer run test -- --watch
```

## Architecture

### Block Structure

The plugin follows WordPress block development best practices with multiple blocks:

```
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
- `src/{{block-slug}}/` - Block directory

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

```
src/
├── {{block-slug-1}}/   # Block 1
│   ├── components/     # Reusable React components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   └── styles/         # SCSS partials
├── {{block-slug-2}}/   # Block 2
│   └── ...
├── scss/               # Global styles
│   ├── abstracts/      # Variables, mixins, functions
│   ├── base/           # Reset, typography, etc.
│   ├── components/     # UI components
│   └── utilities/      # Utility classes
└── shared/             # Shared between blocks
    ├── components/     # Shared React components
    ├── hooks/          # Shared hooks
    └── utils/          # Shared utilities
```

## Testing

### JavaScript Testing

We use Jest and Testing Library:

```bash
# Run all tests
npm run test:unit

# Watch mode
npm run test:unit -- --watch

# Coverage report
npm run test:unit -- --coverage
```

#### Test Structure

```javascript
import { render, screen } from '@testing-library/react';
import { Edit } from '../edit';

describe( '{{slug}} Edit Component', () => {
 it( 'renders correctly', () => {
  const attributes = { content: 'Test content' };
  const setAttributes = jest.fn();

  render( <Edit attributes={ attributes } setAttributes={ setAttributes } /> );

  expect( screen.getByText( 'Test content' ) ).toBeInTheDocument();
 } );
} );
```

### PHP Testing

We use PHPUnit with WordPress test framework:

```bash
# Run PHP tests
composer run test

# Install test database (first time only)
./bin/install-wp-tests.sh {{slug|snakeCase}}_test root '' localhost latest
```

#### Test Structure

```php
<?php
class Test_{{namespace|pascalCase}}_Block extends WP_UnitTestCase {

 public function test_block_registration() {
  $this->assertTrue(
   WP_Block_Type_Registry::get_instance()->is_registered( '{{namespace}}/{{block-slug}}' )
  );
 }

 public function test_render_callback() {
  $attributes = array( 'content' => 'Test content' );
  $result = {{namespace}}_{{block-slug|snakeCase}}_render_callback( $attributes, '', null );

  $this->assertStringContainsString( 'Test content', $result );
 }
}
```

### End-to-End Testing

We use Playwright for E2E testing:

```bash
# Run E2E tests
npm run test:e2e

# Debug mode
npm run test:e2e -- --debug
```

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

The build process is configured via:

- `webpack.config.js` - Custom webpack configuration
- `.babelrc` - Babel transpilation settings
- `postcss.config.js` - PostCSS processing

#### Webpack Configuration

The `webpack.config.js` extends `@wordpress/scripts` with custom settings:

**Entry Points:**

- `index` - Main plugin entry (`src/index.js`)
- Multiple block entries (`src/{{block-slug}}/index.js`)

**Path Aliases:**

- `@` → `src/` directory
- `@blocks` → `src/` directory
- `@utils` → `src/shared/utils/` directory
- `@components` → `src/shared/components/` directory

**Custom Loaders:**

- SVG files processed with `@svgr/webpack` and `url-loader`
- Supports inline SVG imports in React components

**Optimization:**

- Separate CSS bundles for styles and editor
- Code splitting for better performance
- Asset size limits: 512KB per chunk

Example usage of path aliases:

```javascript
// Instead of:
import MyComponent from '../../../shared/components/MyComponent';

// Use:
import MyComponent from '@components/MyComponent';
```

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

### Creating Releases

1. **Update version** using the script above
2. **Test thoroughly** - run all tests and manual testing
3. **Build production assets** with `npm run build`
4. **Create git tag** and push
5. **GitHub Actions** will automatically create release assets

### Plugin ZIP Creation

```bash
npm run plugin-zip
```

This creates a distribution-ready ZIP file excluding:

- Development files (`src/`, `tests/`)
- Configuration files (`.eslintrc`, etc.)
- Dependencies (`node_modules/`, `vendor/`)

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

1. **Clear caches**: `npm run clean && rm -rf node_modules && npm install`
2. **Check Node version**: Must be 18.0+
3. **Update dependencies**: `npm update`

#### WordPress Environment Issues

1. **Reset environment**: `npm run env:destroy && npm run env:start`
2. **Check ports**: Ensure 8888 is available
3. **Docker issues**: Restart Docker Desktop

#### Test Failures

1. **Update snapshots**: `npm run test:unit -- --updateSnapshot`
2. **Check database**: Ensure test database is configured
3. **Clear test cache**: `npm run test:unit -- --clearCache`

### Getting Help

1. Check existing [GitHub Issues](https://github.com/{{author}}/{{plugin_slug}}/issues)
2. Read [WordPress Block Editor Handbook](https://developer.wordpress.org/block-editor/)
3. Join [WordPress Slack](https://wordpress.slack.com) #core-editor channel
4. Review [LightSpeed Standards](https://github.com/lightspeedwp/.github)

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines.
