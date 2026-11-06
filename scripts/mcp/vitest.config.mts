/**
 * Vitest configuration for the local MCP generation tooling (BPS-12).
 *
 * Run with `npm run test:mcp`. The tests generate real plugins into temporary
 * folders, so they are slower than unit tests; coverage must stay at 80% or
 * more for the MCP modules.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		root: import.meta.dirname,
		include: [ '__tests__/**/*.test.mts' ],
		environment: 'node',
		testTimeout: 180000,
		hookTimeout: 180000,
		coverage: {
			provider: 'v8',
			include: [ '*.mts' ],
			exclude: [ 'vitest.config.mts' ],
			reporter: [ 'text-summary', 'text' ],
			thresholds: {
				statements: 80,
				branches: 80,
				functions: 80,
				lines: 80,
			},
		},
	},
} );
