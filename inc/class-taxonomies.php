<?php
namespace {{namespace}}\classes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Custom Taxonomy Registration.
 *
 * Taxonomies are now registered via JSON files in /post-types/
 * and handled by Content_Model_Manager.
 *
 * This class is kept for the TAXONOMY constant used throughout the plugin.
 *
 * @package {{namespace}}
 * @since 1.0.0
 */

/**
 * Taxonomies class.
 */
class Taxonomies {

	/**
	 * Taxonomy slug.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const TAXONOMY = '{{taxonomy_slug}}';

}
