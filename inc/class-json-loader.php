<?php
/**
 * JSON Loader for Post Types, Taxonomies, and Fields
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

namespace {{namespace}}\classes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * JSON_Loader class.
 *
 * Loads post type, taxonomy, and field configurations from JSON files.
 */
class JSON_Loader {

	/**
	 * Holds the loaded post type configurations.
	 *
	 * @var array
	 */
	private static $post_type_configs = array();

	/**
	 * Initialize the JSON loader.
	 *
	 * @since 1.0.0
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'load_configurations' ), 5 );
	}

	/**
	 * Load all JSON configurations.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function load_configurations() {
		$json_path = dirname( dirname( __DIR__ ) ) . '/post-types/';
		
		if ( ! file_exists( $json_path ) ) {
			return;
		}

		$json_files = glob( $json_path . '*.json' );
		
		foreach ( $json_files as $file ) {
			// Skip schema.json
			if ( basename( $file ) === 'schema.json' ) {
				continue;
			}

			$config = self::load_json_file( $file );
			
			if ( $config && isset( $config['slug'] ) ) {
				self::$post_type_configs[ $config['slug'] ] = $config;
			}
		}
	}

	/**
	 * Load and parse a JSON file.
	 *
	 * @since 1.0.0
	 * @param string $file Path to JSON file.
	 * @return array|null Parsed configuration or null on failure.
	 */
	private static function load_json_file( $file ) {
		if ( ! file_exists( $file ) ) {
			return null;
		}

		$contents = file_get_contents( $file );
		
		if ( false === $contents ) {
			return null;
		}

		$config = json_decode( $contents, true );
		
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			error_log( sprintf( 'JSON decode error in %s: %s', $file, json_last_error_msg() ) );
			return null;
		}

		return $config;
	}

	/**
	 * Get all loaded post type configurations.
	 *
	 * @since 1.0.0
	 * @return array
	 */
	public static function get_configurations() {
		return self::$post_type_configs;
	}

	/**
	 * Get configuration for a specific post type.
	 *
	 * @since 1.0.0
	 * @param string $slug Post type slug.
	 * @return array|null Configuration array or null if not found.
	 */
	public static function get_configuration( $slug ) {
		return isset( self::$post_type_configs[ $slug ] ) ? self::$post_type_configs[ $slug ] : null;
	}

	/**
	 * Check if JSON loading is enabled and configurations exist.
	 *
	 * @since 1.0.0
	 * @return bool
	 */
	public static function is_enabled() {
		return ! empty( self::$post_type_configs );
	}

	/**
	 * Get fields for a post type.
	 *
	 * @since 1.0.0
	 * @param string $slug Post type slug.
	 * @return array
	 */
	public static function get_fields( $slug ) {
		$config = self::get_configuration( $slug );
		return isset( $config['fields'] ) ? $config['fields'] : array();
	}

	/**
	 * Get taxonomies for a post type.
	 *
	 * @since 1.0.0
	 * @param string $slug Post type slug.
	 * @return array
	 */
	public static function get_taxonomies( $slug ) {
		$config = self::get_configuration( $slug );
		return isset( $config['taxonomies'] ) ? $config['taxonomies'] : array();
	}

	/**
	 * Get post type labels from configuration.
	 *
	 * @since 1.0.0
	 * @param array $config Post type configuration.
	 * @return array
	 */
	public static function get_post_type_labels( $config ) {
		$singular = isset( $config['label'] ) ? $config['label'] : '';
		$plural   = isset( $config['pluralLabel'] ) ? $config['pluralLabel'] : $singular . 's';
		$slug     = isset( $config['slug'] ) ? $config['slug'] : '';

		return array(
			'name'                  => $plural,
			'singular_name'         => $singular,
			'menu_name'             => $plural,
			'add_new'               => __( 'Add New', '{{textdomain}}' ),
			'add_new_item'          => sprintf( __( 'Add New %s', '{{textdomain}}' ), $singular ),
			'edit_item'             => sprintf( __( 'Edit %s', '{{textdomain}}' ), $singular ),
			'new_item'              => sprintf( __( 'New %s', '{{textdomain}}' ), $singular ),
			'view_item'             => sprintf( __( 'View %s', '{{textdomain}}' ), $singular ),
			'view_items'            => sprintf( __( 'View %s', '{{textdomain}}' ), $plural ),
			'search_items'          => sprintf( __( 'Search %s', '{{textdomain}}' ), $plural ),
			'not_found'             => sprintf( __( 'No %s found', '{{textdomain}}' ), strtolower( $plural ) ),
			'not_found_in_trash'    => sprintf( __( 'No %s found in Trash', '{{textdomain}}' ), strtolower( $plural ) ),
			'all_items'             => sprintf( __( 'All %s', '{{textdomain}}' ), $plural ),
			'archives'              => sprintf( __( '%s Archives', '{{textdomain}}' ), $singular ),
			'attributes'            => sprintf( __( '%s Attributes', '{{textdomain}}' ), $singular ),
			'insert_into_item'      => sprintf( __( 'Insert into %s', '{{textdomain}}' ), strtolower( $singular ) ),
			'uploaded_to_this_item' => sprintf( __( 'Uploaded to this %s', '{{textdomain}}' ), strtolower( $singular ) ),
			'filter_items_list'     => sprintf( __( 'Filter %s list', '{{textdomain}}' ), strtolower( $plural ) ),
			'items_list_navigation' => sprintf( __( '%s list navigation', '{{textdomain}}' ), $plural ),
			'items_list'            => sprintf( __( '%s list', '{{textdomain}}' ), $plural ),
		);
	}

	/**
	 * Get taxonomy labels from configuration.
	 *
	 * @since 1.0.0
	 * @param array $config Taxonomy configuration.
	 * @return array
	 */
	public static function get_taxonomy_labels( $config ) {
		$singular = isset( $config['label'] ) ? $config['label'] : '';
		$plural   = isset( $config['pluralLabel'] ) ? $config['pluralLabel'] : $singular . 's';

		return array(
			'name'                       => $plural,
			'singular_name'              => $singular,
			'search_items'               => sprintf( __( 'Search %s', '{{textdomain}}' ), $plural ),
			'popular_items'              => sprintf( __( 'Popular %s', '{{textdomain}}' ), $plural ),
			'all_items'                  => sprintf( __( 'All %s', '{{textdomain}}' ), $plural ),
			'edit_item'                  => sprintf( __( 'Edit %s', '{{textdomain}}' ), $singular ),
			'update_item'                => sprintf( __( 'Update %s', '{{textdomain}}' ), $singular ),
			'add_new_item'               => sprintf( __( 'Add New %s', '{{textdomain}}' ), $singular ),
			'new_item_name'              => sprintf( __( 'New %s Name', '{{textdomain}}' ), $singular ),
			'separate_items_with_commas' => sprintf( __( 'Separate %s with commas', '{{textdomain}}' ), strtolower( $plural ) ),
			'add_or_remove_items'        => sprintf( __( 'Add or remove %s', '{{textdomain}}' ), strtolower( $plural ) ),
			'choose_from_most_used'      => sprintf( __( 'Choose from the most used %s', '{{textdomain}}' ), strtolower( $plural ) ),
			'not_found'                  => sprintf( __( 'No %s found.', '{{textdomain}}' ), strtolower( $plural ) ),
			'menu_name'                  => $plural,
		);
	}
}

// Initialize the JSON loader
JSON_Loader::init();
