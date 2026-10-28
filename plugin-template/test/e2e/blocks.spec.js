/**
 * End-to-end smoke tests: the editor loads and every plugin block inserts.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { readdirSync } = require( 'node:fs' );
const path = require( 'node:path' );

const blocksDir = path.join( __dirname, '../../src/blocks' );
const blockNames = readdirSync( blocksDir, { withFileTypes: true } )
	.filter( ( entry ) => entry.isDirectory() )
	.map(
		( entry ) =>
			require( path.join( blocksDir, entry.name, 'block.json' ) ).name
	);

test.describe( 'Plugin blocks', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'are registered in the editor', async ( { page } ) => {
		const registered = await page.evaluate( () =>
			window.wp.blocks.getBlockTypes().map( ( block ) => block.name )
		);

		expect( registered ).toEqual( expect.arrayContaining( blockNames ) );
	} );

	for ( const name of blockNames ) {
		test( `${ name } can be inserted`, async ( { editor } ) => {
			await editor.insertBlock( { name } );

			const blocks = await editor.getBlocks();
			expect( blocks.map( ( block ) => block.name ) ).toContain( name );
			await expect(
				editor.canvas.locator( `[data-type="${ name }"]` )
			).toBeVisible();
		} );
	}

	test( 'render on the front end', async ( { editor, page } ) => {
		for ( const name of blockNames ) {
			await editor.insertBlock( { name } );
		}
		const postId = await editor.publishPost();

		const response = await page.goto( `/?p=${ postId }` );
		expect( response.status() ).toBe( 200 );
		await expect(
			page.locator( '.wp-block-{{slug}}-slider' )
		).toBeVisible();
	} );
} );
