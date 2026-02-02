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

	// Set defaults
	result.version = result.version || '1.0.0';
	result.requires_wp = result.requires_wp || '6.5';
	result.requires_php = result.requires_php || '8.0';
	result.license = result.license || 'GPL-2.0-or-later';
	result.description =
		result.description || 'A WordPress multi-block plugin.';

	// Default blocks - no default blocks as templates are removed
	result.blocks = result.blocks || [];

	// Initialize arrays
	result.post_types = result.post_types || [];
	result.taxonomies = result.taxonomies || [];
	result.fields = result.fields || [];
	
	// If using legacy single post type format, convert to array
	if (result.cpt_slug || result.name_singular) {
		const legacyPostType = {
			slug: result.cpt_slug || result.slug?.split('-')[0]?.substring(0, 20),
			singular: result.name_singular || result.name?.replace(/s$/, ''),
			plural: result.name_plural || (result.name_singular ? result.name_singular + 's' : result.name),
			supports: result.cpt_supports || [
				'title',
				'editor',
				'thumbnail',
				'excerpt',
				'revisions',
			],
			has_archive: result.cpt_has_archive !== false,
			public: result.cpt_public !== false,
			menu_icon: result.cpt_menu_icon || 'dashicons-admin-post',
			taxonomies: result.taxonomies || [],
			fields: result.fields || [],
		};
		result.post_types = [legacyPostType];
		
		// Clean up legacy fields (but don't delete taxonomies and fields yet - need to process them)
		delete result.cpt_slug;
		delete result.name_singular;
		delete result.name_plural;
		delete result.cpt_supports;
		delete result.cpt_has_archive;
		delete result.cpt_public;
		delete result.cpt_menu_icon;
	}

	// Convert legacy embedded taxonomies/fields to top-level arrays
	const taxonomyMap = new Map(); // Dedupe taxonomies across post types
	const postTypeFieldMap = new Map(); // Track fields by post type
	
	result.post_types = result.post_types.map((postType) => {
		const pt = { ...postType };
		
		// Auto-derive plural from singular if not set
		if (pt.singular && !pt.plural) {
			pt.plural = pt.singular + 's';
		}
		
		// Default supports
		pt.supports = pt.supports || [
			'title',
			'editor',
			'thumbnail',
			'excerpt',
			'revisions',
		];
		
		// Default settings
		pt.has_archive = pt.has_archive !== false;
		pt.public = pt.public !== false;
		pt.menu_icon = pt.menu_icon || 'dashicons-admin-post';
		
		// Handle taxonomies - convert to array of slugs if needed
		if (pt.taxonomies && pt.taxonomies.length > 0) {
			const taxonomySlugs = [];
			
			pt.taxonomies.forEach(tax => {
				if (typeof tax === 'string') {
					// Already a slug, keep it
					taxonomySlugs.push(tax);
				} else if (tax && typeof tax === 'object' && tax.slug) {
					// Legacy object format - extract to top-level taxonomies
					taxonomySlugs.push(tax.slug);
					
					if (!taxonomyMap.has(tax.slug)) {
						taxonomyMap.set(tax.slug, {
							slug: tax.slug,
							singular: tax.singular || tax.slug,
							plural: tax.plural || tax.singular + 's',
							hierarchical: tax.hierarchical !== false,
							post_types: [pt.slug]
						});
					} else {
						// Add this post type to existing taxonomy
						const existing = taxonomyMap.get(tax.slug);
						if (!existing.post_types.includes(pt.slug)) {
							existing.post_types.push(pt.slug);
						}
					}
				}
			});
			
			pt.taxonomies = taxonomySlugs;
		} else {
			pt.taxonomies = [];
		}
		
		// Handle fields - move to top-level fields array
		if (pt.fields && pt.fields.length > 0) {
			postTypeFieldMap.set(pt.slug, pt.fields);
			delete pt.fields;
		}
		
		return pt;
	});

	// Merge extracted taxonomies into top-level array
	taxonomyMap.forEach(tax => {
		// Check if already exists in result.taxonomies
		const existing = result.taxonomies.find(t => t.slug === tax.slug);
		if (!existing) {
			result.taxonomies.push(tax);
		} else {
			// Merge post_types
			tax.post_types.forEach(pt => {
				if (!existing.post_types.includes(pt)) {
					existing.post_types.push(pt);
				}
			});
		}
	});

	// Merge extracted fields into top-level array
	postTypeFieldMap.forEach((fields, postTypeSlug) => {
		const existing = result.fields.find(f => f.post_type === postTypeSlug);
		if (!existing) {
			result.fields.push({
				post_type: postTypeSlug,
				field_group: fields
			});
		}
	});

	// For backward compatibility, set first post type properties as top-level
	if (result.post_types.length > 0) {
		const firstPostType = result.post_types[0];
		result.cpt_slug = firstPostType.slug;
		result.block_slug = firstPostType.slug.replace(/_/g, '-'); // Dasherized version for block names
		result.name_singular = firstPostType.singular;
		result.name_plural = firstPostType.plural;
		result.cpt_supports = firstPostType.supports;
		result.cpt_has_archive = firstPostType.has_archive;
		result.cpt_public = firstPostType.public;
		result.cpt_menu_icon = firstPostType.menu_icon;
		
		// Legacy format expects embedded arrays
		result.taxonomies_legacy = firstPostType.taxonomies || [];
		result.fields_legacy = result.fields.find(f => f.post_type === firstPostType.slug)?.field_group || [];
	}

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
		
		// Generate per-CPT blocks after copying
		if (fullConfig.post_types && fullConfig.post_types.length > 0) {
			log('INFO', 'Generating per-CPT blocks');
			generatePerCPTBlocks(outputDir, fullConfig);
			log('INFO', 'Per-CPT block generation completed');
		}
		
		// Generate src/index.js with dynamic block imports
		log('INFO', 'Generating src/index.js with block imports');
		generateSrcIndexFile(outputDir, fullConfig);
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

	// Generate post-type JSON files
	if (fullConfig.post_types && fullConfig.post_types.length > 0) {
		log('INFO', 'Generating post-type JSON files');
		generatePostTypeJSONFiles(outputDir, fullConfig);
		
		// Generate taxonomy SCF field groups
		log('INFO', 'Generating taxonomy field groups');
		generateTaxonomySCFGroups(outputDir, fullConfig);
	}

	// Generate SCF JSON field group
	if (fullConfig.fields && fullConfig.fields.length > 0) {
		log('INFO', 'Generating SCF field group JSON');
		generateSCFFieldGroup(outputDir, fullConfig);
	}

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
 * Generate per-CPT blocks from {{cpt_slug}} templates
 * Duplicates block templates that contain {{cpt_slug}} for each registered post type
 * @param {string} outputDir - Output directory path
 * @param {Object} config - Plugin configuration
 */
