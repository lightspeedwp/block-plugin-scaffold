#!/usr/bin/env node
// Detect maximum dry run mode
function isMaximumDryRun(args) {
	return (
		process.env.DRY_RUN === 'maximum' ||
		args['dry-run'] === 'maximum' ||
		args['max-dry-run'] === true
	);
}
/* eslint-disable no-console */

/**
 * @file Plugin Generation Agent
 * @description This agent script manages the end-to-end process of generating a new
 * WordPress plugin from the scaffold. It handles command-line arguments,
 * orchestrates the interactive configuration wizard, and executes the file
 * generation and setup steps.
 */

const fs = require('fs');
const path = require('path');
const { getCanonicalConfigSchema } = require('../validation/validate-config-schema.js');
const {
	validateConfig: validateAgainstSchema,
	validateContentModel,
} = require('../validation/validate-plugin-config.js');
const { runPromptWizard } = require('../lib/wizard.js');
const { FileLogger } = require('../lib/logger.js');
const { generatePlugin } = require('../generate-plugin.js');
const {
	questions: wizardQuestions,
	buildConfigFromAnswers,
} = require('./generate-plugin.questions.js');
const minimist = require('minimist');

/**
 * Validate a plugin configuration against the canonical schema, including
 * the content_model conflict checks the generator also enforces.
 *
 * @param {Object} config Plugin configuration.
 * @return {{valid: boolean, errors: Array}} Validation result.
 */
function validateConfig(config) {
	const result = validateAgainstSchema(config, getCanonicalConfigSchema());
	const contentModelErrors = validateContentModel(config).map((message) => ({
		instancePath: '/content_model',
		keyword: 'content_model',
		message,
	}));
	const errors = [...(result.errors || []), ...contentModelErrors];
	return { valid: errors.length === 0, errors };
}

/**
 * Generate the plugin, reporting the output location.
 *
 * @param {Object}     config  Validated plugin configuration.
 * @param {boolean}    inPlace Process the current directory (template mode).
 * @param {FileLogger} logger  The logger instance.
 */
function runGenerator(config, inPlace, logger) {
	const outputDir = generatePlugin(config, inPlace);
	logger.info(`✓ Plugin generated at: ${outputDir}`);
}

/**
 * Print a summary of the configuration, matching the agent spec's
 * pre-generation summary.
 *
 * @param {Object} config Plugin configuration.
 */
function printSummary(config) {
	const lines = [
		'',
		'Configuration summary',
		`  Plugin:        ${config.name} (${config.slug})`,
		`  Author:        ${config.author}`,
		`  Version:       ${config.version}`,
		`  Content model: ${config.content_model}`,
	];
	(config.post_types || []).forEach((postType) => {
		lines.push(`  Post type:     ${postType.slug} (${postType.plural})`);
	});
	(config.taxonomies || []).forEach((taxonomy) => {
		lines.push(`  Taxonomy:      ${taxonomy.slug} (${taxonomy.plural})`);
	});
	(config.fields || []).forEach((group) => {
		lines.push(
			`  Fields:        ${group.field_group.map((field) => field.name).join(', ')}`
		);
	});
	console.log(`${lines.join('\n')}\n`);
}

/**
 * Display help information and usage instructions.
 * This function prints a formatted help message to the console,
 * detailing the script's usage, available options, and examples.
 *
 * @return {void}
 */
function displayHelp() {
	const help = `
Multi-Block Plugin Scaffold Generator

Usage:
  node generate-plugin.agent.js [options]

Options:
  --help         Display this help message
  --schema       Output JSON schema
  --json         Accept configuration via stdin
  --validate     Validate configuration (provide config as argument)
  --config <path> Load configuration from a JSON file and generate the plugin
  --in-place     Generate into the current directory (template mode)
  --force        Overwrite an existing generated-plugins/<slug> directory
  --dry-run      Run without writing any files

Examples:
  Interactive (asks the staged questions, then generates):
    node generate-plugin.agent.js

  With JSON:
    echo '{"slug":"my-plugin","name":"My Plugin","author":"Author"}' | node generate-plugin.agent.js --json

  Validate:
    node generate-plugin.agent.js --validate '{"slug":"test",...}'

  From config file:
    node generate-plugin.agent.js --config ./my-config.json

  Schema:
    node generate-plugin.agent.js --schema
`;
	console.log(help);
}

/**
 * Display the stored JSON schema for plugin configuration.
 * It loads the schema using `loadSchema` and prints it to the console
 * in a human-readable JSON format.
 *
 * @return {void}
 */
