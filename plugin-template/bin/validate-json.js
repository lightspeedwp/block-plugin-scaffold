/**
 * Validate block.json files against the WordPress block metadata schema.
 *
 * Usage: node bin/validate-json.js [file ...]
 * With no files, every src/blocks/<block>/block.json is checked.
 * The schema is a copy of https://schemas.wordpress.org/block/6.9/block.json.
 */
const fs = require( 'node:fs' );
const Ajv = require( 'ajv' );
const { globSync } = require( 'glob' );

const schema = require( './schemas/block.json' );

// strict: false, because the WordPress schema uses annotation keys Ajv does not know.
const validate = new Ajv( { allErrors: true, strict: false } ).compile(
	schema
);

const files =
	process.argv.length > 2
		? process.argv.slice( 2 )
		: globSync( 'src/blocks/*/block.json' ).sort();

const errors = [];

for ( const file of files ) {
	let data;
	try {
		data = JSON.parse( fs.readFileSync( file, 'utf8' ) );
	} catch ( error ) {
		errors.push( `${ file }: ${ error.message }` );
		continue;
	}

	if ( ! validate( data ) ) {
		for ( const error of validate.errors ) {
			errors.push(
				`${ file }: ${ error.instancePath || '/' } ${ error.message }`
			);
		}
	}
}

if ( errors.length ) {
	process.stderr.write( `${ errors.join( '\n' ) }\n` );
	process.exitCode = 1;
} else {
	process.stdout.write( `${ files.length } block.json file(s) valid.\n` );
}