function generatePerCPTBlocks(outputDir, config) {
	if (!config.post_types || config.post_types.length === 0) {
		log('INFO', 'No post types defined, skipping per-CPT block generation');
		return;
	}

	const blocksDir = path.join(outputDir, 'src', 'blocks');
	if (!fs.existsSync(blocksDir)) {
		log('WARN', 'Blocks directory not found, skipping per-CPT block generation');
		return;
	}

	// After copying, the {{cpt_slug}} template will have been replaced with the FIRST post type's slug
	// We need to find that block and duplicate it for remaining post types
	const firstPostType = config.post_types[0];
	if (!firstPostType) return;
	
	// Look for blocks that match the first post type slug pattern (e.g., "cpd_article-collection")
	const entries = fs.readdirSync(blocksDir, { withFileTypes: true });
	const firstCPTBlocks = entries.filter(
		(entry) => entry.isDirectory() && entry.name.startsWith(`${firstPostType.slug}-`)
	);

	if (firstCPTBlocks.length === 0) {
		log('INFO', 'No per-CPT block templates found (expected blocks starting with first CPT slug)');
		return;
	}

	log('INFO', `Found ${firstCPTBlocks.length} per-CPT block template(s) for first post type`, {
		templates: firstCPTBlocks.map(t => t.name),
		firstPostType: firstPostType.slug
	});

	// For each block template from the first post type
	firstCPTBlocks.forEach((templateBlock) => {
		const templatePath = path.join(blocksDir, templateBlock.name);
		
		// Extract the block type suffix (e.g., "collection" from "cpd_article-collection")
		const blockSuffix = templateBlock.name.replace(`${firstPostType.slug}-`, '');
		
		// Generate a block for each REMAINING post type (skip first one as it already exists)
		config.post_types.slice(1).forEach((postType, index) => {
			// Create block-specific config with CPT variables
			const blockConfig = {
				...config,
				cpt_slug: postType.slug,
				block_slug: postType.slug.replace(/_/g, '-'), // Dasherized version for block names
				cpt_singular: postType.singular,
				cpt_plural: postType.plural,
				cpt_menu_icon: postType.menu_icon,
				cpt_supports: postType.supports,
				// Add indexed variables for multi-CPT support
				[`cpt${index + 2}_slug`]: postType.slug, // +2 because we skipped first
				[`cpt${index + 2}_singular`]: postType.singular,
				[`cpt${index + 2}_plural`]: postType.plural,
			};

			// Create the block directory name for this post type
			const blockDirName = `${postType.slug}-${blockSuffix}`;
			const blockPath = path.join(blocksDir, blockDirName);

			// Create the block directory
			if (!fs.existsSync(blockPath)) {
				fs.mkdirSync(blockPath, { recursive: true });
			}

			// Copy all files from template to new block directory
			const templateFiles = fs.readdirSync(templatePath, { withFileTypes: true });
			templateFiles.forEach((file) => {
				const srcPath = path.join(templatePath, file.name);
				const destName = replaceMustacheVars(file.name, blockConfig);
				const destPath = path.join(blockPath, destName);

				if (file.isDirectory()) {
					// Recursively copy subdirectories
					if (!fs.existsSync(destPath)) {
						fs.mkdirSync(destPath, { recursive: true });
					}
					copyDirWithReplacement(srcPath, destPath, blockConfig, []);
				} else {
					// Copy and process file - replace first post type slug with current post type
					let content = fs.readFileSync(srcPath, 'utf8');
					
					// Create dasherized versions for block names
					const firstCPTDasherized = firstPostType.slug.replace(/_/g, '-');
					const currentCPTDasherized = postType.slug.replace(/_/g, '-');
					
					// Replace the first post type's slug with the current post type's slug
					// Handle both underscore version (for variables) and dash version (for block names)
					content = content.replace(new RegExp(firstCPTDasherized, 'g'), currentCPTDasherized);
					content = content.replace(new RegExp(firstPostType.slug, 'g'), postType.slug);
					content = content.replace(new RegExp(firstPostType.singular, 'g'), postType.singular);
					content = content.replace(new RegExp(firstPostType.plural, 'g'), postType.plural);
					
					// Also replace any remaining mustache variables
					content = replaceMustacheVars(content, blockConfig);
					
					fs.writeFileSync(destPath, content, 'utf8');
				}
			});

			log('INFO', `Generated block: ${blockDirName}`, {
				postType: postType.slug,
				template: templateBlock.name,
				blockSuffix: blockSuffix
			});
		});
	});

	log('INFO', 'Per-CPT block generation completed', {
		templatesProcessed: firstCPTBlocks.length,
		blocksGenerated: firstCPTBlocks.length * (config.post_types.length - 1),
		postTypes: config.post_types.map(pt => pt.slug)
	});
}

