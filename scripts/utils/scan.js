/**
 * Recursively scan a directory for files matching SCAN_EXTENSIONS, skipping EXCLUDE_DIRS and IGNORE_PATHS.
 * @param {string} dir - Directory to scan
 * @param {string} basePath - Relative path prefix
 * @returns {Array<{ fullPath: string, path: string, lines: string[] }>}
 */
function scanDirectory(dir, basePath = '') {
	let results = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);
		const relPath = path.join(basePath, entry.name);
		if (EXCLUDE_DIRS.includes(entry.name) ||
			IGNORE_PATHS.includes(relPath) ||
			shouldIgnorePath(relPath, IGNORE_PATTERNS)) {
			continue;
		}
		if (entry.isDirectory()) {
			results = results.concat(scanDirectory(entryPath, relPath));
		} else if (SCAN_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
			let lines = [];
			try {
				lines = fs.readFileSync(entryPath, 'utf8').split(/\r?\n/);
			} catch (e) {}
			results.push({ fullPath: entryPath, path: relPath, lines });
		}
	}
	return results;
}
// Regex to match mustache variables like {{variable}} or {{variable|filter}}
const MUSTACHE_REGEX = /\{\{\s*([a-zA-Z0-9_\-|]+)\s*\}\}/g;
/**
 * Directory scanning helpers used across tooling in the scaffold.
 *
 * Provides reusable helpers for discovering mustache placeholders, categorising
 * them, and building a registry that can be emitted as JSON or used for
 * configuration validation.
 *
 * @module scripts/utils/scan
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

const SCAN_DIRS = [
	'.',
	'patterns',
	'parts',
	'templates',
	'styles',
	'src',
	'.github',
	'docs',
];

const EXCLUDE_DIRS = [
	'node_modules',
	'vendor',
	'dist',
	'build',
	'output-theme',
	// Generator output: rendered plugins, not scaffold templates.
	'generated-plugins',
	'output-plugin',
	'.git',
	'coverage',
	'test-results',
	'artifacts',
];

const SCAN_EXTENSIONS = [
	'.php',
	'.js',
	'.json',
	'.md',
	'.css',
	'.scss',
	'.html',
	'.txt',
	'.yml',
	'.yaml',
];


/**
 * Load ignore patterns from .mustacheignore file
 *
 * @param {string} rootDir - Root directory to search for .mustacheignore
 * @return {string[]} Array of ignore patterns
 */
function loadIgnorePatterns(rootDir = ROOT_DIR) {
	const ignorePath = path.join(rootDir, '.mustacheignore');
	if (!fs.existsSync(ignorePath)) {
		return [];
	}

	const content = fs.readFileSync(ignorePath, 'utf8');
	return content
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(line => line && !line.startsWith('#'));
}

/**
 * Check if a path should be ignored based on patterns
 *
 * @param {string} filePath - Path to check
 * @param {string[]} patterns - Ignore patterns
 * @return {boolean} True if path should be ignored
 */
function shouldIgnorePath(filePath, patterns) {
	if (!patterns || patterns.length === 0) {
		return false;
	}

	// Normalize path separators
	const normalizedPath = filePath.replace(/\\/g, '/');

	for (const pattern of patterns) {
		const normalizedPattern = pattern.replace(/\\/g, '/');

		// Simple prefix match for directory patterns
		if (normalizedPattern.endsWith('/')) {
			if (normalizedPath.startsWith(normalizedPattern) ||
				normalizedPath.includes('/' + normalizedPattern)) {
				return true;
			}
		}

		// Glob pattern match
		if (normalizedPattern.includes('*')) {
			// Escape special regex characters except * and /
			let regexPattern = normalizedPattern
				.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
				// Replace ** with a placeholder first
				.replace(/\*\*/g, '__DOUBLESTAR__')
				// Replace single * with [^/]* (match anything except /)
				.replace(/\*/g, '[^/]*')
				// Replace placeholder with .* (match anything including /)
				.replace(/__DOUBLESTAR__/g, '.*');

			const regex = new RegExp('^' + regexPattern + '$');
			if (regex.test(normalizedPath)) {
				return true;
			}
		}

		// Exact match
		if (normalizedPath === normalizedPattern || normalizedPath.endsWith('/' + normalizedPattern)) {
			return true;
		}
	}

	return false;
}

// Load custom ignore patterns from .mustacheignore if present
const IGNORE_PATTERNS = loadIgnorePatterns();

let IGNORE_PATHS = [];

