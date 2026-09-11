/**
 * Query Utilities
 *
 * Utility functions for building and processing queries.
 *
 * @package
 */

/**
 * Build WP_Query compatible arguments from block attributes.
 *
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} Query arguments.
 */
export function buildQueryArgs(attributes) {
	const { query = {} } = attributes;

	const args = {
		post_type: query.postType || '{{cpt_slug}}',
		posts_per_page: query.perPage || 6,
		order: query.order || 'desc',
		orderby: query.orderBy || 'date',
	};

	if (query.offset) {
		args.offset = query.offset;
	}

	if (query.author) {
		args.author = query.author;
	}

	if (query.search) {
		args.s = query.search;
	}

	if (query.exclude && query.exclude.length) {
		args.post__not_in = query.exclude;
	}

	if (query.taxQuery) {
		args.tax_query = buildTaxQuery(query.taxQuery);
	}

	if (query.featured) {
		args.meta_query = [
			{
				key: '{{namespace}}_featured',
				value: '1',
				compare: '=',
			},
		];
	}

	return args;
}

/**
 * Build tax_query array from taxonomy query object.
 *
 * @param {Object} taxQuery Taxonomy query object.
 *
 * @return {Array} Tax query array.
 */
export function buildTaxQuery(taxQuery) {
	if (!taxQuery || typeof taxQuery !== 'object') {
		return [];
	}

	const queries = Object.entries(taxQuery)
		.filter(([, terms]) => Array.isArray(terms) && terms.length > 0)
		.map(([taxonomy, terms]) => ({
			taxonomy,
			field: 'term_id',
			terms,
		}));

	if (queries.length === 0) {
		return [];
	}

	if (queries.length === 1) {
		return queries;
	}

	return [{ relation: 'AND' }, ...queries];
}

/**
 * Parse pagination from response headers.
 *
 * @param {Response} response Fetch response.
 *
 * @return {Object} Pagination info.
 */
export function parsePagination(response) {
	return {
		total: parseInt(response.headers.get('X-WP-Total') || '0', 10),
		totalPages: parseInt(
			response.headers.get('X-WP-TotalPages') || '1',
			10
		),
	};
}
