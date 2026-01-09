#!/usr/bin/env node
/* eslint-disable no-console, jsdoc/require-param-type */

/**
 * generate-plugin.js
 *
 * Multi-block plugin generator from scaffold with mustache template processing.
 * Supports both JSON config file and interactive wizard.
 *
 * Usage:
 *   Generator mode: node scripts/generate-plugin.js --config my-plugin-config.json
 *   Template mode:  node scripts/generate-plugin.js --config my-plugin-config.json --in-place
 *   Validate:       node scripts/generate-plugin.js --validate my-plugin-config.json
 *   Help:           node scripts/generate-plugin.js --help
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Ajv2020 = require('ajv/dist/2020');

// Paths
const scaffoldDir = path.resolve(__dirname, '..');
const schemaPath = path.join(
	scaffoldDir,
	'.github/schemas/plugin-config.schema.json'
);
const outputBaseDir = path.resolve(process.cwd(), 'generated-plugins');

// Template mode flag
const isTemplateMode =
	process.argv.includes('--in-place') || process.argv.includes('--template');

// Create logs directory
const logsDir = path.join(scaffoldDir, 'logs');
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
}

// Global log state
let logStream = null;
let logFile = null;
let logEntries = [];

/**
 * Initialize logging for a specific plugin slug
 * @param {string} slug - Plugin slug for log file name
 */
function initializeLogging(slug) {
	if (logStream) {
		return; // Already initialized
	}

	logFile = path.join(logsDir, `generate-plugin-${slug}.log`);

	// Load existing log entries if file exists
	if (fs.existsSync(logFile)) {
		try {
			const existingContent = fs.readFileSync(logFile, 'utf8');
			if (existingContent.trim()) {
				logEntries = JSON.parse(existingContent);
			}
		} catch (error) {
			// If file exists but is not valid JSON, start fresh
			logEntries = [];
		}
	}

	// Stream not needed - we'll write synchronously on close
	logStream = true; // Flag to indicate logging is initialized
}

/**
 * Log function - stores entries in JSON format
 * @param {string} level   - Log level (INFO, WARN, ERROR, DEBUG)
 * @param {string} message - Log message
 * @param {Object} data    - Optional additional data
 */
function log(level, message, data = null) {
	const entry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...(data && { data }),
	};

	logEntries.push(entry);

	// Console output for immediate feedback
	const consoleMessage = `[${entry.timestamp}] [${level}] ${message}`;
	if (level === 'ERROR') {
		console.error(consoleMessage);
	} else if (level === 'WARN') {
		console.warn(consoleMessage);
	} else {
		console.log(consoleMessage);
	}
}

/**
 * Close log stream and finalize log file
 */
function closeLogging() {
	if (logFile && logEntries.length > 0) {
		try {
			// Write synchronously to ensure log persists
			fs.writeFileSync(
				logFile,
				JSON.stringify(logEntries, null, 2),
				'utf8'
			);
		} catch (error) {
			console.error('Failed to write log file:', error.message);
		}
	}
	logStream = null;
}

// Cleanup on exit
process.on('exit', () => {
	closeLogging();
});

process.on('SIGINT', () => {
	log('WARN', 'Generator interrupted by user');
	closeLogging();
	process.exit(1);
});

/**
 * Sanitize user input to prevent security vulnerabilities
 * @param input
 * @param type
 */
