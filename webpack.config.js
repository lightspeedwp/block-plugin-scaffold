/**
 * Webpack configuration.
 *
 * @wordpress/scripts already builds every block it finds through block.json
 * (scripts, styles, view modules and render.php). This adds the plugin's
 * shared entry and the editor scripts in src/js.
 */
const path = require( 'path' );
const { globSync } = require( 'glob' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const extraEntries = () => ( {
	index: './src/index.js',
	...Object.fromEntries(
		globSync( 'src/js/**/*.js' ).map( ( file ) => [
			`js/${ path.relative( 'src/js', file ).replace( /\.js$/, '' ) }`,
			`./${ file }`,
		] )
	),
} );

const withExtraEntries = ( config ) => ( {
	...config,
	entry: () => ( { ...config.entry(), ...extraEntries() } ),
} );

// With --experimental-modules, @wordpress/scripts exports [ scripts, modules ].
module.exports = Array.isArray( defaultConfig )
	? [ withExtraEntries( defaultConfig[ 0 ] ), ...defaultConfig.slice( 1 ) ]
	: withExtraEntries( defaultConfig );