/**
 * Generate src/index.js with dynamic block imports
 * Creates the main entry point file with imports for all generated blocks
 * @param {string} outputDir - Output directory path
 * @param {Object} config - Plugin configuration
 */
function generateSrcIndexFile(outputDir, config) {
	const blocksDir = path.join(outputDir, 'src', 'blocks');
	const indexPath = path.join(outputDir, 'src', 'index.js');
	
	if (!fs.existsSync(blocksDir)) {
		log('WARN', 'Blocks directory not found, skipping src/index.js generation');
		return;
	}

	// Get all block directories
	const blockDirs = fs.readdirSync(blocksDir, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)
		.sort();

	if (blockDirs.length === 0) {
		log('WARN', 'No blocks found, skipping src/index.js generation');
		return;
	}

	// Generate block imports
	const blockImports = blockDirs
		.map(blockDir => `import './blocks/${blockDir}';`)
		.join('\n');

	// Generate the file content
	const content = `/**
 * ${config.name} Plugin - Main Entry Point
 *
 * Registers all blocks from the blocks directory.
 *
 * @package
 */

// Import blocks.
${blockImports}

// Import global styles.
import './scss/style.scss';
import './scss/editor.scss';
`;

	fs.writeFileSync(indexPath, content, 'utf8');
	
	log('INFO', `Generated src/index.js with ${blockDirs.length} block imports`, {
		blocks: blockDirs
	});
}

