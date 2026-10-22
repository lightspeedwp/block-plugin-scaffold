<?php
/**
 * ExamplePlugin Card Pattern
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
	'title'       => __( '{{name}} Card', '{{textdomain}}' ),
	'slug'        => '{{slug}}/item-card',
	'description' => __( 'A single item card for use in grids and lists.', '{{textdomain}}' ),
	'categories'  => array( '{{slug}}' ),
	'keywords'    => array(
		__( 'card', '{{textdomain}}' ),
		__( '{{slug}}', '{{textdomain}}' ),
		__( 'post', '{{textdomain}}' ),
	),
	'blockTypes'  => array( 'core/post-template', 'core/query' ),
	'postTypes'   => array( 'item' ),
	'viewportWidth' => 400,
	'content'     => '<!-- wp:group {"className":"{{namespace}}-item-card","layout":{"type":"constrained"}} -->\n<div class="wp-block-group {{namespace}}-item-card">\n\t<!-- wp:post-featured-image {"isLink":true,"aspectRatio":"16/9"} /-->\n\n\t<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|20","bottom":"var:preset|spacing|20","left":"var:preset|spacing|20","right":"var:preset|spacing|20"}}},"layout":{"type":"constrained"}} -->\n\t<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--20);padding-right:var(--wp--preset--spacing--20);padding-bottom:var(--wp--preset--spacing--20);padding-left:var(--wp--preset--spacing--20)">\n\t\t<!-- wp:post-title {"level":3,"isLink":true,"style":{"typography":{"fontSize":"1.25rem"}}} /-->\n\n\t\t<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"{{slug}}/fields","args":{"key":"{{namespace}}_subtitle"}}}},"style":{"typography":{"fontStyle":"italic"},"color":{"text":"#666666"}}} -->\n\t\t<p class="has-text-color" style="color:#666666;font-style:italic"></p>\n\t\t<!-- /wp:paragraph -->\n\n\t\t<!-- wp:post-excerpt {"moreText":"","excerptLength":20} /-->\n\n\t\t<!-- wp:post-date {"style":{"typography":{"fontSize":"0.875rem"},"color":{"text":"#888888"}}} /-->\n\t</div>\n\t<!-- /wp:group -->\n</div>\n<!-- /wp:group -->',
);
