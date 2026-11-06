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

// How each derived value is worked out, for discover.
const DERIVED_FROM = {
	textdomain: 'the slug',
	namespace: 'the slug, with hyphens replaced by underscores',
	license_uri: 'the licence',
	tested_up_to: 'requires_wp',
	contributors: 'the author, lowercased, letters and numbers only',
	repository_url: 'https://github.com/lightspeedwp/<slug>',
};

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

/**
 * Describe the configuration the generator accepts, for discover.
 *
 * Defaults are the generator's own (applyDefaults), not the schema's
 * `default` values, which differ for blocks, author and author_uri.
 *
 * @return {Object} Description.
 */
function describeConfiguration() {
	const schema = loadSchema();
	const required = new Set( schema.required || [] );
	// Apply defaults to a minimal configuration to read the generator's own.
	const sample = { slug: 'example-plugin', name: 'Example', author: 'A' };
	const defaults = applyDefaults( sample );

	const fields = {};
	for ( const [ key, property ] of Object.entries( schema.properties ) ) {
		if ( key === '_comment' ) {
			continue;
		}
		const field = {
			type: property.type,
			required: required.has( key ),
			description: property.description,
		};
		for ( const rule of [
			'pattern',
			'enum',
			'minLength',
			'maxLength',
			'examples',
			'items',
		] ) {
			if ( property[ rule ] !== undefined ) {
				field[ rule ] = property[ rule ];
			}
		}
		if ( required.has( key ) ) {
			field.default = null;
		} else if ( DERIVED_FROM[ key ] ) {
			field.default = { derived: DERIVED_FROM[ key ] };
		} else if ( key === 'content_model' ) {
			// The generator treats an absent content_model as "custom".
			field.default = 'custom';
		} else if (
			defaults[ key ] !== undefined &&
			! Object.hasOwn( sample, key )
		) {
			field.default = defaults[ key ];
		} else {
			field.default = null;
		}
		fields[ key ] = field;
	}

	return {
		fields,
		combinations: [
			'content_model "custom" (the default): post_types, taxonomies and fields are allowed; each post type gets its own collection block.',
			'content_model "none": a functional-only plugin. post_types, taxonomies, fields and the legacy cpt_slug and name_singular must be empty or absent.',
			'Each taxonomy lists the post_types it attaches to; each fields entry is a field group for one post type.',
		],
		limits: [
			'slug: 3 to 50 characters, lowercase letters, numbers and hyphens.',
			'Post type slugs: up to 20 characters (the WordPress limit).',
			'Taxonomy slugs: up to 32 characters (the WordPress limit).',
			'blocks: only "collection" is accepted.',
		],
		destination:
			'The final folder for the plugin. Defaults to generated-plugins/<slug> in the scaffold checkout. See the contract for refused folders.',
		contract: 'docs/MCP-PLUGIN-GENERATION.md',
	};
}

module.exports = { validateConfiguration, diffValues, describeConfiguration };
