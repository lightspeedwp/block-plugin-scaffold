<?php
/**
 * Test SCF JSON Schema Validation.
 *
 * Comprehensive JSON schema validation tests for SCF field groups.
 *
 * @package example_plugin
 */

/**
 * SCF JSON Schema Validation Test Class.
 */
/**
 * Mustache: example_plugin, example-plugin, example-plugin
 */
class Test_SCF_JSON_Schema_Validation extends WP_UnitTestCase {

	/**
	 * Path to the JSON schema file.
	 *
	 * @var string
	 */
	private $schema_path;

	/**
	 * Schema validator instance.
	 *
	 * @var object
	 */
	private $validator;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->schema_path = dirname( dirname( __DIR__ ) ) . '/scf-json/schema/scf-field-group.schema.json';

		// Include the validator class if it exists.
		$validator_file = dirname( dirname( __DIR__ ) ) . '/inc/class-scf-json-validator.php';
		if ( file_exists( $validator_file ) ) {
			require_once $validator_file;
			// Validator class will be instantiated if available.
			$validator_class = apply_filters( 'scf_json_validator_class', 'SCF_JSON_Validator' );
			if ( class_exists( $validator_class ) ) {
				$this->validator = new $validator_class();
			}
		}
	}

	/**
	 * Test schema file exists and is valid JSON.
	 */
	public function test_schema_file_exists() {
		$this->assertFileExists( $this->schema_path, 'JSON schema file should exist at: ' . $this->schema_path );

		$schema_content = file_get_contents( $this->schema_path );
		$schema = json_decode( $schema_content, true );

		$this->assertIsArray( $schema, 'Schema should be valid JSON' );
		$this->assertArrayHasKey( '$schema', $schema, 'Schema should have $schema property' );
	}

	/**
	 * Test schema has required root properties.
	 */
	public function test_schema_required_properties() {
		$schema_content = file_get_contents( $this->schema_path );
		$schema = json_decode( $schema_content, true );

		$this->assertArrayHasKey( 'title', $schema, 'Schema should have title' );
		$this->assertArrayHasKey( 'description', $schema, 'Schema should have description' );
		$this->assertArrayHasKey( 'type', $schema, 'Schema should have type' );
		$this->assertArrayHasKey( 'required', $schema, 'Schema should have required properties' );
		$this->assertArrayHasKey( 'properties', $schema, 'Schema should have properties' );
	}

	/**
	 * Test schema validates field group key format.
	 */
	public function test_schema_validates_key_format() {
		$schema_content = file_get_contents( $this->schema_path );
		$schema = json_decode( $schema_content, true );

		$this->assertArrayHasKey( 'key', $schema['properties'], 'Schema should define key property' );
		$this->assertArrayHasKey( 'pattern', $schema['properties']['key'], 'Key should have pattern validation' );
		$this->assertStringContainsString( 'group_', $schema['properties']['key']['pattern'], 'Pattern should require group_ prefix' );
	}

	/**
	 * Test schema validates fields array.
	 */
	public function test_schema_validates_fields_array() {
		$schema_content = file_get_contents( $this->schema_path );
		$schema = json_decode( $schema_content, true );

		$this->assertArrayHasKey( 'fields', $schema['properties'], 'Schema should define fields property' );
		$this->assertEquals( 'array', $schema['properties']['fields']['type'], 'Fields should be an array' );
	}

	/**
	 * Test schema validates location array.
	 */
	public function test_schema_validates_location_array() {
		$schema_content = file_get_contents( $this->schema_path );
		$schema = json_decode( $schema_content, true );

		$this->assertArrayHasKey( 'location', $schema['properties'], 'Schema should define location property' );
		$this->assertEquals( 'array', $schema['properties']['location']['type'], 'Location should be an array' );
	}

	/**
	 * Test schema validates position enum.
	 */
	public function test_schema_validates_position_enum() {
		$schema_content = file_get_contents( $this->schema_path );
		$schema = json_decode( $schema_content, true );

		$this->assertArrayHasKey( 'position', $schema['properties'], 'Schema should define position property' );
		$this->assertArrayHasKey( 'enum', $schema['properties']['position'], 'Position should have enum' );
		$this->assertContains( 'normal', $schema['properties']['position']['enum'], 'Position should support "normal"' );
		$this->assertContains( 'side', $schema['properties']['position']['enum'], 'Position should support "side"' );
	}

	/**
	 * Test schema validates label_placement enum.
	 */
	public function test_schema_validates_label_placement_enum() {
		$schema_content = file_get_contents( $this->schema_path );
		$schema = json_decode( $schema_content, true );

		$this->assertArrayHasKey( 'label_placement', $schema['properties'], 'Schema should define label_placement' );
		$this->assertArrayHasKey( 'enum', $schema['properties']['label_placement'], 'label_placement should have enum' );
	}

	/**
	 * Test schema validates hide_on_screen array.
	 */
	public function test_schema_validates_hide_on_screen() {
		$schema_content = file_get_contents( $this->schema_path );
		$schema = json_decode( $schema_content, true );

		$this->assertArrayHasKey( 'hide_on_screen', $schema['properties'], 'Schema should define hide_on_screen' );
		$this->assertEquals( 'array', $schema['properties']['hide_on_screen']['type'], 'hide_on_screen should be an array' );
		$this->assertArrayHasKey( 'enum', $schema['properties']['hide_on_screen']['items'], 'hide_on_screen items should have enum' );
	}

	/**
	 * Test schema validates active boolean.
	 */
	public function test_schema_validates_active_boolean() {
		$schema_content = file_get_contents( $this->schema_path );
		$schema = json_decode( $schema_content, true );

		$this->assertArrayHasKey( 'active', $schema['properties'], 'Schema should define active property' );
		$this->assertArrayHasKey( 'oneOf', $schema['properties']['active'], 'Active should allow boolean or integer' );
	}

	/**
	 * Test validator class exists if implementation is available.
	 */
	public function test_validator_class_available() {
		$validator_file = dirname( dirname( __DIR__ ) ) . '/inc/class-scf-json-validator.php';

		if ( file_exists( $validator_file ) ) {
			$this->assertNotNull( $this->validator, 'Validator should be instantiated' );
			$this->assertTrue( method_exists( $this->validator, 'validate' ), 'Validator should have validate method' );
		} else {
			$this->markTestSkipped( 'Validator class not yet implemented' );
		}
	}

	/**
	 * Test example field group conforms to schema.
	 */
	public function test_example_field_group_conforms_to_schema() {
		$example_path = dirname( dirname( __DIR__ ) ) . '/docs/group_example_basic_fields.json';

		if ( ! file_exists( $example_path ) ) {
			$this->markTestSkipped( 'Example field group file not found' );
			return;
		}

		$example_content = file_get_contents( $example_path );
		$example = json_decode( $example_content, true );

		$this->assertIsArray( $example, 'Example should be valid JSON' );
		$this->assertArrayHasKey( 'key', $example, 'Example should have key' );
		$this->assertArrayHasKey( 'title', $example, 'Example should have title' );
		$this->assertArrayHasKey( 'fields', $example, 'Example should have fields' );
		$this->assertArrayHasKey( 'location', $example, 'Example should have location' );

		// Validate key format
		$this->assertStringStartsWith( 'group_', $example['key'], 'Key should start with group_' );

		// Validate fields array
		$this->assertIsArray( $example['fields'], 'Fields should be an array' );
		$this->assertNotEmpty( $example['fields'], 'Fields array should not be empty' );

		// Validate location array
		$this->assertIsArray( $example['location'], 'Location should be an array' );
		$this->assertNotEmpty( $example['location'], 'Location array should not be empty' );
	}

	/**
	 * Test example field group has valid field types.
	 */
	public function test_example_field_types_are_valid() {
		$example_path = dirname( dirname( __DIR__ ) ) . '/docs/group_example_basic_fields.json';

		if ( ! file_exists( $example_path ) ) {
			$this->markTestSkipped( 'Example field group file not found' );
			return;
		}

		$example_content = file_get_contents( $example_path );
		$example = json_decode( $example_content, true );

		$valid_types = array(
			'tab', 'accordion', 'message',
			'text', 'textarea', 'email', 'url', 'password', 'number',
			'wysiwyg', 'oembed',
			'image', 'file', 'gallery',
			'select', 'checkbox', 'radio', 'button_group', 'true_false',
			'link', 'post_object', 'page_link', 'relationship', 'taxonomy', 'user',
			'date_picker', 'date_time_picker', 'time_picker', 'color_picker',
			'group', 'repeater', 'flexible_content',
		);

		foreach ( $example['fields'] as $field ) {
			$this->assertArrayHasKey( 'type', $field, 'Each field should have a type' );
			$this->assertContains( $field['type'], $valid_types, 'Field type ' . $field['type'] . ' should be valid' );

			// Check for required field properties (type-dependent)
			if ( ! in_array( $field['type'], array( 'tab', 'accordion', 'message' ), true ) ) {
				$this->assertArrayHasKey( 'key', $field, 'Field ' . $field['type'] . ' should have key' );
				$this->assertArrayHasKey( 'label', $field, 'Field ' . $field['type'] . ' should have label' );
			}
		}
	}

	/**
	 * Test example field group valid location rules.
	 */
	public function test_example_location_rules_are_valid() {
		$example_path = dirname( dirname( __DIR__ ) ) . '/docs/group_example_basic_fields.json';

		if ( ! file_exists( $example_path ) ) {
			$this->markTestSkipped( 'Example field group file not found' );
			return;
		}

		$example_content = file_get_contents( $example_path );
		$example = json_decode( $example_content, true );

		$valid_params = array(
			'post_type', 'post_format', 'post_status', 'post_taxonomy',
			'user_role', 'user_form',
			'taxonomy',
			'attachment_type',
			'page_type',
			'page_parent',
			'page_template',
			'option_page',
			'widget',
		);

		foreach ( $example['location'] as $group ) {
			$this->assertIsArray( $group, 'Location group should be an array' );

			foreach ( $group as $rule ) {
				$this->assertArrayHasKey( 'param', $rule, 'Location rule should have param' );
				$this->assertArrayHasKey( 'operator', $rule, 'Location rule should have operator' );
				$this->assertArrayHasKey( 'value', $rule, 'Location rule should have value' );

				$this->assertContains( $rule['param'], $valid_params, 'Location param should be valid' );
				$this->assertIn( $rule['operator'], array( '==', '!=', '~', '!~' ), 'Location operator should be valid' );
			}
		}
	}

	/**
	 * Test repeated field validation.
	 */
	public function test_repeater_field_has_sub_fields() {
		$example_path = dirname( dirname( __DIR__ ) ) . '/docs/group_example_advanced_fields.json';

		if ( ! file_exists( $example_path ) ) {
			$this->markTestSkipped( 'Example field group file not found' );
			return;
		}

		$example_content = file_get_contents( $example_path );
		$example = json_decode( $example_content, true );

		// Find repeater and flexible_content fields
		foreach ( $example['fields'] as $field ) {
			if ( 'repeater' === $field['type'] || 'flexible_content' === $field['type'] ) {
				$this->assertArrayHasKey( 'sub_fields', $field, $field['type'] . ' should have sub_fields' );
				$this->assertIsArray( $field['sub_fields'], 'sub_fields should be an array' );
				$this->assertNotEmpty( $field['sub_fields'], 'sub_fields should not be empty' );
			}
		}
	}

	/**
	 * Test group field has sub_fields.
	 */
	public function test_group_field_has_sub_fields() {
		$example_path = dirname( dirname( __DIR__ ) ) . '/docs/group_example_advanced_fields.json';

		if ( ! file_exists( $example_path ) ) {
			$this->markTestSkipped( 'Example field group file not found' );
			return;
		}

		$example_content = file_get_contents( $example_path );
		$example = json_decode( $example_content, true );

		// Find group fields
		foreach ( $example['fields'] as $field ) {
			if ( 'group' === $field['type'] ) {
				$this->assertArrayHasKey( 'sub_fields', $field, 'Group field should have sub_fields' );
				$this->assertIsArray( $field['sub_fields'], 'sub_fields should be an array' );
			}
		}
	}

	/**
	 * Test flexible_content layouts are properly defined.
	 */
	public function test_flexible_content_layouts() {
		$example_path = dirname( dirname( __DIR__ ) ) . '/docs/group_example_advanced_fields.json';

		if ( ! file_exists( $example_path ) ) {
			$this->markTestSkipped( 'Example field group file not found' );
			return;
		}

		$example_content = file_get_contents( $example_path );
		$example = json_decode( $example_content, true );

		// Find flexible_content fields
		foreach ( $example['fields'] as $field ) {
			if ( 'flexible_content' === $field['type'] ) {
				$this->assertArrayHasKey( 'layouts', $field, 'Flexible content should have layouts' );
				$this->assertIsArray( $field['layouts'], 'layouts should be an array' );
				$this->assertNotEmpty( $field['layouts'], 'layouts should not be empty' );

				// Validate each layout
				foreach ( $field['layouts'] as $layout ) {
					$this->assertArrayHasKey( 'name', $layout, 'Layout should have name' );
					$this->assertArrayHasKey( 'label', $layout, 'Layout should have label' );
					$this->assertArrayHasKey( 'sub_fields', $layout, 'Layout should have sub_fields' );
				}
			}
		}
	}

	/**
	 * Test field wrapper configuration if present.
	 */
	public function test_field_wrapper_configuration() {
		$example_path = dirname( dirname( __DIR__ ) ) . '/docs/group_example_basic_fields.json';

		if ( ! file_exists( $example_path ) ) {
			$this->markTestSkipped( 'Example field group file not found' );
			return;
		}

		$example_content = file_get_contents( $example_path );
		$example = json_decode( $example_content, true );

		// Check fields with wrapper configuration
		foreach ( $example['fields'] as $field ) {
			if ( isset( $field['wrapper'] ) ) {
				$this->assertIsArray( $field['wrapper'], 'wrapper should be an array' );

				if ( isset( $field['wrapper']['width'] ) ) {
					$this->assertTrue( is_numeric( $field['wrapper']['width'] ), 'wrapper width should be numeric' );
				}
			}
		}
	}
}
