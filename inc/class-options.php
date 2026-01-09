<?php
namespace {{namespace}}\classes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Options Pages Registration using Secure Custom Fields.
 *
 * Creates global settings pages for site-wide configuration that is not
 * tied to individual posts, pages, or taxonomies.
 *
 * @package {{namespace}}
 * @since 1.0.0
 * @see https://github.com/WordPress/secure-custom-fields/blob/trunk/docs/tutorials/first-options-page.md
 * @see https://github.com/WordPress/secure-custom-fields/blob/trunk/docs/code-reference/api/index.md
 */

/**
 * Options class.
 *
 * Registers options pages and their associated field groups using SCF.
 */
class Options {

	/**
	 * Main options page slug.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const OPTIONS_PAGE = '{{namespace}}_settings';

	/**
	 * Field group key for main settings.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const FIELD_GROUP = 'group_{{namespace}}_options';

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'acf/init', array( $this, 'register_options_pages' ) );
		add_action( 'acf/init', array( $this, 'register_options_fields' ) );
	}

	/**
	 * Check if Secure Custom Fields is active.
	 *
	 * @since 1.0.0
	 * @return bool
	 */
	public function is_scf_active() {
		return function_exists( 'acf_add_options_page' );
	}

	/**
	 * Register options pages.
	 *
	 * Creates the main settings page and any sub-pages.
	 *
	 * @since 1.0.0
	 * @see https://github.com/WordPress/secure-custom-fields/blob/trunk/docs/tutorials/first-options-page.md
	 * @return void
	 */
	public function register_options_pages() {
		if ( ! $this->is_scf_active() ) {
			return;
		}

		// Main options page.
		acf_add_options_page(
			array(
				'page_title'      => __( '{{name}} Settings', '{{textdomain}}' ),
				'menu_title'      => __( '{{name}}', '{{textdomain}}' ),
				'menu_slug'       => self::OPTIONS_PAGE,
				'capability'      => 'manage_options',
				'icon_url'        => 'dashicons-admin-generic',
				'redirect'        => false,
				'position'        => 30,
				'update_button'   => __( 'Save Settings', '{{textdomain}}' ),
				'updated_message' => __( 'Settings saved.', '{{textdomain}}' ),
				'autoload'        => true,
			)
		);

		// General settings sub-page.
		acf_add_options_sub_page(
			array(
				'page_title'  => __( 'General Settings', '{{textdomain}}' ),
				'menu_title'  => __( 'General', '{{textdomain}}' ),
				'parent_slug' => self::OPTIONS_PAGE,
				'menu_slug'   => self::OPTIONS_PAGE . '-general',
				'capability'  => 'manage_options',
			)
		);

		// Display settings sub-page.
		acf_add_options_sub_page(
			array(
				'page_title'  => __( 'Display Settings', '{{textdomain}}' ),
				'menu_title'  => __( 'Display', '{{textdomain}}' ),
				'parent_slug' => self::OPTIONS_PAGE,
				'menu_slug'   => self::OPTIONS_PAGE . '-display',
				'capability'  => 'manage_options',
			)
		);

		// API settings sub-page.
		acf_add_options_sub_page(
			array(
				'page_title'  => __( 'API Settings', '{{textdomain}}' ),
				'menu_title'  => __( 'API', '{{textdomain}}' ),
				'parent_slug' => self::OPTIONS_PAGE,
				'menu_slug'   => self::OPTIONS_PAGE . '-api',
				'capability'  => 'manage_options',
			)
		);
	}

