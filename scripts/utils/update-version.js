
#!/usr/bin/env node

/**
 * Update version number across all plugin files.
 *
 * Usage: node scripts/utils/update-version.js <new-version>
 *
 * Updates package.json, main plugin file, and version constant.
 *
 * TODO: Add support for release-scaffold.agent.md and release.agent.md workflows.
 * TODO: Add commit and changelog integration.
 *
 * @module scripts/utils/update-version
 */

const fs = require('fs');
const path = require('path');

const { log, print, validateSemver, applyUpdates } = require('./version-utils');

const newVersion = process.argv[2];

if (!newVersion) {
	log('ERROR', 'Usage: node scripts/utils/update-version.js <new-version>');
	process.exit(1);
}

try {
	validateSemver(newVersion);
} catch (error) {
	log('ERROR', error.message);
	process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');

// Determine main plugin file ({{slug}}.php)
const mainPluginFile = (() => {
       const files = fs.readdirSync(rootDir);
       const match = files.find(f => f.endsWith('.php') && f.includes('{{slug}}'));
       return match ? path.join(rootDir, match) : null;
})();

// Determine if this is a scaffold or generated plugin
const isScaffold = fs.existsSync(path.join(rootDir, 'scripts/generate-plugin.js'));

// Compose files to update
const filesToUpdate = [
       {
	       file: path.join(rootDir, 'package.json'),
	       pattern: /"version":\s*"[^"]+"/,
	       replacement: `"version": "${newVersion}"`,
	       mustacheSafe: true,
       },
       {
	       file: path.join(rootDir, 'composer.json'),
	       pattern: /"version":\s*"[^"]+"/,
	       replacement: `"version": "${newVersion}"`,
	       mustacheSafe: true,
       },
       mainPluginFile && {
	       file: mainPluginFile,
	       pattern: /Version:\s*[^\n]+/,
	       replacement: `Version:           ${newVersion}`,
	       mustacheSafe: true,
       },
       mainPluginFile && {
	       file: mainPluginFile,
	       pattern: /define\(\s*'\{\{upper\.namespace\}\}_VERSION',\s*'[^']+'\s*\)/,
	       replacement: `define( '{{upper.namespace}}_VERSION', '${newVersion}' )`,
	       mustacheSafe: true,
       },
].filter(Boolean);

// For generated plugins, update additional files
if (!isScaffold) {
       [
	       {
		       file: path.join(rootDir, '.github/agents/release.agent.md'),
		       pattern: /version: ?[\'\"]?\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?[\'\"]?/gi,
		       replacement: `version: ${newVersion}`,
		       mustacheSafe: true,
	       },
	       {
		       file: path.join(rootDir, 'scripts/agents/release.agent.js'),
		       pattern: /version\s*=\s*[\'\"]\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?[\'\"]/,
		       replacement: `version = '${newVersion}'`,
		       mustacheSafe: true,
	       },
	       {
		       file: path.join(rootDir, 'docs/RELEASE_PROCESS.md'),
		       pattern: /Version:?\s*\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?/gi,
		       replacement: `Version: ${newVersion}`,
		       mustacheSafe: true,
	       },
	       {
		       file: path.join(rootDir, 'readme.txt'),
		       pattern: /Stable tag:\s*\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?/gi,
		       replacement: `Stable tag: ${newVersion}`,
		       mustacheSafe: true,
	       },
       ].forEach(f => filesToUpdate.push(f));
}

log('INFO', `📦 Updating version to ${newVersion}...`);
print();

applyUpdates(filesToUpdate, rootDir);

print();
log('SUCCESS', '🎉 Version update complete!');
