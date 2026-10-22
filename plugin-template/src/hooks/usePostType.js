/**
 * @file usePostType.js
 * @description React hook for retrieving post type data.
 * @todo Add more comprehensive documentation and tests.
 */
/**
 * usePostType Hook
 *
 * Custom hook for fetching a single post from a custom post type with loading state.
 *
 * @package
 * @since 1.0.0
 */

import { useSelect } from '@wordpress/data';

/**
 * usePostType hook.
 *
 * Fetches a single post from the WordPress REST API by ID and post type. Provides
 * reactive loading state and gracefully handles missing post IDs. Uses the WordPress
 * data store for automatic request deduplication and caching.
 *
 * @param {number|null} postId   Post ID to fetch. If falsy, returns null post.
 * @param {string}      postType Post type slug to query. Default: 'item'.
 *
 * @return {Object} Hook return value:
 *   - post: {Object|null} Post object from REST API, or null if not found or postId is missing.
 *   - isLoading: {boolean} Whether the post is currently being fetched.
 *
 * @throws {Error} If the WordPress data store is unavailable.
 *
 * @example
 * const { post, isLoading } = usePostType(123, 'item');
 *
 * if (isLoading) return <Spinner />;
 * if (!post) return <p>Post not found</p>;
 * return <h1>{post.title.rendered}</h1>;
 */
export default function usePostType( postId, postType = 'item' ) {
	return useSelect(
		( select ) => {
			if ( ! postId ) {
				return { post: null, isLoading: false };
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

			return { post, isLoading };
		},
		[ postId, postType ]
	);
}
