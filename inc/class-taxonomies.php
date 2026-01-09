<?php
namespace {{namespace}}\classes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Custom Taxonomy Registration.
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

/**
 * Taxonomies class.
 */
class {{namespace|pascalCase}}_Taxonomies {

	/**
	 * Taxonomy slug.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const TAXONOMY = '{{taxonomy_slug}}';

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_taxonomies' ) );
	}

	/**
	 * Register custom taxonomies.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_taxonomies() {
		$labels = array(
			'name'                       => _x( '{{taxonomy_plural}}', 'Taxonomy general name', '{{textdomain}}' ),
			'singular_name'              => _x( '{{taxonomy_singular}}', 'Taxonomy singular name', '{{textdomain}}' ),
			'search_items'               => __( 'Search {{taxonomy_plural}}', '{{textdomain}}' ),
			'popular_items'              => __( 'Popular {{taxonomy_plural}}', '{{textdomain}}' ),
			'all_items'                  => __( 'All {{taxonomy_plural}}', '{{textdomain}}' ),
			'edit_item'                  => __( 'Edit {{taxonomy_singular}}', '{{textdomain}}' ),
			'update_item'                => __( 'Update {{taxonomy_singular}}', '{{textdomain}}' ),
			'add_new_item'               => __( 'Add New {{taxonomy_singular}}', '{{textdomain}}' ),
			'new_item_name'              => __( 'New {{taxonomy_singular}} Name', '{{textdomain}}' ),
			'separate_items_with_commas' => __( 'Separate {{taxonomy_plural_lower}} with commas', '{{textdomain}}' ),
			'add_or_remove_items'        => __( 'Add or remove {{taxonomy_plural_lower}}', '{{textdomain}}' ),
			'choose_from_most_used'      => __( 'Choose from the most used {{taxonomy_plural_lower}}', '{{textdomain}}' ),
			'not_found'                  => __( 'No {{taxonomy_plural_lower}} found.', '{{textdomain}}' ),
			'menu_name'                  => __( '{{taxonomy_plural}}', '{{textdomain}}' ),
		);

		$args = array(
			'labels'            => $labels,
			'hierarchical'      => true,
			'public'            => true,
			'show_ui'           => true,
			'show_in_rest'      => true, // Required for block editor.
			'show_admin_column' => true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => '{{taxonomy_slug}}' ),
		);

		register_taxonomy(
			self::TAXONOMY,
			{{namespace|pascalCase}}_Post_Types::POST_TYPE,
			$args
		);
	}
}
