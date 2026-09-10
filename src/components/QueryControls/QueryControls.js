/**
 * @file QueryControls.js
 * @description Component for controlling query parameters in the UI.
 * @todo Add prop types and improve test coverage.
 */
/**
 * Query Controls Component
 *
 * Reusable query configuration controls for collection blocks.
 *
 * @package {{namespace}}
 */

import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import TaxonomyFilter from '../TaxonomyFilter';

/**
 * QueryControls component.
 *
 * @param {Object}   props          Component props.
 * @param {Object}   props.query    Current query settings.
 * @param {Function} props.onChange Callback when query changes.
 *
 * @return {Element} QueryControls component.
 */
export default function QueryControls({ query, onChange }) {
	const {
		perPage = 6,
		order = 'desc',
		orderBy = 'date',
		featured = false,
		taxQuery = null,
	} = query;

	const updateQuery = (updates) => {
		onChange({ ...query, ...updates });
	};

	return (
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
					options={[
						   { label: __('Date', '{{textdomain}}'), value: 'date' },
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
						   {
							   label: __('Menu Order', '{{textdomain}}'),
							   value: 'menu_order',
						   },
					]}
					onChange={(value) => updateQuery({ orderBy: value })}
				/>
				<SelectControl
					   label={__('Order', '{{textdomain}}')}
					value={order}
					options={[
						   {
							   label: __('Descending', '{{textdomain}}'),
							   value: 'desc',
						   },
						   {
							   label: __('Ascending', '{{textdomain}}'),
							   value: 'asc',
						   },
					]}
					onChange={(value) => updateQuery({ order: value })}
				/>
				<ToggleControl
					   label={__('Featured Only', '{{textdomain}}')}
					checked={featured}
					onChange={(value) => updateQuery({ featured: value })}
				/>
			</PanelBody>

			   <PanelBody
				   title={__('Filter by Taxonomy', '{{textdomain}}')}
				   initialOpen={false}
			   >
				<TaxonomyFilter
					   taxonomy="{{taxonomy_slug}}_category"
					   value={taxQuery?.['{{taxonomy_slug}}_category'] || []}
					onChange={(termIds) =>
						updateQuery({
							taxQuery: termIds.length
								? { '{{taxonomy_slug}}_category': termIds }
								: null,
						})
					}
					   label={__('Categories', '{{textdomain}}')}
				/>
			</PanelBody>
		</InspectorControls>
	);
}
