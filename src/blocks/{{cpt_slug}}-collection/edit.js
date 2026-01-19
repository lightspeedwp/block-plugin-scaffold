/*
 * @file edit.js
 * @description Block editor component for the post type collection block.
 * @todo Add inspector controls, query controls, and accessibility improvements.
 */
/**
 * Example Plugin Post Type Collection Block - Editor Component
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Collection block edit component.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Function to update attributes.
 * @param {Object}   props.context       Block context.
 *
 * @return {Element} Block editor component.
 */
export default function Edit({ attributes, setAttributes, context }) {
	const {
		postsToShow = 6,
		displayFeaturedImage = true,
		displayTitle = true,
		displayExcerpt = false,
		displayMeta = false,
		columns = 3,
	} = attributes;

	const postType = context.postType || '{{cpt_slug}}';

	const posts = useSelect(
		(select) => {
			return select('core').getEntityRecords('postType', postType, {
				per_page: postsToShow,
			});
		},
		[postType, postsToShow]
	);

	const blockProps = useBlockProps({
		className: 'wp-block-{{namespace}}-{{cpt_slug}}-collection',
	});

	/**
	 * Block editor logic for the {{cpt_slug}}-collection block
	 * Extensible, accessible, and event-driven.
	 */
	import { __ } from '@wordpress/i18n';
	import { useBlockProps } from '@wordpress/block-editor';
	import { useEffect } from '@wordpress/element';

	export default function Edit( { attributes, setAttributes } ) {
		const blockProps = useBlockProps();

		useEffect( () => {
			// Example: trigger custom event for extensibility
			const event = new CustomEvent( 'collectionInit', { detail: { attributes } } );
			document.dispatchEvent( event );
		}, [] );

		return (
			<div { ...blockProps }>
				{/* Render block controls and preview here */}
				<p>{ __( 'Collection block preview (editor).', '{{textdomain}}' ) }</p>
			</div>
		);
	}
							setAttributes({ displayFeaturedImage: value })
						}
					/>
					<ToggleControl
						label={__('Display Title', '{{textdomain}}')}
						checked={displayTitle}
						onChange={(value) =>
							setAttributes({ displayTitle: value })
						}
					/>
					<ToggleControl
						label={__('Display Excerpt', '{{textdomain}}')}
						checked={displayExcerpt}
						onChange={(value) =>
							setAttributes({ displayExcerpt: value })
						}
					/>
					<ToggleControl
						label={__('Display Meta', '{{textdomain}}')}
						checked={displayMeta}
						onChange={(value) =>
							setAttributes({ displayMeta: value })
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div
				{...blockProps}
				style={{
					display: 'grid',
					gridTemplateColumns: `repeat(${columns}, 1fr)`,
					gap: '1.5rem',
				}}
			>
				{Array.isArray(posts) && posts.length > 0 ? (
					posts.map((post) => (
						<article
							key={post.id}
							className="wp-block-{{namespace}}-{{cpt_slug}}-collection__item"
						>
							{displayFeaturedImage && post.featured_media && (
								<div className="wp-block-{{namespace}}-{{cpt_slug}}-collection__image">
									<img
										src={
											post._embedded?.[
												'wp:featuredmedia'
											]?.[0]?.source_url || ''
										}
										alt={
											post._embedded?.[
												'wp:featuredmedia'
											]?.[0]?.alt_text || ''
										}
									/>
								</div>
							)}
							{displayTitle && (
								<h3 className="wp-block-{{namespace}}-{{cpt_slug}}-collection__title">
									{post.title?.rendered ||
										__('Untitled', '{{textdomain}}')}
								</h3>
							)}
							{displayExcerpt && (
								<div
									className="wp-block-{{namespace}}-{{cpt_slug}}-collection__excerpt"
									dangerouslySetInnerHTML={{
										__html: post.excerpt?.rendered || '',
									}}
								/>
							)}
							{displayMeta && (
								<div className="wp-block-{{namespace}}-{{cpt_slug}}-collection__meta">
									<span className="wp-block-{{namespace}}-{{cpt_slug}}-collection__date">
										{new Date(
											post.date
										).toLocaleDateString()}
									</span>
								</div>
							)}
						</article>
					))
				) : (
					<p className="wp-block-{{namespace}}-{{cpt_slug}}-collection__placeholder">
						{__('No posts found.', '{{textdomain}}')}
					</p>
				)}
			</div>
		</>
	);
}