/**
 * Generate individual post-type JSON files from config
 * @param {string} outputDir - Output directory path
 * @param {Object} config - Plugin configuration
 */
function generatePostTypeJSONFiles(outputDir, config) {
       if (!config.post_types || config.post_types.length === 0) {
	       log('INFO', 'No post types defined, skipping post-type JSON generation');
	       return;
       }

       log('INFO', 'Generating post-type JSON files in scf-json/', {
	       postTypeCount: config.post_types.length
       });

       const scfJsonDir = path.join(outputDir, 'scf-json');
       if (!fs.existsSync(scfJsonDir)) {
	       fs.mkdirSync(scfJsonDir, { recursive: true });
	       log('INFO', 'Created scf-json directory');
       }

       // Generate a JSON file for each post type
       config.post_types.forEach((postType) => {
	       const postTypeJson = {
		       slug: postType.slug,
		       label: postType.singular,
		       pluralLabel: postType.plural,
		       icon: postType.menu_icon || 'dashicons-admin-post',
		       supports: postType.supports || ['title', 'editor', 'thumbnail'],
		       has_archive: postType.has_archive !== false,
		       hierarchical: postType.hierarchical || false,
		       rewrite: postType.slug,
		       template: [[`${config.namespace}/${postType.slug}-single`]],
		       fields: [],
		       taxonomies: []
	       };

	       // Add fields from top-level fields array
	       const fieldGroup = config.fields?.find(f => f.post_type === postType.slug);
	       if (fieldGroup && fieldGroup.field_group && fieldGroup.field_group.length > 0) {
		       postTypeJson.fields = fieldGroup.field_group.map(field => ({
			       slug: `${config.namespace}_${field.name}`,
			       type: field.type,
			       label: field.label,
			       description: field.instructions || '',
			       required: field.required || false,
			       placeholder: field.placeholder || '',
			       default_value: field.default_value,
			       choices: field.choices,
			       return_format: field.return_format,
			       min: field.min,
			       max: field.max,
			       step: field.step
		       }));
	       }

	       // Add taxonomies - resolve from top-level taxonomies array or use embedded slugs
	       if (postType.taxonomies && postType.taxonomies.length > 0) {
		       postTypeJson.taxonomies = postType.taxonomies.map(taxSlug => {
			       // Find in top-level taxonomies array
			       const taxDef = config.taxonomies?.find(t => t.slug === taxSlug);
			       if (taxDef) {
				       return {
					       slug: taxDef.slug,
					       label: taxDef.singular,
					       pluralLabel: taxDef.plural,
					       hierarchical: taxDef.hierarchical !== false
				       };
			       }
			       // Fallback if taxonomy not found in top-level array
			       return {
				       slug: taxSlug,
				       label: taxSlug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
				       pluralLabel: taxSlug.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + 's',
				       hierarchical: true
			       };
		       });
	       }

	       // Write the JSON file in scf-json/
	       const filePath = path.join(scfJsonDir, `posttype_${postType.slug}.json`);
	       fs.writeFileSync(
		       filePath,
		       JSON.stringify(postTypeJson, null, 2),
		       'utf8'
	       );

	       log('INFO', `Generated post-type JSON: ${filePath}`, {
		       slug: postType.slug,
		       fieldCount: postTypeJson.fields.length,
		       taxonomyCount: postTypeJson.taxonomies.length
	       });
       });

       log('INFO', 'Post-type JSON files generated successfully in scf-json/', {
	       filesGenerated: config.post_types.length
       });
}

