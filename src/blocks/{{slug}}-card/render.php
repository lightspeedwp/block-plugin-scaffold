<?php
/**
 * Example Plugin Card Block - Server-side Render
 *
 * @package {{namespace}}
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$post_id = $block->context['postId'] ?? get_the_ID();

if ( ! $post_id ) {
	return;
}

$post = get_post( $post_id );

if ( ! $post ) {
	return;
}

$display_featured_image = $attributes['displayFeaturedImage'] ?? true;
$display_title          = $attributes['displayTitle'] ?? true;
$display_excerpt        = $attributes['displayExcerpt'] ?? true;
$display_meta           = $attributes['displayMeta'] ?? true;
$display_subtitle       = $attributes['displaySubtitle'] ?? true;
$link_to_post           = $attributes['linkToPost'] ?? true;

$subtitle = '';
if ( function_exists( 'get_field' ) ) {
	$subtitle = get_field( '{{namespace}}_subtitle', $post_id );
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'wp-block-{{namespace}}-{{cpt_slug}}-card',
	)
);

$permalink = get_permalink( $post );
?>

<article <?php echo $wrapper_attributes; ?>>
	<?php if ( $display_featured_image && has_post_thumbnail( $post_id ) ) : ?>
		<div class="wp-block-{{namespace}}-{{cpt_slug}}-card__image">
			<?php if ( $link_to_post ) : ?>
				<a href="<?php echo esc_url( $permalink ); ?>">
					<?php echo get_the_post_thumbnail( $post_id, 'medium_large' ); ?>
				</a>
			<?php else : ?>
				<?php echo get_the_post_thumbnail( $post_id, 'medium_large' ); ?>
			<?php endif; ?>
		</div>
	<?php endif; ?>

	<div class="wp-block-{{namespace}}-{{cpt_slug}}-card__content">
		<?php if ( $display_title ) : ?>
			<h3 class="wp-block-{{namespace}}-{{cpt_slug}}-card__title">
				<?php if ( $link_to_post ) : ?>
					<a href="<?php echo esc_url( $permalink ); ?>">
						<?php echo esc_html( get_the_title( $post ) ); ?>
					</a>
				<?php else : ?>
					<?php echo esc_html( get_the_title( $post ) ); ?>
				<?php endif; ?>
			</h3>
		<?php endif; ?>

		<?php if ( $display_subtitle && $subtitle ) : ?>
			<p class="wp-block-{{namespace}}-{{cpt_slug}}-card__subtitle">
				<?php echo esc_html( $subtitle ); ?>
			</p>
		<?php endif; ?>

		<?php if ( $display_excerpt ) : ?>
			<div class="wp-block-{{namespace}}-{{cpt_slug}}-card__excerpt">
				<?php echo wp_kses_post( get_the_excerpt( $post ) ); ?>
			</div>
		<?php endif; ?>

		<?php if ( $display_meta ) : ?>
			<div class="wp-block-{{namespace}}-{{cpt_slug}}-card__meta">
				<time class="wp-block-{{namespace}}-{{cpt_slug}}-card__date" datetime="<?php echo esc_attr( get_the_date( 'c', $post ) ); ?>">
					<?php echo esc_html( get_the_date( '', $post ) ); ?>
				</time>
			</div>
		<?php endif; ?>
	</div>
</article>
// ...existing code from render.php for card block...
