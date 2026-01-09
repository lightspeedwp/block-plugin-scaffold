<?php
namespace {{namespace}}\classes;

/**
 * Block Style Variations Registration.
 *
 * @package {{namespace}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Block style variations (including section-style like presets).
 *
 * @since 1.0.0
 */
class Block_Styles {

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_block_styles' ) );
	}

	/**
	 * Register block style variations.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_block_styles() {
		if ( ! function_exists( 'register_block_style' ) ) {
			return;
		}

		$style_files = $this->get_style_files();

		foreach ( $style_files as $file_path ) {
			$definitions = $this->load_style_definitions( $file_path );

			foreach ( $definitions as $definition ) {
				$this->register_block_style_definition( $definition );
			}
		}
	}

	/**
	 * Retrieve all JSON files from the styles directory.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string> Absolute file paths.
	 */
	private function get_style_files() {
		$directory = {{namespace|upper}}_PLUGIN_DIR . 'styles';

		if ( ! is_dir( $directory ) ) {
			return array();
		}

		$files = array();
		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $directory, \FilesystemIterator::SKIP_DOTS )
		);

		foreach ( $iterator as $file ) {
			if ( 'json' !== strtolower( $file->getExtension() ) ) {
				continue;
			}

			$files[] = $file->getPathname();
		}

		return $files;
	}

	/**
	 * Load style definitions from a JSON file.
	 *
	 * Supports files containing a single definition, a `styles` array, or a list of definitions.
	 *
	 * @param string $file_path JSON file path.
	 * @return array<int,array<mixed>> List of style definitions.
	 */
	private function load_style_definitions( $file_path ) {
		$content = file_get_contents( $file_path );

		if ( false === $content ) {
			return array();
		}

		$data = json_decode( $content, true );

		if ( ! is_array( $data ) || empty( $data ) ) {
			return array();
		}

		if ( isset( $data['styles'] ) && is_array( $data['styles'] ) ) {
			return $data['styles'];
		}

		if ( array_keys( $data ) === range( 0, count( $data ) - 1 ) ) {
			return $data;
		}

		return array( $data );
	}

	/**
	 * Register a single block style definition.
	 *
	 * @param array<mixed> $definition Style definition parsed from JSON.
	 * @return void
	 */
	private function register_block_style_definition( $definition ) {
		if ( empty( $definition['blocks'] ) ) {
			return;
		}

		if ( isset( $definition['scope'] ) && 'block' !== $definition['scope'] ) {
			return;
		}

		$blocks = is_array( $definition['blocks'] ) ? $definition['blocks'] : array( $definition['blocks'] );
		$blocks = array_filter( array_map( 'strval', $blocks ) );

		if ( empty( $blocks ) ) {
			return;
		}

		$name  = isset( $definition['name'] ) ? $definition['name'] : '';
		$label = isset( $definition['label'] ) ? $definition['label'] : '';

		if ( empty( $name ) || empty( $label ) ) {
			return;
		}

		$args = array(
			'name'  => $name,
			'label' => __( $label, '{{textdomain}}' ),
		);

		if ( ! empty( $definition['class_name'] ) ) {
			$args['class_name'] = $definition['class_name'];
		}

		if ( isset( $definition['style_data'] ) && is_array( $definition['style_data'] ) ) {
			$args['style_data'] = $definition['style_data'];
		}

		if ( isset( $definition['style_handle'] ) && is_string( $definition['style_handle'] ) ) {
			$args['style_handle'] = $definition['style_handle'];
		}

		register_block_style( $blocks, $args );
	}
}
