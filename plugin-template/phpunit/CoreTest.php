<?php
/**
 * Tests for inc/class-core.php.
 *
 * @package {{namespace}}
 */

namespace {{namespace}}\tests;

use {{namespace}}\classes\Core;

require_once {{namespace|upper}}_DIR . 'inc/class-core.php';

/**
 * Core class tests.
 */
class CoreTest extends TestCase {

	/**
	 * The plugin's block category comes first, before the existing ones.
	 *
	 * @return void
	 */
	public function test_register_block_category_adds_the_plugin_category_first() {
		// The constructor loads every component; this test needs none of them.
		$core = ( new \ReflectionClass( Core::class ) )->newInstanceWithoutConstructor();

		$existing   = array(
			array(
				'slug'  => 'text',
				'title' => 'Text',
			),
		);
		$categories = $core->register_block_category( $existing );

		$this->assertCount( 2, $categories );
		$this->assertSame( '{{slug}}', $categories[0]['slug'] );
		$this->assertSame( $existing[0], $categories[1] );
	}
}
