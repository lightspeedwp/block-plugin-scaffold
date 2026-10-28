#!/usr/bin/env node
/**
 * Generation check (spec 003, FR-008 to FR-011).
 *
 * Generates a plugin from each fixture in tests/fixtures/generation/ into a
 * temporary folder, then installs it from its lockfiles, builds, lints and
 * unit-tests it, and runs its Composer checks (validate, install, PHPCS,
 * PHPStan, PHPUnit), so a scaffold change that breaks generated plugins fails before it is merged.
 *
 * Usage: node scripts/toolchain/check-generation.js
 *          [--fixture <name>] [--keep] [--skip-install] [--e2e [--playground]]
 *
 * --e2e also starts wp-env in the generated plugin and runs its Playwright
 * tests. It needs Docker; add --playground to use wp-env's Playground
 * runtime instead (no Docker).
 *
 * @package
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const scaffoldDir = path.resolve(__dirname, '../..');
const fixturesDir = path.join(scaffoldDir, 'tests/fixtures/generation');

// Template tags; `${{ ... }}` GitHub Actions expressions start with a space.
const TAG = /\{\{[A-Za-z][\w.|-]*\}\}/g;
// Values the generator must replace in every generated plugin.
const EXAMPLE_VALUES = /example-plugin|example_plugin|Example Plugin|Example Author/g;

/**
 * Find unrendered template tags and scaffold example values in the files that
 * carry plugin metadata.
 *
 * @param {string} pluginDir Generated plugin root.
 * @param {string} slug      Plugin slug.
 * @return {{file: string, line: number, value: string}[]} Leftovers.
 */
function findLeftovers(pluginDir, slug) {
	return ['package.json', `${slug}.php`, 'readme.txt'].flatMap((file) => {
		const full = path.join(pluginDir, file);
		if (!fs.existsSync(full)) {
			return [];
		}
		return fs
			.readFileSync(full, 'utf8')
			.split('\n')
			.flatMap((text, index) =>
				[...text.matchAll(TAG), ...text.matchAll(EXAMPLE_VALUES)].map(
					([value]) => ({ file, line: index + 1, value })
				)
			);
	});
}

/**
 * List built block scripts that have no generated asset file.
 *
 * @param {string} pluginDir Generated plugin root.
 * @return {string[]} Relative paths of scripts without index.asset.php.
 */
function findMissingAssetFiles(pluginDir) {
	const blocksDir = path.join(pluginDir, 'build/blocks');
	if (!fs.existsSync(blocksDir)) {
		return [];
	}
	return fs
		.readdirSync(blocksDir)
		.filter(
			(block) =>
				fs.existsSync(path.join(blocksDir, block, 'index.js')) &&
				!fs.existsSync(path.join(blocksDir, block, 'index.asset.php'))
		)
		.map((block) => `build/blocks/${block}/index.js`);
}

/**
 * Run steps in order, stopping at the first one that throws.
 *
 * @param {{name: string, run: Function}[]} steps Steps to run.
 * @param {Function}                        now   Clock in milliseconds.
 * @return {{name: string, ok: boolean, ms: number, error?: string}[]} Results.
 */
function runSteps(steps, now = Date.now) {
	const results = [];
	for (const step of steps) {
		const start = now();
		try {
			step.run();
			results.push({ name: step.name, ok: true, ms: now() - start });
		} catch (error) {
			results.push({
				name: step.name,
				ok: false,
				ms: now() - start,
				error: error.message,
				output: error.output,
			});
			break;
		}
	}
	return results;
}

/**
 * Run a command in the plugin and fail with its output.
 *
 * @param {string}   cwd     Working directory.
 * @param {string}   command Executable.
 * @param {string[]} args    Arguments.
 * @return {string} Combined output.
 */
function run(cwd, command, args) {
	try {
		return execFileSync(command, args, {
			cwd,
			encoding: 'utf8',
			stdio: 'pipe',
			env: { ...process.env, CI: process.env.CI || '1' },
		});
	} catch (error) {
		const failure = new Error(`${command} ${args.join(' ')} exited with ${error.status}`);
		failure.output = `${error.stdout || ''}${error.stderr || ''}`;
		throw failure;
	}
}

/**
 * Generate and check one fixture.
 *
 * @param {string}  fixturePath Fixture config file.
 * @param {Object}  options     CLI options.
 * @return {{fixture: string, dir: string, results: Object[]}} Outcome.
 */