function sanitizeInput(input, type = 'text') {
	if (!input || typeof input !== 'string') {
		return input;
	}

	// Remove null bytes and control characters
	let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '');

	switch (type) {
		case 'slug':
			// Convert to lowercase, replace spaces and underscores with hyphens
			sanitized = sanitized.toLowerCase().replace(/[\s_]+/g, '-');
			// Only lowercase letters, numbers, and hyphens
			sanitized = sanitized.replace(/[^a-z0-9-]/g, '');
			// Remove consecutive hyphens
			sanitized = sanitized.replace(/-+/g, '-');
			// Trim hyphens from ends
			sanitized = sanitized.replace(/^-+|-+$/g, '');
			// Truncate to 50 characters
			if (sanitized.length > 50) {
				sanitized = sanitized.substring(0, 50).replace(/-+$/, '');
			}
			break;

		case 'namespace':
			// Convert to lowercase, replace spaces and hyphens with underscores
			sanitized = sanitized.toLowerCase().replace(/[\s-]+/g, '_');
			// Only lowercase letters, numbers, and underscores
			sanitized = sanitized.replace(/[^a-z0-9_]/g, '');
			// Remove consecutive underscores
			sanitized = sanitized.replace(/_+/g, '_');
			// Trim underscores from ends
			sanitized = sanitized.replace(/^_+|_+$/g, '');
			break;

		case 'name': // Trim whitespace
			sanitized = sanitized.trim();
			// Collapse multiple spaces
			sanitized = sanitized.replace(/\s+/g, ' ');
			// Title case each word
			sanitized = sanitized.replace(/\b\w/g, (char) =>
				char.toUpperCase()
			); // Remove potentially dangerous characters but allow spaces
			sanitized = sanitized.replace(/[<>{}[\]\\\/]/g, '');
			break;

		case 'url':
			// Trim whitespace
			sanitized = sanitized.trim();
			// Add https:// if no protocol
			if (!/^https?:\/\//i.test(sanitized)) {
				sanitized = 'https://' + sanitized;
			}
			// Basic URL sanitization
			try {
				const url = new URL(sanitized);
				if (!['http:', 'https:'].includes(url.protocol)) {
					return '';
				}
				// Remove trailing slash
				sanitized = url.href.replace(/\/$/, '');
			} catch {
				return '';
			}
			break;

		case 'version':
			// Handle two-digit versions (1.2 -> 1.2.0)
			if (/^\d+\.\d+$/.test(sanitized)) {
				sanitized = sanitized + '.0';
			}
			// Semantic version only
			if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(sanitized)) {
				sanitized = '1.0.0';
			}
			break;

		default:
			// Trim whitespace
			sanitized = sanitized.trim();
			// Collapse multiple spaces
			sanitized = sanitized.replace(/\s+/g, ' ');
			// Remove potentially dangerous characters
			sanitized = sanitized.replace(/[<>{}[\]\\]/g, '');
	}

	return sanitized;
}

/**
 * Load and validate JSON schema
 */
function loadSchema() {
	try {
		const schemaContent = fs.readFileSync(schemaPath, 'utf8');
		return JSON.parse(schemaContent);
	} catch (error) {
		log('ERROR', `Failed to load schema: ${error.message}`);
		throw new Error(`Schema load error: ${error.message}`);
	}
}

/**
 * Validate configuration against schema
 * @param config
 */
function validateConfig(config) {
	const schema = loadSchema();

	// Suppress Ajv warnings about unknown formats in test mode
	const originalWarn = console.warn;
	if (process.env.NODE_ENV === 'test') {
		console.warn = () => {};
	}

	const ajv = new Ajv2020({ allErrors: true, strict: false });
	const validate = ajv.compile(schema);
	const valid = validate(config);

	// Restore console.warn
	if (process.env.NODE_ENV === 'test') {
		console.warn = originalWarn;
	}

	if (!valid) {
		const errors = validate.errors
			.map((err) => {
				return `  - ${err.instancePath || 'root'}: ${err.message}`;
			})
			.join('\n');
		// Only log if not in test mode
		if (process.env.NODE_ENV !== 'test') {
			log('ERROR', `Validation errors:\n${errors}`);
		}
		return { valid: false, errors: validate.errors };
	}

	// Only log if not in test mode
	if (process.env.NODE_ENV !== 'test') {
		log('INFO', 'Configuration validated successfully');
	}
	return { valid: true, errors: null };
}

/**
 * Apply defaults and derive computed values
 * @param config
 */
