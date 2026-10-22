/**
 * Tests for check-generation.js.
 *
 * @package
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
	findLeftovers,
	findMissingAssetFiles,
	runSteps,
} = require('../check-generation');

/**
 * Write a minimal generated plugin.
 *
 * @param {Object<string, string>} files Relative path to content.
 * @return {string} Plugin root.
 */
function makePlugin(files) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-generation-test-'));
	Object.entries(files).forEach(([file, content]) => {
		fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
		fs.writeFileSync(path.join(root, file), content);
	});
	return root;
}

describe('findLeftovers', () => {
	it('reports template tags and scaffold example values with file and line', () => {
		const root = makePlugin({
			'package.json': '{\n"name": "gen-check"\n}\n',
			'gen-check.php': '<?php\n/**\n * Plugin Name: {{name}}\n */\n',
			'readme.txt': '=== Gen Check ===\nContributors: example-plugin\n',
		});

		expect(findLeftovers(root, 'gen-check')).toEqual([
			{ file: 'gen-check.php', line: 3, value: '{{name}}' },
			{ file: 'readme.txt', line: 2, value: 'example-plugin' },
		]);
	});

	it('returns nothing for a clean plugin', () => {
		const root = makePlugin({
			'package.json': '{ "name": "gen-check" }',
			'gen-check.php': '<?php // Plugin Name: Gen Check',
			'readme.txt': '=== Gen Check ===',
		});

		expect(findLeftovers(root, 'gen-check')).toEqual([]);
	});

	it('does not mistake GitHub Actions expressions for template tags', () => {
		const root = makePlugin({
			'package.json': '{ "run": "${{ github.ref }}" }',
			'gen-check.php': '<?php',
			'readme.txt': '',
		});

		expect(findLeftovers(root, 'gen-check')).toEqual([]);
	});
});

describe('findMissingAssetFiles', () => {
	it('lists block scripts built without an asset file', () => {
		const root = makePlugin({
			'build/blocks/one/index.js': '',
			'build/blocks/one/index.asset.php': '<?php return array();',
			'build/blocks/two/index.js': '',
		});

		expect(findMissingAssetFiles(root)).toEqual(['build/blocks/two/index.js']);
	});
});

describe('runSteps', () => {
	it('runs steps in order and stops at the first failure', () => {
		const ran = [];
		const results = runSteps(
			[
				{ name: 'one', run: () => ran.push('one') },
				{
					name: 'two',
					run: () => {
						ran.push('two');
						throw new Error('broken');
					},
				},
				{ name: 'three', run: () => ran.push('three') },
			],
			() => 0
		);

		expect(ran).toEqual(['one', 'two']);
		expect(results.map(({ name, ok }) => [name, ok])).toEqual([
			['one', true],
			['two', false],
		]);
		expect(results[1].error).toBe('broken');
	});
});
