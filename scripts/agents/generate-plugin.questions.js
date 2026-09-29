/**
 * Staged questions for the generate-plugin agent wizard, and the mapping from
 * wizard answers to a plugin-config.json object.
 *
 * Stages follow .github/agents/generate-plugin.agent.md: Stage 1 (Plugin
 * Identity), Stage 1.5 (Content Model), then Stages 2–4 (post type,
 * taxonomy, fields), which are only asked for a custom content model.
 *
 * Patterns mirror .github/schemas/plugin-config.schema.json.
 */

const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,48}[a-z0-9]$/;
const POST_TYPE_SLUG_PATTERN = /^[a-z][a-z0-9_]{0,18}[a-z0-9]$/;
const TAXONOMY_SLUG_PATTERN = /^[a-z][a-z0-9_]{0,30}[a-z0-9]$/;
const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

const isCustom = (answers) => answers.content_model === 'custom';

/**
 * Convert a display name to a plugin slug, e.g. "LS Test" -> "ls-test".
 *
 * @param {string} name Display name.
 * @return {string} Kebab-case slug.
 */
function slugify(name = '') {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/**
 * Convert a snake_case or kebab-case name to a label, e.g. "project_url" ->
 * "Project Url".
 *
 * @param {string} name Field name.
 * @return {string} Title Case label.
 */
function labelFromName(name) {
	return name
		.split(/[_-]+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

/**
 * Default English plural for a label, e.g. "Category" -> "Categories".
 *
 * @param {string} singular Singular label.
 * @return {string} Plural label.
 */
function pluralise(singular = '') {
	if (/[^aeiou]y$/i.test(singular)) {
		return `${singular.slice(0, -1)}ies`;
	}
	if (/(s|x|z|ch|sh)$/i.test(singular)) {
		return `${singular}es`;
	}
	return `${singular}s`;
}

/**
 * Parse a comma-separated list, trimming blanks.
 *
 * @param {string} input Raw answer.
 * @return {string[]} List items.
 */
function splitList(input = '') {
	return String(input)
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

const questions = [
	// Stage 1: Plugin Identity
	{
		name: 'name',
		type: 'input',
		message: 'Plugin name:',
		validate: (input) =>
			(input && input.trim().length >= 2) ||
			'Plugin name must be at least 2 characters.',
	},
	{
		name: 'slug',
		type: 'input',
		message: 'Plugin slug (kebab-case):',
		default: (answers) => slugify(answers.name),
		validate: (input) =>
			SLUG_PATTERN.test(input) ||
			'3–50 characters: lowercase letters, numbers and hyphens, starting with a letter.',
	},
	{
		name: 'description',
		type: 'input',
		message: 'Short description:',
		default: 'A WordPress multi-block plugin.',
	},
	{
		name: 'author',
		type: 'input',
		message: 'Author name:',
		default: 'LightSpeed',
		validate: (input) =>
			(input && input.trim().length >= 2) || 'Author is required.',
	},
	{
		name: 'author_uri',
		type: 'input',
		message: 'Author website (URL, optional):',
		validate: (input) =>
			!input ||
			/^https?:\/\//.test(input) ||
			'Enter a URL starting with http:// or https://, or leave blank.',
	},
	{
		name: 'version',
		type: 'input',
		message: 'Initial version (semver):',
		default: '1.0.0',
		validate: (input) =>
			/^\d+\.\d+\.\d+$/.test(input) ||
			'Use semantic versioning, e.g. 1.0.0.',
	},
	{
		name: 'license',
		type: 'list',
		message: 'License:',
		choices: ['GPL-2.0-or-later', 'GPL-3.0-or-later', 'MIT', 'Apache-2.0'],
		default: 'GPL-2.0-or-later',
	},

	// Stage 1.5: Content Model
	{
		name: 'content_model',
		type: 'list',
		message:
			'Does this plugin need a custom content type (post type or taxonomy), or is it purely functional?',
		choices: [
			{
				name: 'Custom content model (post type, taxonomy, fields)',
				value: 'custom',
			},
			{
				name: 'Functional only (blocks, block bindings, options page)',
				value: 'none',
			},
		],
		default: 'custom',
	},

	// Stage 2: Custom Post Type (custom content model only)
	{
		name: 'post_type_slug',
		type: 'input',
		message: 'Post type slug (snake_case, max 20 characters):',
		when: isCustom,
		validate: (input) =>
			POST_TYPE_SLUG_PATTERN.test(input) ||
			'2–20 characters: lowercase letters, numbers and underscores, starting with a letter.',
	},
	{
		name: 'post_type_singular',
		type: 'input',
		message: 'Post type singular label:',
		when: isCustom,
		default: (answers) => labelFromName(answers.post_type_slug || ''),
		validate: (input) => !!input || 'Singular label is required.',
	},
	{
		name: 'post_type_plural',
		type: 'input',
		message: 'Post type plural label:',
		when: isCustom,
		default: (answers) => pluralise(answers.post_type_singular),
		validate: (input) => !!input || 'Plural label is required.',
	},

	// Stage 3: Taxonomies (custom content model only)
	{
		name: 'addTaxonomy',
		type: 'confirm',
		message: 'Add a taxonomy for this post type?',
		when: isCustom,
		default: false,
	},
	{
		name: 'taxonomy_slug',
		type: 'input',
		message: 'Taxonomy slug (snake_case):',
		when: (answers) => isCustom(answers) && answers.addTaxonomy,
		default: (answers) => `${answers.post_type_slug}_category`,
		validate: (input) =>
			TAXONOMY_SLUG_PATTERN.test(input) ||
			'2–32 characters: lowercase letters, numbers and underscores, starting with a letter.',
	},
	{
		name: 'taxonomy_singular',
		type: 'input',
		message: 'Taxonomy singular label:',
		when: (answers) => isCustom(answers) && answers.addTaxonomy,
		default: (answers) => labelFromName(answers.taxonomy_slug || ''),
		validate: (input) => !!input || 'Singular label is required.',
	},
	{
		name: 'taxonomy_plural',
		type: 'input',
		message: 'Taxonomy plural label:',
		when: (answers) => isCustom(answers) && answers.addTaxonomy,
		default: (answers) => pluralise(answers.taxonomy_singular),
		validate: (input) => !!input || 'Plural label is required.',
	},
	{
		name: 'taxonomy_hierarchical',
		type: 'confirm',
		message: 'Hierarchical (like categories)?',
		when: (answers) => isCustom(answers) && answers.addTaxonomy,
		default: true,
	},

	// Stage 4: Custom Fields (custom content model only)
	{
		name: 'field_names',
		type: 'input',
		message:
			'Custom text fields for the post type (comma-separated snake_case names, optional):',
		when: isCustom,
		validate: (input) =>
			splitList(input).every((name) => FIELD_NAME_PATTERN.test(name)) ||
			'Field names must be snake_case, starting with a letter.',
	},
];

/**
 * Build a plugin-config.json object from wizard answers.
 *
 * Functional-only answers never set post_types, taxonomies or fields, since
 * the generator rejects them alongside content_model "none".
 *
 * @param {Object} answers Wizard answers keyed by question name.
 * @return {Object} Plugin configuration.
 */
function buildConfigFromAnswers(answers) {
	const config = {
		slug: answers.slug,
		name: answers.name.trim(),
		description: answers.description,
		author: answers.author,
		version: answers.version,
		license: answers.license,
		content_model: answers.content_model,
	};
	if (answers.author_uri) {
		config.author_uri = answers.author_uri;
	}

	if (!isCustom(answers)) {
		return config;
	}

	config.post_types = [
		{
			slug: answers.post_type_slug,
			singular: answers.post_type_singular,
			plural: answers.post_type_plural,
		},
	];

	if (answers.addTaxonomy) {
		config.taxonomies = [
			{
				slug: answers.taxonomy_slug,
				singular: answers.taxonomy_singular,
				plural: answers.taxonomy_plural,
				hierarchical: answers.taxonomy_hierarchical,
				post_types: [answers.post_type_slug],
			},
		];
	}

	const fieldNames = splitList(answers.field_names);
	if (fieldNames.length > 0) {
		config.fields = [
			{
				post_type: answers.post_type_slug,
				field_group: fieldNames.map((name) => ({
					name,
					label: labelFromName(name),
					type: 'text',
				})),
			},
		];
	}

	return config;
}

module.exports = {
	questions,
	buildConfigFromAnswers,
	slugify,
};
