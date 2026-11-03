/**
 * ESLint configuration: the WordPress rules from `@wordpress/scripts`, then the
 * plugin's own additions in tools/eslint/.
 */
import wordpress from '@wordpress/scripts/config/eslint.config.cjs';
import plugin from './tools/eslint/index.mjs';

export default [
	// Skills vendored unmodified from WordPress/agent-skills (see
	// .agents/skills/VENDORED.md); they follow upstream formatting, not ours.
	{ ignores: [ '.agents/skills/**' ] },
	...wordpress,
	...plugin,
];
