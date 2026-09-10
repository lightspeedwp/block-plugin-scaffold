/**
 * @file useCollection.js
 * @description React hook for retrieving a collection of posts or items.
 * @todo Add pagination and error handling improvements.
 */
/**
 * useCollection Hook
 *
 * Custom hook for querying and filtering posts from a custom post type collection.
 *
 * @package
 * @since 1.0.0
 */

import { useSelect } from '@wordpress/data';

/**
 * useCollection hook.
 *
 * Fetches a collection of posts from WordPress with support for pagination, filtering,
 * searching, and taxonomy-based filtering. Uses the WordPress data store for reactive
 * data management and automatic loading state tracking.
 *
 * @param {Object}  query          Query parameters.
 * @param {string}  query.postType Custom post type to query. Default: 'item'.
 * @param {number}  query.perPage  Number of posts per page. Default: 6.
 * @param {number}  query.page     Current page number. Default: 1.
 * @param {string}  query.order    Sort order ('asc' or 'desc'). Default: 'desc'.
 * @param {string}  query.orderBy  Field to order by ('date', 'title', etc.). Default: 'date'.
 * @param {string}  query.search   Search keyword. Default: ''.
 * @param {Object}  query.taxQuery Taxonomy filter object {taxonomy: [termIds]}. Default: null.
 * @param {boolean} query.featured Filter to featured posts only. Default: false.
 *
 * @return {Object} Hook return value:
 *   - posts: {Array} Array of post objects from REST API.
 *   - isLoading: {boolean} Whether the posts are currently being fetched.
 *   - hasNoPosts: {boolean} Whether the query returned no results.
 *
 * @example
 * const { posts, isLoading, hasNoPosts } = useCollection({
 *   postType: 'item',
 *   perPage: 12,
 *   page: 1,
 *   orderBy: 'date',
 *   order: 'desc',
 *   taxQuery: { '{{namespace}}_category': [1, 2] },
 *   featured: false,
 * });
 *
 * if (isLoading) return <Spinner />;
 * if (hasNoPosts) return <p>No posts found</p>;
 * return posts.map(post => <Post key={post.id} post={post} />);
 */
export default function useCollection(query = {}) {
	const {
		postType = 'item',
		perPage = 6,
		page = 1,
		order = 'desc',
		orderBy = 'date',
		search = '',
		taxQuery = null,
		featured = false,
	} = query;

	return useSelect(
		(select) => {
			const queryArgs = {
				per_page: perPage,
				page,
				order,
				orderby: orderBy,
				search: search || undefined,
				_embed: true,
			};

			// Add taxonomy query.
			if (taxQuery) {
				Object.entries(taxQuery).forEach(([taxonomy, termIds]) => {
					if (termIds.length > 0) {
						queryArgs[taxonomy] = termIds;
					}
				});
			}

			// Add featured meta query (if using REST API with meta query support).
			if (featured) {
				queryArgs.meta_key = '{{namespace}}_featured';
				queryArgs.meta_value = '1';
			}

			const posts = select('core').getEntityRecords(
				'postType',
				postType,
				queryArgs
			);
			const isLoading = select('core/data').isResolving(
				'core',
				'getEntityRecords',
				['postType', postType, queryArgs]
			);

			return {
				posts: posts || [],
				isLoading,
				hasNoPosts: posts && posts.length === 0,
			};
		},
		[postType, perPage, page, order, orderBy, search, taxQuery, featured]
	);
}