function displaySchema() {
	const schema = getCanonicalConfigSchema();
	console.log(JSON.stringify(schema, null, 2));
}

/**
 * Handle JSON mode by reading configuration data from stdin.
 * This function reads a JSON string from standard input, parses it,
 * validates it against the schema, and if valid, writes it to
 * `plugin-config.json` in the current working directory.
 * It provides detailed error feedback for invalid JSON or failed
 * validation.
 *
 * @param {FileLogger} logger - The logger instance.
 * @param {boolean} dryRun - If true, file writing will be skipped.
 * @async
 * @returns {Promise<void>} A promise that resolves on success or rejects on error.
 */
async function handleJsonMode(logger, dryRun) {
		if (dryRun === 'maximum' || process.env.DRY_RUN === 'maximum') {
			logger.info('[MAXIMUM DRY RUN] All actions are simulated. Returning mock config.');
			return { slug: 'mock-plugin', name: 'Mock Plugin', author: 'Mock Author' };
		}
	const input = await new Promise((resolve, reject) => {
		let data = '';
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', (chunk) => (data += chunk));
		process.stdin.on('end', () => resolve(data));
		process.stdin.on('error', (err) => reject(err));
	});

	if (!input) {
		logger.error('Error: No data received from stdin.');
		process.exit(1);
	}

	try {
		// Parse JSON
		const config = JSON.parse(input);

		// Validate configuration
		const result = validateConfig(config);

		if (!result.valid) {
			reportValidationErrors(result, logger);
			process.exit(1);
		}

		// Configuration is valid
		logger.info('✓ Configuration validated successfully');

		if (dryRun) {
			logger.info('[Dry Run] Would write configuration to plugin-config.json');
		} else {
			// Write to plugin-config.json
			const outputPath = path.join(process.cwd(), 'plugin-config.json');
			await fs.promises.writeFile(outputPath, JSON.stringify(config, null, 2));
			logger.info(`✓ Configuration written to: ${outputPath}`);
		}
	} catch (error) {
		logger.error('Error processing configuration:', { error: error.message });
		process.exit(1);
	}
}

// TODO: After successful dry-run JSON validation link this path to the actual generator workflow.

/**
 * Handles configuration provided via a file path.
 * Reads the file, parses it as JSON, validates it, and then proceeds
 * to the generation step.
 *
 * @param {string} configPath - Path to the configuration JSON file.
 * @param {FileLogger} logger - The logger instance.
 * @param {boolean} dryRun - If true, plugin generation will be skipped.
 * @returns {Promise<void>}
 */
async function handleFileConfigMode(configPath, logger, dryRun, inPlace = false) {
		if (dryRun === 'maximum' || process.env.DRY_RUN === 'maximum') {
			logger.info('[MAXIMUM DRY RUN] All actions are simulated. Returning mock config.');
			return { slug: 'mock-plugin', name: 'Mock Plugin', author: 'Mock Author' };
		}
	logger.info(`Loading configuration from: ${configPath}`);
	try {
		const fileContent = await fs.promises.readFile(configPath, 'utf8');
		const config = JSON.parse(fileContent);

		const result = validateConfig(config);
		if (!result.valid) {
			reportValidationErrors(result, logger);
			process.exit(1);
		}

		logger.info('✓ Configuration from file is valid.');

		if (dryRun) {
			logger.info('[Dry Run] Would generate plugin with the provided configuration.');
		} else {
			runGenerator(config, inPlace, logger);
		}
	} catch (error) {
		logger.error(`Failed to process config file: ${configPath}`, {
			error: error.message,
		});
		process.exit(1);
	}
}

/**
 * Handle validate mode - validate configuration from argument
 * This function takes a JSON string as an argument, parses it, and
 * validates it against the schema. It prints a success message if valid,
 * or detailed error messages if invalid. The process exits with a non-zero
 * status code on failure.
 *
 * @param {string} configJson - JSON configuration string
 * @param {FileLogger} logger - The logger instance.
 * @return {void}
 */
function handleValidateMode(configJson, logger) {
	try {
		// Parse JSON
		const config = JSON.parse(configJson);

		// Validate configuration
		const result = validateConfig(config);

		if (!result.valid) {
			reportValidationErrors(result, logger);
			process.exit(1);
		}

		// Configuration is valid
		logger.info('✓ Configuration is valid');
		process.exit(0);
	} catch (error) {
		if (error instanceof SyntaxError) {
			logger.error('Invalid JSON provided for validation.', { error: error.message });
		} else {
			logger.error('Error validating configuration.', { error: error.message });
		}
		process.exit(1);
	}
}

