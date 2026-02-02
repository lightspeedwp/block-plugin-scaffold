<?php
/**
 * Render callback for the {{block_slug}}-field-display block.
 *
 * @package {{namespace}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( '{{namespace}}_render_{{block_slug|snakeCase}}_field_display' ) ) {
	/**
	 * Render the field display block.
	 *
	 * @param array    $attributes Block attributes.
	 * @param string   $content    Block content.
	 * @param WP_Block $block      Block instance.
	 * @return string Rendered block HTML.
	 */
	function {{namespace}}_render_{{block_slug|snakeCase}}_field_display( $attributes, $content, $block ) {
		// Get post ID from context or current post.
		$post_id = isset( $block->context['postId'] ) ? (int) $block->context['postId'] : get_the_ID();
		
		if ( ! $post_id ) {
			return '';
		}

		// Get attributes.
		$field_key     = isset( $attributes['fieldKey'] ) ? $attributes['fieldKey'] : '';
		$prefix        = isset( $attributes['prefix'] ) ? $attributes['prefix'] : '';
		$prefix_bold   = isset( $attributes['prefixBold'] ) ? (bool) $attributes['prefixBold'] : false;
		$fallback_text = isset( $attributes['fallbackText'] ) ? $attributes['fallbackText'] : '';

		if ( empty( $field_key ) ) {
			return '';
		}

		// Get the field value.
		$field_value = get_post_meta( $post_id, $field_key, true );

		// Use fallback if empty.
		if ( empty( $field_value ) ) {
			$field_value = $fallback_text;
		}

		// If still empty, return nothing.
		if ( empty( $field_value ) ) {
			return '';
		}

		// Handle array values.
		if ( is_array( $field_value ) ) {
			$field_value = implode( ', ', array_filter( $field_value ) );
		}

		// Build prefix.
		$prefix_html = '';
		if ( ! empty( $prefix ) ) {
			$prefix_text = esc_html( trim( $prefix ) );
			
			// Add space if needed.
			if ( ! preg_match( '/[\s\p{P}]$/u', $prefix_text ) ) {
				$prefix_text .= ' ';
			}
			
			if ( $prefix_bold ) {
				$prefix_html = '<strong>' . $prefix_text . '</strong>';
			} else {
				$prefix_html = $prefix_text;
			}
		}

		// Build wrapper classes.
		$wrapper_classes = array( 'wp-block-{{slug}}-{{block_slug}}-field-display' );
		if ( ! empty( $attributes['className'] ) ) {
			$wrapper_classes[] = esc_attr( $attributes['className'] );
		}
		if ( ! empty( $attributes['align'] ) ) {
			$wrapper_classes[] = 'align' . esc_attr( $attributes['align'] );
		}

		// Build output.
		$output = sprintf(
			'<div class="%s"><p class="field-display-value">%s%s</p></div>',
			esc_attr( implode( ' ', $wrapper_classes ) ),
			$prefix_html,
			esc_html( $field_value )
		);

		return $output;
	}
}
