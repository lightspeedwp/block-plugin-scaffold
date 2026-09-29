/**
 * Tests for generate-plugin.js
 *
 * @package
 */

const {
	sanitizeInput,
	loadSchema,
	validateConfig,
	applyDefaults,
	applyFilter,
	replaceMustacheVars,
} = require('../generate-plugin');

describe('sanitizeInput', () => {
	describe('slug type', () => {
		it('should convert to lowercase and replace spaces with hyphens', () => {
			expect(sanitizeInput('My Plugin', 'slug')).toBe('my-plugin');
		});

		it('should remove invalid characters', () => {
			expect(sanitizeInput('My_Plugin!@#', 'slug')).toBe('my-plugin');
		});

		it('should handle consecutive hyphens', () => {
			expect(sanitizeInput('my--plugin', 'slug')).toBe('my-plugin');
		});

		it('should trim hyphens from ends', () => {
			expect(sanitizeInput('-my-plugin-', 'slug')).toBe('my-plugin');
		});

		it('should handle empty string', () => {
			expect(sanitizeInput('', 'slug')).toBe('');
		});

		it('should truncate to 50 characters', () => {
			const longSlug = 'a'.repeat(60);
			const result = sanitizeInput(longSlug, 'slug');
			expect(result.length).toBeLessThanOrEqual(50);
		});
	});

	describe('namespace type', () => {
		it('should convert to lowercase with underscores', () => {
			expect(sanitizeInput('My Plugin', 'namespace')).toBe('my_plugin');
		});

		it('should remove invalid characters', () => {
			expect(sanitizeInput('My-Plugin!@#', 'namespace')).toBe(
				'my_plugin'
			);
		});

		it('should handle consecutive underscores', () => {
			expect(sanitizeInput('my__plugin', 'namespace')).toBe('my_plugin');
		});

		it('should trim underscores from ends', () => {
			expect(sanitizeInput('_my_plugin_', 'namespace')).toBe('my_plugin');
		});
	});

	describe('name type', () => {
		it('should preserve spaces and capitalize', () => {
			expect(sanitizeInput('my plugin name', 'name')).toBe(
				'My Plugin Name'
			);
		});

		it('should remove excessive whitespace', () => {
			expect(sanitizeInput('my  plugin   name', 'name')).toBe(
				'My Plugin Name'
			);
		});

		it('should trim whitespace', () => {
			expect(sanitizeInput('  my plugin  ', 'name')).toBe('My Plugin');
		});
	});

	describe('url type', () => {
		it('should preserve valid URLs', () => {
			const url = 'https://example.com';
			expect(sanitizeInput(url, 'url')).toBe(url);
		});

		it('should add https:// if missing', () => {
			expect(sanitizeInput('example.com', 'url')).toBe(
				'https://example.com'
			);
		});

		it('should preserve http://', () => {
			expect(sanitizeInput('http://example.com', 'url')).toBe(
				'http://example.com'
			);
		});

		it('should trim whitespace', () => {
			expect(sanitizeInput('  https://example.com  ', 'url')).toBe(
				'https://example.com'
			);
		});
	});

	describe('version type', () => {
		it('should preserve valid semantic versions', () => {
			expect(sanitizeInput('1.2.3', 'version')).toBe('1.2.3');
		});

		it('should default to 1.0.0 for invalid versions', () => {
			expect(sanitizeInput('invalid', 'version')).toBe('1.0.0');
		});

		it('should handle single digit versions', () => {
			expect(sanitizeInput('1', 'version')).toBe('1.0.0');
		});

		it('should handle two digit versions', () => {
			expect(sanitizeInput('1.2', 'version')).toBe('1.2.0');
		});
	});

	describe('text type', () => {
		it('should trim whitespace', () => {
			expect(sanitizeInput('  text  ', 'text')).toBe('text');
		});

		it('should preserve internal spacing', () => {
			expect(sanitizeInput('some text here', 'text')).toBe(
				'some text here'
			);
		});

		it('should remove excessive whitespace', () => {
			expect(sanitizeInput('some   text   here', 'text')).toBe(
				'some text here'
			);
		});
	});
});