function applyDefaults(config) {
	const result = { ...config };

	// Auto-derive namespace and textdomain from slug
	if (result.slug) {
		result.textdomain = result.textdomain || result.slug;
		result.namespace = result.namespace || result.slug.replace(/-/g, '_');
	}

	// Auto-derive CPT slug from first word of slug (tour-operator -> tour)
	if (!result.cpt_slug && result.slug) {
		const firstWord = result.slug.split('-')[0];
		result.cpt_slug = firstWord.substring(0, 20); // Max 20 chars for CPT
	}

	// Auto-derive singular/plural names
	if (result.name && !result.name_singular) {
		result.name_singular = result.name.replace(/s$/, '');
	}
	if (result.name_singular && !result.name_plural) {
		result.name_plural = result.name_singular + 's';
	}

	// Set defaults
	result.version = result.version || '1.0.0';
	result.requires_wp = result.requires_wp || '6.5';
	result.requires_php = result.requires_php || '8.0';
	result.license = result.license || 'GPL-2.0-or-later';
	result.description =
		result.description || 'A WordPress multi-block plugin.';

	// Default blocks
	result.blocks = result.blocks || [
		'card',
		'collection',
		'slider',
		'featured',
	];

	// Default templates
	result.templates = result.templates || ['single', 'archive'];

	// Default CPT supports
	result.cpt_supports = result.cpt_supports || [
		'title',
		'editor',
		'thumbnail',
		'excerpt',
		'revisions',
	];

	// Default CPT settings
	result.cpt_has_archive = result.cpt_has_archive !== false;
	result.cpt_public = result.cpt_public !== false;
	result.cpt_menu_icon = result.cpt_menu_icon || 'dashicons-admin-post';

	return result;
}

/**
 * Apply mustache filters (transformations)
 * @param value
 * @param filter
 */
function applyFilter(value, filter) {
	switch (filter) {
		case 'upper':
			return value.toUpperCase();
		case 'lower':
			return value.toLowerCase();
		case 'pascalCase':
			return value
				.split(/[-_\s]+/)
				.filter((part) => part.length > 0)
				.map(
					(part) =>
						part.charAt(0).toUpperCase() +
						part.slice(1).toLowerCase()
				)
				.join('');
		case 'camelCase':
			const parts = value
				.split(/[-_\s]+/)
				.filter((part) => part.length > 0);
			if (parts.length === 0) {
				return value;
			}
			return (
				parts[0].toLowerCase() +
				parts
					.slice(1)
					.map(
						(part) =>
							part.charAt(0).toUpperCase() +
							part.slice(1).toLowerCase()
					)
					.join('')
			);
		case 'kebabCase':
			// Handle camelCase
			value = value.replace(/([a-z])([A-Z])/g, '$1-$2');
			// Convert spaces and underscores to hyphens
			return value.toLowerCase().replace(/[_\s]+/g, '-');
		case 'snakeCase':
			// Handle camelCase
			value = value.replace(/([a-z])([A-Z])/g, '$1_$2');
			// Convert spaces and hyphens to underscores
			return value.toLowerCase().replace(/[-\s]+/g, '_');
		default:
			return value;
	}
}

/**
 * Replace mustache variables in content
 * @param content
 * @param config
 */
function replaceMustacheVars(content, config) {
	let result = content;

	// Replace variables with filters (e.g., EXAMPLE_PLUGIN)
	result = result.replace(
		/\{\{([a-z_]+)\|([a-z]+)\}\}/gi,
		(match, varName, filter) => {
			const value = config[varName];
			if (value !== undefined) {
				return applyFilter(String(value), filter);
			}
			return ''; // Return empty string for undefined variables
		}
	);

	// Replace simple variables (e.g., example-plugin)
	result = result.replace(/\{\{([a-z_]+)\}\}/gi, (match, varName) => {
		const value = config[varName];
		if (value === undefined) {
			return ''; // Return empty string for undefined
		}
		// Handle arrays by converting to quoted, comma-separated strings for PHP
		if (Array.isArray(value)) {
			return value.map(item => `'${item}'`).join(', ');
		}
		return String(value);
	});

	return result;
}

/**
 * Copy file with mustache replacement
 * @param srcPath
 * @param destPath
 * @param config
 */
