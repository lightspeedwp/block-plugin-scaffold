<?php
namespace {{namespace}}\classes;

/**
 * Custom Fields Registration using Secure Custom Fields.
 *
 * @package {{namespace}}
 * @since 1.0.0
 * @see https://wordpress.org/plugins/secure-custom-fields/
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Fields class.
 *
 * @since 1.0.0
 */
class Fields {

	/**
	 * Field group key.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const FIELD_GROUP = 'group_{{namespace}}_fields';

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'acf/init', array( $this, 'register_fields' ) );
		add_action( 'admin_notices', array( $this, 'scf_dependency_notice' ) );
	}

	/**
	 * Check if Secure Custom Fields is active.
	 *
	 * @since 1.0.0
	 * @return bool True if SCF is active, false otherwise.
	 */
	public function is_scf_active() {
		return function_exists( 'acf_add_local_field_group' );
	}

	/**
	 * Display admin notice if SCF is not active.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function scf_dependency_notice() {
		if ( ! $this->is_scf_active() ) {
			?>
			<div class="notice notice-warning">
				<p>
					<?php
					printf(
						/* translators: %s: Plugin name */
							esc_html__( '%s requires Secure Custom Fields plugin to be installed and activated for custom fields functionality.', '{{textdomain}}' ),
							'<strong>{{name}}</strong>'
					);
					?>
				</p>
			</div>
			<?php
		}
	}

	/**
	 * Register custom fields.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_fields() {
		if ( ! $this->is_scf_active() ) {
			return;
		}

		acf_add_local_field_group(
			array(
				'key'             => self::FIELD_GROUP,
				'title'           => __( 'Item Details', '{{textdomain}}' ),
				'fields'          => array(
					array(
						'key'          => 'field_{{namespace}}_subtitle',
						'label'        => __( 'Subtitle', '{{textdomain}}' ),
						'name'         => '{{namespace}}_subtitle',
						'type'         => 'text',
						'instructions' => __( 'Enter a subtitle for this item.', '{{textdomain}}' ),
				),
					array(
						'key'          => 'field_{{namespace}}_featured',
						'label'        => __( 'Featured', '{{textdomain}}' ),
						'name'         => '{{namespace}}_featured',
						'type'         => 'true_false',
						'ui'           => 1,
						'instructions' => __( 'Mark this item as featured.', '{{textdomain}}' ),
				),
					array(
						'key'           => 'field_{{namespace}}_gallery',
						'label'         => __( 'Gallery', '{{textdomain}}' ),
						'name'          => '{{namespace}}_gallery',
						'type'          => 'gallery',
						'instructions'  => __( 'Add images to the gallery.', '{{textdomain}}' ),
						'return_format' => 'array',
						'preview_size'  => 'medium',
						'library'       => 'all',
				),
					array(
						'key'           => 'field_{{namespace}}_related',
						'label'         => __( 'Related Items', '{{textdomain}}' ),
						'name'          => '{{namespace}}_related',
						'type'          => 'relationship',
						'post_type'     => array( Post_Types::POST_TYPE ),
						'filters'       => array( 'search', 'taxonomy' ),
						'return_format' => 'object',
						'instructions'  => __( 'Select related items.', '{{textdomain}}' ),
				),
				),
				'location'        => array(
					array(
						array(
							'param'    => 'post_type',
							'operator' => '==',
							'value'    => Post_Types::POST_TYPE,
						),
					),
				),
				'menu_order'      => 0,
				'position'        => 'normal',
				'style'           => 'default',
				'label_placement' => 'top',
			)
		);
	}
}
