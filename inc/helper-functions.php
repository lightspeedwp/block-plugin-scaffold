<?php
/**
 * Helper Functions
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get SVG icon content from the icons library.
 *
 * Retrieves an SVG icon from the plugin's icons block source directory.
 * The SVG is sanitized using wp_kses with allowed SVG elements and attributes.
 *
 * @since 1.0.0
 *
 * @param string $icon_type The icon type/category (e.g., 'outline', 'solid').
 * @param string $icon_name The icon name in camelCase format (e.g., 'priceIcon').
 * @return string The sanitized SVG content, or empty string if not found.
 */
function {{namespace|snakeCase}}_get_icon_svg( $icon_type = 'outline', $icon_name = '' ) {
	if ( empty( $icon_name ) ) {
		return '';
	}

	// Convert camelCase icon name to kebab-case file name.
	$file_name = strtolower( preg_replace( '/([a-z])([A-Z])/', '$1-$2', $icon_name ) );

	// Build the path to the SVG file.
	$svg_path = {{constantPrefix}}_DIR . 'src/blocks/icons/source-icons/' . $icon_type . '/' . $file_name . '.svg';

	// Check if the file exists.
	if ( ! file_exists( $svg_path ) ) {
		return '';
	}

	// Get the SVG content.
	$svg_content = file_get_contents( $svg_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

	if ( empty( $svg_content ) ) {
		return '';
	}

	// Sanitize the SVG content.
	$allowed_svg_tags = array(
		'svg'      => array(
			'class'           => true,
			'aria-hidden'     => true,
			'aria-labelledby' => true,
			'role'            => true,
			'xmlns'           => true,
			'width'           => true,
			'height'          => true,
			'viewbox'         => true,
			'fill'            => true,
		),
		'g'        => array(
			'fill'      => true,
			'clip-path' => true,
		),
		'title'    => array(
			'title' => true,
		),
		'path'     => array(
			'd'               => true,
			'fill'            => true,
			'stroke'          => true,
			'stroke-width'    => true,
			'stroke-linecap'  => true,
			'stroke-linejoin' => true,
			'fill-rule'       => true,
			'clip-rule'       => true,
		),
		'circle'   => array(
			'cx'     => true,
			'cy'     => true,
			'r'      => true,
			'fill'   => true,
			'stroke' => true,
		),
		'rect'     => array(
			'x'         => true,
			'y'         => true,
			'width'     => true,
			'height'    => true,
			'fill'      => true,
			'stroke'    => true,
			'rx'        => true,
			'ry'        => true,
			'transform' => true,
		),
		'line'     => array(
			'x1'           => true,
			'y1'           => true,
			'x2'           => true,
			'y2'           => true,
			'stroke'       => true,
			'stroke-width' => true,
		),
		'polygon'  => array(
			'points' => true,
			'fill'   => true,
			'stroke' => true,
		),
		'polyline' => array(
			'points' => true,
			'fill'   => true,
			'stroke' => true,
		),
		'defs'     => array(),
		'clippath' => array(
			'id' => true,
		),
	);

	$svg_content = wp_kses( $svg_content, $allowed_svg_tags );

	/**
	 * Filters the SVG icon content.
	 *
	 * @since 1.0.0
	 *
	 * @param string $svg_content The SVG content.
	 * @param string $icon_type   The icon type.
	 * @param string $icon_name   The icon name.
	 */
	return apply_filters( '{{namespace|snakeCase}}_icon_svg', $svg_content, $icon_type, $icon_name );
}
