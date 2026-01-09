<?php
namespace {{namespace}}\classes;

/**
 * SCF Local JSON Configuration.
 *
 * Configures Secure Custom Fields to use Local JSON for field group
 * storage and loading. This enables version control of field groups
 * and improves performance by reducing database queries.
 *
 * @package {{namespace}}
 * @see https://github.com/WordPress/secure-custom-fields/blob/trunk/docs/tutorials/local-json.md
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * SCF Local JSON class.
 *
 * Manages Local JSON save and load paths for SCF field groups.
 *
 * @since 1.0.0
 */
class {{namespace|pascalCase}}_SCF_JSON {

	/**
	 * Local JSON directory path.
	 *
	 * @var string
	 */
	private $json_path;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->json_path = {{namespace|upper}}_PLUGIN_DIR . 'scf-json';

		// Set JSON save location.
		add_filter( 'acf/settings/save_json', array( $this, 'set_save_path' ) );

		// Set JSON load locations.
		add_filter( 'acf/settings/load_json', array( $this, 'add_load_path' ) );

		// Ensure JSON directory exists.
		$this->maybe_create_directory();
	}

	/**
	 * Set the save path for JSON field group exports.
	 *
	 * When field groups are created or modified in the WordPress admin,
	 * SCF will save the JSON export to this directory.
	 *
	 * @param string $path Default save path.
	 * @return string Modified save path.
	 * @since 1.0.0
	 */
	public function set_save_path( $path ) {
		return $this->json_path;
	}

	/**
	 * Add custom load path for JSON field groups.
	 *
	 * SCF will load field groups from all paths in this array.
	 * JSON files take precedence over database entries.
	 *
	 * @param array $paths Existing load paths.
	 * @return array Modified load paths.
	 * @since 1.0.0
	 */
	public function add_load_path( $paths ) {
		// Remove the default path if it exists (optional).
		// unset( $paths[0] );

		// Add our custom path.
		$paths[] = $this->json_path;

		return $paths;
	}

	/**
	 * Create the JSON directory if it doesn't exist.
	 *
	 * @return bool True if directory exists or was created.
	 */
	private function maybe_create_directory() {
		if ( ! is_dir( $this->json_path ) ) {
			return wp_mkdir_p( $this->json_path );
		}

		return true;
	}

	/**
	 * Get the JSON directory path.
	 *
	 * @return string JSON directory path.
	 * @since 1.0.0
	 */
	public function get_json_path() {
		return $this->json_path;
	}

	/**
	 * Get all JSON files in the directory.
	 *
	 * @return array Array of JSON file paths.
	 * @since 1.0.0
	 */
	public function get_json_files() {
		$files = glob( $this->json_path . '/*.json' );

		return $files ? $files : array();
	}

	/**
	 * Validate a JSON file against the schema.
	 *
	 * Basic validation to check required properties exist.
	 * For full schema validation, use a dedicated JSON Schema validator.
	 *
	 * @param string $file_path Path to the JSON file.
	 * @return array{valid: bool, errors: array} Validation result.
	 * @since 1.0.0
	 */
	public function validate_json_file( $file_path ) {
		$result = array(
			'valid'  => true,
			'errors' => array(),
		);

		// Check file exists.
		if ( ! file_exists( $file_path ) ) {
			$result['valid']    = false;
			$result['errors'][] = 'File does not exist.';
			return $result;
		}

		// Read and decode JSON.
		$json_content = file_get_contents( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$data         = json_decode( $json_content, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			$result['valid']    = false;
			$result['errors'][] = 'Invalid JSON: ' . json_last_error_msg();
			return $result;
		}

		// Check required properties.
		$required = array( 'key', 'title', 'fields', 'location' );
		foreach ( $required as $property ) {
			if ( ! isset( $data[ $property ] ) ) {
				$result['valid']    = false;
				$result['errors'][] = sprintf( 'Missing required property: %s', $property );
			}
		}

		// Validate key format.
		if ( isset( $data['key'] ) && strpos( $data['key'], 'group_' ) !== 0 ) {
			$result['valid']    = false;
			$result['errors'][] = 'Field group key must start with "group_".';
		}

		// Validate fields array.
		if ( isset( $data['fields'] ) && ! is_array( $data['fields'] ) ) {
			$result['valid']    = false;
			$result['errors'][] = 'Fields must be an array.';
		}

		// Validate each field has required properties.
		if ( isset( $data['fields'] ) && is_array( $data['fields'] ) ) {
			foreach ( $data['fields'] as $index => $field ) {
				$field_required = array( 'key', 'type' );
				foreach ( $field_required as $prop ) {
					if ( ! isset( $field[ $prop ] ) ) {
						$result['valid']    = false;
						$result['errors'][] = sprintf(
							'Field at index %d is missing required property: %s',
							$index,
							$prop
						);
					}
				}

				// Check field key format (skip tabs, accordions, messages).
				$layout_types = array( 'tab', 'accordion', 'message' );
				if ( isset( $field['key'] ) && ! in_array( $field['type'], $layout_types, true ) ) {
					if ( strpos( $field['key'], 'field_' ) !== 0 ) {
						$result['valid']    = false;
						$result['errors'][] = sprintf(
							'Field "%s" key must start with "field_".',
							isset( $field['label'] ) ? $field['label'] : $field['key']
						);
					}
				}
			}
		}

		return $result;
	}

	/**
	 * Validate all JSON files in the directory.
	 *
	 * @return array Array of validation results keyed by filename.
	 * @since 1.0.0
	 */
	public function validate_all_json_files() {
		$results = array();
		$files   = $this->get_json_files();

		foreach ( $files as $file ) {
			$filename             = basename( $file );
			$results[ $filename ] = $this->validate_json_file( $file );
		}

		return $results;
	}
}
