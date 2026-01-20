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
	 * Provides backward compatibility fallback when no JSON configurations exist.
	 * If JSON configurations are found, Content_Model_Manager handles registration.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_post_types() {
		// Only register if JSON configurations don't exist (backward compatibility)
		if ( Content_Model_Manager::has_configurations() ) {
			return;
		}

		// Hardcoded fallback registration
		$this->register_hardcoded();
	}

	/**
	 * Register post type with hardcoded values (backward compatibility).
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private function register_hardcoded() {
		$labels = array(
			'name'                  => _x( '{{name_plural}}', 'Post type general name', '{{textdomain}}' ),
			'singular_name'         => _x( '{{name_singular}}', 'Post type singular name', '{{textdomain}}' ),
			'menu_name'             => _x( '{{name_plural}}', 'Admin Menu text', '{{textdomain}}' ),
			'add_new'               => __( 'Add New', '{{textdomain}}' ),
			'add_new_item'          => __( 'Add New {{name_singular}}', '{{textdomain}}' ),
			'edit_item'             => __( 'Edit {{name_singular}}', '{{textdomain}}' ),
			'new_item'              => __( 'New {{name_singular}}', '{{textdomain}}' ),
			'view_item'             => __( 'View {{name_singular}}', '{{textdomain}}' ),
			'view_items'            => __( 'View {{name_plural}}', '{{textdomain}}' ),
			'search_items'          => __( 'Search {{name_plural}}', '{{textdomain}}' ),
			'not_found'             => __( 'No {{name_plural_lower}} found', '{{textdomain}}' ),
			'not_found_in_trash'    => __( 'No {{name_plural_lower}} found in Trash', '{{textdomain}}' ),
			'all_items'             => __( 'All {{name_plural}}', '{{textdomain}}' ),
			'archives'              => __( '{{name_singular}} Archives', '{{textdomain}}' ),
			'attributes'            => __( '{{name_singular}} Attributes', '{{textdomain}}' ),
			'insert_into_item'      => __( 'Insert into {{name_singular_lower}}', '{{textdomain}}' ),
			'uploaded_to_this_item' => __( 'Uploaded to this {{name_singular_lower}}', '{{textdomain}}' ),
			'filter_items_list'     => __( 'Filter {{name_plural_lower}} list', '{{textdomain}}' ),
			'items_list_navigation' => __( '{{name_plural}} list navigation', '{{textdomain}}' ),
			'items_list'            => __( '{{name_plural}} list', '{{textdomain}}' ),
		);

		$args = array(
			'labels'             => $labels,
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'show_in_rest'       => true,
			'query_var'          => true,
			'rewrite'            => array( 'slug' => self::POST_TYPE ),
			'capability_type'    => 'post',
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => 20,
			'menu_icon'          => 'dashicons-{{cpt_icon_name}}',
			'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ),
			'template'           => array(
				array( '{{namespace}}/{{cpt_slug}}-single' ),
			),
			'template_lock'      => false,
		);

		register_post_type( self::POST_TYPE, $args );
	}
}
