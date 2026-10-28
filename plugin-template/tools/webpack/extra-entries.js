/**
 * Webpack entries `@wordpress/scripts` does not find on its own.
 *
 * It already builds every block it finds through block.json (scripts, styles,
 * view modules and render.php). This adds the plugin's shared entry and the
 * editor scripts in src/js.
 */
const path = require( 'path' );
const { globSync } = require( 'glob' );

const extraEntries = () => ( {
	index: './src/index.js',
	...Object.fromEntries(
		globSync( 'src/js/**/*.js' ).map( ( file ) => [
			`js/${ path.relative( 'src/js', file ).replace( /\.js$/, '' ) }`,
			`./${ file }`,
		] )
	),
} );

/**
 * Add the extra entries to a `@wordpress/scripts` webpack config.
 *
 * @param {Object} config Webpack config with an `entry` function.
 * @return {Object} The config with the extra entries.
 */
const withExtraEntries = ( config ) => ( {
	...config,
	entry: () => ( { ...config.entry(), ...extraEntries() } ),
} );

module.exports = { extraEntries, withExtraEntries };