function copyFileWithReplacement(srcPath, destPath, config) {
	try {
		const content = fs.readFileSync(srcPath, 'utf8');
		const replaced = replaceMustacheVars(content, config);

		// Ensure destination directory exists
		const destDir = path.dirname(destPath);
		if (!fs.existsSync(destDir)) {
			fs.mkdirSync(destDir, { recursive: true });
		}

		fs.writeFileSync(destPath, replaced, 'utf8');
		log(
			'DEBUG',
			`Copied and processed: ${path.relative(scaffoldDir, srcPath)} -> ${path.relative(outputBaseDir, destPath)}`
		);
	} catch (error) {
		log('ERROR', `Failed to copy ${srcPath}: ${error.message}`);
		throw error;
	}
}

/**
 * Copy directory recursively with mustache replacement
 * @param srcDir
 * @param destDir
 * @param config
 * @param excludePaths
 */
function copyDirWithReplacement(srcDir, destDir, config, excludePaths = []) {
	const entries = fs.readdirSync(srcDir, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(srcDir, entry.name);
		const relativePath = path.relative(scaffoldDir, srcPath);

		// Skip excluded paths
		if (excludePaths.some((exclude) => relativePath.startsWith(exclude))) {
			log('DEBUG', `Skipping excluded path: ${relativePath}`);
			continue;
		}

		// Replace mustache in file/dir names
		const destName = replaceMustacheVars(entry.name, config);
		const destPath = path.join(destDir, destName);

		if (entry.isDirectory()) {
			if (!fs.existsSync(destPath)) {
				fs.mkdirSync(destPath, { recursive: true });
			}
			copyDirWithReplacement(srcPath, destPath, config, excludePaths);
		} else {
			copyFileWithReplacement(srcPath, destPath, config);
		}
	}
}

/**
 * Remove scaffold-only dry-run tests from the generated plugin output.
 *
 * These files validate the template during dry-runs and should not ship with
 * a production plugin to avoid confusion and unnecessary bloat.
 *
 * @param {string} outputDir
 */
function removeScaffoldOnlyTests(outputDir) {
	const testDirs = [
		path.join(outputDir, 'scripts', 'dry-run', '__tests__'),
	];

	for (const dirPath of testDirs) {
		if (fs.existsSync(dirPath)) {
			fs.rmSync(dirPath, { recursive: true, force: true });
			log(
				'INFO',
				`Removed scaffold-only dry-run tests: ${path.relative(
					outputDir,
					dirPath
				)}`
			);
		}
	}
}

/**
 * Process files in place (template mode)
 * Replaces mustache variables in files in the current directory
 * @param {string} targetDir - Directory to process
 * @param {Object} config    - Configuration object
 */
function processFilesInPlace(targetDir, config) {
	// Paths to exclude from processing
	const excludePaths = [
		'node_modules',
		'vendor',
		'build',
		'logs',
		'tmp',
		'reports',
		'.git',
		'.github/reports',
		'tests',
		'scripts',
		'bin',
		'.dry-run-backup',
	];

	// Process directory recursively
	function processDirectory(dir) {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			const relativePath = path.relative(targetDir, fullPath);

			// Skip excluded paths
			if (
				excludePaths.some((exclude) => relativePath.startsWith(exclude))
			) {
				log('DEBUG', `Skipping excluded path: ${relativePath}`);
				continue;
			}

			if (entry.isDirectory()) {
				// Recursively process subdirectory
				processDirectory(fullPath);

				// Rename directory if it contains mustache variables
				if (entry.name.includes('{{')) {
					const newName = replaceMustacheVars(entry.name, config);
					const newPath = path.join(dir, newName);
					if (fullPath !== newPath) {
						log(
							'INFO',
							`Renaming directory: ${relativePath} -> ${newName}`
						);
						fs.renameSync(fullPath, newPath);
					}
				}
			} else {
				// Process file content
				const fileContent = fs.readFileSync(fullPath, 'utf8');
				const newContent = replaceMustacheVars(fileContent, config);

				if (fileContent !== newContent) {
					log(
						'INFO',
						`Replacing mustache variables in: ${relativePath}`
					);
					fs.writeFileSync(fullPath, newContent, 'utf8');
				}

				// Rename file if it contains mustache variables
				if (entry.name.includes('{{')) {
					const newName = replaceMustacheVars(entry.name, config);
					const newPath = path.join(dir, newName);
					if (fullPath !== newPath) {
						log(
							'INFO',
							`Renaming file: ${relativePath} -> ${newName}`
						);
						fs.renameSync(fullPath, newPath);
					}
				}
			}
		}
	}

	processDirectory(targetDir);
}

