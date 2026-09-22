
/**
 * Plugin config validation helpers (restored logic).
 *
 * Provides schema validation and specific checks for fields, taxonomies,
 * and configuration best practices.
 *
 * @module scripts/validation/validate-plugin-config
 */
// TODO: Consider exporting a CLI-friendly runner that prints warnings/errors with codes.
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { loadSchema } = require('./define-config-schema');

/**
 * Validate a plugin configuration object against a JSON schema.
 *
 * @param {Object} config Plugin configuration payload.
 * @param {Object} schema JSON schema to validate against.
 * @return {{valid: boolean, errors: Array|null}} Validation results.
 */
function validateConfig(config, schema) {
	const ajv = new Ajv({
		allErrors: true,
		strict: false,
		validateSchema: false,
	});
	addFormats(ajv);
	const validate = ajv.compile(schema);
	const valid = validate(config);
	return {
		valid,
		errors: validate.errors ? validate.errors : [],
	};
}

/**
 * Ensure each field definition uses a supported type and required extras.
 *
 * @param {Object} config Plugin configuration object.
 * @return {string[]} List of validation errors for fields.
 */
function validateFieldTypes(config) {
	const errors = [];
	if (!config.fields) return errors;
	config.fields.forEach((field, i) => {
		if (
			![
				'text',
				'number',
				'select',
				'checkbox',
				'radio',
				'date',
				'email',
				'url',
				'textarea',
				'repeater',
				'group',
			].includes(field.type)
		) {
			errors.push(
				`Field at index ${i} has invalid type: ${field.type}`
			);
		}
		if (field.type === 'select' && !field.choices) {
			errors.push(
				`Field '${field.name}' of type 'select' requires 'choices' property`
			);
		}
	});
	return errors;
}

/**
 * Validate taxonomy configurations for required slugs and length.
 *
 * @param {Object} config Plugin configuration object.
 * @return {string[]} Taxonomy validation errors.
 */
function validateTaxonomies(config) {
	const errors = [];
	if (!config.taxonomies) return errors;
	config.taxonomies.forEach((tax, i) => {
		if (!tax.slug) {
			errors.push(
				`Taxonomy at index ${i} missing required 'slug' property`
			);
		} else if (tax.slug.length > 20) {
			errors.push(
				`Taxonomy slug too long: '${tax.slug}' (max 20 chars)`
			);
		}
	});
	return errors;
}

/**
 * Ensure content_model: "none" (functional-only) is not combined with a
 * populated post_types or taxonomies array.
 *
 * @param {Object} config Plugin configuration payload.
 * @return {string[]} List of validation errors for the content model flag.
 */
function validateContentModel(config) {
	const errors = [];
	if (config.content_model !== 'none') return errors;

	const postTypeCount = config.post_types ? config.post_types.length : 0;
	const taxonomyCount = config.taxonomies ? config.taxonomies.length : 0;

	if (postTypeCount > 0 || taxonomyCount > 0) {
		errors.push(
			`content_model is "none" (functional-only) but post_types contains ${postTypeCount} entr${
				postTypeCount === 1 ? 'y' : 'ies'
			} and taxonomies contains ${taxonomyCount} entr${
				taxonomyCount === 1 ? 'y' : 'ies'
			}; remove them or set content_model to "custom"`
		);
	}

	return errors;
}

/**
 * Run best-practice checks on the configuration to generate warnings.
 *
 * @param {Object} config Plugin configuration payload.
 * @return {string[]} Best-practice warning messages.
 */
function checkBestPractices(config) {
	const warnings = [];
	if (config.textdomain && config.slug && config.textdomain !== config.slug) {
		warnings.push(
			`textdomain '${config.textdomain}' should match slug '${config.slug}'`
		);
	}
	if (
		config.namespace &&
		config.slug &&
		config.namespace !== config.slug.replace(/-/g, '_')
	) {
		warnings.push(
			`namespace '${config.namespace}' should be '${config.slug.replace(
				/-/g,
				'_'
			)}' (slug with underscores)`
		);
	}
	if (config.cpt_slug && config.cpt_slug.length > 20) {
		warnings.push(
			`cpt_slug '${config.cpt_slug}' is too long (max 20 chars)`
		);
	}
	if (!config.blocks || config.blocks.length === 0) {
		warnings.push('No blocks defined - consider adding at least one block');
	}
	if (!config.templates || config.templates.length === 0) {
		warnings.push(
			'No templates defined - consider adding at least one template'
		);
	}
	return warnings;
}

function loadConfigFile(filePath) {
	const resolvedPath = path.isAbsolute(filePath)
		? filePath
		: path.resolve(__dirname, '..', '..', filePath);
	if (!fs.existsSync(resolvedPath)) {
		throw new Error(`Configuration file not found: ${resolvedPath}`);
	}
	const raw = fs.readFileSync(resolvedPath, 'utf8');
	return JSON.parse(raw);
}

function runCli(args = process.argv.slice(2)) {
	const helpFlags = ['help', '--help', '-h'];
	if (args.some((arg) => helpFlags.includes(arg))) {
		console.log(`
Usage: node scripts/validation/validate-plugin-config.js [options] [path]

Options:
  --schema-only       Validate that the canonical schema parses cleanly.
  --config <path>     Validate a specific config file (defaults to tests/fixtures/plugin-config.mock.json).
`);
		return 0;
	}

	if (args.includes('--schema-only')) {
		loadSchema();
		console.log('✅ JSON schema parsed cleanly');
		return 0;
	}

	const configArg = args.find(
		(arg) => !arg.startsWith('--') && !arg.startsWith('-')
	);
	const configPath =
		configArg ||
		path.join(__dirname, '..', '..', 'tests', 'fixtures', 'plugin-config.mock.json');

	try {
		const config = loadConfigFile(configPath);
		const schema = loadSchema();
		const result = validateConfig(config, schema);
		if (!result.valid) {
			console.error('Plugin configuration validation failed:');
			result.errors.forEach((err) => console.error(err));
			return 1;
		}
		console.log(`✅ Configuration valid: ${path.basename(configPath)}`);
		return 0;
	} catch (error) {
		console.error('Error during configuration validation:', error.message);
		return 1;
	}
}

module.exports = {
	validateConfig,
	validateFieldTypes,
	validateTaxonomies,
	validateContentModel,
	checkBestPractices,
	loadConfigFile,
	runCli,
};

if (require.main === module) {
	process.exit(runCli());
}
