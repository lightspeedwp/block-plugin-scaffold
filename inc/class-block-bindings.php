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
	 */
	const SOURCE = '{{slug}}/post-meta';

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_sources' ) );
		add_filter( 'render_block', array( $this, 'render_paragraph_prefix_block' ), 20, 3 );
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
	 * Get post meta value for block bindings.
	 *
	 * @since 1.0.0
	 * @param array $source_args Binding arguments (expects 'key').
	 * @param object $block_instance Block instance object.
	 * @return string|int|null
	 */
	public function get_post_meta_value( $source_args, $block_instance ) {
		if ( empty( $source_args['key'] ) ) {
			return null;
		}

		$post_id = null;
		if ( ! empty( $block_instance->context['postId'] ) ) {
			$post_id = (int) $block_instance->context['postId'];
		} else {
			$post_id = get_the_ID();
		}

		if ( ! $post_id ) {
			return null;
		}

		// Handle core/image and core/cover blocks.
		if ( 'core/image' === $block_instance->parsed_block['blockName'] 
			|| 'core/cover' === $block_instance->parsed_block['blockName'] ) {
			$key   = str_replace( '-', '_', $source_args['key'] );
			$value = get_post_meta( $post_id, $key, true );
			return $value;
		}

		// Handle paragraph and other text blocks.
		$key   = str_replace( '-', '_', $source_args['key'] );
		$value = get_post_meta( $post_id, $key, true );

		// Convert arrays to comma-separated strings.
		if ( is_array( $value ) ) {
			$value = implode( ', ', array_filter( $value ) );
		}

		// Ensure we return a scalar value.
		if ( is_scalar( $value ) ) {
			return (string) $value;
		}

		return null;
	}

	/**
	 * Render paragraph blocks with prefix support.
	 *
	 * Adds prefix text to paragraph blocks that have the 'prefix' attribute.
	 *
	 * @since 1.0.0
	 * @param string $block_content The block content.
	 * @param array  $parsed_block  Parsed block data.
	 * @param object $block_obj     Block object.
	 * @return string Modified block content.
	 */
	public function render_paragraph_prefix_block( $block_content, $parsed_block, $block_obj ) {
		// Only process paragraph blocks.
		if ( 'core/paragraph' !== $parsed_block['blockName'] ) {
			return $block_content;
		}

		// Check if prefix is set.
		if ( empty( $parsed_block['attrs']['prefix'] ) ) {
			return $block_content;
		}

		$prefix      = $parsed_block['attrs']['prefix'];
		$prefix_bold = isset( $parsed_block['attrs']['prefixBold'] ) ? (bool) $parsed_block['attrs']['prefixBold'] : false;

		// Add space after prefix if it doesn't end with punctuation or space.
		if ( ! preg_match( '/[\s\p{P}]$/u', $prefix ) ) {
			$prefix .= ' ';
		}

		// Wrap prefix in strong tags if bold.
		if ( $prefix_bold ) {
			$prefix = '<strong>' . esc_html( $prefix ) . '</strong>';
		} else {
			$prefix = esc_html( $prefix );
		}

		// Insert prefix after opening <p> tag.
		$block_content = preg_replace( '/^(<p[^>]*>)/', '$1' . $prefix, $block_content );

		return $block_content;
	}
}
