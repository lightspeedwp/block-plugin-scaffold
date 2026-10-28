#!/usr/bin/env node

/**
 * Update version number across all plugin files.
 *
 * Usage: node scripts/update-version.js <new-version>
 *
 * @package
 */

const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];

if (!newVersion) {
	log('ERROR', 'Usage: node scripts/update-version.js <new-version>');
	process.exit(1);
}

// Validate semver format.
const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
if (!semverRegex.test(newVersion)) {
	log(
		'ERROR',
		'Invalid version format. Use semantic versioning (e.g., 1.0.0)'
	);
	process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');

/**
 * Structured log helper
 *
 * @param {string} level
 * @param {string} message
 */
function log(level, message) {
	process.stdout.write(`[${level}] ${message}\n`);
}

/**
 * Print raw spacing line
 *
 * @param {string} message
 */
function print(message = '') {
	process.stdout.write(`${message}\n`);
}

const filesToUpdate = [
	{
		file: path.join(rootDir, 'package.json'),
		pattern: /"version":\s*"[^"]+"/,
		replacement: `"version": "${newVersion}"`,
	},
	{
		file: path.join(rootDir, 'example-plugin.php'),
		pattern: /Version:\s*[^\n]+/,
		replacement: `Version:           ${newVersion}`,
	},
	{
		file: path.join(rootDir, 'example-plugin.php'),
		pattern:
			/define\(\s*'\{\{upper\.namespace\}\}_VERSION',\s*'[^']+'\s*\)/,
		replacement: `define( 'EXAMPLE_PLUGIN_VERSION', '${newVersion}' )`,
	},
];

log('INFO', `📦 Updating version to ${newVersion}...`);
print();

filesToUpdate.forEach(({ file, pattern, replacement }) => {
	if (!fs.existsSync(file)) {
		log('WARN', `File not found: ${file}`);
		return;
	}

	const content = fs.readFileSync(file, 'utf8');
	const updated = content.replace(pattern, replacement);

	if (content !== updated) {
		fs.writeFileSync(file, updated);
		log('INFO', `Updated: ${path.relative(rootDir, file)}`);
	} else {
		log('INFO', `No changes: ${path.relative(rootDir, file)}`);
	}
});

print();
log('SUCCESS', '🎉 Version update complete!');
