/**
 * @file edit.js
 * @description Block editor component for the example collection block.
 * @todo Add filtering and accessibility improvements.
 */
/**
 * Example Plugin Collection Block - Editor Component
 *
 * @package
	// Folder and file names should use mustache placeholders, e.g. src/blocks/{{block_slug}}-collection/edit.js

  import { __ } from '@wordpress/i18n';
  import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
  import {
  PanelBody,
	// Folder and file names should use mustache placeholders, e.g. src/blocks/{{block_slug}}-collection/edit.js
  SelectControl,
  RangeControl,
  } from '@wordpress/components';
  import { useSelect } from '@wordpress/data';
  import { useMemo } from '@wordpress/element';

  /**
 * Collection block edit component.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Function to update attributes.
 *
 * @return {Element} Block editor component.
 */
export default function Edit({ attributes, setAttributes }) {
	const {
		query,
		layout,
		columns,
		displayFeaturedImage,
		displayTitle,
		displayExcerpt,
		displayMeta,
		displayPagination,
	} = attributes;

	const { perPage, order, orderBy, featured } = query;

	const updateQuery = (newQuery) => {
		setAttributes({ query: { ...query, ...newQuery } });
	};

	const posts = useSelect(
		(select) => {
			const queryArgs = {
				per_page: perPage,
				order,
				orderby: orderBy,
				_embed: true,
			};

			return select('core').getEntityRecords(
				'postType',
				'{{cpt_slug}}',
				queryArgs
			);
		},
		[perPage, order, orderBy]
	);

	const blockProps = useBlockProps({
		className: `wp-block-{{namespace}}-{{cpt_slug}}-collection is-layout-${layout}`,
	});

	const gridStyle = useMemo(() => {
		if (layout === 'grid') {
			return {
				display: 'grid',
				gridTemplateColumns: `repeat(${columns}, 1fr)`,
				gap: '1.5rem',
			};
		}
		return {};
	}, [layout, columns]);

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Query Settings', '{{textdomain}}')}>
					<RangeControl
						label={__('Number of Items', '{{textdomain}}')}
						value={perPage}
						onChange={(value) => updateQuery({ perPage: value })}
						min={1}
						max={24}
					/>
					<SelectControl
						label={__('Order By', '{{textdomain}}')}
						value={orderBy}
						options=[
							{
								label: __('Date', '{{textdomain}}'),
								value: 'date',
							},
							{
								label: __('Title', '{{textdomain}}'),
								value: 'title',
							},
							{
								label: __('Modified', '{{textdomain}}'),
								value: 'modified',
							},
							{
								label: __('Random', '{{textdomain}}'),
								value: 'rand',
							},
						]
						onChange={(value) => updateQuery({ orderBy: value })}
					/>
					<SelectControl
						label={__('Order', '{{textdomain}}')}
						value={order}
						options=[
							{
								label: __('Descending', '{{textdomain}}'),
								value: 'desc',
							},
							{
								label: __('Ascending', '{{textdomain}}'),
								value: 'asc',
							},
						]
						onChange={(value) => updateQuery({ order: value })}
					/>
					<ToggleControl
						label={__('Featured Only', '{{textdomain}}')}
						checked={featured}
						onChange={(value) => updateQuery({ featured: value })}
					/>
				</PanelBody>

				<PanelBody title={__('Layout', '{{textdomain}}')}>
					<SelectControl
						label={__('Layout', '{{textdomain}}')}
						value={layout}
						options=[
							{
								label: __('Grid', '{{textdomain}}'),
								value: 'grid',
							},
							{
								label: __('List', '{{textdomain}}'),
								value: 'list',
							},
							{
								label: __('Slider', '{{textdomain}}'),
								value: 'slider',
							},
						]
						onChange={(value) => setAttributes({ layout: value })}
					/>
					{layout === 'grid' && (
						<RangeControl
							label={__('Columns', '{{textdomain}}')}
							value={columns}
							onChange={(value) =>
								setAttributes({ columns: value })
							}
							min={1}
							max={6}
						/>
					)}
				</PanelBody>

				<PanelBody title={__('Display Settings', '{{textdomain}}')}>
					<ToggleControl
						label={__('Display Featured Image', '{{textdomain}}')}
						checked={displayFeaturedImage}
						onChange={(value) =>
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
					<ToggleControl
						label={__('Display Pagination', '{{textdomain}}')}
						checked={displayPagination}
						onChange={(value) =>
							setAttributes({ displayPagination: value })
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				{posts === null && <p>{__('Loading…', '{{textdomain}}')}</p>}

				{posts && posts.length === 0 && (
					<p>{__('No items found.', '{{textdomain}}')}</p>
				)}

				{posts && posts.length > 0 && (
					<div
						className="wp-block-{{namespace}}-{{cpt_slug}}-collection__items"
						style={gridStyle}
					>
						{posts.map((post) => (
							<article
								key={post.id}
								className="wp-block-{{namespace}}-{{cpt_slug}}-collection__item"
							>
								{displayFeaturedImage &&
									post._embedded?.[
										'wp:featuredmedia'
									]?.[0] && (
										<div className="wp-block-{{namespace}}-{{cpt_slug}}-collection__image">
											<img
												src={
													post._embedded[
														'wp:featuredmedia'
												][0].source_url
												}
												alt={
													post._embedded[
														'wp:featuredmedia'
												][0].alt_text || ''
												}
											/>
										</div>
									)}
							<div className="wp-block-{{namespace}}-{{cpt_slug}}-collection__content">
								{displayTitle && (
									<h3 className="wp-block-{{namespace}}-{{cpt_slug}}-collection__title">
										{post.title.rendered}
									</h3>
								)}
								{displayExcerpt && (
									<div
										className="wp-block-{{namespace}}-{{cpt_slug}}-collection__excerpt"
										dangerouslySetInnerHTML={{
											__html: post.excerpt.rendered,
										}}
									/>
								)}
								{displayMeta && (
									<div className="wp-block-{{namespace}}-{{cpt_slug}}-collection__meta">
										<time>
											{new Date(
												post.date
											).toLocaleDateString()}
										</time>
									</div>
								)}
							</div>
						</article>
						))}
					</div>
				)}
			</div>
		</>
	);
}
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
		className: 'wp-block-{{namespace}}-{{block_slug}}-collection',
	});

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Collection Settings', '{{textdomain}}')}>
					<RangeControl
						label={__('Posts to show', '{{textdomain}}')}
						min={1}
						max={24}
						value={postsToShow}
						onChange={(value) => setAttributes({ postsToShow: value })}
					/>
					<RangeControl
						label={__('Columns', '{{textdomain}}')}
						min={1}
						max={6}
						value={columns}
						onChange={(value) => setAttributes({ columns: value })}
					/>
					<ToggleControl
						label={__('Display Featured Image', '{{textdomain}}')}
						checked={displayFeaturedImage}
						onChange={(value) => setAttributes({ displayFeaturedImage: value })}
					/>
					<ToggleControl
						label={__('Display Title', '{{textdomain}}')}
						checked={displayTitle}
						onChange={(value) => setAttributes({ displayTitle: value })}
					/>
					<ToggleControl
						label={__('Display Excerpt', '{{textdomain}}')}
						checked={displayExcerpt}
						onChange={(value) => setAttributes({ displayExcerpt: value })}
					/>
					<ToggleControl
						label={__('Display Meta', '{{textdomain}}')}
						checked={displayMeta}
						onChange={(value) => setAttributes({ displayMeta: value })}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1.5rem' }}>
				{Array.isArray(posts) && posts.length > 0 ? (
					posts.map((post) => (
						<article key={post.id} className="wp-block-{{namespace}}-{{block_slug}}-collection__item">
							{displayFeaturedImage && post.featured_media && (
								<div className="wp-block-{{namespace}}-{{block_slug}}-collection__image">
									<img
										src={post._embedded?.['wp:featuredmedia']?.[0]?.source_url || ''}
										alt={post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || ''}
									/>
								</div>
							)}
							{displayTitle && (
								<h3 className="wp-block-{{namespace}}-{{block_slug}}-collection__title">
									{post.title?.rendered || __('Untitled', '{{textdomain}}')}
								</h3>
							)}
							{displayExcerpt && (
								<div
									className="wp-block-{{namespace}}-{{block_slug}}-collection__excerpt"
									dangerouslySetInnerHTML={{ __html: post.excerpt?.rendered || '' }}
								/>
							)}
							{displayMeta && (
								<div className="wp-block-{{namespace}}-{{block_slug}}-collection__meta">
									<span className="wp-block-{{namespace}}-{{block_slug}}-collection__date">
										{new Date(post.date).toLocaleDateString()}
									</span>
								</div>
							)}
						</article>
					))
				) : (
					<p className="wp-block-{{namespace}}-{{block_slug}}-collection__placeholder">
						{__('No posts found.', '{{textdomain}}')}
					</p>
				)}
			</div>
		</>
	);
}
