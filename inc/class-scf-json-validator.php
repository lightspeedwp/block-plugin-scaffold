<?php
namespace {{namespace}}\classes;

/**
 * SCF JSON Schema Validator.
 *
 * Comprehensive JSON Schema validation for SCF field groups using
 * JSON Schema Draft 7 validation.
 *
 * @package example_plugin
 * @package {{namespace}}
 * @see https://github.com/WordPress/secure-custom-fields/blob/trunk/docs/tutorials/local-json.md
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * SCF JSON Schema Validator class.
 *
 * Validates SCF field group JSON files against the schema.
 *
 * @since 1.0.0
 */
class SCF_JSON_Validator {

	/**
	 * Path to the JSON schema file.
	 *
	 * @var string
	 */
	private $schema_path;

	/**
	 * Decoded schema cache.
	 *
	 * @var array
	 */
	private $schema;

	/**
	 * SCF JSON handler instance.
	 *
	 * @var ExamplePlugin_SCF_JSON
	 */
	private $scf_json;

	/**
	 * Valid field types in SCF.
	 *
	 * @var array
	 */
	private $valid_field_types = array(
		'tab', 'accordion', 'message',
		'text', 'textarea', 'email', 'url', 'password', 'number',
		'wysiwyg', 'oembed',
		'image', 'file', 'gallery',
		'select', 'checkbox', 'radio', 'button_group', 'true_false',
		'link', 'post_object', 'page_link', 'relationship', 'taxonomy', 'user',
		'date_picker', 'date_time_picker', 'time_picker', 'color_picker',
		'group', 'repeater', 'flexible_content',
	);

	/**
	 * Valid location parameters.
	 *
	 * @var array
	 */
	private $valid_location_params = array(
		'post_type', 'post_format', 'post_status', 'post_taxonomy',
		'user_role', 'user_form',
		'taxonomy',
		'attachment_type',
		'page_type',
		'page_parent',
		'page_template',
		'option_page',
		'widget',
	);

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		$this->schema_path = EXAMPLE_PLUGIN_PLUGIN_DIR . 'scf-json/schema/scf-field-group.schema.json';
		$this->schema_path = {{namespace|upper}}_PLUGIN_DIR . 'scf-json/schema/scf-field-group.schema.json';

		if ( class_exists( 'example_plugin\classes\ExamplePlugin_SCF_JSON' ) ) {
			$this->scf_json = new ExamplePlugin_SCF_JSON();
				if ( class_exists( '{{namespace}}\\classes\\{{namespace|pascalCase}}_SCF_JSON' ) ) {
		}

		$this->load_schema();
	}