/**
 * Prompt user for confirmation (template mode)
 * @param {string} message - Confirmation message
 * @return {Promise<boolean>} - True if confirmed, false otherwise
 */
function promptConfirmation(message) {
	return new Promise((resolve) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question(`${message} (y/N): `, (answer) => {
			rl.close();
			resolve(
				answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes'
			);
		});
	});
}

/**
 * Generate plugin from configuration
 * @param           config
 * @param {boolean} inPlace - If true, generates in current directory (template mode)
 */
function generatePlugin(config, inPlace = false) {
	// Initialize logging with plugin slug
	initializeLogging(config.slug || 'unknown');

	log('INFO', 'Plugin generator starting', {
		nodeVersion: process.version,
		workingDirectory: process.cwd(),
		mode: inPlace ? 'template' : 'generator',
	});

	log('INFO', `Starting plugin generation: ${config.name} (${config.slug})`);

	// Apply defaults and validation
	const fullConfig = applyDefaults(config);

	log('INFO', 'Validating configuration', { slug: fullConfig.slug });
	const validation = validateConfig(fullConfig);

	if (!validation.valid) {
		log('ERROR', 'Configuration validation failed', {
			errors: validation.errors,
		});
		throw new Error('Configuration validation failed');
	}

	log('INFO', 'Configuration validated successfully', {
		slug: fullConfig.slug,
		name: fullConfig.name,
		version: fullConfig.version,
	});

	// Determine output directory based on mode
	let outputDir;
	if (inPlace) {
		// Template mode: use current directory
		outputDir = process.cwd();
		log('INFO', `Template mode: Generating in-place at ${outputDir}`);
	} else {
		// Generator mode: create output folder
		outputDir = path.join(outputBaseDir, fullConfig.slug);
		log('INFO', `Generator mode: Creating output at ${outputDir}`);
	}

	if (!inPlace) {
		// Generator mode: check if output directory exists
		if (fs.existsSync(outputDir)) {
			log('WARN', `Output directory exists: ${outputDir}`);
			if (!process.argv.includes('--force')) {
				throw new Error(
					'Output directory already exists. Use --force to overwrite.'
				);
			}
			log('INFO', 'Removing existing output directory');
			fs.rmSync(outputDir, { recursive: true, force: true });
		}

		fs.mkdirSync(outputDir, { recursive: true });
		log('INFO', `Created output directory: ${outputDir}`);
	} else {
		// Template mode: ensure we're in a valid directory
		log('INFO', 'Template mode: Validating current directory');
	}

	// Paths to exclude from copying
	const excludePaths = [
		'node_modules',
		'vendor',
		'build',
		'logs',
		'tmp',
		'reports',
		'generated-plugins',
		'output-plugin',
		'output',
		'.git',
		'.github/reports',
		'.github/agents',
		'.github/prompts',
		'tests',
		'docs',
		'scripts',
		'bin',
		'.dry-run-backup',
	];

	// Copy scaffold files with mustache replacement
	if (inPlace) {
		log('INFO', 'Replacing mustache variables in current directory...');
		// In template mode, process files in place
		processFilesInPlace(outputDir, fullConfig);
	} else {
		log('INFO', 'Copying scaffold files to output directory...');
		// In generator mode, copy from scaffold to output
		copyDirWithReplacement(
			scaffoldDir,
			outputDir,
			fullConfig,
			excludePaths
		);
		removeScaffoldOnlyTests(outputDir);
	}

	// Generate package.json
	log('INFO', 'Generating package.json');
	generatePackageJson(outputDir, fullConfig);

	// Generate composer.json
	log('INFO', 'Generating composer.json');
	generateComposerJson(outputDir, fullConfig);

	// Generate README.md
	log('INFO', 'Generating README.md');
	generateReadme(outputDir, fullConfig);

	log('INFO', 'Plugin generated successfully', {
		outputDirectory: outputDir,
		mode: inPlace ? 'template' : 'generator',
		slug: fullConfig.slug,
		name: fullConfig.name,
		version: fullConfig.version,
	});

	// Output next steps
	console.log('\n✅ Plugin generated successfully!\n');
	console.log('📦 Next steps:\n');
	if (!inPlace) {
		console.log(`  cd ${outputDir}`);
	}
	console.log('  composer install');
	console.log('  npm install');
	console.log('  npm run build\n');
	console.log(`📝 Log file: ${logFile}\n`);

	return outputDir;
}

