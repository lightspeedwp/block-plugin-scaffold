/**
 * Copy the files a release ships into dist/<slug>/.
 *
 * Usage: node bin/package-release.js
 * Run `npm run build` first. Every file .distignore does not exclude is
 * copied, using gitignore rules (so `!README.md` keeps README.md).
 * The release workflow zips the folder.
 */
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const ignore = require( 'ignore' );
const { globSync } = require( 'glob' );

const slug = require( '../package.json' ).name;
const target = path.join( 'dist', slug );

// Case-sensitive, as Git is on Linux: otherwise `Icon?` would drop icons/.
const distignore = ignore( { ignorecase: false } ).add(
	fs.readFileSync( '.distignore', 'utf8' )
);

const files = globSync( '**', {
	dot: true,
	nodir: true,
	// Never shipped, and too large to walk.
	ignore: [ '.git/**', 'node_modules/**', 'vendor/**', 'dist/**' ],
} )
	.filter( ( file ) => ! distignore.ignores( file ) )
	.sort();

fs.rmSync( target, { recursive: true, force: true } );

for ( const file of files ) {
	const destination = path.join( target, file );
	fs.mkdirSync( path.dirname( destination ), { recursive: true } );
	fs.copyFileSync( file, destination );
}

process.stdout.write( `Copied ${ files.length } files to ${ target }/\n` );