	/**
	 * Register options page fields.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_options_fields() {
		if ( ! function_exists( 'acf_add_local_field_group' ) ) {
			return;
		}

		// General Settings fields.
		acf_add_local_field_group(
			array(
				'key'             => self::FIELD_GROUP . '_general',
				'title'           => __( 'General Settings', '{{textdomain}}' ),
				'fields'          => array(
					// Tab: Branding.
					array(
						'key'   => 'field_{{namespace}}_tab_branding',
						'label' => __( 'Branding', '{{textdomain}}' ),
						'type'  => 'tab',
					),
					array(
						'key'           => 'field_{{namespace}}_logo',
						'label'         => __( 'Logo', '{{textdomain}}' ),
						'name'          => '{{namespace}}_logo',
						'type'          => 'image',
						'return_format' => 'array',
						'preview_size'  => 'medium',
						'library'       => 'all',
						'instructions'  => __( 'Upload your site logo.', '{{textdomain}}' ),
					),
					array(
						'key'          => 'field_{{namespace}}_company_name',
						'label'        => __( 'Company Name', '{{textdomain}}' ),
						'name'         => '{{namespace}}_company_name',
						'type'         => 'text',
						'instructions' => __( 'Enter your company or organisation name.', '{{textdomain}}' ),
					),
					array(
						'key'          => 'field_{{namespace}}_tagline',
						'label'        => __( 'Tagline', '{{textdomain}}' ),
						'name'         => '{{namespace}}_tagline',
						'type'         => 'text',
						'instructions' => __( 'Enter a short tagline or slogan.', '{{textdomain}}' ),
					),
					// Tab: Contact.
					array(
						'key'   => 'field_{{namespace}}_tab_contact',
						'label' => __( 'Contact', '{{textdomain}}' ),
						'type'  => 'tab',
					),
					array(
						'key'          => 'field_{{namespace}}_email',
						'label'        => __( 'Email Address', '{{textdomain}}' ),
						'name'         => '{{namespace}}_email',
						'type'         => 'email',
						'instructions' => __( 'Primary contact email address.', '{{textdomain}}' ),
					),
					array(
						'key'          => 'field_{{namespace}}_phone',
						'label'        => __( 'Phone Number', '{{textdomain}}' ),
						'name'         => '{{namespace}}_phone',
						'type'         => 'text',
						'instructions' => __( 'Primary contact phone number.', '{{textdomain}}' ),
					),
					array(
						'key'          => 'field_{{namespace}}_address',
						'label'        => __( 'Address', '{{textdomain}}' ),
						'name'         => '{{namespace}}_address',
						'type'         => 'textarea',
						'rows'         => 3,
						'instructions' => __( 'Physical address or mailing address.', '{{textdomain}}' ),
					),
					// Tab: Social Media.
					array(
						'key'   => 'field_{{namespace}}_tab_social',
						'label' => __( 'Social Media', '{{textdomain}}' ),
						'type'  => 'tab',
					),
					array(
						'key'          => 'field_{{namespace}}_social_links',
						'label'        => __( 'Social Links', '{{textdomain}}' ),
						'name'         => '{{namespace}}_social_links',
						'type'         => 'repeater',
						'layout'       => 'table',
						'button_label' => __( 'Add Social Link', '{{textdomain}}' ),
						'sub_fields'   => array(
							array(
								'key'     => 'field_{{namespace}}_social_platform',
								'label'   => __( 'Platform', '{{textdomain}}' ),
								'name'    => 'platform',
								'type'    => 'select',
								'choices' => array(
									'facebook'  => __( 'Facebook', '{{textdomain}}' ),
									'twitter'   => __( 'Twitter/X', '{{textdomain}}' ),
									'instagram' => __( 'Instagram', '{{textdomain}}' ),
									'linkedin'  => __( 'LinkedIn', '{{textdomain}}' ),
									'youtube'   => __( 'YouTube', '{{textdomain}}' ),
									'tiktok'    => __( 'TikTok', '{{textdomain}}' ),
									'other'     => __( 'Other', '{{textdomain}}' ),
								),
							),
							array(
								'key'   => 'field_{{namespace}}_social_url',
								'label' => __( 'URL', '{{textdomain}}' ),
								'name'  => 'url',
								'type'  => 'url',
							),
						),
					),
				),
				'location'        => array(
					array(
						array(
							'param'    => 'options_page',
							'operator' => '==',
							'value'    => self::OPTIONS_PAGE . '-general',
						),
					),
				),
				'menu_order'      => 0,
				'position'        => 'normal',
				'style'           => 'default',
				'label_placement' => 'top',
			)
		);

		// Display Settings fields.
		acf_add_local_field_group(
			array(
				'key'      => self::FIELD_GROUP . '_display',
						'title'    => __( 'Display Settings', '{{textdomain}}' ),
				'fields'   => array(
					array(
							'key'          => 'field_{{namespace}}_items_per_page',
							'label'        => __( 'Items Per Page', '{{textdomain}}' ),
							'name'         => '{{namespace}}_items_per_page',
						'type'         => 'number',
						'default'      => 12,
						'min'          => 1,
						'max'          => 100,
							'instructions' => __( 'Number of items to display per page in archive views.', '{{textdomain}}' ),
					),
					array(
							'key'          => 'field_{{namespace}}_layout',
							'label'        => __( 'Archive Layout', '{{textdomain}}' ),
							'name'         => '{{namespace}}_layout',
						'type'         => 'button_group',
						'choices'      => array(
								'grid'    => __( 'Grid', '{{textdomain}}' ),
								'list'    => __( 'List', '{{textdomain}}' ),
								'masonry' => __( 'Masonry', '{{textdomain}}' ),
						),
						'default'      => 'grid',
							'instructions' => __( 'Choose the default layout for archive pages.', '{{textdomain}}' ),
					),
					array(
							'key'          => 'field_{{namespace}}_show_sidebar',
							'label'        => __( 'Show Sidebar', '{{textdomain}}' ),
							'name'         => '{{namespace}}_show_sidebar',
						'type'         => 'true_false',
						'ui'           => 1,
						'default'      => 1,
							'instructions' => __( 'Display sidebar on archive and single views.', '{{textdomain}}' ),
					),
								array(
									'key'          => 'field_{{namespace}}_featured_image_size',
									'label'        => __( 'Featured Image Size', '{{textdomain}}' ),
									'name'         => '{{namespace}}_featured_image_size',
									'type'         => 'select',
									'choices'      => array(
										'thumbnail' => __( 'Thumbnail (150x150)', '{{textdomain}}' ),
										'medium'    => __( 'Medium (300x300)', '{{textdomain}}' ),
										'large'     => __( 'Large (1024x1024)', '{{textdomain}}' ),
										'full'      => __( 'Full Size', '{{textdomain}}' ),
									),
									'default'      => 'medium',
									'instructions' => __( 'Image size for featured images in listings.', '{{textdomain}}' ),
					),
				),
				'location' => array(
					array(
						array(
							'param'    => 'options_page',
							'operator' => '==',
							'value'    => self::OPTIONS_PAGE . '-display',
						),
					),
				),
			)
		);

		// API Settings fields.
		acf_add_local_field_group(
			array(
				'key'      => self::FIELD_GROUP . '_api',
				'title'    => __( 'API Settings', '{{textdomain}}' ),
				'fields'   => array(
					array(
						'key'          => 'field_{{namespace}}_api_key',
						'label'        => __( 'API Key', '{{textdomain}}' ),
						'name'         => '{{namespace}}_api_key',
						'type'         => 'text',
						'instructions' => __( 'Enter your API key for external integrations.', '{{textdomain}}' ),
					),
					array(
						'key'          => 'field_{{namespace}}_api_secret',
						'label'        => __( 'API Secret', '{{textdomain}}' ),
						'name'         => '{{namespace}}_api_secret',
						'type'         => 'password',
						'instructions' => __( 'Enter your API secret (stored securely).', '{{textdomain}}' ),
					),
					array(
						'key'          => 'field_{{namespace}}_api_endpoint',
						'label'        => __( 'API Endpoint', '{{textdomain}}' ),
						'name'         => '{{namespace}}_api_endpoint',
						'type'         => 'url',
						'instructions' => __( 'Custom API endpoint URL.', '{{textdomain}}' ),
					),
					array(
						'key'          => 'field_{{namespace}}_enable_api',
						'label'        => __( 'Enable API', '{{textdomain}}' ),
						'name'         => '{{namespace}}_enable_api',
						'type'         => 'true_false',
						'ui'           => 1,
						'default'      => 0,
						'instructions' => __( 'Enable external API integration.', '{{textdomain}}' ),
					),
					array(
						'key'          => 'field_{{namespace}}_api_cache_duration',
						'label'        => __( 'Cache Duration', '{{textdomain}}' ),
						'name'         => '{{namespace}}_api_cache_duration',
						'type'         => 'number',
						'default'      => 3600,
						'min'          => 0,
						'append'       => __( 'seconds', '{{textdomain}}' ),
						'instructions' => __( 'How long to cache API responses (0 to disable).', '{{textdomain}}' ),
					),
				),
				'location' => array(
					array(
						array(
							'param'    => 'options_page',
							'operator' => '==',
							'value'    => self::OPTIONS_PAGE . '-api',
						),
					),
				),
			)
		);
	}

	/**
	 * Get an option value.
	 *
	 * Helper method to retrieve option values using get_field().
	 *
	 * @since 1.0.0
	 * @param string $field_name The field name without prefix.
	 * @param mixed  $default    Default value if field is empty.
	 * @return mixed The field value or default.
	 */
	public static function get_option( $field_name, $default = '' ) {
		if ( ! function_exists( 'get_field' ) ) {
			return $default;
		}

		$value = get_field( '{{namespace}}_' . $field_name, 'option' );

		return $value ? $value : $default;
	}

	/**
	 * Update an option value.
	 *
	 * Helper method to update option values using update_field().
	 *
	 * @since 1.0.0
	 * @param string $field_name The field name without prefix.
	 * @param mixed  $value      The value to save.
	 * @return bool True on success, false on failure.
	 */
	public static function update_option( $field_name, $value ) {
		if ( ! function_exists( 'update_field' ) ) {
			return false;
		}

		return update_field( '{{namespace}}_' . $field_name, $value, 'option' );
	}
}
