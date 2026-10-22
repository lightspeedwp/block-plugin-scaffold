/**
 * Jest Configuration
 *
 * @see https://jestjs.io/docs/configuration
 */

// The scaffold's own Jest suite. @wordpress/scripts 36 no longer ships Jest
// defaults, so this uses the published preset and runs through
// `wp-scripts test-unit-jest`. Generated plugins use Vitest (plugin-template/).
module.exports = {
	preset: '@wordpress/jest-preset-default',
	transform: {
		'\\.[jt]sx?$': [
			'babel-jest',
			{ presets: [ '@wordpress/babel-preset-default' ] },
		],
	},

	// Test file patterns
	testMatch: [
		'**/tests/js/**/*.test.js',
		'**/tests/**/*.test.js',
		'**/?(*.)+(spec|test).js',
	],

	// Files to ignore
	testPathIgnorePatterns: [
		'/node_modules/',
		'/vendor/',
		'/build/',
		'/tests/e2e/',
		'/.dry-run-backup/',
		'/generated-plugins/',
		'/plugin-template/',
	],

	// Setup files
	setupFilesAfterEnv: ['<rootDir>/.github/__tests__/setup-tests.js'],

	// Coverage configuration
	collectCoverageFrom: [
		'scripts/dry-run-config.js',
		'scripts/generate-plugin.js',
	],

	coverageDirectory: 'coverage',

	coverageReporters: [
		'text',
		'text-summary',
		'html',
		'lcov',
		'json',
		'json-summary',
	],

	coverageThreshold: {
		global: {
			branches: 0,
			functions: 0,
			lines: 5,
			statements: 5,
		},
	},

	// Module paths
	moduleNameMapper: {
		'\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
		'\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js',
	},

	// Transform ES modules from node_modules
	transformIgnorePatterns: ['node_modules/(?!(parsel-js)/)'],

	// Verbose output
	verbose: true,
};