/**
 * Reports validation errors to the console in a structured format.
 *
 * @param {Object} validationResult - The result object from `validateConfig`.
 * @param {FileLogger} logger - The logger instance.
 */
function reportValidationErrors(validationResult, logger) {
	logger.error('Configuration validation failed.');
	if (validationResult.errors && validationResult.errors.length > 0) {
		validationResult.errors.forEach((error) => {
			// The path to the invalid property, e.g., "/slug"
			const propertyPath = error.instancePath.substring(1) || 'config';
			let message = error.message;

			// Provide a more user-friendly message for required fields.
			if (error.keyword === 'required') {
				message = `is a required property (missing: '${error.params.missingProperty}')`;
			}

			// Log structured error for file, but keep console simple.
			logger.error(`Validation error for '${propertyPath}': ${message}`, { propertyPath, error: error.message });
		});
	}
}

/**
 * Run the interactive wizard to gather configuration from the user.
 *
 * @param {FileLogger} logger - The logger instance.
 * @param {boolean} dryRun - If true, plugin generation will be skipped.
 * @async
 * @returns {Promise<void>} A promise that resolves when the plugin generation is complete.
 */
async function runInteractiveMode(logger, dryRun, inPlace = false) {
	if (dryRun === 'maximum' || process.env.DRY_RUN === 'maximum') {
		logger.info('[MAXIMUM DRY RUN] All actions are simulated. Returning mock config.');
		return { slug: 'mock-plugin', name: 'Mock Plugin', author: 'Mock Author' };
	}
	logger.info('Starting interactive plugin generator...');
	const answers = await runPromptWizard({ questions: wizardQuestions });
	const config = buildConfigFromAnswers(answers);

	const result = validateConfig(config);
	if (!result.valid) {
		reportValidationErrors(result, logger);
		process.exit(1);
	}

	printSummary(config);
	const { confirmed } = await runPromptWizard({
		questions: [
			{
				name: 'confirmed',
				type: 'confirm',
				message: 'Ready to generate?',
				default: true,
			},
		],
	});
	if (!confirmed) {
		logger.info('Generation cancelled.');
		return;
	}

	if (dryRun) {
		logger.info('[Dry Run] Would generate plugin with the received configuration.', { config });
	} else {
		runGenerator(config, inPlace, logger);
	}
}

/**
 * CLI entry point for the generator agent.
 * Parses command-line arguments and routes to the appropriate handler function
 * based on the flags provided (e.g., `--help`, `--schema`, `--json`, `--validate`).
 * If no recognized flags are given, it displays the help message and exits.
 *
 * @async
 * @return {void}
 */
async function main() {
	const logger = new FileLogger('generate-plugin-agent', 'agents');
	try {
		const args = minimist(process.argv.slice(2), {
			boolean: ['help', 'schema', 'json', 'dry-run', 'max-dry-run', 'in-place', 'template', 'force'],
			string: ['validate', 'config'],
			alias: { h: 'help' },
		});

		const dryRun = args['dry-run'];
		const inPlace = args['in-place'] || args.template;
		const maxDryRun = isMaximumDryRun(args);
		if (maxDryRun) {
			logger.info('=== MAXIMUM DRY RUN MODE ENABLED: All side effects are simulated. ===');
		} else if (dryRun) {
			logger.info('--- Dry Run Mode Enabled: No files will be written. ---');
		}

		// Handle --help flag
		if (args.help) {
			displayHelp();
			return;
		}

		// Handle --schema flag
		if (args.schema) {
			displaySchema();
			return;
		}

		// Handle --json flag (read from stdin)
		if (args.json) {
			await handleJsonMode(logger, maxDryRun || dryRun);
			return;
		}

		// Handle --validate flag
		if (args.validate !== undefined) {
			const configJson = args.validate || args._[0];
			if (!configJson) {
				logger.error('Error: --validate requires a JSON string or file path argument.');
				process.exit(1);
			}
			handleValidateMode(configJson, logger);
			return;
		}

		// Handle --config flag
		if (args.config) {
			await handleFileConfigMode(args.config, logger, maxDryRun || dryRun, inPlace);
			return;
		}

		// Default to interactive mode if no other flags are provided.
		await runInteractiveMode(logger, maxDryRun || dryRun, inPlace);
	} catch (error) {
		logger.error('An unexpected error occurred in the agent.', { error: error.stack });
		process.exit(1);
	} finally {
		// Ensure all buffered logs are written to the file before exiting.
		await logger.save();
	}
}

// Run main function if executed directly
if (require.main === module) {
	main();
}

module.exports = main;
