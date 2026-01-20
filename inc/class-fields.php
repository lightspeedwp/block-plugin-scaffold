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

		// Check if JSON configuration exists
		$fields = JSON_Loader::get_fields( Post_Types::POST_TYPE );

		if ( ! empty( $fields ) ) {
			// Register from JSON configuration
			$this->register_from_json( $fields );
		}
	}

	/**
	 * Register fields from JSON configuration.
	 *
	 * @since 1.0.0
	 * @param array $fields_config JSON fields configuration.
	 * @return void
	 */
	private function register_from_json( $fields_config ) {
		$fields = array();

		foreach ( $fields_config as $field_config ) {
			$field = array(
				'key'          => 'field_' . $field_config['slug'],
				'label'        => isset( $field_config['label'] ) ? $field_config['label'] : '',
				'name'         => $field_config['slug'],
				'type'         => $field_config['type'],
				'instructions' => isset( $field_config['description'] ) ? $field_config['description'] : '',
			);

			// Add optional field properties
			if ( isset( $field_config['required'] ) ) {
				$field['required'] = (bool) $field_config['required'];
			}

			if ( isset( $field_config['default_value'] ) ) {
				$field['default_value'] = $field_config['default_value'];
			}

			if ( isset( $field_config['placeholder'] ) ) {
				$field['placeholder'] = $field_config['placeholder'];
			}

			if ( isset( $field_config['choices'] ) ) {
				$field['choices'] = $field_config['choices'];
			}

			if ( isset( $field_config['return_format'] ) ) {
				$field['return_format'] = $field_config['return_format'];
			}

			// Field type specific settings
			switch ( $field_config['type'] ) {
				case 'true_false':
					$field['ui'] = 1;
					break;

				case 'gallery':
					$field['preview_size'] = 'medium';
					$field['library']      = 'all';
					break;

				case 'relationship':
					if ( ! isset( $field['post_type'] ) ) {
						$field['post_type'] = array( Post_Types::POST_TYPE );
					}
					$field['filters'] = array( 'search', 'taxonomy' );
					if ( ! isset( $field['return_format'] ) ) {
						$field['return_format'] = 'object';
					}
					break;
			}

			$fields[] = $field;
		}

		acf_add_local_field_group(
			array(
				'key'             => self::FIELD_GROUP,
				'title'           => __( 'Item Details', '{{textdomain}}' ),
				'fields'          => $fields,
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
