<?php
/**
 * Render callback for the {{kebabCase.cpt_slug}}-collection block.
 *
 * @package {{namespace}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( '{{namespace}}_render_{{snakeCase.cpt_slug}}_collection' ) ) {
	/**
	 * Render the {{kebabCase.cpt_slug}}-collection block.
	 *
	 * @param array    $attributes Block attributes.
	 * @param string   $content    Block content.
	 * @param WP_Block $block      Block instance.
	 * @return string Rendered block HTML.
	 */
	function {{namespace}}_render_{{snakeCase.cpt_slug}}_collection( $attributes, $content, $block ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Render callback signature.
		// Output markup for the collection block.
		return '<div class="wp-block-{{slug}}-{{kebabCase.cpt_slug}}-collection">' .
			'<p>' . esc_html__( 'Collection block output.', '{{textdomain}}' ) . '</p>' .
		'</div>';
	}
}

// $attributes, $content and $block are provided by WordPress when it includes this file.
echo {{namespace}}_render_{{snakeCase.cpt_slug}}_collection( $attributes, $content, $block ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped inside the render function.