/**
 * Infer type/format for a mustache variable based on name, usage, and file context
 *
 * @param {string} varName - Variable name
 * @param {Array} usage - Usage context
 * @param {Array} files - Files where variable appears
 * @return {Object} Type and optional format
 */
function inferVariableType(varName, usage, files) {
	const name = varName.toLowerCase();
	// Heuristics by name
	if (name.endsWith('_url') || name.endsWith('_uri') || name === 'url' || name === 'uri') {
		return { type: 'string', format: 'url' };
	}
	if (name.endsWith('_email') || name === 'email') {
		return { type: 'string', format: 'email' };
	}
	if (name === 'version' || name.endsWith('_version')) {
		return { type: 'string', format: 'semver' };
	}
	if (name === 'year') {
		return { type: 'string', format: 'year' };
	}
	if (name.endsWith('_color') || name.endsWith('_colour')) {
		return { type: 'string', format: 'color' };
	}
	if (name.startsWith('is_') || name.startsWith('has_')) {
		return { type: 'boolean' };
	}
	if (name.endsWith('_count') || name.endsWith('_number') || name === 'count' || name === 'number') {
		return { type: 'number' };
	}
	if (name.endsWith('_ids') || name.endsWith('_list') || name.endsWith('_array') || name.endsWith('_items')) {
		return { type: 'array' };
	}
	if (name.endsWith('_json')) {
		return { type: 'object', format: 'json' };
	}
	if (name === 'license') {
		return { type: 'string', format: 'spdx' };
	}
	if (name === 'slug' || name.endsWith('_slug')) {
		return { type: 'string', format: 'slug' };
	}
	if (name === 'namespace') {
		return { type: 'string', format: 'namespace' };
	}
	if (name === 'author' || name === 'author_uri') {
		return { type: 'string' };
	}
	// Heuristics by file extension
	if (files.some(f => f.endsWith('.json'))) {
		return { type: 'string' };
	}
	// Heuristics by usage context (look for array/object in JSON, etc.)
	// Fallback
	return { type: 'string' };
}

function buildRegistry(options = {}) {
	const files = gatherTemplateFiles(options).map(f => ({ ...f }));
	const summary = {
		totalFiles: files.length,
		filesWithVariables: 0,
		uniqueVariables: 0,
		totalOccurrences: 0,
	};

	const variables = {};
	const categories = {};
	// Track all discovered variable names (from files)
	const discoveredVars = new Set();

	for (const file of files) {
		let content;
		try {
			content = fs.readFileSync(file.fullPath, 'utf8');
		} catch (error) {
			continue;
		}

		const discovered = extractVariables(content);
		if (!discovered.length) {
			continue;
		}

		summary.filesWithVariables++;

		const canonicalVariables = Array.from(
			new Set(discovered.map((name) => name.split('|')[0]))
		);

		for (const varName of canonicalVariables) {
			discoveredVars.add(varName);
			if (!variables[varName]) {
				const category = categorizeVariable(varName);
				variables[varName] = {
					name: varName,
					category,
					files: [],
					count: 0,
					usage: [], // Track usage context
					type: undefined,
					format: undefined,
				};

				if (!categories[category]) {
					categories[category] = {
						variables: [],
						count: 0,
					};
				}
				categories[category].variables.push(varName);
			}

			const meta = variables[varName];
			if (!meta.files.includes(file.path)) {
				meta.files.push(file.path);
			}

			// Track usage: file and line numbers
			if (file.lines && file.lines.length > 0) {
				file.lines.forEach((line, idx) => {
					let match;
					MUSTACHE_REGEX.lastIndex = 0;
					while ((match = MUSTACHE_REGEX.exec(line)) !== null) {
						const foundVar = match[1].split('|')[0];
						if (foundVar === varName) {
							meta.usage.push({ file: file.path, line: idx + 1 });
						}
					}
				});
			}

			const occurrences = countOccurrences(content, varName);
			meta.count += occurrences;
			summary.totalOccurrences += occurrences;
		}
	}

	// Infer type/format for each variable
	for (const varName of Object.keys(variables)) {
		const meta = variables[varName];
		const files = meta.files || [];
		const usage = meta.usage || [];
		const { type, format } = inferVariableType(varName, usage, files);
		meta.type = type;
		if (format) meta.format = format;
	}

	summary.uniqueVariables = Object.keys(variables).length;

	for (const category of Object.keys(categories)) {
		categories[category].count = categories[category].variables.length;
	}

	const sortedVariables = Object.values(variables).sort((a, b) => {
		if (b.count === a.count) {
			return a.name.localeCompare(b.name);
		}
		return b.count - a.count;
	});

	// Enhancement: Detect unused/undocumented variables
	let registryVars = [];
	try {
		const registryPath = path.join(__dirname, '../mustache-variables-registry.json');
		if (fs.existsSync(registryPath)) {
			const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
			registryVars = Object.keys(registry.variables || {});
		}
	} catch (e) {
		// ignore
	}
	const missingInRegistry = Array.from(discoveredVars).filter((v) => !registryVars.includes(v));
	const unusedInFiles = registryVars.filter((v) => !discoveredVars.has(v));

	return {
		results: {
			summary,
			variables,
			categories,
			missingInRegistry,
			unusedInFiles,
		},
		sortedVariables,
	};
}

