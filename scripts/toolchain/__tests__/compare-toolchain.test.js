/**
 * Tests for compare-toolchain.js.
 *
 * @package
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { compareToolchain } = require('../compare-toolchain');

/**
 * Write a minimal plugin with the given files.
 *
 * @param {Object<string, string|Object>} files Relative path to content.
 * @return {string} Plugin root.
 */
function makePlugin(files) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'compare-toolchain-test-'));
	Object.entries(files).forEach(([file, content]) => {
		fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
		fs.writeFileSync(
			path.join(root, file),
			typeof content === 'string' ? content : JSON.stringify(content)
		);
	});
	return root;
}

const base = {
	'package.json': { name: 'one', scripts: { build: 'wp-scripts build' } },
	'composer.json': { name: 'one/one', scripts: { lint: 'phpcs' } },
	'eslint.config.mjs': 'export default [];\n',
	'test/unit/a.test.js': 'test();\n',
};

describe('compareToolchain', () => {
	it('ignores plugin metadata in the manifests', () => {
		const a = makePlugin(base);
		const b = makePlugin({
			...base,
			'package.json': { ...base['package.json'], name: 'two', homepage: 'x' },
			'composer.json': { ...base['composer.json'], name: 'two/two' },
		});

		expect(compareToolchain(a, b)).toEqual([]);
	});

	it('reports changed scripts, configs and tests', () => {
		const a = makePlugin(base);
		const b = makePlugin({
			...base,
			'package.json': { name: 'one', scripts: { build: 'other' } },
			'eslint.config.mjs': 'export default [ {} ];\n',
			'test/unit/a.test.js': 'test( 1 );\n',
		});

		expect(compareToolchain(a, b).map(({ file }) => file)).toEqual([
			'eslint.config.mjs',
			'package.json',
			'test/unit/a.test.js',
		]);
	});

	it('reports files that exist on one side only', () => {
		const a = makePlugin(base);
		const b = makePlugin({ ...base, 'test/e2e/extra.spec.js': 'x' });

		expect(compareToolchain(a, b)).toEqual([
			{ file: 'test/e2e/extra.spec.js', a: null, b: 'x' },
		]);
	});
});
