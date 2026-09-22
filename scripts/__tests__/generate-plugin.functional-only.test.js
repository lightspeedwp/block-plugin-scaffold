/**
 * Tests for functional-only generation mode (content_model: "none").
 *
 * Verifies the file-presence/absence matrix from
 * .github/spec/002-post-type-exclusion/data-model.md for both a
 * functional-only config and a content-model config, so a regression in
 * either direction is caught (FR-004–FR-008, SC-002, SC-003).
 *
 * @package
 */

const fs = require('fs');
const path = require('path');

const { generatePlugin } = require('../generate-plugin');

// generate-plugin.js resolves its output base dir once, at require time,
// relative to process.cwd() — which under Jest is the repo root. Generated
// output therefore always lands under <repoRoot>/generated-plugins/<slug>
// regardless of any later process.chdir(), so tests clean that directory up
// directly rather than trying to relocate output via chdir.
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const generatedOutputDirs = [];

// Paths whose name depends only on the plugin slug.
const CONTENT_MODEL_SLUG_PATHS = [
	'patterns/{slug}-grid.php',
	'patterns/{slug}-archive.php',
	'patterns/{slug}-card.php',
	'patterns/{slug}-featured.php',
	'patterns/{slug}-meta.php',
	'patterns/{slug}-single.php',
	'patterns/{slug}-slider.php',
	'scf-json/group_{slug}_example.json',
];

// Paths that never vary with config.
const CONTENT_MODEL_STATIC_PATHS = [
	'src/hooks/usePostType.js',
	'src/hooks/useTaxonomies.js',
	'src/hooks/useCollection.js',
	'src/components/TaxonomyFilter',
	'src/components/PostSelector',
];

const ALWAYS_PRESENT_PATHS = [
	'src/index.js',
	'package.json',
	'composer.json',
	'inc/class-core.php',
	'inc/class-block-bindings.php',
	'inc/class-block-styles.php',
	'inc/class-options.php',
	'inc/helper-functions.php',
];

/**
 * Run generatePlugin(), removing any pre-existing output directory first
 * (generatePlugin() refuses to overwrite without --force), and track the
 * output dir for cleanup in afterEach.
 *
 * @param {Object} config Plugin configuration to generate from.
 * @return {string} The generated plugin's output directory.
 */
function generateAndTrack(config) {
	const outputDir = path.join(REPO_ROOT, 'generated-plugins', config.slug);
	fs.rmSync(outputDir, { recursive: true, force: true });
	generatedOutputDirs.push(outputDir);
	return generatePlugin(config, false);
}

afterEach(() => {
	while (generatedOutputDirs.length > 0) {
		fs.rmSync(generatedOutputDirs.pop(), { recursive: true, force: true });
	}
});

describe('generatePlugin: functional-only mode', () => {
	it('excludes all content-model artefacts when content_model is "none"', () => {
		const configPath = path.join(
			__dirname,
			'..',
			'..',
			'tests',
			'fixtures',
			'plugin-config.functional-only.json'
		);
		const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		const outputDir = generateAndTrack(config);

		CONTENT_MODEL_SLUG_PATHS.forEach((templatePath) => {
			const resolved = templatePath.replace('{slug}', config.slug);
			expect(fs.existsSync(path.join(outputDir, resolved))).toBe(
				false
			);
		});

		CONTENT_MODEL_STATIC_PATHS.forEach((staticPath) => {
			expect(fs.existsSync(path.join(outputDir, staticPath))).toBe(
				false
			);
		});

		// No post types configured, so there is no post-type-derived
		// block_slug — assert the blocks dir has nothing collection-related.
		const blockDirs = fs.readdirSync(path.join(outputDir, 'src', 'blocks'));
		expect(blockDirs.some((dir) => dir.endsWith('-collection'))).toBe(
			false
		);

		ALWAYS_PRESENT_PATHS.forEach((genericPath) => {
			expect(fs.existsSync(path.join(outputDir, genericPath))).toBe(
				true
			);
		});
	});

	it('keeps content-model artefacts when content_model is absent (backward compatibility)', () => {
		const config = {
			slug: 'content-model-plugin',
			name: 'Content Model Plugin',
			author: 'LightSpeed',
			post_types: [
				{
					slug: 'item',
					singular: 'Item',
					plural: 'Items',
				},
			],
		};
		const outputDir = generateAndTrack(config);

		CONTENT_MODEL_SLUG_PATHS.forEach((templatePath) => {
			const resolved = templatePath.replace('{slug}', config.slug);
			expect(fs.existsSync(path.join(outputDir, resolved))).toBe(
				true
			);
		});

		CONTENT_MODEL_STATIC_PATHS.forEach((staticPath) => {
			expect(fs.existsSync(path.join(outputDir, staticPath))).toBe(
				true
			);
		});

		// The collection block is generated under the post type's own
		// block_slug (here "item"), not the plugin slug.
		expect(
			fs.existsSync(path.join(outputDir, 'src', 'blocks', 'item-collection'))
		).toBe(true);

		ALWAYS_PRESENT_PATHS.forEach((genericPath) => {
			expect(fs.existsSync(path.join(outputDir, genericPath))).toBe(
				true
			);
		});

		// Post-type JSON is only produced for a content-model config.
		expect(
			fs.existsSync(
				path.join(outputDir, 'scf-json', 'post-type-item.json')
			)
		).toBe(true);
	});
});
