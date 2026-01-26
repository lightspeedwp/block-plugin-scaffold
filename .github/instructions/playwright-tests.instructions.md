---
title: Playwright Testing Instructions
description: Comprehensive guide for writing, organizing, and running Playwright E2E tests for WordPress blocks and plugins
category: Testing
audience: Developers
created: 2025-12-16
updated: 2025-12-16
references:
  - ../custom-instructions.md
  - ./testing-e2e.instructions.md
  - ./jest-tests.instructions.md
  - ./a11y.instructions.md
---

# Playwright Testing Instructions

This document provides comprehensive guidance for writing end-to-end (E2E) tests using Playwright in the multi-block-plugin-scaffold repository. It builds on the general E2E testing instructions with WordPress-specific patterns and block editor testing strategies.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Test File Organization](#test-file-organization)
- [Playwright Configuration](#playwright-configuration)
- [Writing Tests](#writing-tests)
- [WordPress Block Editor Testing](#wordpress-block-editor-testing)
- [Locator Strategies](#locator-strategies)
- [Assertions and Expectations](#assertions-and-expectations)
- [Test Fixtures and Utilities](#test-fixtures-and-utilities)
- [Running Tests](#running-tests)
- [Debugging and Troubleshooting](#debugging-and-troubleshooting)
- [Best Practices](#best-practices)

## Overview

Playwright is a modern end-to-end testing framework that provides reliable automation for web applications. For WordPress block development, Playwright offers excellent support for testing the block editor interface, user interactions, and accessibility compliance.

### Why Playwright?

- **Auto-waiting** - Automatically waits for elements to be ready
- **Web-first assertions** - Built-in retry logic for flaky tests
- **Multiple browsers** - Test in Chromium, Firefox, and WebKit
- **WordPress utilities** - `@wordpress/e2e-test-utils-playwright` package
- **Accessibility testing** - Built-in aria snapshot testing

## Getting Started

### Installation

```bash
# Install Playwright and dependencies
npm install --save-dev @playwright/test

# Install WordPress E2E utilities
npm install --save-dev @wordpress/e2e-test-utils-playwright

# Install Axe for accessibility testing
npm install --save-dev axe-playwright

# Install Playwright browsers
npx playwright install
```

### Dependencies

The repository uses these Playwright-related packages:

- `@playwright/test` - Core Playwright testing framework
- `@wordpress/e2e-test-utils-playwright` - WordPress block editor utilities
- `axe-playwright` - Accessibility testing integration

## Test File Organization

### Directory Structure

```
tests/
├── e2e/                          # All Playwright E2E tests
│   ├── config/
│   │   └── playwright.config.ts  # Playwright configuration
│   ├── specs/                    # Test specifications
│   │   ├── blocks/
│   │   │   ├── {{slug}}-collection.spec.ts
│   │   │   └── {{slug}}-slider.spec.ts
│   │   ├── admin/
│   │   │   ├── cpt-management.spec.ts
│   │   │   └── settings.spec.ts
│   │   └── frontend/
│   │       ├── single-{{slug}}.spec.ts
│   │       └── archive-{{slug}}.spec.ts
│   ├── fixtures/                 # Test data and utilities
│   │   ├── test-data.ts
│   │   └── mock-posts.ts
│   └── utils/                    # Shared test utilities
│       ├── admin.ts
│       └── block-editor.ts
└── setup-tests.js                # Global test setup
```

### File Naming Conventions

- Use `.spec.ts` suffix for test files
- Name files after the feature or component being tested
- Use kebab-case for filenames

```
{{slug}}-collection.spec.ts     # Collection block tests
cpt-management.spec.ts          # CPT admin tests
archive-{{slug}}.spec.ts        # Archive page tests
```

## Playwright Configuration

### Configuration File

Located at `tests/e2e/config/playwright.config.ts` or `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	// Test directory
	testDir: './tests/e2e/specs',

	// Maximum time one test can run
	timeout: 30 * 1000,

	// Test execution settings
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,

	// Reporter configuration
	reporter: [
		['html'],
		['list'],
		['junit', { outputFile: 'test-results/junit.xml' }],
	],

	// Shared settings for all projects
	use: {
		baseURL: process.env.WP_BASE_URL || 'http://localhost:8889',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},

	// Browser projects
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
		},
		{
			name: 'webkit',
			use: { ...devices['Desktop Safari'] },
		},
	],

	// Local dev server (optional)
	webServer: {
		command: 'npm run start',
		url: 'http://localhost:8889',
		reuseExistingServer: !process.env.CI,
	},
});
```

### Environment Variables

Configure in `.env` file:

```bash
# WordPress site URL
WP_BASE_URL=http://localhost:8889

# WordPress admin credentials
WP_USERNAME=admin
WP_PASSWORD=password

# Test user credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASS=password123
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('{{name}} Collection Block', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to page before each test
		await page.goto('/wp-admin/post-new.php');
	});

	test('should insert collection block', async ({ page }) => {
		await test.step('Open block inserter', async () => {
			await page.getByRole('button', { name: 'Add block' }).click();
		});

		await test.step('Search for collection block', async () => {
			await page.getByRole('searchbox', { name: 'Search' }).fill('{{name}} Collection');
		});

		await test.step('Insert block', async () => {
			await page.getByRole('option', { name: '{{name}} Card' }).click();
		});

		await test.step('Verify block inserted', async () => {
			await expect(page.getByRole('document', { name: /{{name}} Card/ })).toBeVisible();
		});
	});

	test('should edit block content', async ({ page }) => {
		// Test implementation
	});
});
```

### Using WordPress Test Utils

```typescript
import { test, expect } from '@playwright/test';
import { Admin, Editor } from '@wordpress/e2e-test-utils-playwright';

test.describe('Block Editor Tests', () => {
	test('should create new post with block', async ({ page, admin, editor }) => {
		await admin.createNewPost();

		await editor.insertBlock({
			name: '{{namespace}}/{{slug}}-collection',
		});

		await editor.openDocumentSettingsSidebar();

		// Verify block exists
		const block = editor.canvas.getByRole('document', { name: /{{name}} Collection/ });
		await expect(block).toBeVisible();

		// Publish post
		await editor.publishPost();
	});
});
```

### Test Hooks

Use hooks for setup and teardown:

```typescript
test.describe('{{name}} Tests', () => {
	// Runs once before all tests in describe block
	test.beforeAll(async ({ browser }) => {
		// Setup test data
	});

	// Runs before each test
	test.beforeEach(async ({ page }) => {
		await page.goto('/wp-admin');
	});

	// Runs after each test
	test.afterEach(async ({ page }) => {
		// Cleanup
	});

	// Runs once after all tests
	test.afterAll(async ({ browser }) => {
		// Final cleanup
	});

	test('test case', async ({ page }) => {
		// Test code
	});
});
```

## WordPress Block Editor Testing

### Inserting Blocks

```typescript
test('insert block using inserter', async ({ page, editor }) => {
	// Using WordPress utils
	await editor.insertBlock({
		name: '{{namespace}}/{{slug}}-collection',
	});

	// Or manually
	await page.getByRole('button', { name: 'Add block' }).click();
	await page.getByRole('option', { name: '{{name}} Collection' }).click();
});
```

### Editing Block Attributes

```typescript
test('edit block attributes', async ({ page, editor }) => {
	await editor.insertBlock({
		name: '{{namespace}}/{{slug}}-collection',
	});

	// Open block settings
	await editor.openDocumentSettingsSidebar();

	// Edit attributes
	await page.getByRole('textbox', { name: 'Heading' }).fill('My Heading');
	await page.getByRole('combobox', { name: 'Display Type' }).selectOption('featured');
	await page.getByRole('checkbox', { name: 'Show Excerpt' }).check();

	// Verify changes
	await expect(page.getByRole('heading', { name: 'My Heading' })).toBeVisible();
});
```

### Testing Block Variations

```typescript
test('insert block variation', async ({ page, editor }) => {
	await page.getByRole('button', { name: 'Add block' }).click();
	await page.getByRole('option', { name: '{{name}} Collection' }).click();

	// Select variation
	await page.getByRole('button', { name: 'Grid' }).click();

	// Verify correct variation inserted
	const block = editor.canvas.locator('[data-type="{{namespace}}/{{slug}}-collection"]');
	await expect(block).toHaveAttribute('data-variation', 'grid');
});
```

### Testing InnerBlocks

```typescript
test('insert inner blocks', async ({ page, editor }) => {
	await editor.insertBlock({
		name: '{{namespace}}/{{slug}}-collection',
	});

	// Click to add inner block
	await page.getByRole('button', { name: 'Add block' }).click();
	await page.getByRole('option', { name: 'Paragraph' }).click();

	// Type content
	await page.keyboard.type('Inner block content');

	// Verify inner block
	await expect(page.getByText('Inner block content')).toBeVisible();
});
```

### Testing Dynamic Blocks

```typescript
test('dynamic block renders correctly', async ({ page, editor }) => {
	await editor.insertBlock({
		name: '{{namespace}}/{{slug}}-featured',
	});

	// Set attributes
	await page.getByRole('spinbutton', { name: 'Number of Items' }).fill('3');

	// Save post
	await editor.publishPost();

	// Visit frontend
	const postUrl = await editor.getPermalink();
	await page.goto(postUrl);

	// Verify frontend rendering
	const collectionItems = page.locator('.{{slug}}-collection .collection-item');
	await expect(collectionItems).toHaveCount(3);
});
```

## Locator Strategies

### Prefer User-Facing Locators

Always prefer locators that users would use to find elements:

```typescript
// ✅ Good - User-facing locators
await page.getByRole('button', { name: 'Add block' });
await page.getByRole('textbox', { name: 'Heading' });
await page.getByRole('heading', { name: 'Welcome' });
await page.getByLabel('Show excerpt');
await page.getByPlaceholder('Enter title...');
await page.getByText('Published');

// ❌ Bad - Brittle implementation details
await page.locator('.block-editor-inserter__toggle');
await page.locator('input[name="heading"]');
await page.locator('#heading-1');
```

### Locator Priority

1. **Role-based** - `getByRole('button', { name: 'Save' })`
2. **Label-based** - `getByLabel('Email address')`
3. **Placeholder** - `getByPlaceholder('Enter email')`
4. **Text content** - `getByText('Submit form')`
5. **Test ID** - `getByTestId('submit-button')` (last resort)
6. **CSS/XPath** - Only when absolutely necessary

### Block-Specific Locators

```typescript
// Block by data-type attribute
const block = page.locator('[data-type="{{namespace}}/{{slug}}-collection"]');

// Block by aria-label
const block = editor.canvas.getByRole('document', { name: '{{name}} Collection' });

// Block toolbar
const toolbar = page.locator('.block-editor-block-toolbar');

// Block settings panel
const settings = page.locator('.block-editor-block-inspector');

// Block content area
const content = editor.canvas.locator('[data-type="{{namespace}}/{{slug}}-collection"] .block-content');
```

## Assertions and Expectations

### Web-First Assertions

Use auto-retrying assertions that wait for conditions:

```typescript
// Element visibility
await expect(page.getByRole('button')).toBeVisible();
await expect(page.getByText('Error')).not.toBeVisible();

// Element state
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();
await expect(page.getByRole('checkbox')).toBeChecked();

// Text content
await expect(page.getByRole('heading')).toHaveText('Welcome');
await expect(page.getByRole('heading')).toContainText('Wel');

// Attributes
await expect(page.locator('.block')).toHaveAttribute('data-type', '{{namespace}}/{{slug}}-card');
await expect(page.locator('img')).toHaveAttribute('src', /uploads/);

// Count
await expect(page.locator('.{{slug}}-card')).toHaveCount(3);

// URL
await expect(page).toHaveURL(/\/wp-admin\/post-new\.php/);
await expect(page).toHaveTitle(/New Post/);

// CSS/Styles
await expect(page.locator('.block')).toHaveCSS('display', 'block');
```

### Aria Snapshots

Test accessibility tree structure:

```typescript
test('block has correct aria structure', async ({ page, editor }) => {
	await editor.insertBlock({
		name: '{{namespace}}/{{slug}}-card',
	});

	await expect(page.locator('.{{slug}}-card')).toMatchAriaSnapshot(`
		- article:
		  - img "Featured image"
		  - heading "{{name_singular}} Title" [level=2]
		  - paragraph
		  - link "Read more"
	`);
});
```

### Custom Assertions

Create reusable assertion helpers:

```typescript
// utils/assertions.ts
export async function expectBlockToBeInserted(page: Page, blockName: string) {
	const block = page.locator(`[data-type="${blockName}"]`);
	await expect(block).toBeVisible();
	await expect(block).toHaveCount(1);
}

// In test
await expectBlockToBeInserted(page, '{{namespace}}/{{slug}}-card');
```

## Test Fixtures and Utilities

### Creating Custom Fixtures

```typescript
// fixtures/admin-user.ts
import { test as base } from '@playwright/test';

type AdminUserFixture = {
	adminUser: {
		username: string;
		password: string;
	};
};

export const test = base.extend<AdminUserFixture>({
	adminUser: async ({}, use) => {
		await use({
			username: process.env.WP_USERNAME || 'admin',
			password: process.env.WP_PASSWORD || 'password',
		});
	},
});
```

### WordPress Utilities

```typescript
// utils/wordpress.ts
import { Page } from '@playwright/test';

export async function loginToWordPress(page: Page, username: string, password: string) {
	await page.goto('/wp-login.php');
	await page.getByLabel('Username or Email Address').fill(username);
	await page.getByLabel('Password', { exact: true }).fill(password);
	await page.getByRole('button', { name: 'Log In' }).click();
	await page.waitForURL(/wp-admin/);
}

export async function createPost(page: Page, title: string, type: string = 'post') {
	await page.goto(`/wp-admin/post-new.php?post_type=${type}`);
	await page.getByRole('textbox', { name: 'Add title' }).fill(title);
	return page;
}

export async function publishPost(page: Page) {
	await page.getByRole('button', { name: 'Publish' }).click();
	await page.getByRole('region', { name: 'Editor publish' })
		.getByRole('button', { name: 'Publish' })
		.click();
	await page.getByText('Post published').waitFor();
}
```

### Block Testing Utilities

```typescript
// utils/blocks.ts
import { Page, Editor } from '@wordpress/e2e-test-utils-playwright';

export async function insertAndConfigureBlock(
	editor: Editor,
	blockName: string,
	attributes: Record<string, any>
) {
	await editor.insertBlock({ name: blockName });

	for (const [key, value] of Object.entries(attributes)) {
		// Set attribute based on type
		// Implementation details...
	}
}

export async function getBlockAttributes(page: Page, blockName: string) {
	const block = page.locator(`[data-type="${blockName}"]`);
	// Extract and return attributes
}
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Or use Playwright directly
npx playwright test

# Run specific test file
npx playwright test {{slug}}-card.spec.ts

# Run tests matching pattern
npx playwright test --grep "collection block"

# Run in headed mode (see browser)
npx playwright test --headed

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug Mode

```bash
# Debug mode with inspector
npx playwright test --debug

# Debug specific test
npx playwright test {{slug}}-card.spec.ts --debug

# Set PWDEBUG environment variable
PWDEBUG=1 npx playwright test
```

### Generating Tests

```bash
# Generate tests with codegen
npx playwright codegen http://localhost:8889/wp-admin

# Generate tests for specific workflow
npx playwright codegen --save-storage=auth.json http://localhost:8889/wp-admin
```

## Debugging and Troubleshooting

### Traces

Playwright automatically captures traces on failure:

```bash
# View trace
npx playwright show-trace trace.zip

# Run with trace on
npx playwright test --trace on
```

### Screenshots

```typescript
// Take screenshot during test
await page.screenshot({ path: 'screenshot.png' });

// Full page screenshot
await page.screenshot({ path: 'full-page.png', fullPage: true });

// Element screenshot
await page.locator('.block').screenshot({ path: 'block.png' });
```

### Videos

Configure in `playwright.config.ts`:

```typescript
use: {
	video: 'retain-on-failure',
	// or 'on', 'off', 'on-first-retry'
}
```

### Debugging Selectors

```typescript
// Highlight element
await page.locator('.block').highlight();

// Get element info
const element = await page.locator('.block');
console.log(await element.count());
console.log(await element.textContent());
console.log(await element.getAttribute('data-type'));
```

### Common Issues

**Issue: Element not found**
```typescript
// ❌ Element might not be ready
await page.locator('.block').click();

// ✅ Wait for element
await page.locator('.block').waitFor();
await page.locator('.block').click();

// ✅ Or use built-in waiting
await expect(page.locator('.block')).toBeVisible();
```

**Issue: Test timing out**
```typescript
// Increase timeout for specific test
test('slow test', async ({ page }) => {
	test.setTimeout(60000); // 60 seconds
	// Test code
});

// Or increase globally in config
timeout: 60 * 1000,
```

**Issue: Flaky tests**
```typescript
// Use web-first assertions (auto-retry)
await expect(page.locator('.block')).toBeVisible();

// Enable retries in config
retries: process.env.CI ? 2 : 0,

// Add explicit waits when needed
await page.waitForLoadState('networkidle');
```

## Best Practices

### Test Organization

1. **One feature per file** - Keep tests focused
2. **Use describe blocks** - Group related tests
3. **Descriptive test names** - Clearly state what is tested
4. **Independent tests** - Each test should work in isolation

```typescript
test.describe('{{name}} Collection Block', () => {
	test.describe('Insertion', () => {
		test('should insert via inserter', async ({ page }) => {});
		test('should insert via slash command', async ({ page }) => {});
	});

	test.describe('Configuration', () => {
		test('should update query settings', async ({ page }) => {});
		test('should toggle layout options', async ({ page }) => {});
	});

	test.describe('Rendering', () => {
		test('should render on frontend', async ({ page }) => {});
		test('should display featured image', async ({ page }) => {});
	});
});
```

### Avoid Hard Waits

```typescript
// ❌ Bad - Arbitrary wait
await page.waitForTimeout(3000);

// ✅ Good - Wait for specific condition
await page.waitForLoadState('networkidle');
await page.waitForSelector('.block');
await expect(page.locator('.block')).toBeVisible();
```

### Use Page Object Model

```typescript
// pages/block-editor.page.ts
export class BlockEditorPage {
	constructor(private page: Page, private editor: Editor) {}

	async insertBlock(blockName: string) {
		await this.page.getByRole('button', { name: 'Add block' }).click();
		await this.page.getByRole('option', { name: blockName }).click();
	}

	async publishPost() {
		await this.page.getByRole('button', { name: 'Publish' }).click();
		await this.page
			.getByRole('region', { name: 'Editor publish' })
			.getByRole('button', { name: 'Publish' })
			.click();
	}
}

// In test
const editorPage = new BlockEditorPage(page, editor);
await editorPage.insertBlock('{{name}} Card');
await editorPage.publishPost();
```

### Test Data Management

```typescript
// fixtures/test-data.ts
export const testPosts = {
	published: {
		title: 'Published Test Post',
		content: 'This is published content',
		status: 'publish',
	},
	draft: {
		title: 'Draft Test Post',
		content: 'This is draft content',
		status: 'draft',
	},
};

// In test
import { testPosts } from '../fixtures/test-data';

test('test with fixture data', async ({ page }) => {
	await createPost(page, testPosts.published.title);
});
```

### Accessibility Testing

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('block is accessible', async ({ page, editor }) => {
	await editor.insertBlock({
		name: '{{namespace}}/{{slug}}-card',
	});

	await injectAxe(page);
	await checkA11y(page, '.{{slug}}-card', {
		detailedReport: true,
		detailedReportOptions: {
			html: true,
		},
	});
});
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [WordPress E2E Utils](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-e2e-test-utils-playwright/)
- [Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [Testing E2E Instructions](./testing-e2e.instructions.md)
- [Jest Tests Instructions](./jest-tests.instructions.md)
- [Accessibility Instructions](./a11y.instructions.md)

## Examples from This Repository

See `tests/e2e/specs/blocks/` for examples of:
- Block insertion and configuration
- Block editor interactions
- Frontend rendering verification
- Accessibility testing with aria snapshots
