<?php
/**
 * Render callback for the slider block.
 *
 * @package {{namespace}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( '{{namespace}}_render_slider' ) ) {
	function {{namespace}}_render_slider( $attributes, $content, $block ) {
		// Output markup for the slider block.
		return '<div class="wp-block-{{slug}}-slider">' .
			'<p>' . esc_html__( 'Slider block output.', '{{textdomain}}' ) . '</p>' .
		'</div>';
	}
}
