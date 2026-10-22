<?php
/**
 * Uninstall Tests.
 *
 * @package example_plugin
 */

/**
 * Test case for Uninstall.
 */
class Test_Uninstall extends WP_UnitTestCase {

	/**
	 * Test that uninstall file exists.
	 */
	public function test_uninstall_file_exists() {
		$uninstall_file = dirname( dirname( __DIR__ ) ) . '/plugin-template/uninstall.php';
		$this->assertFileExists( $uninstall_file );
	}

	/**
	 * Test that posts can be deleted.
	 */
	public function test_can_delete_posts() {
		// Create test post.
		$post_id = $this->factory->post->create(
			array(
				'post_type' => 'example-plugin',
			)
		);

		$this->assertGreaterThan( 0, $post_id );

		// Delete post.
		wp_delete_post( $post_id, true );

		// Verify deletion.
		$deleted_post = get_post( $post_id );
		$this->assertNull( $deleted_post );
	}

	/**
	 * Test that terms can be deleted.
	 */
	public function test_can_delete_terms() {
		// Create test term.
		$term = wp_insert_term( 'Uninstall Test Term', 'example-plugin_category' );

		$this->assertIsArray( $term );
		$this->assertArrayHasKey( 'term_id', $term );

		// Delete term.
		wp_delete_term( $term['term_id'], 'example-plugin_category' );

		// Verify deletion - get_term returns WP_Error or null when term doesn't exist.
		$deleted_term = get_term( $term['term_id'], 'example-plugin_category' );
		$this->assertTrue( is_wp_error( $deleted_term ) || null === $deleted_term );
	}

	/**
	 * Test that post meta can be deleted.
	 */
	public function test_can_delete_post_meta() {
		$post_id = $this->factory->post->create(
			array(
				'post_type' => 'example-plugin',
			)
		);

		update_post_meta( $post_id, 'example-plugin_test_meta', 'test_value' );

		$value = get_post_meta( $post_id, 'example-plugin_test_meta', true );
		$this->assertEquals( 'test_value', $value );

		delete_post_meta( $post_id, 'example-plugin_test_meta' );

		$deleted_value = get_post_meta( $post_id, 'example-plugin_test_meta', true );
		$this->assertEmpty( $deleted_value );
	}
}