describe('loadSchema', () => {
	it('should load and parse the schema file', () => {
		const schema = loadSchema();
		expect(schema).toBeDefined();
		expect(schema.$schema).toBe(
			'https://json-schema.org/draft/2020-12/schema'
		);
		expect(schema.type).toBe('object');
		expect(schema.required).toContain('slug');
		expect(schema.required).toContain('name');
		expect(schema.required).toContain('author');
	});

	it('should have properties defined', () => {
		const schema = loadSchema();
		expect(schema.properties).toBeDefined();
		expect(schema.properties.slug).toBeDefined();
		expect(schema.properties.name).toBeDefined();
		expect(schema.properties.author).toBeDefined();
	});
});

describe('validateConfig', () => {
	let validConfig;

	beforeEach(() => {
		validConfig = {
			slug: 'test-plugin',
			name: 'Test Plugin',
			author: 'Test Author',
		};
	});

	it('should validate a valid minimal config', () => {
		const result = validateConfig(validConfig);
		expect(result.valid).toBe(true);
		expect(result.errors).toBeNull();
	});

	it('should reject config missing required slug', () => {
		delete validConfig.slug;
		const result = validateConfig(validConfig);
		expect(result.valid).toBe(false);
		expect(result.errors).toBeDefined();
	});

	it('should reject config missing required name', () => {
		delete validConfig.name;
		const result = validateConfig(validConfig);
		expect(result.valid).toBe(false);
		expect(result.errors).toBeDefined();
	});

	it('should reject config missing required author', () => {
		delete validConfig.author;
		const result = validateConfig(validConfig);
		expect(result.valid).toBe(false);
		expect(result.errors).toBeDefined();
	});

	it('should reject invalid slug format', () => {
		validConfig.slug = 'Invalid Slug!';
		const result = validateConfig(validConfig);
		expect(result.valid).toBe(false);
	});

	it('should accept valid optional fields', () => {
		validConfig.description = 'Test description';
		validConfig.version = '1.0.0';
		validConfig.author_uri = 'https://example.com';
		const result = validateConfig(validConfig);
		expect(result.valid).toBe(true);
	});

	it('should reject invalid version format', () => {
		validConfig.version = 'invalid';
		const result = validateConfig(validConfig);
		expect(result.valid).toBe(false);
	});

	it('should validate complete plugin config', () => {
		const completeConfig = {
			slug: 'tour-operator',
			name: 'Tour Operator',
			author: 'LightSpeed',
			description: 'Tour booking plugin',
			version: '1.0.0',
			author_uri: 'https://developer.lsdev.biz',
			license: 'GPL-2.0-or-later',
			cpt_slug: 'tour',
			cpt_supports: ['title', 'editor', 'thumbnail'],
		};
		const result = validateConfig(completeConfig);
		expect(result.valid).toBe(true);
	});

	it('should reject content_model: "none" combined with non-empty post_types', () => {
		validConfig.content_model = 'none';
		validConfig.post_types = [
			{ slug: 'tour', singular: 'Tour', plural: 'Tours' },
		];
		const result = validateConfig(validConfig);
		expect(result.valid).toBe(false);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('content_model');
		expect(result.errors[0].message).toContain('post_types');
	});

	it('should accept content_model: "none" with no post_types/taxonomies', () => {
		validConfig.content_model = 'none';
		const result = validateConfig(validConfig);
		expect(result.valid).toBe(true);
	});
});

