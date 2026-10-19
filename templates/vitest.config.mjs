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
	},
} );
