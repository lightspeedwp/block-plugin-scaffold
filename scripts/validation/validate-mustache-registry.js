/**
 * Scan the repository and ensure every mustache token in the registry still exists,
 * and that no new placeholders have appeared without a registry entry.
 *
 * @module scripts/validation/validate-mustache-registry
 */

const fs = require('fs');
const path = require('path');
const {
	scanDirectory,
	extractVariables,
	variableName,
	SCAN_DIRS,
} = require('../utils/scan');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'scripts', 'mustache-variables-registry.json');

/**
 * Load the registry file and return the registered variable names.
 *
 * @return {Map<string, Object>}
 */
function loadRegistry() {
	const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
	const parsed = JSON.parse(raw);
	const variables = parsed.variables ?? {};

	return new Map(Object.entries(variables));
}

/**
 * Recursively scan the workspace directories for files that might contain mustache placeholders.
 *
 * @return {Array<Object>}
 */
function gatherTemplateFiles() {
	const files = [];

	SCAN_DIRS.forEach((scanDir) => {
		const fullPath = path.join(ROOT_DIR, scanDir);
		if (!fs.existsSync(fullPath)) {
			return;
		}

		files.push(...scanDirectory(fullPath, scanDir));
	});

	return files;
}

/**
 * Extract clean variable names (without filters) from file contents.
 *
 * @param {string} content
 * @return {Array<string>}
 */
function collectVariableNames(content) {
	return extractVariables(content).map(variableName);
}

/**
 * Build a map of found variable names to the files that mention them.
 *
 * @param {Array<Object>} files
 * @return {Map<string, Set<string>>}
 */
function buildFoundMap(files) {
	const map = new Map();

	files.forEach((file) => {
		const absolute = file.fullPath;
		if (!fs.existsSync(absolute)) {
			return;
		}

		const content = fs.readFileSync(absolute, 'utf8');
		const names = collectVariableNames(content);
		if (!names.length) {
			return;
		}

		names.forEach((name) => {
			if (!map.has(name)) {
				map.set(name, new Set());
			}

			map.get(name).add(file.path);
		});
	});

	return map;
}

/**
 * Format an array of strings for logging.
 *
 * @param {Array<string>} items
 * @param {number} sample
 * @return {string}
 */
function formatList(items, sample = 3) {
	if (!items.length) {
		return '';
	}

	const sampleList = items.slice(0, sample).join(', ');
	return `${items.length} item(s): ${sampleList}${items.length > sample ? ', …' : ''}`;
}

/**
 * Check if new variables have placeholder values defined
 *
 * @param {string[]} variables - Variable names to check
 * @param {Object} placeholders - Placeholder map
 * @return {string[]} Variables without placeholders
 */
function checkNewVariablesHavePlaceholders(variables, placeholders) {
	return variables.filter(varName => {
		return !placeholders.hasOwnProperty(varName) ||
			placeholders[varName] === undefined ||
			placeholders[varName] === '';
	});
}

/**
 * Validate registry with optional strict mode
 *
 * @param {Object} registry - Registry object
 * @param {Object} placeholders - Placeholder values
 * @param {Object} options - Validation options
 * @return {Object} Validation result
 */
function validateRegistry(registry, placeholders, options = {}) {
	const errors = [];
	const warnings = [];

	if (options.strict) {
		const variables = Object.keys(registry.variables || {});
		const missing = checkNewVariablesHavePlaceholders(variables, placeholders);

		if (missing.length > 0) {
			errors.push(...missing);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

function main() {
	const args = process.argv.slice(2);
	const strictMode = args.includes('--strict');

	const registry = loadRegistry();
	const files = gatherTemplateFiles();
	const foundMap = buildFoundMap(files);

	const registryKeys = new Set(registry.keys());
	const foundKeys = new Set(foundMap.keys());

	const missingRegistry = [];
	foundKeys.forEach((key) => {
		if (!registryKeys.has(key)) {
			missingRegistry.push(key);
		}
	});

	const staleRegistry = [];
	registryKeys.forEach((key) => {
		if (!foundKeys.has(key)) {
			staleRegistry.push(key);
		}
	});

	const issues = [];

	if (missingRegistry.length) {
		issues.push(
			`Templates include ${missingRegistry.length} unregistered mustache variable(s): ${formatList(
				missingRegistry
			)}`
		);
	}

	if (staleRegistry.length) {
		issues.push(
			`Registry lists ${staleRegistry.length} variable(s) that no longer appear in templates: ${formatList(
				staleRegistry
			)}`
		);
	}

	// Strict mode: check for placeholder values
	if (strictMode && missingRegistry.length > 0) {
		// Example value of each new variable, from the scaffold's example config.
		const { getPlaceholder } = require(path.join(ROOT_DIR, 'scripts', 'utils', 'placeholders.js'));
		const placeholders = Object.fromEntries(
			missingRegistry.map((varName) => [varName, getPlaceholder(varName)])
		);

		const missingPlaceholders = checkNewVariablesHavePlaceholders(missingRegistry, placeholders);
		if (missingPlaceholders.length > 0) {
			issues.push(
				`New variables lack placeholder values: ${formatList(missingPlaceholders)}`
			);
		}
	}

	console.log(`✔ Scanned ${files.length} template file(s) across ${SCAN_DIRS.length} directories.`);
	console.log(`✔ Registry contains ${registryKeys.size} variable(s).`);

	if (issues.length) {
		console.error('❌ Mustache registry validation failed:');
		issues.forEach((issue) => console.error(`  - ${issue}`));
		process.exitCode = 1;
	} else {
		console.log('✅ Mustache registry is in sync with template files.');
	}
}

if (require.main === module) {
	main();
}

module.exports = {
	loadRegistry,
	gatherTemplateFiles,
	buildFoundMap,
	validateRegistry,
	checkNewVariablesHavePlaceholders,
};