	/**
	 * Load and cache the JSON schema.
	 *
	 * @return bool True if schema loaded successfully.
	 */
	private function load_schema() {
		if ( ! file_exists( $this->schema_path ) ) {
			return false;
		}

		$schema_json = file_get_contents( $this->schema_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$this->schema = json_decode( $schema_json, true );

		return $this->schema !== null;
	}

	/**
	 * Validate a field group JSON file.
	 *
	 * Comprehensive validation including schema, field types, and structure.
	 *
	 * @param string $file_path Path to JSON file to validate.
	 * @return array{valid: bool, errors: array, warnings: array} Validation result.
	 * @since 1.0.0
	 */
	public function validate( $file_path ) {
		$result = array(
			'valid'    => true,
			'errors'   => array(),
			'warnings' => array(),
		);

		// Check file exists.
		if ( ! file_exists( $file_path ) ) {
			$result['valid']    = false;
			$result['errors'][] = 'File does not exist: ' . $file_path;
			return $result;
		}

		// Read and decode JSON.
		$json_content = file_get_contents( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$field_group  = json_decode( $json_content, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			$result['valid']    = false;
			$result['errors'][] = 'Invalid JSON: ' . json_last_error_msg();
			return $result;
		}

		// Validate root structure.
		$this->validate_root_structure( $field_group, $result );

		if ( ! empty( $result['errors'] ) ) {
			$result['valid'] = false;
			return $result;
		}

		// Validate field group properties.
		$this->validate_field_group_properties( $field_group, $result );

		// Validate fields.
		$this->validate_fields( $field_group, $result );

		// Validate location rules.
		$this->validate_location_rules( $field_group, $result );

		// Validate position and style values.
		$this->validate_display_properties( $field_group, $result );

		$result['valid'] = empty( $result['errors'] );

		return $result;
	}

	/**
	 * Validate root structure of field group.
	 *
	 * @param array $field_group Field group data.
	 * @param array $result      Validation result array (passed by reference).
	 */
	private function validate_root_structure( $field_group, &$result ) {
		$required = array( 'key', 'title', 'fields', 'location' );

		foreach ( $required as $property ) {
			if ( ! isset( $field_group[ $property ] ) ) {
				$result['errors'][] = sprintf( 'Missing required property: %s', $property );
			}
		}

		// Validate key format.
		if ( isset( $field_group['key'] ) ) {
			if ( ! is_string( $field_group['key'] ) ) {
				$result['errors'][] = 'Field group key must be a string';
			} elseif ( strpos( $field_group['key'], 'group_' ) !== 0 ) {
				$result['errors'][] = 'Field group key must start with "group_"';
			}
		}

		// Validate title.
		if ( isset( $field_group['title'] ) && ! is_string( $field_group['title'] ) ) {
			$result['errors'][] = 'Field group title must be a string';
		}

		// Validate fields is array.
		if ( isset( $field_group['fields'] ) && ! is_array( $field_group['fields'] ) ) {
			$result['errors'][] = 'Fields must be an array';
		}

		// Validate location is array.
		if ( isset( $field_group['location'] ) && ! is_array( $field_group['location'] ) ) {
			$result['errors'][] = 'Location must be an array';
		}
	}

	/**
	 * Validate field group display properties.
	 *
	 * @param array $field_group Field group data.
	 * @param array $result      Validation result array (passed by reference).
	 */
	private function validate_field_group_properties( $field_group, &$result ) {
		$valid_positions = array( 'acf_after_title', 'normal', 'side' );
		if ( isset( $field_group['position'] ) && ! in_array( $field_group['position'], $valid_positions, true ) ) {
			$result['errors'][] = sprintf(
				'Invalid position "%s". Must be one of: %s',
				$field_group['position'],
				implode( ', ', $valid_positions )
			);
		}

		$valid_styles = array( 'default', 'seamless' );
		if ( isset( $field_group['style'] ) && ! in_array( $field_group['style'], $valid_styles, true ) ) {
			$result['warnings'][] = sprintf(
				'Invalid style "%s". Should be one of: %s',
				$field_group['style'],
				implode( ', ', $valid_styles )
			);
		}

		$valid_label_placements = array( 'top', 'left' );
		if ( isset( $field_group['label_placement'] ) && ! in_array( $field_group['label_placement'], $valid_label_placements, true ) ) {
			$result['warnings'][] = 'Invalid label_placement value';
		}

		$valid_instruction_placements = array( 'label', 'field' );
		if ( isset( $field_group['instruction_placement'] ) && ! in_array( $field_group['instruction_placement'], $valid_instruction_placements, true ) ) {
			$result['warnings'][] = 'Invalid instruction_placement value';
		}
	}

	/**
	 * Validate fields array.
	 *
	 * @param array $field_group Field group data.
	 * @param array $result      Validation result array (passed by reference).
	 */
	private function validate_fields( $field_group, &$result ) {
		if ( ! isset( $field_group['fields'] ) || ! is_array( $field_group['fields'] ) ) {
			return;
		}

		if ( empty( $field_group['fields'] ) ) {
			$result['warnings'][] = 'Field group has no fields defined';
			return;
		}

		foreach ( $field_group['fields'] as $index => $field ) {
			$this->validate_field( $field, $index, $result );
		}
	}

	/**
	 * Validate individual field.
	 *
	 * @param array $field   Field data.
	 * @param int   $index   Field index.
	 * @param array $result  Validation result array (passed by reference).
	 */
	private function validate_field( $field, $index, &$result ) {
		// Check required properties.
		if ( ! isset( $field['key'] ) ) {
			$result['errors'][] = sprintf( 'Field at index %d missing required property: key', $index );
			return;
		}

		if ( ! isset( $field['type'] ) ) {
			$result['errors'][] = sprintf( 'Field "%s" missing required property: type', $field['key'] );
			return;
		}

		// Validate field type.
		if ( ! in_array( $field['type'], $this->valid_field_types, true ) ) {
			$result['errors'][] = sprintf(
				'Invalid field type "%s" in field "%s"',
				$field['type'],
				$field['key']
			);
		}

		// Validate field key format (skip layout fields).
		$layout_types = array( 'tab', 'accordion', 'message' );
		if ( ! in_array( $field['type'], $layout_types, true ) ) {
			if ( strpos( $field['key'], 'field_' ) !== 0 ) {
				$result['errors'][] = sprintf(
					'Field key "%s" must start with "field_"',
					$field['key']
				);
			}

			// Validate field has name (except layout types).
			if ( ! isset( $field['name'] ) || empty( $field['name'] ) ) {
				$result['warnings'][] = sprintf(
					'Field "%s" should have a name for database storage',
					$field['key']
				);
			}
		}

		// Validate sub_fields for container types.
		$container_types = array( 'group', 'repeater', 'flexible_content' );
		if ( in_array( $field['type'], $container_types, true ) ) {
			if ( ! isset( $field['sub_fields'] ) || ! is_array( $field['sub_fields'] ) ) {
				$result['errors'][] = sprintf(
					'Field "%s" of type "%s" must have sub_fields array',
					$field['key'],
					$field['type']
				);
			}
		}

		// Validate flexible_content layouts.
		if ( 'flexible_content' === $field['type'] ) {
			if ( ! isset( $field['layouts'] ) || ! is_array( $field['layouts'] ) ) {
				$result['errors'][] = sprintf(
					'Flexible content field "%s" must have layouts array',
					$field['key']
				);
			}
		}
	}

	/**
	 * Validate location rules.
	 *
	 * @param array $field_group Field group data.
	 * @param array $result      Validation result array (passed by reference).
	 */
	private function validate_location_rules( $field_group, &$result ) {
		if ( ! isset( $field_group['location'] ) || ! is_array( $field_group['location'] ) ) {
			return;
		}

		if ( empty( $field_group['location'] ) ) {
			$result['warnings'][] = 'Field group has no location rules defined';
			return;
		}

		foreach ( $field_group['location'] as $group_index => $group ) {
			if ( ! is_array( $group ) ) {
				$result['errors'][] = sprintf(
					'Location group %d must be an array',
					$group_index
				);
				continue;
			}

			foreach ( $group as $rule_index => $rule ) {
				$this->validate_location_rule( $rule, $group_index, $rule_index, $result );
			}
		}
	}

	/**
	 * Validate individual location rule.
	 *
	 * @param array $rule         Location rule.
	 * @param int   $group_index  Location group index.
	 * @param int   $rule_index   Rule index within group.
	 * @param array $result       Validation result array (passed by reference).
	 */
	private function validate_location_rule( $rule, $group_index, $rule_index, &$result ) {
		if ( ! isset( $rule['param'] ) ) {
			$result['errors'][] = sprintf(
				'Location rule [%d][%d] missing param',
				$group_index,
				$rule_index
			);
			return;
		}

		if ( ! in_array( $rule['param'], $this->valid_location_params, true ) ) {
			$result['warnings'][] = sprintf(
				'Location param "%s" may not be valid in [%d][%d]',
				$rule['param'],
				$group_index,
				$rule_index
			);
		}

		if ( ! isset( $rule['operator'] ) ) {
			$result['errors'][] = sprintf(
				'Location rule [%d][%d] missing operator',
				$group_index,
				$rule_index
			);
		}

		if ( ! isset( $rule['value'] ) ) {
			$result['errors'][] = sprintf(
				'Location rule [%d][%d] missing value',
				$group_index,
				$rule_index
			);
		}
	}

	/**
	 * Validate display properties (placeholder for future expansion).
	 *
	 * @param array $field_group Field group data.
	 * @param array $result      Validation result array (passed by reference).
	 */
	private function validate_display_properties( $field_group, &$result ) {
		// Validate hide_on_screen array contains valid values.
		if ( isset( $field_group['hide_on_screen'] ) && is_array( $field_group['hide_on_screen'] ) ) {
			$valid_hide_values = array(
				'permalink', 'the_content', 'excerpt', 'discussion', 'comments',
				'revisions', 'slug', 'author', 'format', 'page_attributes',
				'featured_image', 'categories', 'tags', 'send-trackbacks',
			);

			foreach ( $field_group['hide_on_screen'] as $hide_value ) {
				if ( ! in_array( $hide_value, $valid_hide_values, true ) ) {
					$result['warnings'][] = sprintf(
						'Unknown hide_on_screen value: %s',
						$hide_value
					);
				}
			}
		}
	}

	/**
	 * Validate all JSON files in SCF JSON directory.
	 *
	 * @return array Array of validation results keyed by filename.
	 * @since 1.0.0
	 */
	public function validate_all_files() {
		$results = array();

		if ( ! $this->scf_json ) {
			return $results;
		}

		$files = $this->scf_json->get_json_files();

		foreach ( $files as $file_path ) {
			$filename = basename( $file_path );
			$results[ $filename ] = $this->validate( $file_path );
		}

		return $results;
	}

	/**
	 * Get schema information.
	 *
	 * @return array|null Schema array or null if not loaded.
	 * @since 1.0.0
	 */
	public function get_schema() {
		return $this->schema;
	}

	/**
	 * Check if schema is loaded.
	 *
	 * @return bool True if schema is available.
	 * @since 1.0.0
	 */
	public function has_schema() {
		return ! empty( $this->schema );
	}
}
