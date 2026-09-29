
/**
 * Plugin config validation helpers
 *
 * @package
 */

const fs = require('fs');
const path = require('path');

const {
	validateConfig,
	validateFieldTypes,
	validateTaxonomies,
	validateContentModel,
	checkBestPractices,
} = require('../validate-plugin-config');

const { loadConfigFile } = require('../../generate-plugin');

const FIXTURE_PATH = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'tests',
	'fixtures',
	'plugin-config.test.json'
);

describe('Plugin configuration validation', () => {
	const fixtureConfig = loadConfigFile(FIXTURE_PATH);
	const schemaPath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'.github',
		'schemas',
		'plugin-config.schema.json'
	);
	const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

	test('validateConfig accepts a valid configuration file', () => {
		const result = validateConfig(fixtureConfig, schema);

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	test('validateFieldTypes reports invalid definitions', () => {
		const config = {
			fields: [
				{
					name: 'field_one',
					label: 'Invalid field',
					type: 'unsupported',
				},
				{ name: 'choices', label: 'Needs options', type: 'select' },
			],
		};

		const errors = validateFieldTypes(config);

		expect(errors).toEqual(
			expect.arrayContaining([
				expect.stringContaining(
					'Field at index 0 has invalid type: unsupported'
				),
				expect.stringContaining(
					"Field 'choices' of type 'select' requires 'choices' property"
				),
			])
		);
	});

	test('validateTaxonomies catches missing or invalid slugs', () => {
		const config = {
			taxonomies: [
				{ singular: 'Book', plural: 'Books' },
				{
					slug: 'too-long-taxonomy-slug-example-123',
					singular: 'Series',
					plural: 'Series',
				},
			],
		};

		const errors = validateTaxonomies(config);

		expect(errors).toEqual(
			expect.arrayContaining([
				"Taxonomy at index 0 missing required 'slug' property",
				expect.stringContaining('slug too long'),
			])
		);
	});

	test('validateContentModel flags content_model "none" combined with post_types/taxonomies', () => {
		const config = {
			content_model: 'none',
			post_types: [
				{ slug: 'tour', singular: 'Tour', plural: 'Tours' },
			],
			taxonomies: [
				{ slug: 'destination', singular: 'Destination', plural: 'Destinations' },
			],
		};

		const errors = validateContentModel(config);

		expect(errors).toEqual(
			expect.arrayContaining([
				expect.stringContaining('content_model is "none"'),
			])
		);
		expect(errors[0]).toContain('post_types contains 1 entry');
		expect(errors[0]).toContain('taxonomies contains 1 entry');
	});

	test('validateContentModel allows content_model "none" with empty or absent post_types/taxonomies', () => {
		expect(validateContentModel({ content_model: 'none' })).toEqual([]);
		expect(
			validateContentModel({
				content_model: 'none',
				post_types: [],
				taxonomies: [],
			})
		).toEqual([]);
	});

	test('validateContentModel is a no-op when content_model is "custom" or absent', () => {
		expect(
			validateContentModel({
				content_model: 'custom',
				post_types: [{ slug: 'tour', singular: 'Tour', plural: 'Tours' }],
			})
		).toEqual([]);
		expect(
			validateContentModel({
				post_types: [{ slug: 'tour', singular: 'Tour', plural: 'Tours' }],
			})
		).toEqual([]);
	});

	test('checkBestPractices highlights mismatches and missing sections', () => {
		const config = {
			slug: 'example-plugin',
			textdomain: 'different-domain',
			namespace: 'exampleplugin',
			cpt_slug: 'very-long-custom-post-type-slug',
			blocks: [],
			templates: [],
		};

		const warnings = checkBestPractices(config);

		expect(warnings).toEqual(
			expect.arrayContaining([
				"textdomain 'different-domain' should match slug 'example-plugin'",
				"namespace 'exampleplugin' should be 'example_plugin' (slug with underscores)",
				expect.stringContaining(
					"cpt_slug 'very-long-custom-post-type-slug'"
				),
				'No blocks defined - consider adding at least one block',
				'No templates defined - consider adding at least one template',
			])
		);
	});
});