/**
 * Generate SCF field groups for taxonomies
 * Creates a field group for each unique taxonomy with default fields (thumbnail_id, subtitle)
 * Uses top-level taxonomies array if available, otherwise extracts from post types
 * @param {string} outputDir - Output directory path
 * @param {Object} config - Plugin configuration
 */
function generateTaxonomySCFGroups(outputDir, config) {
       // Use top-level taxonomies array if available
       if (!config.taxonomies || config.taxonomies.length === 0) {
	       log('INFO', 'No taxonomies defined, skipping taxonomy JSON generation');
	       return;
       }

       const scfJsonDir = path.join(outputDir, 'scf-json');
       if (!fs.existsSync(scfJsonDir)) {
	       fs.mkdirSync(scfJsonDir, { recursive: true });
	       log('INFO', 'Created scf-json directory');
       }

       // Generate a JSON file for each taxonomy
       config.taxonomies.forEach((taxonomy) => {
	       const taxonomyJson = {
		       slug: taxonomy.slug,
		       label: taxonomy.singular,
		       pluralLabel: taxonomy.plural,
		       hierarchical: taxonomy.hierarchical !== false,
		       post_types: taxonomy.post_types || [],
	       };

	       // Write the JSON file in scf-json/
	       const filePath = path.join(scfJsonDir, `taxonomy_${taxonomy.slug}.json`);
	       fs.writeFileSync(
		       filePath,
		       JSON.stringify(taxonomyJson, null, 2),
		       'utf8'
	       );

	       log('INFO', `Generated taxonomy JSON: ${filePath}`, {
		       slug: taxonomy.slug,
		       postTypes: taxonomyJson.post_types
	       });
       });

       log('INFO', 'Taxonomy JSON files generated successfully in scf-json/', {
	       filesGenerated: config.taxonomies.length
       });
}

/**
 * Generate SCF JSON field group file from config
 * Supports both old format (config.fields as array) and new format (config.fields with post_type/field_group)
 * @param {string} outputDir - Output directory path
 * @param {Object} config - Plugin configuration
 */
