<?php
namespace {{namespace}}\classes;

/**
 * Custom Fields Registration using Secure Custom Fields.
 *
 * Fields are now registered via JSON files in /post-types/
 * and handled by Content_Model_Manager.
 *
 * This class is kept for the FIELD_GROUP constant and SCF dependency checks.
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

}
