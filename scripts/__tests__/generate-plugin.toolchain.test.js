/**
 * Tests for the standard toolchain in a generated plugin (spec 003): the
 * package and Composer manifests, one config file per tool, the plugin-template
 * files, and no scaffold-only or organisation-provided files.
 *
 * @package
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// Require the generator from a temporary directory, so output never lands in
// the repo's own generated-plugins/ (see generate-plugin.output.test.js).
const TEMP_CWD = fs.mkdtempSync(path.join(os.tmpdir(), 'generate-plugin-toolchain-'));
const ORIGINAL_CWD = process.cwd();
process.chdir(TEMP_CWD);
const { generatePlugin } = require('../generate-plugin');
process.chdir(ORIGINAL_CWD);

const toolchain = require('../toolchain/standard-toolchain.json');

const CONFIG = {
	slug: 'toolchain-check',
	name: 'Toolchain Check',
	author: 'LightSpeed',
	content_model: 'none',
};

let outputDir;

beforeAll(() => {
	outputDir = generatePlugin(CONFIG, false);
});

afterAll(() => {
	fs.rmSync(TEMP_CWD, { recursive: true, force: true });
});

const readJson = (file) =>
	JSON.parse(fs.readFileSync(path.join(outputDir, file), 'utf8'));
const exists = (file) => fs.existsSync(path.join(outputDir, file));

/**
 * List every file in the generated plugin, relative to its root.
 *
 * @param {string} dir Directory to walk.
 * @return {string[]} Relative file paths.
 */
function listFiles(dir = outputDir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = path.join(dir, entry.name);
		return entry.isDirectory()
			? listFiles(full)
			: [path.relative(outputDir, full)];
	});
}

describe('standard-toolchain.json', () => {
	it('defines the 10 standard command aliases', () => {
		expect(toolchain.scripts.standard).toEqual([
			'start',
			'build',
			'format',
			'lint:js',
			'lint:css',
			'lint:pkg',
			'test:unit',
			'test:e2e',
			'packages-update',
			'zip',
		]);
		toolchain.scripts.standard.forEach((alias) => {
			expect(toolchain.scripts.all[alias]).toEqual(expect.any(String));
		});
	});

	it('uses caret or exact semver ranges only', () => {
		Object.values({
			...toolchain.dependencies,
			...toolchain.devDependencies,
			...toolchain.composer['require-dev'],
		}).forEach((range) => {
			expect(range).toMatch(/^\^?\d+\.\d+(\.\d+)?$/);
		});
	});

	it('never lists a package that @wordpress/scripts already provides', () => {
		Object.keys(toolchain.providedBy).forEach((name) => {
			expect(toolchain.devDependencies).not.toHaveProperty(name);
		});
	});
});

describe('generatePlugin: package.json', () => {
	it('takes metadata from the config and the toolchain from the standard', () => {
		const pkg = readJson('package.json');

		expect(pkg).toMatchObject({
			name: 'toolchain-check',
			author: 'LightSpeed',
			license: 'GPL-2.0-or-later',
			engines: toolchain.engines,
			scripts: toolchain.scripts.all,
			'lint-staged': toolchain.lintStaged,
			dependencies: toolchain.dependencies,
			devDependencies: toolchain.devDependencies,
		});
	});

	it('orders fields as npm-package-json-lint expects', () => {
		const keys = Object.keys(readJson('package.json'));

		expect(keys.indexOf('devDependencies')).toBeLessThan(
			keys.indexOf('scripts')
		);
		expect(keys[0]).toBe('name');
	});

	it('derives the URLs the WordPress package lint requires', () => {
		expect(readJson('package.json')).toMatchObject({
			homepage: 'https://github.com/lightspeedwp/toolchain-check',
			repository: {
				type: 'git',
				url: 'https://github.com/lightspeedwp/toolchain-check.git',
			},
			bugs: { url: 'https://github.com/lightspeedwp/toolchain-check/issues' },
		});
	});

	it('contains no template tags or scaffold example values', () => {
		const raw = fs.readFileSync(path.join(outputDir, 'package.json'), 'utf8');

		expect(raw).not.toMatch(/\{\{[A-Za-z][\w\s|-]*\}\}/);
		expect(raw).not.toMatch(/example-plugin|example_plugin|Example Author/);
	});
});

describe('generatePlugin: composer.json', () => {
	it('defines the lint:fix script that lint-staged calls', () => {
		const composer = readJson('composer.json');

		expect(composer.scripts).toEqual(toolchain.composer.scripts);
		expect(composer['require-dev']).toEqual(toolchain.composer['require-dev']);
	});
});

