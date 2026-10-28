#!/usr/bin/env node
/**
 * Compare the toolchain files of two plugins (spec 003, FR-027).
 *
 * Usage: node scripts/toolchain/compare-toolchain.js <plugin-a> <plugin-b>
 *
 * Prints a unified diff for every toolchain file that differs and exits with
 * 1, or exits with 0 when they match. Plugin metadata in package.json and
 * composer.json is left out, so two plugins with different names compare by
 * toolchain only.
 *
 * @package
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Toolchain files compared exactly (data-model.md §6).
const FILES = [
	'eslint.config.mjs',
	'.stylelintrc.js',
	'prettier.config.mjs',
	'.editorconfig',
	'.stylelintignore',
	'.jshintignore',
	'.markdownlintignore',
	'.markdownlint.json',
	'.npmpackagejsonlintrc.json',
	'.browserslistrc',
	'postcss.config.mjs',
	'tsconfig.json',
	'tsconfig.build.json',
	'jsconfig.json',
	'vitest.config.mjs',
	'playwright.config.js',
	'phpcs.xml.dist',
	'phpstan.neon',
	'phpunit.xml',
	'.wp-env.json',
	'.npmrc',
	'.husky/pre-commit',
	'.github/workflows/ci.yml',
	'.github/workflows/changelog.yml',
	'.github/workflows/release.yml',
	'.distignore',
	'.coderabbit.yml',
	'AGENTS.md',
	'CLAUDE.md',
	'.gitignore',
	'webpack.config.js',
];
// Folders whose files are all compared.
const DIRS = [
	'bin',
	'tools',
	'test/unit',
	'test/e2e',
	'phpunit',
	'.agents',
	'.claude',
	'.codex',
	'.gemini',
	'.specify',
	'guidelines',
];
// Manifest fields compared; metadata such as name and URLs is left out.
const PACKAGE_FIELDS = [
	'engines',
	'main',
	'dependencies',
	'devDependencies',
	'scripts',
	'lint-staged',
];
const COMPOSER_FIELDS = ['require', 'require-dev', 'scripts', 'config'];

/**
 * List files under a folder, relative to the plugin root.
 *
 * @param {string} root Plugin root.
 * @param {string} dir  Folder relative to the root.
 * @return {string[]} Relative file paths.
 */
function listFiles(root, dir) {
	const full = path.join(root, dir);
	if (!fs.existsSync(full)) {
		return [];
	}
	return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) =>
		entry.isDirectory()
			? listFiles(root, path.join(dir, entry.name))
			: [path.join(dir, entry.name)]
	);
}

/**
 * Read a file, or a manifest reduced to its toolchain fields.
 *
 * @param {string} root Plugin root.
 * @param {string} file Relative path.
 * @return {string|null} Comparable content, or null when missing.
 */
function readComparable(root, file) {
	const full = path.join(root, file);
	if (!fs.existsSync(full)) {
		return null;
	}
	// Compare a link by its target, not by the folder it points to.
	if (fs.lstatSync(full).isSymbolicLink()) {
		return `symlink -> ${fs.readlinkSync(full)}\n`;
	}
	const content = fs.readFileSync(full, 'utf8');
	const fields = { 'package.json': PACKAGE_FIELDS, 'composer.json': COMPOSER_FIELDS }[file];
	if (!fields) {
		return content;
	}
	const json = JSON.parse(content);
	const picked = Object.fromEntries(
		fields.filter((field) => field in json).map((field) => [field, json[field]])
	);
	return `${JSON.stringify(picked, null, '\t')}\n`;
}

/**
 * Compare two plugins' toolchain files.
 *
 * @param {string} a First plugin root.
 * @param {string} b Second plugin root.
 * @return {{file: string, a: string|null, b: string|null}[]} Differences.
 */
function compareToolchain(a, b) {
	const files = new Set([
		'package.json',
		'composer.json',
		...FILES,
		...DIRS.flatMap((dir) => [...listFiles(a, dir), ...listFiles(b, dir)]),
	]);
	return [...files]
		.sort()
		.map((file) => ({ file, a: readComparable(a, file), b: readComparable(b, file) }))
		.filter(({ a: left, b: right }) => left !== right);
}

/**
 * Print a unified diff for one difference.
 *
 * @param {{file: string, a: string|null, b: string|null}} difference Difference.
 */
function printDiff({ file, a, b }) {
	if (a === null || b === null) {
		process.stdout.write(`Only in ${a === null ? 'second' : 'first'} plugin: ${file}\n`);
		return;
	}
	const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'compare-toolchain-'));
	fs.writeFileSync(path.join(tmp, 'a'), a);
	fs.writeFileSync(path.join(tmp, 'b'), b);
	try {
		execFileSync('diff', ['-u', '--label', `a/${file}`, '--label', `b/${file}`, 'a', 'b'], {
			cwd: tmp,
			stdio: 'inherit',
		});
	} catch {
		// diff exits with 1 when files differ; the output is the point.
	} finally {
		fs.rmSync(tmp, { recursive: true, force: true });
	}
}

if (require.main === module) {
	const [a, b] = process.argv.slice(2);
	if (!a || !b) {
		process.stderr.write('Usage: compare-toolchain.js <plugin-a> <plugin-b>\n');
		process.exit(2);
	}
	const differences = compareToolchain(path.resolve(a), path.resolve(b));
	differences.forEach(printDiff);
	process.stdout.write(
		differences.length
			? `\n${differences.length} toolchain file(s) differ.\n`
			: 'Toolchain files match.\n'
	);
	process.exit(differences.length ? 1 : 0);
}

module.exports = { compareToolchain };
