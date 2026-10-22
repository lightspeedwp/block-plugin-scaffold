/**
 * ESLint config for the scaffold repository.
 *
 * Lints the plugin template source with the same defaults a generated plugin
 * uses (templates/eslint.config.cjs). The generator CLI, its Jest suite,
 * scaffold-only config and the plugin-only templates are left out, as they were
 * before (ESLint 9+ no longer skips dot-folders by default).
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
			'scripts/**',
			'templates/**',
			'tests/**',
			'tmp/**',
		],
	},
	...defaultConfig,
	{
		// {{tags}} render to values of any length, so line wrapping is settled
		// by the generator after rendering (formatGeneratedOutput()).
		files: [ 'src/**' ],
		rules: { 'prettier/prettier': 'off' },
	},
];
