/**
 * Configuration validation and normalisation for local MCP plugin generation
 * (BPS-12).
 *
 * Uses the generator's own defaults and validation, not the standalone
 * validator, whose field and taxonomy checks contradict the schema (see
 * "Supported configuration" in docs/MCP-PLUGIN-GENERATION.md).
 *
 * @package
 */

const {
	applyDefaults,
	loadSchema,
	validateConfig,
} = require( '../generate-plugin' );

// Values the generator works out from other values rather than defaulting.
const DERIVED = new Set( [
	'textdomain',
	'namespace',
	'license_uri',
	'tested_up_to',
	'contributors',
	'repository_url',
] );

// Legacy single-post-type fields the generator still accepts.
const LEGACY = new Set( [
	'cpt_slug',
	'name_singular',
	'name_plural',
	'cpt_supports',
] );

/**
 * Validate a configuration and describe where each value comes from.
 *
 * @param {*} config Configuration from the client.
 * @return {{
 *   valid: boolean,
 *   errors: {path: string, message: string}[],
 *   warnings: {path: string, message: string}[],
 *   normalised: Object<string, {value: *, source: string}>,
 *   values: Object<string, *>
 * }} Result.
 */
function validateConfiguration( config ) {
	if ( ! config || typeof config !== 'object' || Array.isArray( config ) ) {
		return {
			valid: false,
			errors: [ { path: '', message: 'config must be an object' } ],
			warnings: [],
			normalised: {},
			values: {},
		};
	}

	const schema = loadSchema();
	const full = applyDefaults( config );
	const validation = validateConfig( full );
	const errors = ( validation.errors || [] ).map( ( error ) => ( {
		path: error.instancePath || '',
		message: error.message,
	} ) );

	const supplied = ( key ) => Object.hasOwn( config, key );
	const normalised = {};
	const values = {};
	for ( const key of Object.keys( schema.properties ) ) {
		if ( key === '_comment' || full[ key ] === undefined ) {
			continue;
		}
		let source = 'default';
		if ( supplied( key ) ) {
			source = 'supplied';
		} else if ( DERIVED.has( key ) ) {
			source = 'derived';
		}
		normalised[ key ] = { value: full[ key ], source };
		values[ key ] = full[ key ];
	}

	const warnings = [];
	if ( ! supplied( 'repository_url' ) ) {
		warnings.push( {
			path: '/repository_url',
			message: `Not supplied, so it defaults to ${ full.repository_url }. Set it if the plugin lives elsewhere.`,
		} );
	}
	for ( const key of Object.keys( config ) ) {
		if ( LEGACY.has( key ) ) {
			warnings.push( {
				path: `/${ key }`,
				message:
					'Legacy single-post-type field; use post_types instead.',
			} );
			normalised[ key ] = { value: config[ key ], source: 'supplied' };
			values[ key ] = config[ key ];
		} else if ( ! Object.hasOwn( schema.properties, key ) ) {
			warnings.push( {
				path: `/${ key }`,
				message: 'Not part of the configuration schema.',
			} );
		}
	}

	return {
		valid: validation.valid,
		errors,
		warnings,
		normalised,
		values,
	};
}

/**
 * List the configuration values that differ between two previews.
 *
 * @param {Object} before Values from the earlier preview.
 * @param {Object} after  Values from this preview.
 * @return {{field: string, before: *, after: *}[]} Changes.
 */
function diffValues( before, after ) {
	const keys = new Set( [
		...Object.keys( before ),
		...Object.keys( after ),
	] );
	return [ ...keys ]
		.sort()
		.filter(
			( key ) =>
				JSON.stringify( before[ key ] ) !==
				JSON.stringify( after[ key ] )
		)
		.map( ( key ) => ( {
			field: key,
			before: before[ key ],
			after: after[ key ],
		} ) );
}

module.exports = { validateConfiguration, diffValues };
