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
 * Read the registered block name from a generated block's block.json.
 *
 * @param {string} outputDir Generated plugin directory.
 * @param {string} blockDir  Block directory name under src/blocks.
 * @return {string} The block name.
 */
function readBlockName(outputDir, blockDir) {
	const blockJson = path.join(outputDir, 'src', 'blocks', blockDir, 'block.json');
	return JSON.parse(fs.readFileSync(blockJson, 'utf8')).name;
}

/**
 * List the block import paths in a generated plugin's src/index.js.
 *
 * @param {string} outputDir Generated plugin directory.
 * @return {string[]} Import paths under ./blocks/.
 */
function readIndexImports(outputDir) {
	const index = fs.readFileSync(path.join(outputDir, 'src', 'index.js'), 'utf8');
	return [...index.matchAll(/import '(\.\/blocks\/[^']+)';/g)].map((m) => m[1]);
}

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

		// The collection block is post-type specific, so it is never
		// generated without post types. Generic blocks keep plain names.
		const blockDirs = fs.readdirSync(path.join(outputDir, 'src', 'blocks'));
		expect(blockDirs.sort()).toEqual(['field-display', 'icons', 'slider']);
		expect(readBlockName(outputDir, 'slider')).toBe(`${config.slug}/slider`);
		expect(readBlockName(outputDir, 'field-display')).toBe(
			`${config.slug}/field-display`
		);
		expect(readIndexImports(outputDir)).toEqual([
			'./blocks/field-display',
			'./blocks/slider',
		]);

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
		// slug (here "item"); generic blocks are not prefixed with it.
		const blockDirs = fs.readdirSync(path.join(outputDir, 'src', 'blocks'));
		expect(blockDirs.sort()).toEqual([
			'field-display',
			'icons',
			'item-collection',
			'slider',
		]);
		expect(readBlockName(outputDir, 'item-collection')).toBe(
			`${config.slug}/item-collection`
		);

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

	it('generates one collection block per post type and generic blocks once', () => {
		const config = {
			slug: 'multi-cpt-plugin',
			name: 'Multi CPT Plugin',
			author: 'LightSpeed',
			post_types: [
				{ slug: 'tour', singular: 'Tour', plural: 'Tours' },
				{ slug: 'travel_style', singular: 'Travel Style', plural: 'Travel Styles' },
			],
		};
		const outputDir = generateAndTrack(config);

		const blockDirs = fs.readdirSync(path.join(outputDir, 'src', 'blocks'));
		expect(blockDirs.sort()).toEqual([
			'field-display',
			'icons',
			'slider',
			'tour-collection',
			'travel-style-collection',
		]);

		// Each collection block carries its own post type's variables.
		const travelStyle = path.join(
			outputDir,
			'src',
			'blocks',
			'travel-style-collection'
		);
		expect(readBlockName(outputDir, 'travel-style-collection')).toBe(
			'multi-cpt-plugin/travel-style-collection'
		);
		const blockJson = JSON.parse(
			fs.readFileSync(path.join(travelStyle, 'block.json'), 'utf8')
		);
		expect(blockJson.title).toBe('Travel Style Collection');
		expect(blockJson.render).toBe(
			'multi_cpt_plugin_render_travel_style_collection'
		);
		expect(
			fs.readFileSync(path.join(travelStyle, 'edit.js'), 'utf8')
		).toContain("context.postType || 'travel_style'");

		expect(readIndexImports(outputDir)).toEqual([
			'./blocks/field-display',
			'./blocks/slider',
			'./blocks/tour-collection',
			'./blocks/travel-style-collection',
		]);
	});
});
