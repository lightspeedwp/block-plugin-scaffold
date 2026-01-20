/**
 * Validate Post Type JSON Files
 *
 * This script validates all JSON files in the post-types directory
 * against the schema.json file.
 *
 * Usage: node scripts/validate-post-types.js
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

// ANSI color codes for console output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
};

/**
 * Main validation function
 */
function validatePostTypes() {
	console.log(colors.blue + '🔍 Validating Post Type JSON files...' + colors.reset);
	console.log('');

	const postTypesDir = path.join(__dirname, '../post-types');
	const schemaPath = path.join(postTypesDir, 'schema.json');

	// Check if directories exist
	if (!fs.existsSync(postTypesDir)) {
		console.error(colors.red + '❌ Error: post-types directory not found!' + colors.reset);
		process.exit(1);
	}

	if (!fs.existsSync(schemaPath)) {
		console.error(colors.red + '❌ Error: schema.json not found!' + colors.reset);
		process.exit(1);
	}

	// Load schema
	let schema;
	try {
		const schemaContent = fs.readFileSync(schemaPath, 'utf8');
		schema = JSON.parse(schemaContent);
	} catch (error) {
		console.error(colors.red + '❌ Error loading schema.json:' + colors.reset);
		console.error(error.message);
		process.exit(1);
	}

	// Initialize AJV validator
	const ajv = new Ajv({ allErrors: true });
	const validate = ajv.compile(schema);

	// Get all JSON files (except schema.json)
	const jsonFiles = fs.readdirSync(postTypesDir)
		.filter(file => file.endsWith('.json') && file !== 'schema.json');

	if (jsonFiles.length === 0) {
		console.log(colors.yellow + '⚠️  No post type JSON files found to validate.' + colors.reset);
		return;
	}

	let hasErrors = false;

	// Validate each file
	jsonFiles.forEach(file => {
		const filePath = path.join(postTypesDir, file);
		console.log(colors.blue + `📄 Validating: ${file}` + colors.reset);

		try {
			// Read and parse JSON file
			const content = fs.readFileSync(filePath, 'utf8');
			const data = JSON.parse(content);

			// Validate against schema
			const valid = validate(data);

			if (valid) {
				console.log(colors.green + '   ✓ Valid' + colors.reset);
			} else {
				hasErrors = true;
				console.log(colors.red + '   ✗ Invalid' + colors.reset);
				
				// Display validation errors
				validate.errors.forEach(error => {
					console.log(colors.red + `     - ${error.instancePath}: ${error.message}` + colors.reset);
					if (error.params) {
						console.log(colors.red + `       ${JSON.stringify(error.params)}` + colors.reset);
					}
				});
			}
		} catch (error) {
			hasErrors = true;
			console.log(colors.red + '   ✗ Error reading/parsing file' + colors.reset);
			console.log(colors.red + `     ${error.message}` + colors.reset);
		}

		console.log('');
	});

	// Summary
	if (hasErrors) {
		console.log(colors.red + '❌ Validation failed! Please fix the errors above.' + colors.reset);
		process.exit(1);
	} else {
		console.log(colors.green + '✅ All post type JSON files are valid!' + colors.reset);
	}
}

// Run validation
validatePostTypes();
