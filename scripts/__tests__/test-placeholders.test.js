/**
 * Tests for scripts/utils/placeholders.js.
 *
 * @package
 */

const {
	getPlaceholder,
	replacePlaceholders,
} = require('../utils/placeholders');

describe('placeholders', () => {
	it('renders plugin tags from the scaffold example config', () => {
		expect(getPlaceholder('slug')).toBe('example-plugin');
		expect(getPlaceholder('{{namespace}}')).toBe('example_plugin');
		expect(getPlaceholder('textdomain')).toBe('example-plugin');
		expect(getPlaceholder('name')).toBe('Example Plugin');
	});

	it('applies filters the way the generator does', () => {
		expect(getPlaceholder('upper.namespace')).toBe('EXAMPLE_PLUGIN');
	});

	it('returns an empty string for a tag the example config does not set', () => {
		expect(getPlaceholder('not_a_variable')).toBe('');
	});

	it('replaces every tag in content', () => {
		expect(replacePlaceholders("__( 'Hi', '{{textdomain}}' )")).toBe(
			"__( 'Hi', 'example-plugin' )"
		);
	});
});