function gatherTemplateFiles(options = {}) {
	const { directories = SCAN_DIRS, rootDir = ROOT_DIR } = options;
	const files = [];

	for (const scanDir of directories) {
		const dirPath = path.join(rootDir, scanDir);
		if (!fs.existsSync(dirPath)) {
			continue;
		}

		const basePath = scanDir === '.' ? '' : scanDir;
		files.push(...scanDirectory(dirPath, basePath));
	}

	return files;
}

/**
 * Recover unique mustache placeholders from content.
 *
 * @param {string} content
 * @return {string[]}
 */
function extractVariables(content) {
	const variables = new Set();
	let match;
	MUSTACHE_REGEX.lastIndex = 0;

	while ((match = MUSTACHE_REGEX.exec(content)) !== null) {
		variables.add(match[1]);
	}

	return Array.from(variables);
}

/**
 * Categorise a placeholder for reporting.
 *
 * @param {string} varName
 * @return {string}
 */
function categorizeVariable(varName) {
	const cleanName = varName.split('|')[0];

	if ([
		'theme_slug',
		'theme_name',
		'namespace',
		'description',
	].includes(cleanName)) {
		return 'core_identity';
	}

	if (
		cleanName.includes('author') ||
		cleanName.includes('email') ||
		cleanName === 'year'
	) {
		return 'author_contact';
	}

	if (
		cleanName.includes('version') ||
		cleanName.includes('_wp_') ||
		cleanName.includes('_php_')
	) {
		return 'versioning';
	}

	if (cleanName.includes('_url') || cleanName.includes('_uri')) {
		return 'urls';
	}

	if (cleanName.includes('license')) {
		return 'license';
	}

	if (cleanName.includes('color') || cleanName.includes('_colour')) {
		return 'design_colors';
	}

	if (
		cleanName.includes('font') ||
		cleanName.includes('line_height') ||
		cleanName.includes('weight')
	) {
		return 'design_typography';
	}

	if (
		cleanName.includes('width') ||
		cleanName.includes('spacing') ||
		cleanName.includes('size')
	) {
		return 'design_layout';
	}

	if (
		cleanName.includes('text') ||
		cleanName.includes('title') ||
		cleanName.includes('excerpt') ||
		cleanName.includes('skip_link') ||
		cleanName.includes('copyright')
	) {
		return 'content_strings';
	}

	if (cleanName.includes('image') || cleanName.includes('thumbnail')) {
		return 'images';
	}

	if (
		cleanName.includes('tags') ||
		cleanName.includes('textdomain') ||
		cleanName.includes('audience')
	) {
		return 'theme_metadata';
	}

	if (cleanName.includes('button') || cleanName.includes('border')) {
		return 'ui_components';
	}

	return 'other';
}

/**
 * Count occurrences of a placeholder in a file.
 *
 * @param {string} content
 * @param {string} varName
 * @return {number}
 */
function countOccurrences(content, varName) {
	const cleaned = varName.split('|')[0];
	const escaped = cleaned.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
	const occurrences = content.match(
		new RegExp(`\\{\\{${escaped}(?:\\|[^}]+)?\\}\\}`, 'g')
	);
	return occurrences ? occurrences.length : 0;
}

/**
 * Format console output for CLI users.
 *
 * @param {Object} results
 * @param {Array<Object>} sortedVariables
 */
function displayResults(results, sortedVariables) {
	console.log(
		`Scanned ${results.summary.totalFiles} template file(s) across ${SCAN_DIRS.length} directories.`
	);
	console.log(
		`Discovered ${results.summary.uniqueVariables} unique mustache variable(s) in ${results.summary.filesWithVariables} file(s).`
	);
	console.log(`Total placeholder occurrences: ${results.summary.totalOccurrences}.`);

	const categoryLines = CATEGORY_ORDER.filter((category) => results.categories[category]);
	if (categoryLines.length) {
		console.log('Variables by category:');
		for (const category of categoryLines) {
			const summary = results.categories[category];
			console.log(`  ${category}: ${summary.count} variable(s)`);
		}
	}

	if (!sortedVariables.length) {
		console.log('No mustache placeholders were detected.');
		return;
	}

	console.log('Top placeholders:');
	sortedVariables.slice(0, 20).forEach((variable, index) => {
		console.log(
			`  ${index + 1}. {{${variable.name}}} — ${variable.count} occurrence(s) in ${variable.files.length} file(s)`
		);
	});
}

