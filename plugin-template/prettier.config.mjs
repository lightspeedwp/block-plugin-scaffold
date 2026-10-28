/**
 * Prettier configuration: the WordPress style, as `@wordpress/scripts` ships it,
 * with two-space YAML to match `.editorconfig`.
 */
import config from '@wordpress/scripts/config/.prettierrc.js';

export default {
	...config,
	overrides: [
		...( config.overrides || [] ),
		{
			files: '*.{yml,yaml}',
			options: { useTabs: false, tabWidth: 2 },
		},
	],
};
