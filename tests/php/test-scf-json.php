<?php
/**
 * Test SCF JSON validation.
 *
 * @package example_plugin
 */

/**
 * SCF JSON Test Class.
 */
/**
 * Mustache: example_plugin, example-plugin, example-plugin
 */
class Test_SCF_JSON extends WP_UnitTestCase {

	/**
	 * SCF JSON handler instance.
	 *
	 * @var ExamplePlugin_SCF_JSON
	 */
	private $scf_json;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		// Include the class if not already loaded.
		if ( ! class_exists( 'ExamplePlugin_SCF_JSON' ) ) {
			require_once dirname( dirname( __DIR__ ) ) . '/plugin-template/inc/class-scf-json.php';
		}

		$this->scf_json = new ExamplePlugin_SCF_JSON();
	}

	/**
	 * Test JSON directory path.
	 */
	public function test_get_json_path() {
		$path = $this->scf_json->get_json_path();

		$this->assertStringContainsString( 'scf-json', $path );
	}

	/**
	 * Test valid JSON file validation.
	 */
	public function test_validate_valid_json() {
		// Create a temporary valid JSON file.
		$temp_file = wp_tempnam();
		$valid_json = array(
			'key'      => 'group_test_example',
			'title'    => 'Test Field Group',
			'fields'   => array(
				array(
					'key'   => 'field_test_text',
					'label' => 'Text Field',
					'name'  => 'test_text',
					'type'  => 'text',
				),
			),
			'location' => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'post',
					),
				),
			),
		);

		file_put_contents( $temp_file, wp_json_encode( $valid_json ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		$result = $this->scf_json->validate_json_file( $temp_file );

		$this->assertTrue( $result['valid'] );
		$this->assertEmpty( $result['errors'] );

		unlink( $temp_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
	}

	/**
	 * Test invalid JSON file validation - missing key.
	 */
	public function test_validate_missing_key() {
		$temp_file = wp_tempnam();
		$invalid_json = array(
			'title'    => 'Test Field Group',
			'fields'   => array(),
			'location' => array(),
		);

		file_put_contents( $temp_file, wp_json_encode( $invalid_json ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		$result = $this->scf_json->validate_json_file( $temp_file );

		$this->assertFalse( $result['valid'] );
		$this->assertContains( 'Missing required property: key', $result['errors'] );

		unlink( $temp_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
	}

	/**
	 * Test invalid JSON file validation - invalid key format.
	 */
	public function test_validate_invalid_key_format() {
		$temp_file = wp_tempnam();
		$invalid_json = array(
			'key'      => 'invalid_key_format',
			'title'    => 'Test Field Group',
			'fields'   => array(),
			'location' => array(),
		);

		file_put_contents( $temp_file, wp_json_encode( $invalid_json ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		$result = $this->scf_json->validate_json_file( $temp_file );

		$this->assertFalse( $result['valid'] );
		$this->assertContains( 'Field group key must start with "group_".', $result['errors'] );

		unlink( $temp_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
	}

	/**
	 * Test invalid JSON file validation - malformed JSON.
	 */
	public function test_validate_malformed_json() {
		$temp_file = wp_tempnam();
		$malformed_json = '{ "key": "group_test", "title": "Test" }}}';

		file_put_contents( $temp_file, $malformed_json ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		$result = $this->scf_json->validate_json_file( $temp_file );

		$this->assertFalse( $result['valid'] );

		unlink( $temp_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
	}

	/**
	 * Test validation of non-existent file.
	 */
	public function test_validate_nonexistent_file() {
		$result = $this->scf_json->validate_json_file( '/path/to/nonexistent.json' );

		$this->assertFalse( $result['valid'] );
		$this->assertContains( 'File does not exist.', $result['errors'] );
	}

	/**
	 * Test field key validation.
	 */
	public function test_validate_field_key_format() {
		$temp_file = wp_tempnam();
		$invalid_json = array(
			'key'      => 'group_test_example',
			'title'    => 'Test Field Group',
			'fields'   => array(
				array(
					'key'   => 'invalid_field_key',
					'label' => 'Text Field',
					'name'  => 'test_text',
					'type'  => 'text',
				),
			),
			'location' => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'post',
					),
				),
			),
		);

		file_put_contents( $temp_file, wp_json_encode( $invalid_json ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		$result = $this->scf_json->validate_json_file( $temp_file );

		$this->assertFalse( $result['valid'] );

		unlink( $temp_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
	}

	/**
	 * Test that layout fields (tab, accordion, message) are exempt from field key validation.
	 */
	public function test_layout_fields_exempt_from_key_validation() {
		$temp_file = wp_tempnam();
		$valid_json = array(
			'key'      => 'group_test_example',
			'title'    => 'Test Field Group',
			'fields'   => array(
				array(
					'key'   => 'field_test_tab',
					'label' => 'Tab',
					'name'  => '',
					'type'  => 'tab',
				),
				array(
					'key'   => 'field_test_text',
					'label' => 'Text Field',
					'name'  => 'test_text',
					'type'  => 'text',
				),
			),
			'location' => array(
				array(
					array(
						'param'    => 'post_type',
						'operator' => '==',
						'value'    => 'post',
					),
				),
			),
		);

		file_put_contents( $temp_file, wp_json_encode( $valid_json ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents

		$result = $this->scf_json->validate_json_file( $temp_file );

		$this->assertTrue( $result['valid'] );

		unlink( $temp_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink
	}
}
