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
	function {{namespace}}_render_{{snakeCase.cpt_slug}}_collection( $attributes, $content, $block ) {
		// Output markup for the CPT1 collection block.
		return '<div class="wp-block-{{slug}}-{{kebabCase.cpt_slug}}-collection">' .
			'<p>' . esc_html__( 'CPT1 collection block output.', '{{textdomain}}' ) . '</p>' .
		'</div>';
	}
}
