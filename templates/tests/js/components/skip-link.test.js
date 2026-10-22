/**
 * Unit tests for the SkipLink component.
 */
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkipLink from '../../../src/components/SkipLink/SkipLink';

describe( 'SkipLink', () => {
	test( 'links to the main content by default', () => {
		render( <SkipLink /> );

		expect(
			screen.getByRole( 'link', { name: 'Skip to main content' } )
		).toHaveAttribute( 'href', '#maincontent' );
	} );

	test( 'accepts a custom target and label', () => {
		render( <SkipLink target="#content" label="Skip ahead" /> );

		expect(
			screen.getByRole( 'link', { name: 'Skip ahead' } )
		).toHaveAttribute( 'href', '#content' );
	} );
} );
