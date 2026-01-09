<?php
namespace {{namespace}}\classes;

/**
 * Block Templates Registration.
 *
 * @package example_plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Plugin block templates registration.
 */
class Block_Templates {

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_block_templates' ) );
	}

	/**
	 * Register plugin block templates via the WP 6.7+ API.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_block_templates() {
		if ( ! function_exists( 'register_block_template' ) ) {
			return; // Pre-6.7: no-op.
		}

		$templates_dir = {{namespace|upper}}_PLUGIN_DIR . 'templates/';

		$template_file = $templates_dir . 'example-archive.html';

		if ( file_exists( $template_file ) ) {
			register_block_template(
				'{{slug}}//example-archive',
				array(
					'title'       => __( '{{name}} Example Archive', '{{textdomain}}' ),
					'description' => __( 'Example archive template registered by the plugin.', '{{textdomain}}' ),
					'post_types'  => array( 'post' ),
					'content'     => file_get_contents( $template_file ),
				)
			);
		}
	}
}