function generateSCFFieldGroup(outputDir, config) {
	if (!config.fields || config.fields.length === 0) {
		log('INFO', 'No custom fields defined, skipping SCF JSON generation');
		return;
	}

	const scfJsonDir = path.join(outputDir, 'scf-json');
	if (!fs.existsSync(scfJsonDir)) {
		fs.mkdirSync(scfJsonDir, { recursive: true });
		log('INFO', 'Created scf-json directory');
	}

	// Check if using new structure (array of {post_type, field_group})
	const hasNewStructure = config.fields.some(f => f.post_type && f.field_group);

	if (hasNewStructure) {
		// New structure: Generate a field group for each post type
		config.fields.forEach(fieldGroupDef => {
			if (!fieldGroupDef.post_type || !fieldGroupDef.field_group || fieldGroupDef.field_group.length === 0) {
				return;
			}

			const postType = fieldGroupDef.post_type;
			const fields = fieldGroupDef.field_group;

			log('INFO', `Generating SCF field group for post type: ${postType}`, {
				fieldCount: fields.length
			});

			// Map config fields to SCF field format
			const scfFields = fields.map((field, index) => {
				const fieldKey = `field_${postType}_${field.name}`;
				
				const scfField = {
					key: fieldKey,
					label: field.label,
					name: field.name,
					type: field.type,
					instructions: field.instructions || '',
					required: field.required ? 1 : 0,
				};

				// Add optional properties
				if (field.default_value !== undefined) {
					scfField.default_value = field.default_value;
				}
				if (field.placeholder) {
					scfField.placeholder = field.placeholder;
				}
				if (field.choices) {
					scfField.choices = field.choices;
				}
				if (field.return_format) {
					scfField.return_format = field.return_format;
				}
				if (field.multiple !== undefined) {
					scfField.multiple = field.multiple ? 1 : 0;
				}
				if (field.allow_null !== undefined) {
					scfField.allow_null = field.allow_null ? 1 : 0;
				}

				// Add type-specific properties
				if (field.type === 'number') {
					if (field.min !== undefined) scfField.min = field.min;
					if (field.max !== undefined) scfField.max = field.max;
					if (field.step !== undefined) scfField.step = field.step;
				}

				return scfField;
			});

			// Get post type label
			const postTypeDef = config.post_types?.find(pt => pt.slug === postType);
			const postTypeLabel = postTypeDef?.singular || postType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

			// Create the field group
			const fieldGroup = {
				key: `group_${postType}_fields`,
				title: `${postTypeLabel} Fields`,
				fields: scfFields,
				location: [
					[
						{
							param: 'post_type',
							operator: '==',
							value: postType,
						},
					],
				],
				menu_order: 0,
				position: 'normal',
				style: 'default',
				label_placement: 'top',
				instruction_placement: 'label',
				hide_on_screen: [],
				active: true,
			};

			// Write the JSON file
			const outputPath = path.join(scfJsonDir, `group_${postType}_fields.json`);
			fs.writeFileSync(outputPath, JSON.stringify(fieldGroup, null, 4), 'utf8');

			log('INFO', `Generated SCF field group: ${outputPath}`, {
				postType,
				fieldCount: scfFields.length
			});
		});

		log('INFO', 'All SCF field groups generated successfully', {
			groupsGenerated: config.fields.length
		});

	} else {
		// Old structure: Single field group for main post type (backward compatibility)
		log('INFO', 'Generating SCF JSON field group (legacy format)');

		// Map config fields to SCF field format
		const scfFields = config.fields.map((field, index) => {
			const fieldKey = `field_${config.slug}_${field.name}`;
			
			const scfField = {
				key: fieldKey,
				label: field.label,
				name: field.name,
				type: field.type,
				instructions: field.instructions || '',
				required: field.required ? 1 : 0,
			};

			// Add optional properties
			if (field.default_value !== undefined) {
				scfField.default_value = field.default_value;
			}
			if (field.placeholder) {
				scfField.placeholder = field.placeholder;
			}
			if (field.choices) {
				scfField.choices = field.choices;
			}
			if (field.return_format) {
				scfField.return_format = field.return_format;
			}
			if (field.multiple !== undefined) {
				scfField.multiple = field.multiple ? 1 : 0;
			}
			if (field.allow_null !== undefined) {
				scfField.allow_null = field.allow_null ? 1 : 0;
			}

			// Add type-specific properties
			if (field.type === 'number') {
				if (field.min !== undefined) scfField.min = field.min;
				if (field.max !== undefined) scfField.max = field.max;
				if (field.step !== undefined) scfField.step = field.step;
			}

			return scfField;
		});

		// Create the field group
		const fieldGroup = {
			key: `group_${config.slug}_fields`,
			title: `${config.name} Fields`,
			fields: scfFields,
			location: [
				[
					{
						param: 'post_type',
						operator: '==',
						value: config.cpt_slug || config.slug,
					},
				],
			],
			menu_order: 0,
			position: 'normal',
			style: 'default',
			label_placement: 'top',
			instruction_placement: 'label',
			hide_on_screen: [],
			active: true,
		};

		// Write the JSON file
		const outputPath = path.join(scfJsonDir, `group_${config.slug}_fields.json`);
		fs.writeFileSync(outputPath, JSON.stringify(fieldGroup, null, 4), 'utf8');

		log('INFO', `Generated SCF field group: ${outputPath}`, {
			fieldCount: scfFields.length
		});
	}
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
