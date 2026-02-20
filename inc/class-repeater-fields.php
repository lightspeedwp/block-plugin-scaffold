<?php
namespace {{namespace}}\classes;

/**
 * Repeater and Flexible Content Fields using Secure Custom Fields.
 *
 * @package example_plugin
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
							'value'    => 'example-plugin',
						),
					),
				),
			)
		);

		// Flexible Content Field Group for sections.
		acf_add_local_field_group(
			array(
				'key'      => 'group_example_plugin_sections',
				'title'    => __( 'Item Sections', 'example-plugin' ),
				'fields'   => array(
					array(
						'key'          => 'field_example_plugin_sections',
						'label'        => __( 'Content Sections', 'example-plugin' ),
						'name'         => 'example_plugin_sections',
						'type'         => 'flexible_content',
						'instructions' => __( 'Add content sections.', 'example-plugin' ),
						'button_label' => __( 'Add Section', 'example-plugin' ),
						'layouts'      => array(
							'layout_text'    => array(
								'key'        => 'layout_example_plugin_text',
								'name'       => 'text_section',
								'label'      => __( 'Text Section', 'example-plugin' ),
								'sub_fields' => array(
									array(
										'key'   => 'field_example_plugin_section_heading',
										'label' => __( 'Heading', 'example-plugin' ),
										'name'  => 'heading',
										'type'  => 'text',
									),
									array(
										'key'   => 'field_example_plugin_section_content',
										'label' => __( 'Content', 'example-plugin' ),
										'name'  => 'content',
										'type'  => 'wysiwyg',
									),
								),
							),
							'layout_gallery' => array(
								'key'        => 'layout_example_plugin_gallery',
								'name'       => 'gallery_section',
								'label'      => __( 'Gallery Section', 'example-plugin' ),
								'sub_fields' => array(
									array(
										'key'           => 'field_example_plugin_section_gallery',
										'label'         => __( 'Gallery', 'example-plugin' ),
										'name'          => 'gallery',
										'type'          => 'gallery',
										'return_format' => 'array',
									),
								),
							),
							'layout_cta'     => array(
								'key'        => 'layout_example_plugin_cta',
								'name'       => 'cta_section',
								'label'      => __( 'Call to Action', 'example-plugin' ),
								'sub_fields' => array(
									array(
										'key'   => 'field_example_plugin_cta_text',
										'label' => __( 'CTA Text', 'example-plugin' ),
										'name'  => 'cta_text',
										'type'  => 'text',
									),
									array(
										'key'   => 'field_example_plugin_cta_link',
										'label' => __( 'CTA Link', 'example-plugin' ),
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
							'value'    => 'example-plugin',
						),
					),
				),
			)
		);
	}
}
