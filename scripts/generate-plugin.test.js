#!/usr/bin/env node

/**
 * Tests for generator helpers
 *
 * @package
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'test';

const {
	sanitizeInput,
	applyDefaults,
	applyFilter,
	replaceMustacheVars,
	findUnsetTags,
	loadConfigFile,
	validateConfig,
	loadSchema,
	generatePlugin,
} = require('./generate-plugin');

const ROOT_DIR = path.resolve(__dirname, '..');
const CLI_PATH = path.join(ROOT_DIR, 'scripts', 'generate-plugin.js');
const CLI_ENV = { ...process.env, NODE_ENV: 'test' };
const INVALID_CONFIG_PATH = path.join(
	ROOT_DIR,
	'tmp',
	'invalid-plugin-config.json'
);

afterAll(() => {
	process.env.NODE_ENV = originalNodeEnv;
});

const FIXTURE_PATH = path.join(
	ROOT_DIR,
	'tests',
	'fixtures',
	'plugin-config.test.json'
);

describe('generate-plugin helpers', () => {
	test('sanitizeInput canonicalises slug, namespace, name, url, and version', () => {
		expect(sanitizeInput(' Tour__Plugin++ ', 'slug')).toBe('tour-plugin');
		expect(sanitizeInput('Tour Operator', 'namespace')).toBe(
			'tour_operator'
		);
		expect(sanitizeInput('  sample name ', 'name')).toBe('Sample Name');
		expect(sanitizeInput('example.com', 'url')).toBe('https://example.com');
		expect(sanitizeInput('not-a-url', 'url')).toBe('https://not-a-url');
		expect(sanitizeInput('not a url at all', 'url')).toBe('');
		expect(sanitizeInput('1.2', 'version')).toBe('1.2.0');
		expect(sanitizeInput('v1', 'version')).toBe('1.0.0');
	});

	test('applyDefaults derives values and populates defaults', () => {
		const config = {
			slug: 'tour-operator-pro',
			name: 'Tour Operator Pros',
			author: 'LightSpeed',
		};

		const result = applyDefaults(config);

		expect(result.textdomain).toBe('tour-operator-pro');
		expect(result.namespace).toBe('tour_operator_pro');
		expect(result.cpt_slug).toBe('tour');
		expect(result.name_singular).toBe('Tour Operator Pro');
		expect(result.name_plural).toBe('Tour Operator Pros');
		expect(result.blocks).toContain('card');
		expect(result.templates).toContain('single');
		expect(result.cpt_supports).toEqual(
			expect.arrayContaining(['title', 'editor'])
		);
		expect(result.cpt_has_archive).toBe(true);
		expect(result.cpt_public).toBe(true);
		expect(result.cpt_menu_icon).toBe('dashicons-admin-post');
	});

	test('applyFilter handles text transformations', () => {
		expect(applyFilter('example plugin', 'upper')).toBe('EXAMPLE PLUGIN');
		expect(applyFilter('Example Plugin', 'lower')).toBe('example plugin');
		expect(applyFilter('example-plugin', 'pascalCase')).toBe(
			'ExamplePlugin'
		);
		expect(applyFilter('example-plugin', 'camelCase')).toBe(
			'examplePlugin'
		);
		expect(applyFilter('examplePlugin', 'kebabCase')).toBe(
			'example-plugin'
		);
		expect(applyFilter('examplePlugin', 'snakeCase')).toBe(
			'example_plugin'
		);
		expect(applyFilter('value', 'unknown')).toBe('value');
	});

	test('replaceMustacheVars handles filters and missing keys', () => {
		const config = { name: 'Example Plugin', slug: 'example-plugin' };
		const template =
			'{{upper.name}} renders {{slug}}, missing {{missing}} should be empty.';
		const rendered = replaceMustacheVars(template, config);

		expect(rendered).toContain('EXAMPLE PLUGIN');
		expect(rendered).toContain('example-plugin');
		expect(rendered).not.toContain('{{missing}}');
	});

	test('replaceMustacheVars applies filters as mustache.js dotted names', () => {
		const config = { namespace: 'tour_operator', slug: 'tour-operator' };

		expect(
			replaceMustacheVars(
				'{{upper.namespace}} {{pascalCase.namespace}} {{camelCase.slug}}',
				config
			)
		).toBe('TOUR_OPERATOR TourOperator tourOperator');
	});

	test('replaceMustacheVars does not HTML-escape values', () => {
		expect(
			replaceMustacheVars("'{{name}}'", { name: 'Tours & <Trips>' })
		).toBe("'Tours & <Trips>'");
	});

	test('findUnsetTags lists tags with no value, including filtered ones', () => {
		expect(
			findUnsetTags('{{slug}} {{missing}} {{upper.slug}} {{upper.nope}}', {
				slug: 'example-plugin',
			})
		).toEqual(['missing', 'upper.nope']);
	});

	test('loadConfigFile returns parsed fixture content', () => {
		const loaded = loadConfigFile(FIXTURE_PATH);

		expect(loaded).toMatchObject({
			slug: 'test-plugin',
			name: 'Test Plugin',
			author: 'Test Team',
		});
	});

	test('validateConfig returns valid when config satisfies schema', () => {
		const config = loadConfigFile(FIXTURE_PATH);

		const result = validateConfig(config);

		expect(result.valid).toBe(true);
		expect(result.errors).toBeNull();
	});

	test('validateConfig reports errors for missing required fields', () => {
		const result = validateConfig({ name: 'Missing Slug' });

		expect(result.valid).toBe(false);
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					instancePath: '',
					message: expect.any(String),
				}),
			])
		);
	});
});

test('loadSchema returns JSON schema metadata', () => {
	const schema = loadSchema();

	expect(schema).toHaveProperty('title');
	expect(schema.required).toEqual(
		expect.arrayContaining(['slug', 'name', 'author'])
	);
});

describe('generate-plugin CLI commands', () => {
	afterAll(() => {
		if (fs.existsSync(INVALID_CONFIG_PATH)) {
			fs.rmSync(INVALID_CONFIG_PATH, { force: true });
		}
	});

	test('--help displays the usage guide', () => {
		const result = spawnSync('node', [CLI_PATH, '--help'], {
			encoding: 'utf8',
			cwd: ROOT_DIR,
			env: CLI_ENV,
		});

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('Multi-Block Plugin Generator');
	});

	test('--validate succeeds with a valid config file', () => {
		const result = spawnSync(
			'node',
			[CLI_PATH, '--validate', FIXTURE_PATH],
			{
				encoding: 'utf8',
				cwd: ROOT_DIR,
				env: CLI_ENV,
			}
		);

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('Configuration is valid');
	});

	test('--validate reports failure on invalid config', () => {
		fs.mkdirSync(path.dirname(INVALID_CONFIG_PATH), { recursive: true });
		fs.writeFileSync(
			INVALID_CONFIG_PATH,
			JSON.stringify({ name: 'Missing slug' }),
			'utf8'
		);

		const result = spawnSync(
			'node',
			[CLI_PATH, '--validate', INVALID_CONFIG_PATH],
			{
				encoding: 'utf8',
				cwd: ROOT_DIR,
				env: CLI_ENV,
			}
		);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('❌ Configuration validation failed');
	});
});

describe('generatePlugin runner', () => {
	test('generatePlugin produces an output plugin scaffold', () => {
		const baseConfig = loadConfigFile(FIXTURE_PATH);
		const slug = `coverage-test-${Date.now()}`;
		const config = {
			...baseConfig,
			slug,
			name: 'Coverage Test Plugin',
			namespace: `coverage_test_${Date.now()}`,
		};

		let outputDir;

		try {
			outputDir = generatePlugin(config, false);

			expect(outputDir).toContain(path.join('generated-plugins', slug));
			expect(fs.existsSync(path.join(outputDir, 'package.json'))).toBe(
				true
			);
			expect(fs.existsSync(path.join(outputDir, 'composer.json'))).toBe(
				true
			);
			expect(fs.existsSync(path.join(outputDir, 'README.md'))).toBe(true);
			expect(
				fs.existsSync(
					path.join(
						outputDir,
						'scripts',
						'dry-run',
						'__tests__'
					)
				)
			).toBe(false);

			expect(console).toHaveLogged();
		} finally {
			if (outputDir && fs.existsSync(outputDir)) {
				fs.rmSync(outputDir, { recursive: true, force: true });
			}

			const logFile = path.join(
				ROOT_DIR,
				'logs',
				`generate-plugin-${slug}.log`
			);
			if (fs.existsSync(logFile)) {
				fs.rmSync(logFile, { force: true });
			}
		}
	});
});
