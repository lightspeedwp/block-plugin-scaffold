import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

export default defineConfig( {
	plugins: [
		react( {
			// Block source uses JSX in .js files, as @wordpress/scripts allows.
			parserConfig: ( id ) =>
				/\.[cm]?jsx?$/.test( id )
					? { syntax: 'ecmascript', jsx: true }
					: undefined,
		} ),
	],
	test: {
		environment: 'jsdom',
		globals: false,
		include: [ 'tests/js/**/*.test.{js,jsx}' ],
		restoreMocks: true,
		setupFiles: [ './tests/js/setup.js' ],
		// Measures the files the tests load; fails the run below the thresholds.
		coverage: {
			enabled: true,
			provider: 'v8',
			reporter: [ 'text', 'lcov' ],
			thresholds: {
				branches: 70,
				statements: 80,
				functions: 80,
			},
		},
	},
} );
