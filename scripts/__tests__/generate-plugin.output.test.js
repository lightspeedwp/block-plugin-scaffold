/**
 * Tests for the contents of a generated plugin with post types: rendered
 * templates must not leak placeholders, and scaffold-only files must not be
 * copied into the output.
 *
 * @package
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// generate-plugin.js resolves its output base dir once, at require time,
// relative to process.cwd(). Require it from a fresh temporary directory so
// generated output never lands in the repo's own generated-plugins/.
const TEMP_CWD = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-plugin-output-'));
const ORIGINAL_CWD = process.cwd();
process.chdir(TEMP_CWD);
const { generatePlugin } = require('../generate-plugin');
process.chdir(ORIGINAL_CWD);

const CONFIG = {
	slug: 'output-check-plugin',
	name: 'Output Check Plugin',
	author: 'LightSpeed',
	content_model: 'custom',
	post_types: [
		{ slug: 'project', singular: 'Project', plural: 'Projects' },
		{ slug: 'testimonial', singular: 'Testimonial', plural: 'Testimonials' },
	],
};

let outputDir;

beforeAll(() => {
	outputDir = generatePlugin(CONFIG, false);
});

afterAll(() => {
	fs.rmSync(TEMP_CWD, { recursive: true, force: true });
});

/**
 * Return every {{placeholder}} left in a generated file.
 *
 * @param {string} relativePath Path inside the generated plugin.
 * @return {string[]} Unrendered placeholders.
 */
function leftoverPlaceholders(relativePath) {
	const content = fs.readFileSync(path.join(outputDir, relativePath), 'utf8');
	return content.match(/\{\{[A-Za-z][\w\s|-]*\}\}/g) || [];
}

describe('generatePlugin: output with post types', () => {
	it('renders readme.txt with no placeholders and a complete header', () => {
		expect(leftoverPlaceholders('readme.txt')).toEqual([]);

		const readme = fs.readFileSync(path.join(outputDir, 'readme.txt'), 'utf8');
		expect(readme.match(/^=== .+ ===$/gm)).toEqual([
			'=== Output Check Plugin ===',
		]);
		[
			'Contributors',
			'Tags',
			'Requires at least',
			'Tested up to',
			'Stable tag',
			'Requires PHP',
			'License',
			'License URI',
		].forEach((header) => {
			expect(readme).toMatch(new RegExp(`^${header}: \\S`, 'm'));
		});
	});

	it('renders every per-post-type collection block file without placeholders', () => {
		CONFIG.post_types.forEach(({ slug, singular }) => {
			const blockDir = path.join('src', 'blocks', `${slug}-collection`);
			fs.readdirSync(path.join(outputDir, blockDir)).forEach((file) => {
				expect(leftoverPlaceholders(path.join(blockDir, file))).toEqual([]);
			});

			const readme = fs.readFileSync(
				path.join(outputDir, blockDir, 'README.md'),
				'utf8'
			);
			expect(readme).toContain(`# ${singular} Collection Block`);
		});
	});

	it('does not copy scaffold development artefacts', () => {
		[
			'dryrun-debug.log',
			'test-results',
			'multi-block-plugin-scaffold.code-workspace',
			'IMPLEMENTATION-SUMMARY.md',
			'SCF-JSON-REGISTRATION-CHANGES.md',
			'.specify',
			'.todo',
		].forEach((artefact) => {
			expect(fs.existsSync(path.join(outputDir, artefact))).toBe(false);
		});
	});
});
