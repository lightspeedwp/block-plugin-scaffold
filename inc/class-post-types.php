<?php
namespace {{namespace}}\classes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Custom Post Type Registration.
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

/**
 * Post Types class.
 */
class Post_Types {

	/**
	 * Post type slug.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const POST_TYPE = '{{cpt_slug}}';

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_post_types' ) );
	}

	/**
	 * Register custom post types.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_post_types() {
		// Check if JSON configuration exists
		$config = JSON_Loader::get_configuration( self::POST_TYPE );

		if ( $config ) {
			// Register from JSON configuration
			$this->register_from_json( $config );
		}
	}

	/**
	 * Register post type from JSON configuration.
	 *
	 * @since 1.0.0
	 * @param array $config JSON configuration.
	 * @return void
	 */
	private function register_from_json( $config ) {
		$labels = JSON_Loader::get_post_type_labels( $config );

		$args = array(
			'labels'             => $labels,
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'show_in_rest'       => true, // Required for block editor.
			'query_var'          => true,
			'rewrite'            => array( 'slug' => $config['slug'] ),
			'capability_type'    => 'post',
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => 20,
			'menu_icon'          => isset( $config['icon'] ) ? 'dashicons-' . $config['icon'] : 'dashicons-admin-post',
			'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ),
			'template'           => isset( $config['template'] ) ? $config['template'] : array(),
			'template_lock'      => false,
		);

		register_post_type( self::POST_TYPE, $args );
	}
}
