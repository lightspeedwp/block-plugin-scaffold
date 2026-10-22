<?php
/**
 * Render callback for the {{cpt_slug|kebabCase}}-collection block.
 *
 * @package {{namespace}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( '{{namespace}}_render_{{cpt_slug|snakeCase}}_collection' ) ) {
	function {{namespace}}_render_{{cpt_slug|snakeCase}}_collection( $attributes, $content, $block ) {
		// Output markup for the CPT1 collection block.
		return '<div class="wp-block-{{slug}}-{{cpt_slug|kebabCase}}-collection">' .
			'<p>' . esc_html__( 'CPT1 collection block output.', '{{textdomain}}' ) . '</p>' .
		'</div>';
	}
}
