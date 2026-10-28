/**
 * Unit tests for the query utilities.
 */
import { describe, expect, test } from 'vitest';
import {
	buildQueryArgs,
	buildTaxQuery,
	parsePagination,
} from '../../../src/utils/query';

describe( 'buildQueryArgs', () => {
	test( 'applies defaults', () => {
		const args = buildQueryArgs( {} );

		expect( args ).toMatchObject( {
			posts_per_page: 6,
			order: 'desc',
			orderby: 'date',
		} );
		// The plugin's first post type, or '' for a functional-only plugin.
		expect( args.post_type ).toEqual( expect.any( String ) );
	} );

	test( 'maps optional query settings', () => {
		const args = buildQueryArgs( {
			query: {
				postType: 'post',
				perPage: 3,
				search: 'safari',
				exclude: [ 7 ],
				featured: true,
			},
		} );

		expect( args ).toMatchObject( {
			post_type: 'post',
			posts_per_page: 3,
			s: 'safari',
			post__not_in: [ 7 ],
		} );
		expect( args.meta_query[ 0 ].key ).toMatch( /_featured$/ );
	} );
} );

describe( 'buildTaxQuery', () => {
	test( 'drops empty taxonomies and joins several with AND', () => {
		expect(
			buildTaxQuery( { category: [ 1 ], post_tag: [], genre: [ 2, 3 ] } )
		).toEqual( [
			{ relation: 'AND' },
			{ taxonomy: 'category', field: 'term_id', terms: [ 1 ] },
			{ taxonomy: 'genre', field: 'term_id', terms: [ 2, 3 ] },
		] );
	} );

	test( 'returns an empty list for invalid input', () => {
		expect( buildTaxQuery( null ) ).toEqual( [] );
	} );
} );

describe( 'parsePagination', () => {
	test( 'reads the WordPress REST headers', () => {
		const response = new Response( null, {
			headers: { 'X-WP-Total': '12', 'X-WP-TotalPages': '2' },
		} );

		expect( parsePagination( response ) ).toEqual( {
			total: 12,
			totalPages: 2,
		} );
	} );
} );