function checkFixture(fixturePath, options) {
	const fixture = path.basename(fixturePath, '.json');
	const { slug } = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
	const outputBase = fs.mkdtempSync(path.join(os.tmpdir(), `check-generation-${fixture}-`));
	const dir = path.join(outputBase, slug);
	const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

	const steps = [
		{
			name: 'generate',
			run: () =>
				run(scaffoldDir, process.execPath, [
					'scripts/generate-plugin.js',
					'--config',
					fixturePath,
					'--output-dir',
					outputBase,
					'--yes',
				]),
		},
		{
			name: 'leftover placeholders',
			run: () => {
				const leftovers = findLeftovers(dir, slug);
				if (leftovers.length) {
					const error = new Error(`${leftovers.length} leftover value(s)`);
					error.output = leftovers
						.map(({ file, line, value }) => `${file}:${line}  ${value}`)
						.join('\n');
					throw error;
				}
			},
		},
		...(options.skipInstall
			? []
			: [
					{
						// npm ci fails when package-lock.json does not match
						// package.json, so this also checks the shipped lock.
						name: 'npm ci',
						run: () => {
							const output = run(dir, npm, ['ci', '--no-audit', '--no-fund']);
							if (/ERESOLVE|peer dep(endency)? conflict/i.test(output)) {
								const error = new Error('peer dependency conflict');
								error.output = output;
								throw error;
							}
						},
					},
				]),
		{
			name: 'build',
			run: () => {
				run(dir, npm, ['run', 'build']);
				const missing = findMissingAssetFiles(dir);
				if (missing.length) {
					const error = new Error('block scripts without index.asset.php');
					error.output = missing.join('\n');
					throw error;
				}
			},
		},
		{ name: 'lint:js', run: () => run(dir, npm, ['run', 'lint:js']) },
		{ name: 'lint:css', run: () => run(dir, npm, ['run', 'lint:css']) },
		{ name: 'lint:pkg', run: () => run(dir, npm, ['run', 'lint:pkg']) },
		{ name: 'lint:json', run: () => run(dir, npm, ['run', 'lint:json']) },
		{ name: 'lint:md:docs', run: () => run(dir, npm, ['run', 'lint:md:docs']) },
		{ name: 'test:unit', run: () => run(dir, npm, ['run', 'test:unit']) },
		...(options.skipInstall
			? []
			: [
					{
						// Fails when composer.lock's content-hash does not
						// match composer.json.
						name: 'composer validate',
						run: () => run(dir, 'composer', ['validate', '--no-check-publish']),
					},
					{
						name: 'composer install',
						run: () =>
							run(dir, 'composer', ['install', '--no-interaction', '--no-progress']),
					},
					{ name: 'composer lint', run: () => run(dir, 'composer', ['run', 'lint']) },
					{
						name: 'composer phpstan',
						run: () => run(dir, 'composer', ['run', 'phpstan']),
					},
					{ name: 'composer test', run: () => run(dir, 'composer', ['run', 'test']) },
				]),
		...(options.e2e
			? [
					{
						name: 'test:e2e',
						run: () => {
							run(dir, 'npx', ['playwright', 'install', 'chromium']);
							run(dir, npm, [
								'run',
								'env:start',
								...(options.playground ? ['--', '--runtime=playground'] : []),
							]);
							try {
								run(dir, npm, ['run', 'test:e2e']);
							} finally {
								run(dir, npm, ['run', 'env:stop']);
							}
						},
					},
				]
			: []),
	];

	return { fixture, dir, outputBase, results: runSteps(steps) };
}

/**
 * Parse CLI arguments.
 *
 * @param {string[]} argv Arguments after the script name.
 * @return {{fixture?: string, keep: boolean, skipInstall: boolean, e2e: boolean, playground: boolean}} Options.
 */
function parseArgs(argv) {
	const fixtureIndex = argv.indexOf('--fixture');
	return {
		fixture: fixtureIndex === -1 ? undefined : argv[fixtureIndex + 1],
		keep: argv.includes('--keep'),
		skipInstall: argv.includes('--skip-install'),
		e2e: argv.includes('--e2e'),
		playground: argv.includes('--playground'),
	};
}

/**
 * Run the check for every selected fixture and print a summary.
 *
 * @return {number} Exit code.
 */
function main() {
	const options = parseArgs(process.argv.slice(2));
	const fixtures = fs
		.readdirSync(fixturesDir)
		.filter((file) => file.endsWith('.json'))
		.filter((file) => !options.fixture || file === `${options.fixture}.json`)
		.map((file) => path.join(fixturesDir, file));

	if (!fixtures.length) {
		process.stderr.write(`No fixtures found for "${options.fixture}".\n`);
		return 2;
	}

	let failed = false;
	for (const fixturePath of fixtures) {
		const outcome = checkFixture(fixturePath, options);
		const ok = outcome.results.every((result) => result.ok);
		failed = failed || !ok;

		for (const { name, ok: stepOk, ms } of outcome.results) {
			process.stdout.write(
				`${stepOk ? '✔' : '✖'} ${outcome.fixture.padEnd(16)} ${name.padEnd(22)} ${(ms / 1000).toFixed(1)}s\n`
			);
		}
		const failure = outcome.results.find((result) => !result.ok);
		if (failure) {
			process.stdout.write(`\n${failure.name}: ${failure.error}\n${failure.output || ''}\n`);
		}

		// Keep a failed plugin locally for debugging; CI starts clean every run.
		if (options.keep || (!ok && !process.env.GITHUB_ACTIONS)) {
			process.stdout.write(`Kept: ${outcome.dir}\n\n`);
		} else {
			fs.rmSync(outcome.outputBase, { recursive: true, force: true });
		}
	}

	process.stdout.write(failed ? '\nGeneration check failed.\n' : '\nGeneration check passed.\n');
	return failed ? 1 : 0;
}

if (require.main === module) {
	process.exit(main());
}

module.exports = { findLeftovers, findMissingAssetFiles, runSteps };
