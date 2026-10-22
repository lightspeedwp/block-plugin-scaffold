<?php
/**
 * PHPStan bootstrap file.
 *
 * @package example_plugin
 */

// Define constants for PHPStan.
define( 'EXAMPLE_PLUGIN_VERSION', '1.0.0' );
define( 'EXAMPLE_PLUGIN_PLUGIN_DIR', dirname( __DIR__ ) . '/plugin-template/' );
define( 'EXAMPLE_PLUGIN_PLUGIN_URL', 'https://example.com/wp-content/plugins/example-plugin/' );
define( 'EXAMPLE_PLUGIN_PLUGIN_BASENAME', 'example-plugin/example-plugin.php' );

// Mock ACF functions.
if ( ! function_exists( 'acf_add_local_field_group' ) ) {
	function acf_add_local_field_group( array $args ): bool {
		return true;
	}
}

if ( ! function_exists( 'get_field' ) ) {
	/**
	 * Get ACF field value.
	 *
	 * @param string $field   Field name.
	 * @param int    $post_id Post ID.
	 * @return mixed
	 */
	function get_field( string $field, int $post_id = 0 ) {
		return null;
	}
}

if ( ! function_exists( 'have_rows' ) ) {
	function have_rows( string $field, int $post_id = 0 ): bool {
		return false;
	}
}

if ( ! function_exists( 'the_row' ) ) {
	function the_row(): void {}
}

if ( ! function_exists( 'get_sub_field' ) ) {
	/**
	 * Get sub field value.
	 *
	 * @param string $field Field name.
	 * @return mixed
	 */
	function get_sub_field( string $field ) {
		return null;
	}
}

if ( ! function_exists( 'get_row_layout' ) ) {
	function get_row_layout(): string {
		return '';
	}
}

if ( ! function_exists( 'get_row_index' ) ) {
	function get_row_index(): int {
		return 0;
	}
}
