/**
 * @file useFields.js
 * @description React hook for retrieving custom fields for a post.
 * @todo Add unit tests and improve error handling for edge cases.
 */
/**
 * useFields Hook
 *
 * Custom hook for accessing all ACF or custom meta field values from a post.
 *
 * @package
 * @since 1.0.0
 */

import { useSelect } from '@wordpress/data';

/**
 * useFields hook.
 *
 * Fetches all ACF or custom meta fields from a post. Provides a convenient way to
 * access all custom field data without needing to query individual fields. Gracefully
 * handles missing posts by returning an empty object. Prioritizes ACF fields if available.
 *
 * @param {number} postId   Post ID to fetch fields from.
 * @param {string} postType Post type slug. Default: 'item'.
 *
 * @return {Object} Hook return value:
 *   - fields: {Object} Field data object containing all ACF/meta fields, or empty object.
 *   - isLoading: {boolean} Whether the post data is currently being fetched.
 *
 * @throws {Error} If the WordPress data store is unavailable.
 *
 * @example
 * const { fields, isLoading } = useFields(123, 'item');
 *
 * if (isLoading) return <Spinner />;
 * return (
 *   <div>
 *     <h1>{fields.title}</h1>
 *     <p>{fields.description}</p>
 *     <img src={fields.featured_image} alt={fields.title} />
 *   </div>
 * );
 */
export default function useFields( postId, postType = 'item' ) {
	return useSelect(
		( select ) => {
			if ( ! postId ) {
				return { fields: {}, isLoading: false };
			}

			const post = select( 'core' ).getEntityRecord(
				'postType',
				postType,
				postId
			);
			const isLoading = select( 'core/data' ).isResolving(
				'core',
				'getEntityRecord',
				[ 'postType', postType, postId ]
			);

			// ACF fields are typically in the 'acf' object or in 'meta'.
			const fields = post?.acf || post?.meta || {};

			return { fields, isLoading };
		},
		[ postId, postType ]
	);
}
