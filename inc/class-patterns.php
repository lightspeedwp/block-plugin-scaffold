<?php
namespace {{namespace}}\classes;

/**
 * Block Patterns Registration.
 *
 * @package {{namespace}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Patterns class.
 *
 * @since 1.0.0
 */
class Patterns {

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_pattern_category' ) );
		add_action( 'init', array( $this, 'register_patterns' ) );
	}

	/**
	 * Register pattern category.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_pattern_category() {
		register_block_pattern_category(
			'{{slug}}',
			array(
				'label' => __( '{{name}}', '{{textdomain}}' ),
			)
		);
	}

	/**
	 * Register patterns from patterns directory.
	 *
	 * Patterns return associative arrays with properties:
	 * - slug: Pattern identifier (required)
	 * - title: Display name (required)
	 * - description: Pattern description
	 * - categories: Array of category slugs
	 * - keywords: Array of search terms
	 * - viewportWidth: Preview width in pixels
	 * - blockTypes: Array of applicable block types
	 * - postTypes: Array of applicable post types
	 * - content: Block markup HTML (required)
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_patterns() {
		$patterns_dir = {{namespace|upper}}_PLUGIN_DIR . 'patterns/';

		if ( ! is_dir( $patterns_dir ) ) {
			return;
		}

		$pattern_files = glob( $patterns_dir . '*.php' );

		foreach ( $pattern_files as $pattern_file ) {
			$pattern = require $pattern_file;

			// Skip if pattern doesn't return an array.
			if ( ! is_array( $pattern ) ) {
				continue;
			}

			// Extract pattern slug from array or derive from filename.
			$slug = $pattern['slug'] ?? $this->get_pattern_slug_from_file( $pattern_file );

			// Skip if no slug available.
			if ( empty( $slug ) ) {
				continue;
			}

			// Register the pattern with WordPress.
			register_block_pattern( $slug, $pattern );
		}
	}

	/**
	 * Derive pattern slug from filename.
	 *
	 * Converts 'patterns/{{slug}}-tour-card.php' to '{{slug}}/tour-card'
	 *
	 * @since 1.0.0
	 * @param string $pattern_file Full path to pattern file.
	 * @return string Pattern slug.
	 */
	private function get_pattern_slug_from_file( $pattern_file ) {
		$filename = basename( $pattern_file, '.php' );

		// Remove '{{slug}}-' prefix if present, preserving post type and pattern purpose.
		if ( strpos( $filename, '{{slug}}-' ) === 0 ) {
			$pattern_name = substr( $filename, strlen( '{{slug}}-' ) );
		} else {
			$pattern_name = $filename;
		}

		// Return namespaced slug in the format '{{slug}}/{post_type}-{pattern}'.
		return '{{slug}}/' . $pattern_name;
	}
}
