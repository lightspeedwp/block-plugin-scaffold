/**
 * Example values for the plugin scaffold's {{tags}}.
 *
 * Renders any tag with the generator's own replaceMustacheVars() and the
 * scaffold's example config (the values the root package.json uses), so the
 * example value of a tag always matches what the generator would produce.
 * Used by validate-mustache-registry.js in strict mode.
 *
 * @module placeholders
 */

const { applyDefaults, replaceMustacheVars } = require('../generate-plugin');

// The scaffold's own example plugin (see the root package.json).
const EXAMPLE_CONFIG = applyDefaults({
	slug: 'example-plugin',
	name: 'Example Plugin',
	description: 'A multi-block WordPress plugin scaffold example',
	author: 'Example Author',
	author_uri: 'https://example.com',
	version: '1.1.0',
});

/**
 * Example value for a tag, or an empty string when the example config has no
 * value for it.
 *
 * @param {string} tag Tag with or without braces, e.g. `slug` or `{{upper.slug}}`.
 * @return {string} Rendered example value.
 */
function getPlaceholder(tag) {
	const name = tag.replace(/^\{\{\s*|\s*\}\}$/g, '');
	return replaceMustacheVars(`{{${name}}}`, EXAMPLE_CONFIG);
}

/**
 * Replace every tag in a string with its example value.
 *
 * @param {string} content Template content.
 * @return {string} Content with example values.
 */
function replacePlaceholders(content) {
	return replaceMustacheVars(content, EXAMPLE_CONFIG);
}

module.exports = { EXAMPLE_CONFIG, getPlaceholder, replacePlaceholders };
