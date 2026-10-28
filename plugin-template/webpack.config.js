/**
 * Webpack configuration: the `@wordpress/scripts` default, plus the entries
 * in tools/webpack/extra-entries.js.
 */
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const { withExtraEntries } = require( './tools/webpack/extra-entries' );

// With --experimental-modules, @wordpress/scripts exports [ scripts, modules ].
module.exports = Array.isArray( defaultConfig )
	? [ withExtraEntries( defaultConfig[ 0 ] ), ...defaultConfig.slice( 1 ) ]
	: withExtraEntries( defaultConfig );
