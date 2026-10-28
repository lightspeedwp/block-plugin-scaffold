#!/usr/bin/env node
/**
 * Refresh the standard toolchain's lockfiles.
 *
 * Generated plugins get their package-lock.json and composer.lock from
 * standard-toolchain.package-lock.json and standard-toolchain.composer.lock.
 * After a change to standard-toolchain.json, run `npm run toolchain:lockfiles`:
 * it generates the ls-test plugin into a temporary folder, resolves its
 * dependencies again with npm and Composer (without installing them), and
 * copies the new lockfiles back here. Then copy them into lightspeedwp/ls-test
 * and prove them there, as for any toolchain change.
 *
 * @package
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const scaffoldDir = path.resolve(__dirname, '../..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// The plugin whose lockfiles are stored, so they stay byte-identical to ls-test's.
const LS_TEST_CONFIG = {
	slug: 'ls-test',
	name: 'LS Test',
	description: 'A functional-only LightSpeed test plugin with the default settings page.',
	author: 'LightSpeed',
	author_uri: 'https://lightspeedwp.agency',
	version: '1.0.0',
	license: 'GPL-2.0-or-later',
	content_model: 'none',
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'toolchain-lockfiles-'));
try {
	const configPath = path.join(tmp, 'ls-test-config.json');
	fs.writeFileSync(configPath, JSON.stringify(LS_TEST_CONFIG));
	execFileSync(
		process.execPath,
		['scripts/generate-plugin.js', '--config', configPath, '--output-dir', tmp, '--yes'],
		{ cwd: scaffoldDir, stdio: 'inherit' }
	);

	const pluginDir = path.join(tmp, LS_TEST_CONFIG.slug);
	execFileSync(
		npm,
		['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'],
		{ cwd: pluginDir, stdio: 'inherit' }
	);
	execFileSync('composer', ['update', '--no-install', '--no-scripts', '--no-interaction'], {
		cwd: pluginDir,
		stdio: 'inherit',
	});

	fs.copyFileSync(
		path.join(pluginDir, 'package-lock.json'),
		path.join(__dirname, 'standard-toolchain.package-lock.json')
	);
	fs.copyFileSync(
		path.join(pluginDir, 'composer.lock'),
		path.join(__dirname, 'standard-toolchain.composer.lock')
	);
	process.stdout.write(
		'Updated scripts/toolchain/standard-toolchain.package-lock.json and standard-toolchain.composer.lock.\n'
	);
} finally {
	fs.rmSync(tmp, { recursive: true, force: true });
}
