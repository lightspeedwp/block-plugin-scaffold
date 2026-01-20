<?php
/**
 * Content Model Manager - Handles all JSON-based post types, taxonomies, and fields
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

namespace {{namespace}}\classes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Content_Model_Manager class.
 *
 * Centralized manager for loading JSON configurations and registering
 * all post types, taxonomies, and custom fields.
 */
class Content_Model_Manager {

	/**
	 * Holds the loaded post type configurations.
	 *
	 * @var array
	 */
	private static $configurations = array();

	/**
	 * Initialize the content model manager.
	 *
	 * @since 1.0.0
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'load_and_register' ), 10 );
		add_action( 'acf/init', array( __CLASS__, 'register_all_fields' ) );
	}

	/**
	 * Load all JSON configurations and register post types and taxonomies.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function load_and_register() {
		self::load_configurations();
		self::register_all_post_types();
		self::register_all_taxonomies();
	}

	/**
	 * Load all JSON configuration files.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private static function load_configurations() {
		$json_path = dirname( dirname( __FILE__ ) ) . '/post-types/';
		
		if ( ! file_exists( $json_path ) ) {
			return;
		}

		$json_files = glob( $json_path . '*.json' );
		
		if ( empty( $json_files ) ) {
			return;
		}

		foreach ( $json_files as $file ) {
			// Skip schema.json
			if ( basename( $file ) === 'schema.json' ) {
				continue;
			}

			$config = self::load_json_file( $file );
			
			if ( $config && isset( $config['slug'] ) ) {
				self::$configurations[ $config['slug'] ] = $config;
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
			error_log( sprintf( 'JSON decode error in %s: %s', basename( $file ), json_last_error_msg() ) );
			return null;
		}

		return $config;
	}

	/**
	 * Register all post types from loaded configurations.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private static function register_all_post_types() {
		if ( empty( self::$configurations ) ) {
			return;
		}

		foreach ( self::$configurations as $slug => $config ) {
			self::register_post_type( $slug, $config );
		}
	}

	/**
	 * Register a single post type from configuration.
	 *
	 * @since 1.0.0
	 * @param string $slug Post type slug.
	 * @param array  $config Post type configuration.
	 * @return void
	 */
	private static function register_post_type( $slug, $config ) {
		$labels = self::get_post_type_labels( $config );

		$args = array(
			'labels'             => $labels,
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'show_in_rest'       => true,
			'query_var'          => true,
			'rewrite'            => array( 'slug' => $slug ),
			'capability_type'    => 'post',
			'has_archive'        => true,
			'hierarchical'       => false,
			'menu_position'      => 20,
			'menu_icon'          => isset( $config['icon'] ) ? 'dashicons-' . $config['icon'] : 'dashicons-admin-post',
			'supports'           => array( 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ),
			'template'           => isset( $config['template'] ) ? $config['template'] : array(),
			'template_lock'      => false,
		);

		register_post_type( $slug, $args );
	}

	/**
	 * Register all taxonomies from loaded configurations.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	private static function register_all_taxonomies() {
		if ( empty( self::$configurations ) ) {
			return;
		}

		foreach ( self::$configurations as $post_type_slug => $config ) {
			if ( empty( $config['taxonomies'] ) ) {
				continue;
			}

			foreach ( $config['taxonomies'] as $taxonomy_config ) {
				self::register_taxonomy( $taxonomy_config, $post_type_slug );
			}
		}
	}

	/**
	 * Register a single taxonomy from configuration.
	 *
	 * @since 1.0.0
	 * @param array  $config Taxonomy configuration.
	 * @param string $post_type Post type to attach to.
	 * @return void
	 */
	private static function register_taxonomy( $config, $post_type ) {
		if ( ! isset( $config['slug'] ) ) {
			return;
		}

		$labels = self::get_taxonomy_labels( $config );

		$args = array(
			'labels'            => $labels,
			'hierarchical'      => isset( $config['hierarchical'] ) ? (bool) $config['hierarchical'] : true,
			'public'            => true,
			'show_ui'           => true,
			'show_in_rest'      => true,
			'show_admin_column' => isset( $config['show_admin_column'] ) ? (bool) $config['show_admin_column'] : true,
			'query_var'         => true,
			'rewrite'           => array( 'slug' => $config['slug'] ),
		);

		register_taxonomy( $config['slug'], $post_type, $args );
	}

	/**
	 * Register all custom fields from loaded configurations.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_all_fields() {
		if ( ! function_exists( 'acf_add_local_field_group' ) ) {
			return;
		}

		if ( empty( self::$configurations ) ) {
			return;
		}

		foreach ( self::$configurations as $post_type_slug => $config ) {
			if ( empty( $config['fields'] ) ) {
				continue;
			}

			self::register_field_group( $post_type_slug, $config['fields'] );
		}
	}

	/**
	 * Register a field group for a post type.
	 *
	 * @since 1.0.0
	 * @param string $post_type Post type slug.
	 * @param array  $fields_config Fields configuration.
	 * @return void
	 */
	private static function register_field_group( $post_type, $fields_config ) {
		$fields = array();

		foreach ( $fields_config as $field_config ) {
			$field = array(
				'key'          => 'field_' . $post_type . '_' . $field_config['slug'],
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
						$field['post_type'] = array( $post_type );
					}
					$field['filters'] = array( 'search', 'taxonomy' );
					if ( ! isset( $field['return_format'] ) ) {
						$field['return_format'] = 'object';
					}
					break;
			}

			$fields[] = $field;
		}

		$config = self::get_configuration( $post_type );
		$label  = isset( $config['label'] ) ? $config['label'] : ucfirst( $post_type );

		acf_add_local_field_group(
			array(
				'key'             => 'group_' . $post_type . '_fields',
				'title'           => sprintf( __( '%s Details', '{{textdomain}}' ), $label ),
				'fields'          => $fields,
				'location'        => array(
					array(
						array(
							'param'    => 'post_type',
							'operator' => '==',
							'value'    => $post_type,
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

	/**
	 * Get all loaded configurations.
	 *
	 * @since 1.0.0
	 * @return array
	 */
	public static function get_configurations() {
		return self::$configurations;
	}

	/**
	 * Get configuration for a specific post type.
	 *
	 * @since 1.0.0
	 * @param string $slug Post type slug.
	 * @return array|null Configuration array or null if not found.
	 */
	public static function get_configuration( $slug ) {
		return isset( self::$configurations[ $slug ] ) ? self::$configurations[ $slug ] : null;
	}

	/**
	 * Check if configurations are loaded.
	 *
	 * @since 1.0.0
	 * @return bool
	 */
	public static function has_configurations() {
		return ! empty( self::$configurations );
	}

	/**
	 * Get post type labels from configuration.
	 *
	 * @since 1.0.0
	 * @param array $config Post type configuration.
	 * @return array
	 */
	private static function get_post_type_labels( $config ) {
		$singular = isset( $config['label'] ) ? $config['label'] : '';
		$plural   = isset( $config['pluralLabel'] ) ? $config['pluralLabel'] : $singular . 's';

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
	private static function get_taxonomy_labels( $config ) {
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

// Initialize the content model manager
Content_Model_Manager::init();
