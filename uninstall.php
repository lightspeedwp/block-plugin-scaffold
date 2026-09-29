<?php
/**
 * {{name}} Uninstall
 *
 * Fired when the plugin is uninstalled to remove the plugin's own settings.
 *
 * Content is deliberately kept: posts, terms and their meta belong to the
 * site, not the plugin, and remain in place if the plugin is reinstalled.
 *
 * @package {{namespace}}
 */

// If uninstall not called from WordPress, exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

// Prefix shared by every option, transient and cron hook the plugin creates.
$option_prefix = '{{namespace}}_';

// Never run unscoped: an empty prefix would match unrelated site data.
if ( '_' === $option_prefix ) {
	return;
}

/**
 * Delete plugin options, including SCF options page values
 * (options_{prefix}* and their _options_{prefix}* field references).
 */
// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s",
		$wpdb->esc_like( $option_prefix ) . '%',
		$wpdb->esc_like( 'options_' . $option_prefix ) . '%',
		$wpdb->esc_like( '_options_' . $option_prefix ) . '%'
	)
);

/**
 * Delete transients.
 */
// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching
$wpdb->query(
	$wpdb->prepare(
		"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s",
		$wpdb->esc_like( '_transient_' . $option_prefix ) . '%',
		$wpdb->esc_like( '_transient_timeout_' . $option_prefix ) . '%',
		$wpdb->esc_like( '_site_transient_' . $option_prefix ) . '%',
		$wpdb->esc_like( '_site_transient_timeout_' . $option_prefix ) . '%'
	)
);

/**
 * Clear scheduled cron hooks.
 */
$hooks = array(
	$option_prefix . 'cron',
	$option_prefix . 'daily',
	$option_prefix . 'hourly',
	$option_prefix . 'cleanup',
);

foreach ( $hooks as $hook ) {
	wp_clear_scheduled_hook( $hook );
}

/**
 * Flush rewrite rules so the plugin's post type and taxonomy permalinks
 * are removed.
 */
flush_rewrite_rules();

/**
 * Clear cached copies of the options deleted above.
 */
wp_cache_flush();
