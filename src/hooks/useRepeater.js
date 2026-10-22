/**
 * @file useRepeater.js
 * @description React hook for handling repeater fields.
 * @todo Add support for nested repeaters and validation.
 */
/**
 * useRepeater Hook
 *
 * Custom hook for accessing ACF or custom meta field repeater data.
 *
 * @package
 * @since 1.0.0
 */

import { useSelect } from '@wordpress/data';

/**
 * useRepeater hook.
 *
 * Fetches repeater field data from a post's ACF or custom meta fields. Gracefully
 * handles missing posts, fields, and non-array field values. Useful for rendering
 * dynamic content blocks, multiple similar items, or gallery-like structures that
 * are stored as array data in post meta.
 *
 * @param {number} postId    Post ID to fetch fields from.
 * @param {string} fieldName Repeater field name (key) to retrieve.
 * @param {string} postType  Post type slug. Default: 'item'.
 *
 * @return {Object} Hook return value:
 *   - rows: {Array} Array of repeater field items, or empty array if not found.
 *   - isLoading: {boolean} Whether the post data is currently being fetched.
 *
 * @throws {Error} If the WordPress data store is unavailable.
 *
 * @example
 * const { rows, isLoading } = useRepeater(123, 'gallery_items', 'item');
 *
 * if (isLoading) return <Spinner />;
 * if (rows.length === 0) return <p>No items</p>;
 * return (
 *   <div className="gallery">
 *     {rows.map((item, index) => (
 *       <div key={index} className="gallery-item">
 *         <img src={item.image} alt={item.title} />
 *       </div>
 *     ))}
 *   </div>
 * );
 */
export default function useRepeater( postId, fieldName, postType = 'item' ) {
	return useSelect(
		( select ) => {
			if ( ! postId || ! fieldName ) {
				return { rows: [], isLoading: false };
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

			const fieldValue =
				post?.acf?.[ fieldName ] ?? post?.meta?.[ fieldName ] ?? null;
			const rows = Array.isArray( fieldValue ) ? fieldValue : [];

			return { rows, isLoading };
		},
		[ postId, fieldName, postType ]
	);
}
