<?php
/**
 * Test Options Page registration.
 *
 * @package example_plugin
 */

/**
 * Record SCF registration calls so the options page and field group can be asserted.
 */
if ( ! function_exists( 'acf_add_options_page' ) ) {
	function acf_add_options_page( $args ) {
		$GLOBALS['scf_options_pages'][] = $args;
	}
}
if ( ! function_exists( 'acf_add_options_sub_page' ) ) {
	function acf_add_options_sub_page( $args ) {
		$GLOBALS['scf_options_pages'][] = $args;
	}
}
if ( ! function_exists( 'acf_add_local_field_group' ) ) {
	function acf_add_local_field_group( $args ) {
		$GLOBALS['scf_field_groups'][] = $args;
	}
}

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

	/**
	 * Test that a single settings page is registered under the Settings menu.
	 */
	public function test_single_settings_page_under_options_general() {
		$GLOBALS['scf_options_pages'] = array();

		$this->options->register_options_pages();

		$this->assertCount( 1, $GLOBALS['scf_options_pages'] );
		$this->assertEquals( 'options-general.php', $GLOBALS['scf_options_pages'][0]['parent_slug'] );
		$this->assertEquals( ExamplePlugin_Options::OPTIONS_PAGE, $GLOBALS['scf_options_pages'][0]['menu_slug'] );
	}

	/**
	 * Test that one field group is registered with Branding, Contact and API tabs.
	 */
	public function test_field_group_tabs() {
		$GLOBALS['scf_field_groups'] = array();

		$this->options->register_options_fields();

		$this->assertCount( 1, $GLOBALS['scf_field_groups'] );

		$group = $GLOBALS['scf_field_groups'][0];
		$tabs  = array();
		foreach ( $group['fields'] as $field ) {
			if ( 'tab' === $field['type'] ) {
				$tabs[] = $field['label'];
			}
		}

		$this->assertEquals( array( 'Branding', 'Contact', 'API' ), $tabs );
		$this->assertEquals( ExamplePlugin_Options::OPTIONS_PAGE, $group['location'][0][0]['value'] );
	}
}