describe('applyDefaults', () => {
	it('should derive namespace from slug', () => {
		const config = { slug: 'my-plugin' };
		const result = applyDefaults(config);
		expect(result.namespace).toBe('my_plugin');
	});

	it('should derive textdomain from slug', () => {
		const config = { slug: 'my-plugin' };
		const result = applyDefaults(config);
		expect(result.textdomain).toBe('my-plugin');
	});

	it('should set default version', () => {
		const config = { slug: 'my-plugin' };
		const result = applyDefaults(config);
		expect(result.version).toBe('1.0.0');
	});

	it('should preserve existing version', () => {
		const config = { slug: 'my-plugin', version: '2.0.0' };
		const result = applyDefaults(config);
		expect(result.version).toBe('2.0.0');
	});

	it('should set default license', () => {
		const config = { slug: 'my-plugin' };
		const result = applyDefaults(config);
		expect(result.license).toBe('GPL-2.0-or-later');
	});

	it('should derive cpt_slug from slug if not provided', () => {
		const config = { slug: 'tour-operator' };
		const result = applyDefaults(config);
		expect(result.cpt_slug).toBe('tour');
	});

	it('should preserve existing cpt_slug', () => {
		const config = { slug: 'tour-operator', cpt_slug: 'custom' };
		const result = applyDefaults(config);
		expect(result.cpt_slug).toBe('custom');
	});

	it('should set default blocks array', () => {
		const config = { slug: 'my-plugin' };
		const result = applyDefaults(config);
		expect(result.blocks).toEqual([
			'card',
			'collection',
			'slider',
			'featured',
		]);
	});

	it('should preserve existing blocks', () => {
		const config = { slug: 'my-plugin', blocks: ['card', 'slider'] };
		const result = applyDefaults(config);
		expect(result.blocks).toEqual(['card', 'slider']);
	});
});

describe('applyFilter', () => {
	describe('upper filter', () => {
		it('should convert to uppercase', () => {
			expect(applyFilter('test', 'upper')).toBe('TEST');
		});

		it('should handle mixed case', () => {
			expect(applyFilter('TeSt', 'upper')).toBe('TEST');
		});
	});

	describe('lower filter', () => {
		it('should convert to lowercase', () => {
			expect(applyFilter('TEST', 'lower')).toBe('test');
		});

		it('should handle mixed case', () => {
			expect(applyFilter('TeSt', 'lower')).toBe('test');
		});
	});

	describe('pascalCase filter', () => {
		it('should convert snake_case to PascalCase', () => {
			expect(applyFilter('my_plugin_name', 'pascalCase')).toBe(
				'MyPluginName'
			);
		});

		it('should convert kebab-case to PascalCase', () => {
			expect(applyFilter('my-plugin-name', 'pascalCase')).toBe(
				'MyPluginName'
			);
		});

		it('should handle spaces', () => {
			expect(applyFilter('my plugin name', 'pascalCase')).toBe(
				'MyPluginName'
			);
		});

		it('should handle single word', () => {
			expect(applyFilter('plugin', 'pascalCase')).toBe('Plugin');
		});
	});

	describe('camelCase filter', () => {
		it('should convert snake_case to camelCase', () => {
			expect(applyFilter('my_plugin_name', 'camelCase')).toBe(
				'myPluginName'
			);
		});

		it('should convert kebab-case to camelCase', () => {
			expect(applyFilter('my-plugin-name', 'camelCase')).toBe(
				'myPluginName'
			);
		});

		it('should handle spaces', () => {
			expect(applyFilter('my plugin name', 'camelCase')).toBe(
				'myPluginName'
			);
		});

		it('should handle single word', () => {
			expect(applyFilter('plugin', 'camelCase')).toBe('plugin');
		});
	});

	describe('kebabCase filter', () => {
		it('should convert snake_case to kebab-case', () => {
			expect(applyFilter('my_plugin_name', 'kebabCase')).toBe(
				'my-plugin-name'
			);
		});

		it('should convert camelCase to kebab-case', () => {
			expect(applyFilter('myPluginName', 'kebabCase')).toBe(
				'my-plugin-name'
			);
		});

		it('should convert spaces to hyphens', () => {
			expect(applyFilter('my plugin name', 'kebabCase')).toBe(
				'my-plugin-name'
			);
		});
	});

	describe('snakeCase filter', () => {
		it('should convert kebab-case to snake_case', () => {
			expect(applyFilter('my-plugin-name', 'snakeCase')).toBe(
				'my_plugin_name'
			);
		});

		it('should convert camelCase to snake_case', () => {
			expect(applyFilter('myPluginName', 'snakeCase')).toBe(
				'my_plugin_name'
			);
		});

		it('should convert spaces to underscores', () => {
			expect(applyFilter('my plugin name', 'snakeCase')).toBe(
				'my_plugin_name'
			);
		});
	});

	describe('invalid filter', () => {
		it('should return original value for unknown filter', () => {
			expect(applyFilter('test', 'invalidFilter')).toBe('test');
		});
	});
});

