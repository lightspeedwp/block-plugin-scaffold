<?php
/**
 * Main Plugin Tests.
 *
 * @package example_plugin
 */

/**
 * Test case for main plugin class.
 */
/**
 * Mustache: example_plugin, example-plugin, example-plugin
 */
class Test_Plugin_Main extends WP_UnitTestCase {

	/**
	 * Set up test fixtures.
	 */
	public function setUp(): void {
		parent::setUp();
	}

	/**
	 * Test that plugin constants are defined.
	 */
	public function test_plugin_constants_defined() {
		$this->assertTrue( defined( 'EXAMPLE_PLUGIN_VERSION' ) );
		$this->assertTrue( defined( 'EXAMPLE_PLUGIN_PLUGIN_DIR' ) );
		$this->assertTrue( defined( 'EXAMPLE_PLUGIN_PLUGIN_URL' ) );
		$this->assertTrue( defined( 'EXAMPLE_PLUGIN_PLUGIN_BASENAME' ) );
	}

	/**
	 * Test that main plugin class exists.
	 */
	public function test_main_class_exists() {
		$this->assertTrue( class_exists( 'ExamplePlugin_Plugin' ) );
	}

	/**
	 * Test that supporting classes exist.
	 */
	public function test_supporting_classes_exist() {
		$this->assertTrue( class_exists( 'ExamplePlugin_Post_Types' ) );
		$this->assertTrue( class_exists( 'ExamplePlugin_Taxonomies' ) );
		$this->assertTrue( class_exists( 'ExamplePlugin_Fields' ) );
		$this->assertTrue( class_exists( 'ExamplePlugin_Repeater_Fields' ) );
		$this->assertTrue( class_exists( 'ExamplePlugin_Block_Bindings' ) );
		$this->assertTrue( class_exists( 'ExamplePlugin_Patterns' ) );
	}
}
