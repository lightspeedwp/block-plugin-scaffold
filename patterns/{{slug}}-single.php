<?php
/**
 * ExamplePlugin Single Pattern
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'title'       => __( '{{name}} Single', '{{textdomain}}' ),
	'slug'        => '{{slug}}/item-single',
	'description' => __( 'Single item content layout.', '{{textdomain}}' ),
	'categories'  => array( '{{slug}}' ),
	'keywords'    => array(
		__( 'single', '{{textdomain}}' ),
		__( '{{slug}}', '{{textdomain}}' ),
		__( 'post', '{{textdomain}}' ),
	),
	'blockTypes'  => array( 'core/post-content', 'core/group' ),
	'postTypes'   => array( 'item' ),
	'templateTypes' => array( 'single', 'single-{{namespace}}' ),
	'viewportWidth' => 1200,
	'content'     => '<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">\n\t<!-- wp:post-featured-image {"aspectRatio":"21/9"} /-->\n\n\t<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}}},"layout":{"type":"constrained","contentSize":"720px"}} -->\n\t<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40)">\n\t\t<!-- wp:post-title {"level":1} /-->\n\n\t\t<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"{{slug}}/fields","args":{"key":"{{namespace}}_subtitle"}}}},"style":{"typography":{"fontSize":"1.25rem","fontStyle":"italic"},"color":{"text":"#666666"}}} -->\n\t\t<p class="has-text-color" style="color:#666666;font-size:1.25rem;font-style:italic"></p>\n\t\t<!-- /wp:paragraph -->\n\n\t\t<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"},"style":{"spacing":{"blockGap":"var:preset|spacing|20"}}} -->\n\t\t<div class="wp-block-group">\n\t\t\t<!-- wp:post-date /-->\n\t\t\t<!-- wp:post-author {"showAvatar":false} /-->\n\t\t</div>\n\t\t<!-- /wp:group -->\n\n\t\t<!-- wp:post-content {"layout":{"type":"constrained"}} /-->\n\t</div>\n\t<!-- /wp:group -->\n\n\t<!-- wp:pattern {"slug":"{{slug}}/item-meta"} /-->\n</div>\n<!-- /wp:group -->',
);