describe('replaceMustacheVars', () => {
	const config = {
		slug: 'test-plugin',
		name: 'Test Plugin',
		namespace: 'test_plugin',
	};

	it('should replace simple mustache variables', () => {
		const template = 'Plugin: {{name}}';
		const result = replaceMustacheVars(template, config);
		expect(result).toBe('Plugin: Test Plugin');
	});

	it('should replace multiple variables', () => {
		const template = '{{slug}} - {{name}}';
		const result = replaceMustacheVars(template, config);
		expect(result).toBe('test-plugin - Test Plugin');
	});

	it('should apply filters', () => {
		const template = 'Namespace: {{namespace|upper}}';
		const result = replaceMustacheVars(template, config);
		expect(result).toBe('Namespace: TEST_PLUGIN');
	});

	it('should handle multiple filters in one template', () => {
		const template = '{{namespace|upper}} and {{namespace|pascalCase}}';
		const result = replaceMustacheVars(template, config);
		expect(result).toBe('TEST_PLUGIN and TestPlugin');
	});

	it('should handle mixed variables with and without filters', () => {
		const template = '{{slug}} - {{namespace|pascalCase}}';
		const result = replaceMustacheVars(template, config);
		expect(result).toBe('test-plugin - TestPlugin');
	});

	it('should preserve text without mustache variables', () => {
		const template = 'Plain text without variables';
		const result = replaceMustacheVars(template, config);
		expect(result).toBe('Plain text without variables');
	});

	it('should handle undefined variables', () => {
		const template = '{{nonexistent}}';
		const result = replaceMustacheVars(template, config);
		expect(result).toBe('');
	});

	it('should handle complex real-world templates', () => {
		const template = `/**
 * Plugin Name: {{name}}
 * Text Domain: {{slug}}
 * Namespace: {{namespace|upper}}_VERSION
 */
class {{namespace|pascalCase}}_Plugin {}`;
		const result = replaceMustacheVars(template, config);
		expect(result).toContain('Plugin Name: Test Plugin');
		expect(result).toContain('Text Domain: test-plugin');
		expect(result).toContain('TEST_PLUGIN_VERSION');
		expect(result).toContain('class TestPlugin_Plugin {}');
	});
});

describe('Integration tests', () => {
	it('should process complete plugin configuration', () => {
		const config = {
			slug: 'tour-operator',
			name: 'Tour Operator',
			author: 'LightSpeed',
			description: 'Tour booking plugin',
		};

		// Apply defaults
		const configWithDefaults = applyDefaults(config);
		expect(configWithDefaults.namespace).toBe('tour_operator');
		expect(configWithDefaults.textdomain).toBe('tour-operator');
		expect(configWithDefaults.version).toBe('1.0.0');

		// Validate
		const validation = validateConfig(configWithDefaults);
		expect(validation.valid).toBe(true);

		// Replace mustache variables
		const template = '{{namespace|upper}}_VERSION = "{{version}}"';
		const result = replaceMustacheVars(template, configWithDefaults);
		expect(result).toBe('TOUR_OPERATOR_VERSION = "1.0.0"');
	});

	it('should handle complete workflow with taxonomies and fields', () => {
		const config = {
			slug: 'tour-operator',
			name: 'Tour Operator',
			author: 'LightSpeed',
			taxonomies: [
				{
					slug: 'destination',
					singular: 'Destination',
					plural: 'Destinations',
					hierarchical: true,
				},
			],
			fields: [
				{
					name: 'price',
					label: 'Price',
					type: 'number',
					required: false,
				},
			],
		};

		const configWithDefaults = applyDefaults(config);
		const validation = validateConfig(configWithDefaults);
		expect(validation.valid).toBe(true);
		expect(configWithDefaults.taxonomies).toHaveLength(1);
		expect(configWithDefaults.fields).toHaveLength(1);
	});
});
