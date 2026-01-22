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
