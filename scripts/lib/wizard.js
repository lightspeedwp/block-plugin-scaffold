
/**
 * @module wizard
 * @file Wizard.js
 * @description Interactive wizard library for release and plugin scaffolding.
 *
 * This module provides a pluggable, extensible wizard system for gathering configuration
 * data for plugin and release scaffolding. It supports multiple user interface modes,
 * including CLI prompts, JSON file input, environment variables, and mock/test modes.
 *
 * ## Supported Modes
 * - cli: Interactive CLI prompts (inquirer)
 * - interactive: Step-by-step with confirmation (inquirer, multi-step)
 * - advanced: Asks for extra fields (inquirer, if available)
 * - minimal: Only required fields (fast, non-interactive)
 * - silent: Returns empty config (for dry-run or error cases)
 * - json: Load from config file
 * - env: Load from environment variables
 * - mock: Simulated config for tests/dry runs
 * - web: Placeholder for future web UI
 *
 * ## Usage
 *
 *     const { runWizard } = require('./wizard');
 *     const config = await runWizard({ mode: 'cli' });
 *
 * ## TODO
 * - Implement full interactive prompts for 'interactive' mode (multi-step, help, validation)
 * - Add support for web UI in 'web' mode
 * - Add more advanced validation and error handling
 * - Add support for custom field extensions
 */
/**
 * Main wizard runner. Selects interface by options.mode or falls back to CLI/mock.
 * @function runWizard
 * @param {Object} [options] - Wizard options
 * @param {string} [options.mode] - One of 'cli', 'json', 'mock', 'env', 'interactive', 'advanced', 'minimal', 'silent', 'web'.
 * @param {string} [options.configFile] - Path to config file (for json mode).
 * @returns {Promise<Object>} Configuration object.
 */
/**
 * Ensures the wizard config is valid against the canonical schema.
 * @function ensureWizardConfig
 * @param {Object} config - The config object to validate
 * @throws {Error} If config is invalid
 */
// TODO: Add more interface types and improve user experience for each mode.

const fs = require('fs');
const path = require('path');
const { getCanonicalConfigSchema } = require('../validation/define-config-schema');
const { validateConfig } = require('../validation/validate-plugin-config');

// Try to require inquirer, but don't fail if not installed (for non-CLI modes)
let inquirer = null;
try {
	inquirer = require('inquirer');
} catch (e) {
	// Not installed, CLI mode will not be available
}

/**
 * Registry of wizard interface options.
 * Available modes:
 * - cli: Interactive CLI prompts (inquirer)
 * - interactive: Step-by-step with confirmation (inquirer, more granular)
 * - advanced: Asks for extra fields (inquirer, if available)
 * - minimal: Only required fields (fast, non-interactive)
 * - silent: Returns empty config (for dry-run or error cases)
 * - json: Load from config file
 * - env: Load from environment variables
 * - mock: Simulated config for tests/dry runs
 * - web: Placeholder for future web UI
 */
const wizardInterfaces = {
	cli: async () => {
		if (!inquirer) {
			throw new Error('CLI wizard requires inquirer. Please install it with `npm install inquirer`.');
		}
		const questions = [
			{
				type: 'input',
				name: 'slug',
				message: 'Plugin slug (kebab-case):',
				validate: (input) => !!input || 'Slug is required',
			},
			{
				type: 'input',
				name: 'name',
				message: 'Plugin name (Title Case):',
				validate: (input) => !!input || 'Name is required',
			},
			{
				type: 'input',
				name: 'author',
				message: 'Author:',
				default: 'LightSpeed',
			},
		];
		const answers = await inquirer.prompt(questions);
		ensureWizardConfig(answers);
		return answers;
	},
	interactive: async () => {
		// TODO: Implement interactive prompts here (multi-step, validation, help, etc.)
		if (!inquirer) {
			throw new Error('Interactive wizard requires inquirer. Please install it with `npm install inquirer`.');
		}
		// Step-by-step, confirm each step
		const slug = (await inquirer.prompt({
			type: 'input',
			name: 'slug',
			message: 'Step 1: Plugin slug (kebab-case):',
			validate: (input) => !!input || 'Slug is required',
		})).slug;
		const name = (await inquirer.prompt({
			type: 'input',
			name: 'name',
			message: 'Step 2: Plugin name (Title Case):',
			validate: (input) => !!input || 'Name is required',
		})).name;
		const author = (await inquirer.prompt({
			type: 'input',
			name: 'author',
			message: 'Step 3: Author:',
			default: 'LightSpeed',
		})).author;
		const confirm = (await inquirer.prompt({
			type: 'confirm',
			name: 'ok',
			message: `Confirm: slug="${slug}", name="${name}", author="${author}"?`,
			default: true,
		})).ok;
		if (!confirm) throw new Error('Wizard cancelled by user.');
		const config = { slug, name, author };
		ensureWizardConfig(config);
		return config;
	},
	advanced: async () => {
		if (!inquirer) {
			throw new Error('Advanced wizard requires inquirer. Please install it with `npm install inquirer`.');
		}
		const questions = [
			{
				type: 'input',
				name: 'slug',
				message: 'Plugin slug (kebab-case):',
				validate: (input) => !!input || 'Slug is required',
			},
			{
				type: 'input',
				name: 'name',
				message: 'Plugin name (Title Case):',
				validate: (input) => !!input || 'Name is required',
			},
			{
				type: 'input',
				name: 'author',
				message: 'Author:',
				default: 'LightSpeed',
			},
			{
				type: 'input',
				name: 'description',
				message: 'Plugin description:',
				default: 'A WordPress plugin.',
			},
			{
				type: 'input',
				name: 'version',
				message: 'Version (semver):',
				default: '1.0.0',
			},
		];
		const answers = await inquirer.prompt(questions);
		ensureWizardConfig(answers);
		return answers;
	},
	silent: async () => {
		// Returns an empty config (for dry-run or error cases)
		const config = {};
		try {
			ensureWizardConfig(config);
		} catch (e) {
			// Ignore validation errors for silent mode
		}
		return config;
	},
	minimal: async () => {
		// Only required fields, no prompts (could be extended to accept args)
		const config = {
			slug: 'minimal-plugin',
			name: 'Minimal Plugin',
			author: 'LightSpeed',
		};
		ensureWizardConfig(config);
		return config;
	},
	json: async (options = {}) => {
		if (!options.configFile) {
			throw new Error('JSON mode requires options.configFile');
		}
		const configPath = path.resolve(process.cwd(), options.configFile);
		if (!fs.existsSync(configPath)) {
			throw new Error(`Config file not found: ${configPath}`);
		}
		const content = fs.readFileSync(configPath, 'utf8');
		let parsed;
		try {
			parsed = JSON.parse(content);
		} catch (e) {
			throw new Error(`Invalid JSON in config file: ${configPath}`);
		}
		ensureWizardConfig(parsed);
		return parsed;
	},
	mock: async () => {
		// Simulate user input with a mock configuration object.
		const config = {
			slug: 'example-plugin',
			name: 'Example Plugin',
			author: 'Example Author',
		};
		ensureWizardConfig(config);
		return config;
	},
	env: async () => {
		// Gather config from environment variables
		const config = {
			slug: process.env.PLUGIN_SLUG,
			name: process.env.PLUGIN_NAME,
			author: process.env.PLUGIN_AUTHOR || 'LightSpeed',
		};
		ensureWizardConfig(config);
		return config;
	},
	web: async () => {
		// Placeholder for future web UI wizard
		throw new Error('Web wizard interface is not yet implemented.');
	},
};

