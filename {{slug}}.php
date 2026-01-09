<?php
/**
 * Plugin Name:       {{name}}
 * Plugin URI:        {{plugin_uri}}
 * Description:       {{description}}
 * Version:           {{version}}
 * Requires at least: {{requires_wp}}
 * Requires PHP:      {{requires_php}}
 * Requires Plugins:  secure-custom-fields
 * Author:            {{author}}
 * Author URI:        {{author_uri}}
 * License:           {{license}}
 * License URI:       {{license_uri}}
 * Text Domain:       {{textdomain}}
 * Domain Path:       /languages
 *
 * @package {{namespace}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Plugin constants.
define( '{{namespace|upper}}_VERSION', '{{version}}' );
define( '{{namespace|upper}}_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( '{{namespace|upper}}_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( '{{namespace|upper}}_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

/**
 * Defensive coding: Check for SCF/ACF functions before using them.
 *
 * While Plugin Dependencies ensures SCF is active, defensive coding is still
 * recommended for:
 * - Edge cases (FTP deletion, deployment issues)
 * - Loading order variations
 * - Future compatibility
 *
 * @see https://make.wordpress.org/core/2024/03/05/introducing-plugin-dependencies-in-wordpress-6-5/
 */
if ( ! function_exists( 'acf_add_local_field_group' ) ) {
       add_action(
	       'admin_notices',
	       function () {
		       echo '<div class="error"><p>' .
			       esc_html__( '{{name}} requires Secure Custom Fields to be active.', '{{textdomain}}' ) .
			       '</p></div>';
	       }
       );
       return;
}

// Include the Core class.
require_once {{namespace|upper}}_PLUGIN_DIR . 'inc/class-core.php';

/**
 * Initialise the plugin and return the main instance.
 *
 * @return \{{namespace}}\classes\Core Main plugin instance.
 */
function {{namespace}}_plugin() {
       global ${{namespace}}_plugin;
       if ( null === ${{namespace}}_plugin ) {
	       ${{namespace}}_plugin = new \{{namespace}}\classes\Core();
       }
       return ${{namespace}}_plugin;
}

// Initialize the plugin.
{{namespace}}_plugin();
