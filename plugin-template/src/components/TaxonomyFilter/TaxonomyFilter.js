/**
 * @file TaxonomyFilter.js
 * @description Component for filtering items by taxonomy terms.
 * @todo Add multi-select and accessibility improvements.
 */
/**
 * Taxonomy Filter Component
 *
 * A reusable component for filtering by taxonomy terms in the block editor.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { SelectControl, Spinner, FormTokenField } from '@wordpress/components';

/**
 * TaxonomyFilter component.
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.taxonomy Taxonomy slug.
 * @param {Array}    props.value    Selected term IDs.
 * @param {Function} props.onChange Callback when selection changes.
 * @param {string}   props.label    Control label.
 * @param {boolean}  props.multiple Allow multiple selections.
 *
 * @return {Element} TaxonomyFilter component.
 */
export default function TaxonomyFilter( {
	taxonomy = '{{taxonomy_slug}}_category',
	value = [],
	onChange,
	label = __( 'Filter by Category', '{{textdomain}}' ),
	multiple = true,
} ) {
	const { terms, isLoading } = useSelect(
		( select ) => {
			const queryArgs = {
				per_page: 100,
				hide_empty: false,
			};

			return {
				terms: select( 'core' ).getEntityRecords(
					'taxonomy',
					taxonomy,
					queryArgs
				),
				isLoading: select( 'core/data' ).isResolving(
					'core',
					'getEntityRecords',
					[ 'taxonomy', taxonomy, queryArgs ]
				),
			};
		},
		[ taxonomy ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( ! terms || terms.length === 0 ) {
		return <p>{ __( 'No terms found.', '{{textdomain}}' ) }</p>;
	}

	if ( multiple ) {
		const termNames = terms.map( ( term ) => term.name );
		const selectedNames = value
			.map( ( id ) => terms.find( ( term ) => term.id === id )?.name )
			.filter( Boolean );

		const handleChange = ( names ) => {
			const ids = names
				.map(
					( name ) => terms.find( ( term ) => term.name === name )?.id
				)
				.filter( Boolean );
			onChange( ids );
		};

		return (
			<FormTokenField
				label={ label }
				value={ selectedNames }
				suggestions={ termNames }
				onChange={ handleChange }
			/>
		);
	}

	const options = [
		{ value: '', label: __( 'All', '{{textdomain}}' ) },
		...terms.map( ( term ) => ( {
			value: term.id.toString(),
			label: term.name,
		} ) ),
	];

	return (
		<SelectControl
			label={ label }
			value={ value[ 0 ]?.toString() || '' }
			options={ options }
			onChange={ ( val ) =>
				onChange( val ? [ parseInt( val, 10 ) ] : [] )
			}
		/>
	);
}