/**
 * Run a custom prompt wizard with a provided question set.
 *
 * @param {Object} [options]
 * @param {Array} options.questions - Inquirer-style questions
 * @param {string} [options.mode='cli'] - One of 'cli', 'mock', 'json', or 'silent'
 * @param {string} [options.configFile] - JSON file for non-interactive loads
 * @param {Object} [options.mockAnswers] - Values to return in mock/silent modes
 * @returns {Promise<Object>} Collected answers
 */
async function runPromptWizard(options = {}) {
	const { questions, mode = 'cli', configFile, mockAnswers } = options;

	if (!Array.isArray(questions) || questions.length === 0) {
		throw new Error('runPromptWizard requires a non-empty questions array');
	}

	const normalizedMode = mode || 'cli';

	if (normalizedMode === 'mock' || normalizedMode === 'silent') {
		// Resolve defaults in order, like inquirer: function defaults and
		// `when` conditions receive the answers collected so far.
		return questions.reduce((answers, question) => {
			if (question.name in answers) {
				return answers;
			}
			if (typeof question.when === 'function' && !question.when(answers)) {
				return answers;
			}
			const value =
				typeof question.default === 'function'
					? question.default(answers)
					: question.default;
			if (value !== undefined) {
				answers[question.name] = value;
			}
			return answers;
		}, { ...(mockAnswers || {}) });
	}

	if (normalizedMode === 'json') {
		if (!configFile) {
			throw new Error('JSON wizard mode requires a configFile');
		}
		const configPath = path.resolve(process.cwd(), configFile);
		if (!fs.existsSync(configPath)) {
			throw new Error(`Config file not found: ${configPath}`);
		}
		const content = fs.readFileSync(configPath, 'utf8');
		return JSON.parse(content);
	}

	if (!inquirer) {
		throw new Error('CLI wizard mode requires inquirer. Install it or switch to mock/json mode.');
	}

	return inquirer.prompt(questions);
}

/**
 * Main wizard runner. Selects interface by options.mode or falls back to CLI/mock.
 * @param {Object} [options]
 * @param {string} [options.mode] - One of 'cli', 'json', 'mock', 'env'.
 * @param {string} [options.configFile] - Path to config file (for json mode).
 * @returns {Promise<Object>} Configuration object.
 */
async function runWizard(options = {}) {
	const mode = options.mode || (options.configFile ? 'json' : (inquirer ? 'cli' : 'mock'));
	if (!wizardInterfaces[mode]) {
		throw new Error(`Unknown wizard mode: ${mode}`);
	}
	return wizardInterfaces[mode](options);
}

function ensureWizardConfig(config) {
	const schema = getCanonicalConfigSchema();
	const validation = validateConfig(config, schema);
	if (!validation.valid) {
		throw new Error(
			`Wizard generated config is invalid: ${validation.errors
				.map((error) => error.message)
				.join(', ')}`
		);
	}
}

module.exports = {
	runWizard,
	runPromptWizard,
	wizardInterfaces,
};
