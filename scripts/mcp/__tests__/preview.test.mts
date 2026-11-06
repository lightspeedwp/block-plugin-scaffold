/**
 * Preview, approval and destination rules (BPS-12, T3).
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { describeConfiguration, validateConfiguration } from '../config.mts';
import {
	PREVIEW_TTL_MS,
	assertPreviewCurrent,
	canonicalJson,
	createPreview,
	discardPreview,
	getApprovedPreview,
	resolveDestination,
} from '../preview.mts';
import { SCAFFOLD, fixture, tempDir, thrown } from './helpers.mts';

type Preview = Record< string, any >;

const work = tempDir( 'preview' );
afterAll( () => fs.rmSync( work, { recursive: true, force: true } ) );

const cfg = fixture( { slug: 'tsp-preview' } );
const approve = ( p: Preview ) => ( {
	previewId: p.previewId,
	approvalHash: p.approvalHash,
	approved: true,
} );
const preview = ( destination: string, overrides = {} ): Preview =>
	createPreview( {
		config: { ...cfg, ...overrides },
		destination,
		detail: 'full',
	} );
const byPath = ( p: Preview ) =>
	Object.fromEntries(
		p.files.map( ( file: Preview ) => [ file.path, file ] )
	);

describe( 'configuration', () => {
	it( 'reports the generator defaults, not the schema defaults', () => {
		const fields = describeConfiguration().fields as Preview;
		expect( fields.blocks.default ).toEqual( [] );
		expect( fields.author.required ).toBe( true );
		expect( fields.author.default ).toBeNull();
		expect( fields.content_model.default ).toBe( 'custom' );
		expect( fields.namespace.default ).toEqual( {
			derived: 'the slug, with hyphens replaced by underscores',
		} );
	} );

	it( 'marks each value supplied, derived or default', () => {
		const result = validateConfiguration( cfg );
		expect( result.valid ).toBe( true );
		expect( result.normalised.slug.source ).toBe( 'supplied' );
		expect( result.normalised.textdomain.source ).toBe( 'derived' );
		expect( result.normalised.requires_wp.source ).toBe( 'default' );
		expect(
			result.warnings.some( ( w ) => w.path === '/repository_url' )
		).toBe( true );
	} );

	it( 'warns about legacy and unknown fields', () => {
		const result = validateConfiguration( {
			...cfg,
			cpt_slug: 'tour',
			not_a_field: true,
		} );
		const paths = result.warnings.map( ( w ) => w.path );
		expect( paths ).toContain( '/cpt_slug' );
		expect( paths ).toContain( '/not_a_field' );
		expect( result.normalised.cpt_slug.source ).toBe( 'supplied' );
	} );

	it( 'rejects a configuration that is not an object', () => {
		for ( const value of [ null, 'text', [ 1 ] ] ) {
			expect( validateConfiguration( value ).valid ).toBe( false );
		}
	} );

	it( 'lists every broken rule', () => {
		const result = validateConfiguration( {
			slug: 'Bad Slug',
			name: 'X',
		} );
		expect( result.valid ).toBe( false );
		expect( result.errors.length ).toBeGreaterThanOrEqual( 2 );
	} );

	it( 'hashes equal values equally, whatever the key order', () => {
		expect( canonicalJson( { b: 1, a: [ { d: undefined, c: 2 } ] } ) ).toBe(
			canonicalJson( { a: [ { c: 2, d: null } ], b: 1 } )
		);
	} );
} );

describe( 'preview into a new folder', () => {
	const dest = path.join( work, 'dest-new' );
	let first: Preview;

	it( 'plans every path as create and touches nothing', () => {
		first = preview( dest );
		expect( first.destination.exists ).toBe( false );
		expect( first.summary.create ).toBe( first.files.length );
		expect( first.summary.conflict ).toBe( 0 );
		expect( first.processEffects.stagingFolder ).toBeTruthy();
		expect( fs.existsSync( dest ) ).toBe( false );
	} );

	it( 'accepts only the matching approval', () => {
		expect( getApprovedPreview( approve( first ) ).previewId ).toBe(
			first.previewId
		);
		assertPreviewCurrent( getApprovedPreview( approve( first ) ) );
		for ( const bad of [
			{ ...approve( first ), approvalHash: 'x' },
			{ ...approve( first ), approved: false },
			{ ...approve( first ), approved: 'yes' as unknown as boolean },
		] ) {
			expect( thrown( () => getApprovedPreview( bad ) ).code ).toBe(
				'APPROVAL_MISMATCH'
			);
		}
		expect(
			thrown( () =>
				getApprovedPreview( { ...approve( first ), previewId: 'nope' } )
			).code
		).toBe( 'PREVIEW_NOT_FOUND' );
	} );

	it( 'lists configuration changes and replaces the older preview', () => {
		const second = createPreview( {
			config: { ...cfg, name: 'TSP Preview Renamed' },
			destination: dest,
			previousPreviewId: first.previewId,
		} ) as Preview;
		expect(
			second.configuration.changesSincePreviousPreview.map(
				( c: Preview ) => c.field
			)
		).toContain( 'name' );
		expect( second.approvalHash ).not.toBe( first.approvalHash );
		expect( fs.existsSync( first.processEffects.stagingFolder ) ).toBe(
			false
		);
		expect(
			thrown( () => getApprovedPreview( approve( first ) ) ).code
		).toBe( 'PREVIEW_NOT_FOUND' );

		// The default summary is compact: no create paths, counts by folder.
		expect( second.files ).toEqual( [] );
		expect( Object.keys( second.createByFolder ).length ).toBeGreaterThan(
			0
		);
		expect( JSON.stringify( second ).length ).toBeLessThan( 20000 );
		discardPreview( second.previewId );
		discardPreview( 'unknown' );
	} );

	it( 'reports nothing when the earlier preview is unknown', () => {
		const p = createPreview( {
			config: cfg,
			destination: path.join( work, 'dest-unknown-previous' ),
			previousPreviewId: 'unknown',
		} ) as Preview;
		expect( p.configuration.changesSincePreviousPreview ).toBeNull();
		discardPreview( p.previewId );
	} );
} );

describe( 'preview into an existing folder', () => {
	it( 'classifies changed, identical, clashing and linked paths', () => {
		const dest = path.join( work, 'dest-existing' );
		fs.mkdirSync( path.join( dest, '.git' ), { recursive: true } );
		fs.writeFileSync( path.join( dest, '.git', 'HEAD' ), 'ref\n' );
		fs.writeFileSync( path.join( dest, 'notes.txt' ), 'mine\n' );
		fs.mkdirSync( path.join( dest, 'src' ) );
		fs.writeFileSync( path.join( dest, 'src', 'custom.js' ), 'x\n' );
		fs.writeFileSync( path.join( dest, 'README.md' ), 'old\n' );
		fs.mkdirSync( path.join( dest, 'composer.json' ) );
		fs.writeFileSync( path.join( dest, 'bin' ), 'a file\n' );
		const elsewhere = path.join( work, 'elsewhere' );
		fs.mkdirSync( elsewhere );
		fs.symlinkSync( elsewhere, path.join( dest, 'src', 'blocks' ) );
		fs.symlinkSync( elsewhere, path.join( dest, 'uninstall.php' ) );

		const reference = preview( path.join( work, 'reference' ) );
		const staged = path.join(
			reference.processEffects.stagingFolder,
			'plugin'
		);
		fs.copyFileSync(
			path.join( staged, 'package.json' ),
			path.join( dest, 'package.json' )
		);

		const p = preview( dest );
		const files = byPath( p );
		expect( files[ 'README.md' ].action ).toBe( 'overwrite' );
		expect( files[ 'package.json' ].action ).toBe( 'unchanged' );
		expect( files[ 'composer.json' ].action ).toBe( 'conflict' );
		expect( files[ 'uninstall.php' ].action ).toBe( 'conflict' );
		expect( files.bin.action ).toBe( 'conflict' );
		const underFile = p.files.filter( ( f: Preview ) =>
			f.path.startsWith( 'bin/' )
		);
		expect( underFile.length ).toBeGreaterThan( 0 );
		expect(
			underFile.every( ( f: Preview ) => f.action === 'conflict' )
		).toBe( true );
		const linked = p.files.filter( ( f: Preview ) =>
			f.path.startsWith( 'src/blocks' )
		);
		expect( linked.length ).toBeGreaterThan( 1 );
		expect(
			linked.every( ( f: Preview ) => f.action === 'conflict' )
		).toBe( true );
		expect( p.preserved.hasGit ).toBe( true );
		expect( p.preserved.count ).toBeGreaterThanOrEqual( 2 );
		expect(
			fs.readFileSync( path.join( dest, 'README.md' ), 'utf8' )
		).toBe( 'old\n' );

		expect(
			thrown( () =>
				assertPreviewCurrent( getApprovedPreview( approve( p ) ) )
			).code
		).toBe( 'CONFLICT' );
	} );

	it( 'goes stale when a planned path changes, not an unrelated one', () => {
		const dest = path.join( work, 'dest-clean' );
		fs.mkdirSync( dest );
		fs.writeFileSync( path.join( dest, 'README.md' ), 'old\n' );
		fs.writeFileSync( path.join( dest, 'unrelated.txt' ), 'keep\n' );

		let p = preview( dest );
		fs.rmSync( path.join( dest, 'unrelated.txt' ) );
		assertPreviewCurrent( getApprovedPreview( approve( p ) ) );
		fs.writeFileSync( path.join( dest, 'README.md' ), 'edited\n' );
		expect(
			thrown( () =>
				assertPreviewCurrent( getApprovedPreview( approve( p ) ) )
			).code
		).toBe( 'STALE_PREVIEW' );

		p = preview( dest );
		fs.writeFileSync( path.join( dest, 'composer.json' ), '{}\n' );
		expect(
			thrown( () =>
				assertPreviewCurrent( getApprovedPreview( approve( p ) ) )
			).code
		).toBe( 'STALE_PREVIEW' );

		p = preview( dest );
		fs.renameSync( dest, `${ dest }-moved` );
		fs.symlinkSync( `${ dest }-moved`, dest );
		expect(
			thrown( () =>
				assertPreviewCurrent( getApprovedPreview( approve( p ) ) )
			).code
		).toBe( 'STALE_PREVIEW' );
		discardPreview( p.previewId );
	} );
} );

describe( 'preview lifetime and failures', () => {
	it( 'expires after 30 minutes and removes its staging folder', () => {
		const p = preview( path.join( work, 'dest-expiry' ) );
		const later = () => new Date( Date.now() + PREVIEW_TTL_MS + 60000 );
		expect(
			thrown( () => getApprovedPreview( approve( p ), { now: later } ) )
				.code
		).toBe( 'PREVIEW_NOT_FOUND' );
		expect( fs.existsSync( p.processEffects.stagingFolder ) ).toBe( false );
	} );

	it( 'reports invalid configuration and staging failures', () => {
		const dest = path.join( work, 'x' );
		expect(
			thrown( () =>
				createPreview( {
					config: { slug: 'x-plugin', name: 'X' },
					destination: dest,
				} )
			).code
		).toBe( 'INVALID_CONFIG' );
		expect(
			thrown( () =>
				createPreview( {
					config: { ...cfg, content_model: 'none' },
					destination: dest,
				} )
			).code
		).toBe( 'INVALID_CONFIG' );
		expect(
			thrown( () =>
				createPreview(
					{ config: cfg, destination: dest },
					{ tmpDir: path.join( work, 'no-such-folder' ) }
				)
			).code
		).toBe( 'STAGING_FAILED' );
		expect(
			thrown( () =>
				createPreview( {
					config: { ...cfg, blocks: [ 'not-a-block' ] },
					destination: dest,
				} )
			).code
		).toBe( 'INVALID_CONFIG' );
	} );
} );

describe( 'destination rules', () => {
	const home = os.homedir();
	const linkDest = path.join( work, 'link-dest' );
	const aFile = path.join( work, 'a-file' );
	fs.symlinkSync( work, linkDest );
	fs.writeFileSync( aFile, '' );

	it.each( [
		[ 'an empty path', '' ],
		[ 'a non-string', 42 ],
		[ 'a relative path', 'plugins/tsp' ],
		[ 'a ".." segment', `${ work }/../escape` ],
		[ 'the filesystem root', '/' ],
		[ 'the home folder', home ],
		[ 'the home folder via ~', '~' ],
		[ '/System', '/System/tsp' ],
		[ '/Library', '/Library/tsp' ],
		[ '/usr/local', '/usr/local/tsp' ],
		[ '/private/etc', '/private/etc/tsp' ],
		[ 'the scaffold root', SCAFFOLD ],
		[ 'scaffold scripts', path.join( SCAFFOLD, 'scripts', 'tsp' ) ],
		[
			'generated-plugins itself',
			path.join( SCAFFOLD, 'generated-plugins' ),
		],
		[ 'a symbolic link', linkDest ],
		[ 'an existing file', aFile ],
		[ 'a missing parent', path.join( work, 'no', 'such', 'tsp' ) ],
		[ 'a file as parent', path.join( aFile, 'tsp' ) ],
	] )( 'refuses %s', ( _label, destination ) => {
		expect(
			thrown( () => resolveDestination( destination, 'tsp' ) ).code
		).toBe( 'UNSAFE_DESTINATION' );
	} );

	it.each( [
		[
			'the default',
			undefined,
			path.join(
				fs.realpathSync( SCAFFOLD ),
				'generated-plugins',
				'tsp'
			),
		],
		[
			'a folder in generated-plugins',
			path.join( SCAFFOLD, 'generated-plugins', 'tsp' ),
			path.join(
				fs.realpathSync( SCAFFOLD ),
				'generated-plugins',
				'tsp'
			),
		],
		[
			'a home subfolder via ~/',
			'~/tsp-plugin',
			path.join( fs.realpathSync( home ), 'tsp-plugin' ),
		],
		[
			'the temporary folder, by its real path',
			path.join( os.tmpdir(), 'tsp' ),
			path.join( fs.realpathSync( os.tmpdir() ), 'tsp' ),
		],
	] )( 'allows %s', ( _label, destination, expected ) => {
		expect( resolveDestination( destination, 'tsp' ).path ).toBe(
			expected
		);
	} );
	it( 'creates generated-plugins/ for the default on a fresh checkout only', () => {
		const fresh = path.join( work, 'fresh-checkout' );
		fs.mkdirSync( fresh );
		const resolved = resolveDestination( undefined, 'tsp', {
			scaffoldDir: fresh,
		} );
		expect( resolved ).toEqual( {
			path: path.join( fresh, 'generated-plugins', 'tsp' ),
			exists: false,
			createParent: true,
		} );
		expect( fs.existsSync( path.join( fresh, 'generated-plugins' ) ) ).toBe(
			false
		);
		expect(
			thrown( () =>
				resolveDestination(
					path.join( fresh, 'generated-plugins', 'tsp' ),
					'tsp',
					{ scaffoldDir: fresh }
				)
			).code
		).toBe( 'UNSAFE_DESTINATION' );
		expect( resolveDestination( undefined, 'tsp' ).createParent ).toBe(
			false
		);
	} );
} );
