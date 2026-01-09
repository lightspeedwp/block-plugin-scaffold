<?php
namespace {{namespace}}\classes;

/**
 * Block Bindings Registration.
 *
 * @package {{namespace}}
 * @since 6.5.0 Block Bindings API
 */
class Block_Bindings {

	/**
	 * Binding source name.
	 *
	 * @since 1.0.0
	public function __construct() {
	 */
	const SOURCE = 'example_plugin/fields';

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_sources' ) );
	}

	/**
	 * Register bindings sources.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_sources() {
		if ( ! function_exists( 'register_block_bindings_source' ) ) {
			return;
		}

		register_block_bindings_source(
			'{{slug}}/post-meta',
			array(
				'label'              => __( '{{name}} Post Meta', '{{textdomain}}' ),
				'get_value_callback' => array( $this, 'get_post_meta_value' ),
				'uses_context'       => array( 'postId' ),
			)
		);
	}

	/**
	 * Example binding: fetch a scalar post meta value.
	 *
	 * @since 1.0.0
	 * @param array $args    Binding arguments (expects 'key').
	 * @param array $context Binding context (expects 'postId').
	 * @return string|null
	 */
	public function get_post_meta_value( $args, $context ) {
		if ( empty( $args['key'] ) || empty( $context['postId'] ) ) {
			return null;
		}

		$meta = get_post_meta( (int) $context['postId'], $args['key'], true );

		if ( is_scalar( $meta ) ) {
			return (string) $meta;
		}

		return null;
	}
}
