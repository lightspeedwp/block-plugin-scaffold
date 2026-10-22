<?php
/**
 * {{name}} Slider Pattern
 *
 * @package {{namespace}}
 * @since {{version}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'title'       => __( '{{name}} Slider', '{{textdomain}}' ),
	'slug'        => '{{slug}}/item-slider',
	'description' => __( 'A slider/carousel of items.', '{{textdomain}}' ),
	'categories'  => array( '{{slug}}' ),
	'keywords'    => array(
		__( 'slider', '{{textdomain}}' ),
		__( '{{slug}}', '{{textdomain}}' ),
		__( 'carousel', '{{textdomain}}' ),
	),
	'blockTypes'  => array( 'core/group', 'core/query' ),
	'postTypes'   => array( '{{cpt_slug}}' ),
	'viewportWidth' => 1200,
	'content'     => '<!-- wp:{{slug}}/slider {"source":"posts","autoplay":true,"autoplaySpeed":5000,"showDots":true,"showArrows":true} /-->',
);