/**
 * Generate package.json
 * @param outputDir
 * @param config
 */
function generatePackageJson(outputDir, config) {
	const packageJson = {
		name: `@${config.namespace}/${config.slug}`,
		version: config.version,
		description: config.description,
		author: config.author,
		license: config.license,
		scripts: {
			build: 'wp-scripts build',
			start: 'wp-scripts start',
			'lint:js': 'wp-scripts lint-js',
			'lint:css': 'wp-scripts lint-style',
			'test:unit': 'wp-scripts test-unit-js',
			'env:start': 'wp-env start',
			'env:stop': 'wp-env stop',
		},
		devDependencies: {
			'@wordpress/scripts': '^27.0.0',
		},
	};

	const packagePath = path.join(outputDir, 'package.json');
	fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
	log('INFO', 'Generated package.json');
}

/**
 * Generate composer.json
 * @param outputDir
 * @param config
 */
function generateComposerJson(outputDir, config) {
	const composerJson = {
		name: `${config.namespace}/${config.slug}`,
		description: config.description,
		version: config.version,
		type: 'wordpress-plugin',
		license: config.license,
		authors: [
			{
				name: config.author,
				homepage: config.author_uri || '',
			},
		],
		require: {
			php: `>=${config.requires_php}`,
		},
		'require-dev': {
			'phpunit/phpunit': '^9.0',
			'wp-coding-standards/wpcs': '^3.0',
			'phpstan/phpstan': '^1.10',
		},
	};

	const composerPath = path.join(outputDir, 'composer.json');
	fs.writeFileSync(
		composerPath,
		JSON.stringify(composerJson, null, 2),
		'utf8'
	);
	log('INFO', 'Generated composer.json');
}

/**
 * Generate README.md
 * @param outputDir
 * @param config
 */
function generateReadme(outputDir, config) {
	const readme = `# ${config.name}

${config.description}

## Installation

1. Install dependencies:
   \`\`\`bash
   composer install
   npm install
   \`\`\`

2. Build assets:
   \`\`\`bash
   npm run build
   \`\`\`

3. Activate the plugin in WordPress

## Development

Start development mode with file watching:

\`\`\`bash
npm run start
\`\`\`

## Testing

Start WordPress environment:

\`\`\`bash
npm run env:start
\`\`\`

Access at: http://localhost:8888

## Requirements

- WordPress ${config.requires_wp}+
- PHP ${config.requires_php}+
- Secure Custom Fields plugin

## License

${config.license}
`;

	const readmePath = path.join(outputDir, 'README.md');
	fs.writeFileSync(readmePath, readme, 'utf8');
	log('INFO', 'Generated README.md');
}

/**
 * Load configuration from JSON file
 * @param filePath
 */
function loadConfigFile(filePath) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		return JSON.parse(content);
	} catch (error) {
		log('ERROR', `Failed to load config file: ${error.message}`);
		throw new Error(`Config file error: ${error.message}`);
	}
}

/**
 * Show help message
 */
