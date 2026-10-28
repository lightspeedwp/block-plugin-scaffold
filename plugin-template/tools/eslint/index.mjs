/**
 * The plugin's ESLint additions, applied after the WordPress rules.
 */
export default [
	// Generated reports and test output, on top of the WordPress ignores
	// (build/, node_modules/ and vendor/).
	{
		ignores: [
			'artifacts/**',
			'coverage/**',
			'dist/**',
			'playwright-report/**',
			'test-results/**',
		],
	},
];
