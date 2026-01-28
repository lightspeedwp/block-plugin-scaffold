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
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
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

	/**
	 * Register REST API routes.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_rest_routes() {
		register_rest_route(
			'{{slug}}/v1',
			'/fields/(?P<post_type>[a-zA-Z0-9_-]+)',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_available_fields' ),
				'permission_callback' => array( $this, 'check_editor_permission' ),
				'args'                => array(
					'post_type' => array(
						'required'          => true,
						'validate_callback' => function ( $param ) {
							return is_string( $param ) && post_type_exists( $param );
						},
					),
				),
			)
		);
	}

	/**
	 * Check if user has permission to edit posts.
	 *
	 * @since 1.0.0
	 * @return bool
	 */
	public function check_editor_permission() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Get available custom fields for a post type from SCF JSON files.
	 *
	 * @since 1.0.0
	 * @param \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_available_fields( $request ) {
		$post_type = $request->get_param( 'post_type' );
		$fields    = array();

		// Get SCF JSON directory.
		$json_dir = {{namespace|upper}}_DIR . 'scf-json';

		if ( ! is_dir( $json_dir ) ) {
			return rest_ensure_response( array( 'fields' => $fields ) );
		}

		// Get all JSON files.
		$json_files = glob( $json_dir . '/*.json' );

		if ( empty( $json_files ) ) {
			return rest_ensure_response( array( 'fields' => $fields ) );
		}

		foreach ( $json_files as $file ) {
			$json_data = json_decode( file_get_contents( $file ), true );

			if ( ! $json_data || ! isset( $json_data['location'] ) ) {
				continue;
			}

			// Check if this field group applies to the post type.
			$applies_to_post_type = false;
			foreach ( $json_data['location'] as $location_group ) {
				foreach ( $location_group as $rule ) {
					if ( isset( $rule['param'] ) && 'post_type' === $rule['param'] 
						&& isset( $rule['value'] ) && $rule['value'] === $post_type ) {
						$applies_to_post_type = true;
						break 2;
					}
				}
			}

			if ( ! $applies_to_post_type ) {
				continue;
			}

			// Extract fields from this group.
			if ( isset( $json_data['fields'] ) && is_array( $json_data['fields'] ) ) {
				foreach ( $json_data['fields'] as $field ) {
					if ( isset( $field['name'] ) && isset( $field['label'] ) ) {
						$fields[] = array(
							'value' => $field['name'],
							'label' => $field['label'],
							'type'  => isset( $field['type'] ) ? $field['type'] : 'text',
						);
					}
				}
			}
		}

		// Sort fields by label.
		usort(
			$fields,
			function ( $a, $b ) {
				return strcmp( $a['label'], $b['label'] );
			}
		);

		return rest_ensure_response( array( 'fields' => $fields ) );
	}
}
