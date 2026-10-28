/**
 * ESLint configuration: the WordPress rules from `@wordpress/scripts`, then the
 * plugin's own additions in tools/eslint/.
 */
import wordpress from '@wordpress/scripts/config/eslint.config.cjs';
import plugin from './tools/eslint/index.mjs';

export default [ ...wordpress, ...plugin ];
