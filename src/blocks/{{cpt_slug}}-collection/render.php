<?php
/**
 * Render callback for the {{cpt_slug}}-collection block.
 *
 * @package {{namespace}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function {{namespace}}_render_{{cpt_slug}}_collection( $attributes, $content, $block ) {
	// Output markup for the CPT1 collection block.
	return '<div class="wp-block-{{namespace}}-{{cpt_slug}}-collection">' .
		'<p>' . esc_html__( 'CPT1 collection block output.', '{{textdomain}}' ) . '</p>' .
	'</div>';
}
