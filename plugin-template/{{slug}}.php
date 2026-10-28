<?php
/**
 * Plugin Name:       {{name}}
 * Plugin URI:
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
define( '{{upper.namespace}}_VERSION', '{{version}}' );
define( '{{upper.namespace}}_DIR', plugin_dir_path( __FILE__ ) );
define( '{{upper.namespace}}_URL', plugin_dir_url( __FILE__ ) );
define( '{{upper.namespace}}_BASENAME', plugin_basename( __FILE__ ) );

// Include helper functions.
require_once {{upper.namespace}}_DIR . 'inc/helper-functions.php';

// Include the Core class.
require_once {{upper.namespace}}_DIR . 'inc/class-core.php';

/**
 * Initialise the plugin and return the main instance.
 *
 * @return \{{namespace}}\classes\Core Main plugin instance.
 */
function {{namespace}}_init() {
	global ${{namespace}};
	if ( null === ${{namespace}} ) {
		${{namespace}} = new \{{namespace}}\classes\Core();
	}
	return ${{namespace}};
}

// Initialize the plugin.
{{namespace}}_init();
