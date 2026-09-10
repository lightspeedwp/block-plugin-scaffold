<?php
namespace {{namespace}}\classes;

/**
 * Repeater and Flexible Content Fields using Secure Custom Fields.
 *
 * @package {{namespace}}
 * @see https://wordpress.org/plugins/secure-custom-fields/
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Repeater Fields class.
 *
 * @since 1.0.0
 */
class Repeater_Fields {

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		add_action( 'acf/init', array( $this, 'register_repeater_fields' ) );
	}

	/**
	 * Register repeater field groups.
	 *
	 * @return void
	 * @since 1.0.0
	 */
	public function register_repeater_fields() {
		if ( ! function_exists( 'acf_add_local_field_group' ) ) {
			return;
		}

		// Slider/Gallery Repeater Field Group.
		acf_add_local_field_group(
			array(
				'key'      => 'group_{{namespace}}_slider',
				'title'    => __( 'Item Slider', '{{textdomain}}' ),
				'fields'   => array(
					array(
						'key'          => 'field_{{namespace}}_slides',
						'label'        => __( 'Slides', '{{textdomain}}' ),
						'name'         => '{{namespace}}_slides',
						'type'         => 'repeater',
						'instructions' => __( 'Add slides to the slider.', '{{textdomain}}' ),
						'min'          => 0,
						'max'          => 20,
						'layout'       => 'block',
						'button_label' => __( 'Add Slide', '{{textdomain}}' ),
						'sub_fields'   => array(
							array(
								'key'           => 'field_{{namespace}}_slide_image',
								'label'         => __( 'Image', '{{textdomain}}' ),
								'name'          => 'image',
								'type'          => 'image',
								'return_format' => 'array',
								'preview_size'  => 'medium',
								'library'       => 'all',
							),
							array(
								'key'   => 'field_{{namespace}}_slide_title',
								'label' => __( 'Title', '{{textdomain}}' ),
								'name'  => 'title',
								'type'  => 'text',
							),
							array(
								'key'   => 'field_{{namespace}}_slide_caption',
								'label' => __( 'Caption', '{{textdomain}}' ),
								'name'  => 'caption',
								'type'  => 'textarea',
								'rows'  => 2,
							),
							array(
								'key'   => 'field_{{namespace}}_slide_link',
								'label' => __( 'Link', '{{textdomain}}' ),
								'name'  => 'link',
								'type'  => 'link',
							),
						),
					),
				),
				'location' => array(
					array(
						array(
							'param'    => 'post_type',
							'operator' => '==',
							'value'    => '{{namespace}}',
						),
					),
				),
			)
		);

		// Flexible Content Field Group for sections.
		acf_add_local_field_group(
			array(
				'key'      => 'group_{{namespace}}_sections',
				'title'    => __( 'Item Sections', '{{textdomain}}' ),
				'fields'   => array(
					array(
						'key'          => 'field_{{namespace}}_sections',
						'label'        => __( 'Content Sections', '{{textdomain}}' ),
						'name'         => '{{namespace}}_sections',
						'type'         => 'flexible_content',
						'instructions' => __( 'Add content sections.', '{{textdomain}}' ),
						'button_label' => __( 'Add Section', '{{textdomain}}' ),
						'layouts'      => array(
							'layout_text'    => array(
								'key'        => 'layout_{{namespace}}_text',
								'name'       => 'text_section',
								'label'      => __( 'Text Section', '{{textdomain}}' ),
								'sub_fields' => array(
									array(
										'key'   => 'field_{{namespace}}_section_heading',
										'label' => __( 'Heading', '{{textdomain}}' ),
										'name'  => 'heading',
										'type'  => 'text',
									),
									array(
										'key'   => 'field_{{namespace}}_section_content',
										'label' => __( 'Content', '{{textdomain}}' ),
										'name'  => 'content',
										'type'  => 'wysiwyg',
									),
								),
							),
							'layout_gallery' => array(
								'key'        => 'layout_{{namespace}}_gallery',
								'name'       => 'gallery_section',
								'label'      => __( 'Gallery Section', '{{textdomain}}' ),
								'sub_fields' => array(
									array(
										'key'           => 'field_{{namespace}}_section_gallery',
										'label'         => __( 'Gallery', '{{textdomain}}' ),
										'name'          => 'gallery',
										'type'          => 'gallery',
										'return_format' => 'array',
									),
								),
							),
							'layout_cta'     => array(
								'key'        => 'layout_{{namespace}}_cta',
								'name'       => 'cta_section',
								'label'      => __( 'Call to Action', '{{textdomain}}' ),
								'sub_fields' => array(
									array(
										'key'   => 'field_{{namespace}}_cta_text',
										'label' => __( 'CTA Text', '{{textdomain}}' ),
										'name'  => 'cta_text',
										'type'  => 'text',
									),
									array(
										'key'   => 'field_{{namespace}}_cta_link',
										'label' => __( 'CTA Link', '{{textdomain}}' ),
										'name'  => 'cta_link',
										'type'  => 'link',
									),
								),
							),
						),
					),
				),
				'location' => array(
					array(
						array(
							'param'    => 'post_type',
							'operator' => '==',
							'value'    => '{{namespace}}',
						),
					),
				),
			)
		);
	}
}