/**
 * Flatten nested config objects for easy comparison.
 *
 * @param {Object} config
 * @param {string} prefix
 * @return {Object}
 */
function flattenConfig(config, prefix = '') {
	const flattened = {};

	for (const [key, value] of Object.entries(config)) {
		const newKey = prefix ? `${prefix}_${key}` : key;

		if (value && typeof value === 'object' && !Array.isArray(value)) {
			Object.assign(flattened, flattenConfig(value, newKey));
			continue;
		}

		if (!Array.isArray(value)) {
			flattened[newKey] = value;
		}
	}

	return flattened;
}

/**
 * Determine whether a placeholder is derived rather than user provided.
 *
 * @param {string} varName
 * @return {boolean}
 */
function isDerivedVariable(varName) {
	const derived = [
		'namespace',
		'support_url',
		'support_email',
		'security_email',
		'business_email',
		'docs_url',
		'docs_repo_url',
		'content_width_px',
		'year',
		'created_date',
		'updated_date',
	];

	return derived.includes(varName);
}

/**
 * Validate a config file against the discovered placeholders.
 *
 * @param {string} configPath
 * @param {Object} results
 */
function validateConfig(configPath, results) {
	let config;
	try {
		config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	} catch (error) {
		console.error(`Unable to parse configuration at ${configPath}: ${error.message}`);
		process.exit(1);
	}

	const flatConfig = flattenConfig(config);
	const configKeys = new Set(Object.keys(flatConfig));
	const discovered = new Set(Object.keys(results.variables).map((name) => name.split('|')[0]));

	const missing = [];
	const extra = [];

	for (const placeholder of discovered) {
		if (!configKeys.has(placeholder) && !isDerivedVariable(placeholder)) {
			missing.push(placeholder);
		}
	}

	for (const key of configKeys) {
		if (
			!discovered.has(key) &&
			!key.startsWith('_') &&
			key !== 'design_system' &&
			key !== 'theme_structure' &&
			key !== 'features' &&
			key !== 'content'
		) {
			extra.push(key);
		}
	}

	if (missing.length) {
		console.error(`Missing variables from config: ${missing.join(', ')}`);
	}

	if (extra.length) {
		console.error(`Unused values in config: ${extra.join(', ')}`);
	}

	if (missing.length || extra.length) {
		process.exitCode = 1;
		return;
	}

	console.log('Configuration is in sync with the mustache registry.');
}

/**
 * Keep the registry object stable for JSON output.
 *
 * @param {Object} variables
 * @return {Object}
 */
function sortVariablesAlphabetically(variables) {
	return Object.keys(variables)
		.sort((a, b) => a.localeCompare(b))
		.reduce((acc, key) => {
			acc[key] = variables[key];
			return acc;
		}, {});
}

/**
 * CLI entry point.
 */
function runCli() {
	const args = process.argv.slice(2);
	const outputJson = args.includes('--json');
	const validateIndex = args.indexOf('--validate');
	const { results, sortedVariables } = buildRegistry();

	if (validateIndex !== -1) {
		const configPath = args[validateIndex + 1];
		if (!configPath) {
			console.error('Missing argument for --validate');
			process.exit(1);
		}
		validateConfig(configPath, results);
		return;
	}

	if (outputJson) {
		const payload = {
			summary: results.summary,
			variables: sortVariablesAlphabetically(results.variables),
		};
		console.log(JSON.stringify(payload, null, 2));
		return;
	}

	displayResults(results, sortedVariables);
}

if (require.main === module) {
	runCli();
}

module.exports = {
	SCAN_DIRS,
	EXCLUDE_DIRS,
	SCAN_EXTENSIONS,
	MUSTACHE_REGEX,
	scanDirectory,
	extractVariables,
	categorizeVariable,
	buildRegistry,
	gatherTemplateFiles,
	validateConfig,
	flattenConfig,
	isDerivedVariable,
	sortVariablesAlphabetically,
	loadIgnorePatterns,
	shouldIgnorePath,
	IGNORE_PATTERNS,
	inferVariableType,
};
