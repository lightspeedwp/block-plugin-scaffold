<?php
/**
 * Tests for inc/helper-functions.php.
 *
 * @package {{namespace}}
 */

namespace {{namespace}}\tests;

use Brain\Monkey\Filters;
use Brain\Monkey\Functions;

require_once {{namespace|upper}}_DIR . 'inc/helper-functions.php';

/**
 * Icon helper tests.
 */
class HelperFunctionsTest extends TestCase {

	/**
	 * An empty icon name returns no markup.
	 *
	 * @return void
	 */
	public function test_get_icon_svg_returns_empty_string_without_a_name() {
		$this->assertSame( '', {{namespace|snakeCase}}_get_icon_svg( 'outline', '' ) );
	}

	/**
	 * An icon that has no file returns no markup.
	 *
	 * @return void
	 */
	public function test_get_icon_svg_returns_empty_string_for_a_missing_icon() {
		$this->assertSame( '', {{namespace|snakeCase}}_get_icon_svg( 'outline', 'noSuchIcon' ) );
	}

	/**
	 * A camelCase name loads the kebab-case file and sanitises it.
	 *
	 * @return void
	 */
	public function test_get_icon_svg_loads_and_sanitises_the_icon_file() {
		Functions\expect( 'wp_kses' )
			->once()
			->andReturnFirstArg();

		$svg = {{namespace|snakeCase}}_get_icon_svg( 'outline', 'arrowDownIcon' );

		$this->assertStringContainsString( '<svg', $svg );
	}

	/**
	 * The icon markup passes through the plugin's filter.
	 *
	 * @return void
	 */
	public function test_get_icon_svg_applies_the_icon_filter() {
		Functions\when( 'wp_kses' )->returnArg();
		Filters\expectApplied( '{{namespace|snakeCase}}_icon_svg' )
			->once()
			->with( \Mockery::type( 'string' ), 'outline', 'arrowDownIcon' )
			->andReturn( '<svg>filtered</svg>' );

		$this->assertSame( '<svg>filtered</svg>', {{namespace|snakeCase}}_get_icon_svg( 'outline', 'arrowDownIcon' ) );
	}
}
