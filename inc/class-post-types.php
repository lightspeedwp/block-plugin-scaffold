<?php
namespace {{namespace}}\classes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Custom Post Type Registration.
 *
 * Post types are now registered via JSON files in /post-types/
 * and handled by Content_Model_Manager.
 *
 * This class is kept for the POST_TYPE constant used throughout the plugin.
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

/**
 * Post Types class.
 */
class Post_Types {

	/**
	 * Post type slug.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const POST_TYPE = '{{cpt_slug}}';

}
