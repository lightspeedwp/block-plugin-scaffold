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
class Taxonomies {

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
		// Check if JSON configuration exists for the post type
		$taxonomies = JSON_Loader::get_taxonomies( Post_Types::POST_TYPE );

		if ( ! empty( $taxonomies ) ) {
			// Register from JSON configuration
			foreach ( $taxonomies as $taxonomy_config ) {
				$this->register_from_json( $taxonomy_config );
			}
		}
	}

	/**
	 * Register taxonomy from JSON configuration.
	 *
	 * @since 1.0.0
	 * @param array $config JSON configuration.
	 * @return void
	 */
	private function register_from_json( $config ) {
		$labels = JSON_Loader::get_taxonomy_labels( $config );

		$args = array(
			'labels'            => $labels,
			'hierarchical'      => isset( $config['hierarchical'] ) ? (bool) $config['hierarchical'] : true,
			'public'            => true,
			'show_ui'           => true,
			'show_in_rest'      => true, // Required for block editor.
			'show_admin_column' => isset( $config['show_admin_column'] ) ? (bool) $config['show_admin_column'] : true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => $config['slug'] ),
		);

		register_taxonomy(
			$config['slug'],
			Post_Types::POST_TYPE,
			$args
		);
	}
}
