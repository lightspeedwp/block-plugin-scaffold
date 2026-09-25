/**
 * E2E tests for Example Plugin Slider block.
 *
 * @package
 */

/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

const { test, expect } = require('@playwright/test');

test.describe('Example Plugin Slider Block', () => {
	test.beforeEach(async ({ page }) => {
		// Login to WordPress admin.
		await page.goto('/wp-admin');
		await page.fill('#user_login', 'admin');
		await page.fill('#user_pass', 'password');
		await page.click('#wp-submit');

		// Create a new post.
		await page.goto('/wp-admin/post-new.php');
		await page.waitForSelector('.block-editor-page');
	});

	test('should insert slider block', async ({ page }) => {
		// Open block inserter.
		await page.click('.edit-post-header-toolbar__inserter-toggle');
		await page.fill(
			'.block-editor-inserter__search input',
			'Example Plugin Slider'
		);

		// Insert the block.
		const blockItem = page.locator(
			'.block-editor-block-types-list__item[data-id="example-plugin/slider"]'
		);
		await blockItem.click();

		// Verify block is inserted.
		const block = page.locator(
			'.wp-block-example-plugin-slider'
		);
		await expect(block).toBeVisible();
	});

	test('should add slides', async ({ page }) => {
		// Insert the block.
		await page.click('.edit-post-header-toolbar__inserter-toggle');
		await page.fill(
			'.block-editor-inserter__search input',
			'Example Plugin Slider'
		);
		await page.click(
			'.block-editor-block-types-list__item[data-id="example-plugin/slider"]'
		);

		// Click add slide button.
		const addSlideButton = page.locator('button:has-text("Add Slide")');
		await addSlideButton.click();

		// Verify slide was added.
		const slide = page.locator(
			'.wp-block-example-plugin-slider__slide'
		);
		await expect(slide).toBeVisible();
	});
});
