<?php
/**
 * PHPUnit bootstrap file for Example Plugin.
 *
 * @package example_plugin
 */

// Create logs directory. Fall back to the system temp dir when logs/ is read-only.
$logs_dir = __DIR__ . '/../logs';
if ( ! is_dir( $logs_dir ) ) {
	$created = @mkdir( $logs_dir, 0755, true );
	if ( ! $created && ! is_dir( $logs_dir ) ) {
		$logs_dir = rtrim( sys_get_temp_dir(), '/\\' );
	}
}

if ( ! is_dir( $logs_dir ) ) {
	$logs_dir = rtrim( sys_get_temp_dir(), '/\\' );
}

// Create log file before writing so we avoid permission issues later.
$log_file = @tempnam( $logs_dir, 'phpunit-log-' );
if ( false === $log_file ) {
	$log_file = tempnam( rtrim( sys_get_temp_dir(), '/\\' ), 'phpunit-log-' );
}

/**
 * Log function for PHPUnit tests
 *
 * @param string $level Log level (ERROR, WARN, INFO, DEBUG, TRACE).
 * @param string $message Log message.
 */
function test_log( $level, $message ) {
	global $log_file;
	if ( empty( $log_file ) ) {
		$log_file = tempnam( rtrim( sys_get_temp_dir(), '/\\' ), 'phpunit-log-' );
	}
	$entry = sprintf(
		"[%s] [%s] %s\n",
		gmdate( 'c' ),
		$level,
		$message
	);
	file_put_contents( $log_file, $entry, FILE_APPEND );
	echo $entry;
}

// Log bootstrap start.
test_log( 'INFO', 'PHPUnit bootstrap starting' );
test_log( 'INFO', 'PHP version: ' . PHP_VERSION );
test_log( 'INFO', 'Working directory: ' . getcwd() );
test_log( 'INFO', "Log file: {$log_file}" );

// Composer autoloader.
if ( file_exists( dirname( __DIR__ ) . '/vendor/autoload.php' ) ) {
	require dirname( __DIR__ ) . '/vendor/autoload.php';
}

$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find $_tests_dir/includes/functions.php" . PHP_EOL;
	echo "Have you run bin/install-wp-tests.sh?" . PHP_EOL;
	exit( 1 );
}

// Give access to tests_add_filter() function.
require_once $_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {
	// Mock ACF functions for testing without ACF.
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		function acf_add_local_field_group( $args ) {
			return true;
		}
	}

	if ( ! function_exists( 'get_field' ) ) {
		function get_field( $field, $post_id = false ) {
			return get_post_meta( $post_id ? $post_id : get_the_ID(), $field, true );
		}
	}

	if ( ! function_exists( 'have_rows' ) ) {
		function have_rows( $field, $post_id = false ) {
			return false;
		}
	}

	require dirname( __DIR__ ) . '/plugin-template/example-plugin.php';
}

tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

// Start up the WP testing environment.
require $_tests_dir . '/includes/bootstrap.php';
