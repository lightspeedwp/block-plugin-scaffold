/**
 * Stylelint configuration: the WordPress SCSS rules from `@wordpress/scripts`,
 * with class names in BEM form (block__element--modifier).
 */
module.exports = {
	extends: '@wordpress/scripts/config/.stylelintrc.json',
	rules: {
		'selector-class-pattern': [
			'^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
			{
				resolveNestedSelectors: true,
				message: ( selector ) =>
					`Expected class "${ selector }" to be BEM: block__element--modifier, lowercase with hyphens`,
			},
		],
	},
};
