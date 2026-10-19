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
	/**
	 * Render the slider block.
	 *
	 * @param array    $attributes Block attributes.
	 * @param string   $content    Block content.
	 * @param WP_Block $block      Block instance.
	 * @return string Rendered block HTML.
	 */
	function {{namespace}}_render_slider( $attributes, $content, $block ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Render callback signature.
		// Output markup for the slider block.
		return '<div class="wp-block-{{slug}}-slider">' .
			'<p>' . esc_html__( 'Slider block output.', '{{textdomain}}' ) . '</p>' .
		'</div>';
	}
}

// $attributes, $content and $block are provided by WordPress when it includes this file.
echo {{namespace}}_render_slider( $attributes, $content, $block ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped inside the render function.
