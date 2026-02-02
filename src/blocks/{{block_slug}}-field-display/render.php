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
		$icon_type     = isset( $attributes['iconType'] ) ? sanitize_key( $attributes['iconType'] ) : 'outline';
		$icon_name     = isset( $attributes['iconName'] ) ? preg_replace( '/[^a-zA-Z0-9]/', '', $attributes['iconName'] ) : '';

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
		$wrapper_classes = array( 'wp-block-{{slug}}-{{block_slug}}-field-display', 'wp-block-group', 'is-layout-flex', 'is-nowrap' );
		if ( ! empty( $attributes['className'] ) ) {
			$wrapper_classes[] = esc_attr( $attributes['className'] );
		}
		if ( ! empty( $attributes['align'] ) ) {
			$wrapper_classes[] = 'align' . esc_attr( $attributes['align'] );
		}

		// Start building the output.
		$output = sprintf(
			'<div class="%s" style="flex-wrap: nowrap; vertical-align: top;">',
			esc_attr( implode( ' ', $wrapper_classes ) )
		);

		// Add icon block if icon is selected.
		if ( ! empty( $icon_name ) && function_exists( '{{namespace|snakeCase}}_get_icon_svg' ) ) {
			$svg_content = {{namespace|snakeCase}}_get_icon_svg( $icon_type, $icon_name );
			if ( ! empty( $svg_content ) ) {
				$output .= sprintf(
					'<div class="wp-block-group is-layout-flex" style="flex-wrap: nowrap; vertical-align: middle;">
						<span class="block-icon-svg" style="font-size: inherit; display: inline-block;">%s</span>
					</div>',
					$svg_content // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- SVG content is sanitized in {{namespace|snakeCase}}_get_icon_svg().
				);
			}
		}

		// Add paragraph block with prefix and field value.
		$output .= sprintf(
			'<div class="wp-block-group is-layout-flex" style="flex-wrap: nowrap;">
				<p class="field-display-value">%s%s</p>
			</div>',
			$prefix_html,
			esc_html( $field_value )
		);

		// Close wrapper.
		$output .= '</div>';

		return $output;
	}
}
