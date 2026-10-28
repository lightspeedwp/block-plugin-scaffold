/**
 * End-to-end accessibility and viewport checks on the front end.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { default: AxeBuilder } = require( '@axe-core/playwright' );
const { readdirSync } = require( 'node:fs' );
const path = require( 'node:path' );

const blocksDir = path.join( __dirname, '../../src/blocks' );
const blockNames = readdirSync( blocksDir, { withFileTypes: true } )
	.filter( ( entry ) => entry.isDirectory() )
	.map(
		( entry ) =>
			require( path.join( blocksDir, entry.name, 'block.json' ) ).name
	);

const viewports = {
	mobile: { width: 375, height: 812 },
	tablet: { width: 768, height: 1024 },
	desktop: { width: 1280, height: 800 },
};

// The plugin's own markup; theme markup is left out of the scan.
const blockSelector = '.wp-block-{{slug}}-slider';

test.describe( 'Plugin blocks on the front end', () => {
	let post;

	test.beforeAll( async ( { requestUtils } ) => {
		post = await requestUtils.createPost( {
			title: 'Accessibility check',
			content: blockNames
				.map( ( name ) => `<!-- wp:${ name } /-->` )
				.join( '\n' ),
			status: 'publish',
		} );
	} );

	// Delete only this post, so a run against a real site keeps its content.
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/posts/${ post.id }`,
			params: { force: true },
		} );
	} );

	for ( const [ name, size ] of Object.entries( viewports ) ) {
		test( `fit and pass axe on ${ name }`, async ( { page } ) => {
			await page.setViewportSize( size );
			await page.goto( post.link );

			const block = page.locator( blockSelector );
			await expect( block ).toBeVisible();

			const box = await block.boundingBox();
			expect( box.x ).toBeGreaterThanOrEqual( 0 );
			expect( box.x + box.width ).toBeLessThanOrEqual( size.width );

			// Content can overflow while the block itself fits.
			const scrollWidth = await page.evaluate(
				() => document.documentElement.scrollWidth
			);
			expect( scrollWidth ).toBeLessThanOrEqual( size.width );

			const results = await new AxeBuilder( { page } )
				.include( blockSelector )
				.withTags( [
					'wcag2a',
					'wcag2aa',
					'wcag21a',
					'wcag21aa',
					'wcag22aa',
				] )
				.analyze();
			expect( results.violations ).toEqual( [] );
		} );
	}
} );
