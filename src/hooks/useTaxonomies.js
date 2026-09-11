/**
 * @file useTaxonomies.js
 * @description React hook for retrieving taxonomy terms for a post.
 * @todo Add support for custom taxonomy filtering.
 */
/**
 * useTaxonomies Hook
 *
 * Custom hook for fetching taxonomy terms with configurable query options.
 *
 * @package
 * @since 1.0.0
 */

import { useSelect } from '@wordpress/data';

/**
 * useTaxonomies hook.
 *
 * Fetches taxonomy terms from the WordPress REST API with support for custom query
 * arguments. By default fetches all terms (up to 100) including empty terms. Useful
 * for populating filter controls, dropdowns, and term selection interfaces.
 *
 * @param {string} taxonomy Taxonomy slug to query. Default: '{{taxonomy_slug}}'.
 * @param {Object} args     Additional query arguments to merge with defaults.
 *                          - per_page: {number} Number of terms to fetch (default: 100).
 *                          - hide_empty: {boolean} Whether to hide empty terms (default: false).
 *                          - Any other REST API query parameters supported by the taxonomy endpoint.
 *
 * @return {Object} Hook return value:
 *   - terms: {Array} Array of term objects from REST API, or undefined if loading.
 *   - isLoading: {boolean} Whether the terms are currently being fetched.
 *
 * @throws {Error} If the WordPress data store is unavailable.
 *
 * @example
 * const { terms, isLoading } = useTaxonomies('{{taxonomy_slug}}', {
 *   hide_empty: true,
 *   per_page: 50,
 * });
 *
 * if (isLoading) return <Spinner />;
 * return (
 *   <select>
 *     {terms?.map(term => (
 *       <option key={term.id} value={term.id}>{term.name}</option>
 *     ))}
 *   </select>
 * );
 */
export default function useTaxonomies(
	taxonomy = '{{taxonomy_slug}}',
	args = {}
) {
	return useSelect(
		(select) => {
			const queryArgs = {
				per_page: 100,
				hide_empty: false,
				...args,
			};

			const terms = select('core').getEntityRecords(
				'taxonomy',
				taxonomy,
				queryArgs
			);
			const isLoading = select('core/data').isResolving(
				'core',
				'getEntityRecords',
				['taxonomy', taxonomy, queryArgs]
			);

			return { terms, isLoading };
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[taxonomy, JSON.stringify(args)]
	);
}
