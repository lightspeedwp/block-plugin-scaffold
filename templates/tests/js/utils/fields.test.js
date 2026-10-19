/**
 * Unit tests for the field utilities.
 */
import { describe, expect, test, vi } from 'vitest';
import {
	extractImageData,
	formatFieldValue,
	getFieldValue,
	isFieldEmpty,
	processRepeaterRows,
} from '../../../src/utils/fields';

describe( 'getFieldValue', () => {
	test( 'prefers the ACF value over post meta', () => {
		const post = { acf: { colour: 'red' }, meta: { colour: 'blue' } };

		expect( getFieldValue( post, 'colour' ) ).toBe( 'red' );
	} );

	test( 'falls back to post meta', () => {
		expect( getFieldValue( { meta: { colour: 'blue' } }, 'colour' ) ).toBe(
			'blue'
		);
	} );

	test( 'returns null for a missing post or field', () => {
		expect( getFieldValue( null, 'colour' ) ).toBeNull();
		expect( getFieldValue( { acf: {} }, 'colour' ) ).toBeNull();
	} );
} );

describe( 'formatFieldValue', () => {
	test.each( [
		[ true, 'true_false', 'Yes' ],
		[ false, 'boolean', 'No' ],
		[ [ 'a', 'b' ], 'array', 'a, b' ],
		[ 42, 'text', '42' ],
		[ null, 'text', '' ],
	] )( 'formats %j as %s → %j', ( value, type, expected ) => {
		expect( formatFieldValue( value, type ) ).toBe( expected );
	} );
} );

describe( 'isFieldEmpty', () => {
	test.each( [ null, undefined, '', [], {} ] )(
		'treats %j as empty',
		( value ) => {
			expect( isFieldEmpty( value ) ).toBe( true );
		}
	);

	test.each( [ 0, 'x', [ 1 ], { a: 1 } ] )(
		'treats %j as filled',
		( value ) => {
			expect( isFieldEmpty( value ) ).toBe( false );
		}
	);
} );

describe( 'extractImageData', () => {
	test( 'wraps a URL string', () => {
		expect( extractImageData( 'https://example.test/a.jpg' ) ).toEqual( {
			url: 'https://example.test/a.jpg',
			alt: '',
		} );
	} );

	test( 'picks the requested size from an image object', () => {
		const image = {
			url: 'full.jpg',
			alt: 'A view',
			sizes: { medium: { url: 'medium.jpg' } },
		};

		expect( extractImageData( image ) ).toMatchObject( {
			url: 'medium.jpg',
			alt: 'A view',
		} );
		expect( extractImageData( image, 'large' ).url ).toBe( 'full.jpg' );
	} );

	test( 'returns null when there is no URL', () => {
		expect( extractImageData( {} ) ).toBeNull();
		expect( extractImageData( '' ) ).toBeNull();
	} );
} );

describe( 'processRepeaterRows', () => {
	test( 'maps each row with its index', () => {
		const transform = vi.fn(
			( row, index ) => `${ index }:${ row.title }`
		);

		expect(
			processRepeaterRows( [ { title: 'A' }, { title: 'B' } ], transform )
		).toEqual( [ '0:A', '1:B' ] );
	} );

	test( 'returns an empty list for invalid rows', () => {
		expect( processRepeaterRows( null, () => {} ) ).toEqual( [] );
	} );
} );