function showHelp() {
	console.log(`
Multi-Block Plugin Generator

Usage:
  node scripts/generate-plugin.js [options]

Options:
  --config <file>    Path to JSON configuration file
  --validate <file>  Validate configuration file without generating
  --in-place         Generate in current directory (template mode)
  --template         Alias for --in-place
  --force            Overwrite existing output directory
  --help             Show this help message

Modes:
  Generator Mode (default):
    - Creates plugin in generated-plugins/<slug>/
    - Use when generating multiple plugins or experimenting
    - Keeps scaffold pristine

  Template Mode (--in-place):
    - Replaces mustache variables in current directory
    - Use when creating ONE plugin from a template repo
    - Modifies files in place

Examples:
  # Generator mode (default) - creates output folder
  node scripts/generate-plugin.js --config my-plugin.json

  # Template mode - generates in current directory
  node scripts/generate-plugin.js --config my-plugin.json --in-place

  # Validate configuration
  node scripts/generate-plugin.js --validate my-plugin.json

Configuration:
  See .github/schemas/plugin-config.schema.json for schema
  See scripts/fixtures/plugin-config.example.json for example
`);
}

/**
 * Main execution
 */
async function main() {
	const args = process.argv.slice(2);

	// Show help
	if (args.includes('--help') || args.includes('-h')) {
		showHelp();
		process.exit(0);
	}

	// Validate mode
	const validateIndex = args.indexOf('--validate');
	if (validateIndex !== -1) {
		const configFile = args[validateIndex + 1];
		if (!configFile) {
			console.error('❌ Error: --validate requires a file path');
			process.exit(1);
		}

		try {
			const config = loadConfigFile(configFile);
			const fullConfig = applyDefaults(config);
			const validation = validateConfig(fullConfig);

			if (validation.valid) {
				console.log('✅ Configuration is valid');
				process.exit(0);
			} else {
				console.error('❌ Configuration validation failed');
				process.exit(1);
			}
		} catch (error) {
			console.error(`❌ Error: ${error.message}`);
			process.exit(1);
		}
	}

	// Config file mode
	const configIndex = args.indexOf('--config');
	if (configIndex !== -1) {
		const configFile = args[configIndex + 1];
		if (!configFile) {
			console.error('❌ Error: --config requires a file path');
			showHelp();
			process.exit(1);
		}

		try {
			const config = loadConfigFile(configFile);
			const inPlace = isTemplateMode;

			// Prompt confirmation for template mode
			if (inPlace) {
				console.log('\n⚠️  Template Mode Enabled\n');
				console.log(
					'This will modify files in the current directory by replacing mustache variables.'
				);
				console.log(
					'This action CANNOT be undone without Git or a backup.\n'
				);

				const confirmed = await promptConfirmation(
					'Are you sure you want to proceed with in-place generation?'
				);

				if (!confirmed) {
					console.log('\n❌ Generation cancelled by user');
					log('INFO', 'Template mode generation cancelled by user');
					process.exit(0);
				}
			}

			generatePlugin(config, inPlace);
			process.exit(0);
		} catch (error) {
			console.error(`❌ Error: ${error.message}`);
			log('ERROR', `Generation failed: ${error.stack}`);
			process.exit(1);
		}
	}

	// Interactive mode - delegate to agent
	console.log('🔧 Starting interactive plugin generator...\n');
	console.log('For interactive mode, use the agent:');
	console.log('  node scripts/generate-plugin.agent.js\n');
	console.log('Or provide a configuration file:');
	console.log('  node scripts/generate-plugin.js --config my-plugin.json\n');

	showHelp();
	process.exit(0);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		sanitizeInput,
		loadSchema,
		validateConfig,
		applyDefaults,
		applyFilter,
		replaceMustacheVars,
		generatePlugin,
		loadConfigFile,
	};
}

// Run if executed directly
if (require.main === module) {
	main().catch((error) => {
		console.error(`❌ Fatal error: ${error.message}`);
		log('ERROR', `Fatal error: ${error.stack}`);
		process.exit(1);
	});
}
