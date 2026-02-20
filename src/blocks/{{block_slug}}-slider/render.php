<?php
/**
 * Render callback for the {{block_slug}}-slider block.
 *
 * @package {{namespace}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( '{{namespace}}_render_{{block_slug|snakeCase}}_slider' ) ) {
	function {{namespace}}_render_{{block_slug|snakeCase}}_slider( $attributes, $content, $block ) {
		// Output markup for the slider block.
		return '<div class="wp-block-{{namespace}}-{{block_slug}}-slider">' .
			'<p>' . esc_html__( 'Slider block output.', '{{textdomain}}' ) . '</p>' .
		'</div>';
	}
}
