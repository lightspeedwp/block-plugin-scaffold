/**
 * ESLint config for the scaffold repository.
 *
 * Lints the plugin template source with the same defaults a generated plugin
 * uses (plugin-template/eslint.config.cjs). The generator CLI, its Jest suite,
 * scaffold-only config and the plugin's own configs and starter tests are left
 * out (ESLint 9+ no longer skips dot-folders by default).
 */
const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	{
		ignores: [
			'.github/**',
			'.lighthouserc.js',
			'bin/**',
			'coverage/**',
			'generated-plugins/**',
			'jest.config.js',
			'logs/**',
			'plugin-template/eslint.config.cjs',
			'plugin-template/playwright.config.js',
			'plugin-template/tests/**',
			'plugin-template/vitest.config.mjs',
			'scripts/**',
			'tests/**',
			'tmp/**',
		],
	},
	...defaultConfig,
	{
		// {{tags}} render to values of any length, so line wrapping is settled
		// by the generator after rendering (formatGeneratedOutput()).
		files: [ 'plugin-template/src/**' ],
		rules: { 'prettier/prettier': 'off' },
	},
];
