<?php
/**
 * Test Options Page registration.
 *
 * @package example_plugin
 */

/**
 * Options Test Class.
 */
class Test_Options extends WP_UnitTestCase {

	/**
	 * Options instance.
	 *
	 * @var ExamplePlugin_Options
	 */
	private $options;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		// Include the class if not already loaded.
		if ( ! class_exists( 'ExamplePlugin_Options' ) ) {
			require_once dirname( dirname( __DIR__ ) ) . '/inc/class-options.php';
		}

		$this->options = new ExamplePlugin_Options();
	}

	/**
	 * Test that options page slug constant is defined.
	 */
	public function test_options_page_constant() {
		$this->assertEquals( 'example-plugin-settings', ExamplePlugin_Options::OPTIONS_PAGE );
	}

	/**
	 * Test that field group constant is defined.
	 */
	public function test_field_group_constant() {
		$this->assertEquals( 'group_example-plugin_options', ExamplePlugin_Options::FIELD_GROUP );
	}

	/**
	 * Test SCF active check returns false when SCF not loaded.
	 */
	public function test_scf_not_active() {
		// This test assumes SCF is not loaded in test environment.
		// If SCF is loaded, this would return true.
		if ( ! function_exists( 'acf_add_options_page' ) ) {
			$this->assertFalse( $this->options->is_scf_active() );
		} else {
			$this->assertTrue( $this->options->is_scf_active() );
		}
	}

	/**
	 * Test get_option with default value when SCF not loaded.
	 */
	public function test_get_option_default() {
		$value = ExamplePlugin_Options::get_option( 'nonexistent', 'default_value' );

		// When get_field doesn't exist, should return default.
		if ( ! function_exists( 'get_field' ) ) {
			$this->assertEquals( 'default_value', $value );
		}
	}

	/**
	 * Test update_option returns false when SCF not loaded.
	 */
	public function test_update_option_no_scf() {
		if ( ! function_exists( 'update_field' ) ) {
			$result = ExamplePlugin_Options::update_option( 'test_field', 'test_value' );
			$this->assertFalse( $result );
		}
	}
}