describe('generatePlugin: config files', () => {
	it('has exactly one config per tool', () => {
		[
			'eslint.config.mjs',
			'.stylelintrc.js',
			'prettier.config.mjs',
			'vitest.config.mjs',
			'playwright.config.js',
			'phpcs.xml.dist',
			'.stylelintignore',
			'.markdownlintignore',
			'.npmpackagejsonlintrc.json',
			'tools/eslint/index.mjs',
			'.browserslistrc',
			'postcss.config.mjs',
			'tsconfig.json',
			'tsconfig.build.json',
			'jsconfig.json',
			'tools/webpack/extra-entries.js',
			'.coderabbit.yml',
			'AGENTS.md',
			'CLAUDE.md',
			'.agents/roles/INVENTORY.md',
			'.claude/agents/reviewer-agent.md',
			'.claude/settings.json',
			'.claude/hooks/check-branch.mjs',
			'.codex/config.toml',
			'.codex/agents/reviewer-agent.toml',
			'.gemini/settings.json',
			'.gemini/agents/reviewer-agent.md',
			'toolchain-check.code-workspace',
			'docs/README.md',
			'docs/INTERACTIVITY-AND-DATAVIEWS.md',
			'phpstan.neon',
			'.husky/pre-commit',
		].forEach((file) => expect(exists(file)).toBe(true));

		[
			'.eslintrc.cjs',
			'eslint.config.cjs',
			'.eslint.config.cjs',
			'.stylelintrc.json',
			'.prettierrc.js',
			'phpcs.xml',
			'.eslintignore',
			'.stylelint.config.cjs',
			'.prettier.config.cjs',
			'.prettierignore',
			'.jest.config.cjs',
			'jest.config.js',
			'.npmpackagejsonlintrc.cjs',
			'.postcss.config.cjs',
		].forEach((file) => expect(exists(file)).toBe(false));
	});

	it('uses the plugin configs from plugin-template/, not the scaffold versions', () => {
		expect(
			fs.readFileSync(path.join(outputDir, 'eslint.config.mjs'), 'utf8')
		).not.toMatch(/scripts\/\*\*/);
		expect(
			fs.readFileSync(path.join(outputDir, 'phpcs.xml.dist'), 'utf8')
		).not.toMatch(/exclude-pattern>inc\//);
	});
});

describe('generatePlugin: plugin-template files', () => {
	it('copies the starter tests and CI workflow', () => {
		[
			'test/unit/setup.js',
			'bin/validate-json.js',
			'test/unit/utils/fields.test.js',
			'test/e2e/blocks.spec.js',
			'phpunit/phpstan-bootstrap.php',
			'.github/workflows/ci.yml',
			'.gitignore',
		].forEach((file) => expect(exists(file)).toBe(true));
		expect(exists('plugin-template')).toBe(false);
	});

	it('renders the plugin files with no template tags left', () => {
		listFiles().forEach((file) => {
			if (!/\.(js|cjs|mjs|json|php|xml|neon|yml)$/.test(file)) {
				return;
			}
			const content = fs.readFileSync(path.join(outputDir, file), 'utf8');
			expect([file, content.match(/\{\{[A-Za-z][\w.|-]*\}\}/g)]).toEqual([
				file,
				null,
			]);
		});
	});

	it('keeps the Claude skill links to the shared skills', () => {
		['test', 'validate', 'changelog', 'branch-validation'].forEach((skill) => {
			const link = path.join(outputDir, '.claude/skills', skill);
			expect(fs.lstatSync(link).isSymbolicLink()).toBe(true);
			expect(fs.readlinkSync(link)).toBe(`../../.agents/skills/${skill}`);
			expect(fs.existsSync(path.join(link, 'SKILL.md'))).toBe(true);
		});
	});

	it('keeps Spec Kit placeholders and script permissions', () => {
		const command = '.gemini/commands/speckit.plan.toml';
		expect(fs.readFileSync(path.join(outputDir, command), 'utf8')).toBe(
			fs.readFileSync(
				path.join(__dirname, '../../plugin-template', command),
				'utf8'
			)
		);
		expect(
			fs.statSync(
				path.join(outputDir, '.specify/scripts/bash/create-new-feature.sh')
			).mode & 0o111
		).not.toBe(0);
		expect(
			fs.readFileSync(
				path.join(outputDir, '.specify/memory/constitution.md'),
				'utf8'
			)
		).toContain('# Toolchain Check Constitution');
	});

	it('copies the workflows without rendering their GitHub expressions', () => {
		['ci.yml', 'changelog.yml', 'release.yml'].forEach((file) => {
			const workflow = path.join('.github/workflows', file);
			expect(fs.readFileSync(path.join(outputDir, workflow), 'utf8')).toBe(
				fs.readFileSync(
					path.join(__dirname, '../../plugin-template', workflow),
					'utf8'
				)
			);
		});
	});
});

describe('generatePlugin: scaffold-only and organisation-provided files', () => {
	it('does not copy them into the plugin', () => {
		[
			'.devcontainer',
			'.gemini/settings.local.json',
			'.gpt',
			'.qodo',
			'.mustacheignore',
			'.lighthouserc.js',
			'.size-limit.json',
			'codecov.yml',
			'VERSION',
			'CODE_OF_CONDUCT.md',
			'SUPPORT.md',
		].forEach((file) => expect([file, exists(file)]).toEqual([file, false]));
	});

	it('does not copy .DS_Store files from any folder', () => {
		expect(listFiles().filter((file) => file.endsWith('.DS_Store'))).toEqual(
			[]
		);
	});
});
