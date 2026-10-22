<?php
/**
 * PHPUnit bootstrap: unit tests run without WordPress.
 *
 * WordPress functions are stubbed per test with Brain Monkey (see TestCase).
 *
 * @package {{namespace}}
 */

require_once __DIR__ . '/../../vendor/autoload.php';

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

// The constants the main plugin file defines at runtime.
require_once __DIR__ . '/phpstan-bootstrap.php';

require_once __DIR__ . '/TestCase.php';
