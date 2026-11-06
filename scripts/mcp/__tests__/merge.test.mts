/**
 * Preservation-safe merge into the destination (BPS-12, T4).
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { generatePlugin } from '../generator.mts';
import { generateFromPreview } from '../merge.mts';
import { createPreview } from '../preview.mts';
import {
	diffTrees,
	fixedNow,
	fixture,
	snapshot,
	tempDir,
	thrown,
} from './helpers.mts';

type Preview = Record< string, any >;

const work = tempDir( 'merge' );
afterAll( () => fs.rmSync( work, { recursive: true, force: true } ) );

const cfg = fixture( {
	slug: 'tsp-merge',
	repository_url: 'https://github.com/lightspeedwp/tsp-merge',
} );
const now = fixedNow;
const approve = ( p: Preview ) => ( {
	previewId: p.previewId,
	approvalHash: p.approvalHash,
	approved: true,
} );
const preview = ( destination: string ): Preview =>
	createPreview( { config: cfg, destination, detail: 'full' }, { now } );

let reference: string;
beforeAll( () => {
	reference = generatePlugin( cfg, {
		outputDir: path.join( work, 'reference', 'tsp-merge' ),
		now,
		output: false,
		logFile: path.join( work, 'reference.log' ),
	} );
} );

describe( 'a new destination', () => {
	const dest = path.join( work, 'fresh' );
	let first: Preview;

	it( 'matches the generator output exactly', () => {
		first = preview( dest );
		const result = generateFromPreview( approve( first ), { now } );
		expect( diffTrees( reference, dest ) ).toEqual( [] );
		expect( result.written ).toHaveLength( first.summary.create );
		expect( result.backupFolder ).toBeNull();
		expect( fs.existsSync( first.processEffects.stagingFolder ) ).toBe(
			false
		);
		const journal = fs.readFileSync( result.journal, 'utf8' ).trim();
		expect( journal.split( '\n' ).pop() ).toContain( '"op":"done"' );
		const link = '.claude/skills/test';
		expect( fs.lstatSync( path.join( dest, link ) ).isSymbolicLink() ).toBe(
			true
		);
		expect( fs.readlinkSync( path.join( dest, link ) ) ).toBe(
			fs.readlinkSync( path.join( reference, link ) )
		);
	} );

	it( 'refuses to replay a used approval', () => {
		expect(
			thrown( () => generateFromPreview( approve( first ), { now } ) )
				.code
		).toBe( 'PREVIEW_NOT_FOUND' );
	} );

	it( 'changes nothing, not even modification times, when run again', () => {
		const before = snapshot( dest );
		const again = preview( dest );
		expect( again.summary.unchanged ).toBe( again.files.length );
		const result = generateFromPreview( approve( again ), { now } );
		expect( result.written ).toEqual( [] );
		expect( snapshot( dest ) ).toEqual( before );
	} );
} );

describe( 'an existing Git repository', () => {
	it( 'overwrites planned files, backs them up, and leaves the rest alone', () => {
		const repo = path.join( work, 'repo' );
		fs.mkdirSync( repo );
		execFileSync( 'git', [ 'init', '-q', repo ] );
		fs.writeFileSync( path.join( repo, 'README.md' ), 'client readme\n' );
		fs.mkdirSync( path.join( repo, 'src' ) );
		fs.writeFileSync(
			path.join( repo, 'src', 'custom.js' ),
			'export const custom = 1;\n'
		);
		fs.writeFileSync( path.join( repo, 'notes.md' ), 'keep me\n' );
		fs.mkdirSync( path.join( repo, 'vendor-local' ) );
		fs.writeFileSync(
			path.join( repo, 'vendor-local', 'tool.sh' ),
			'#!/bin/sh\n'
		);
		fs.chmodSync( path.join( repo, 'vendor-local', 'tool.sh' ), 0o755 );
		fs.writeFileSync(
			path.join( repo, 'package.json' ),
			'{"name":"old"}\n'
		);
		fs.chmodSync( path.join( repo, 'package.json' ), 0o444 );
		fs.mkdirSync( path.join( repo, 'sub', '.git' ), { recursive: true } );
		fs.writeFileSync(
			path.join( repo, 'sub', '.git', 'config' ),
			'[core]\n'
		);
		fs.writeFileSync(
			path.join( repo, '.gitmodules' ),
			'[submodule "x"]\n'
		);
		execFileSync( 'git', [ '-C', repo, 'add', '-A' ] );
		execFileSync( 'git', [
			'-C',
			repo,
			'-c',
			'user.email=t@example.com',
			'-c',
			'user.name=t',
			'commit',
			'-qm',
			'client',
		] );
		const gitBefore = snapshot( path.join( repo, '.git' ) );
		const subGitBefore = snapshot( path.join( repo, 'sub', '.git' ) );
		const unrelated = [
			'src/custom.js',
			'notes.md',
			'vendor-local/tool.sh',
			'.gitmodules',
		];
		const before = snapshot( repo );

		const p = preview( repo );
		const files = Object.fromEntries(
			p.files.map( ( f: Preview ) => [ f.path, f ] )
		);
		expect( files[ 'README.md' ].action ).toBe( 'overwrite' );
		expect( files[ 'package.json' ].action ).toBe( 'overwrite' );
		expect( p.summary.conflict ).toBe( 0 );

		const result = generateFromPreview( approve( p ), { now } );
		const after = snapshot( repo );
		expect( snapshot( path.join( repo, '.git' ) ) ).toEqual( gitBefore );
		expect( snapshot( path.join( repo, 'sub', '.git' ) ) ).toEqual(
			subGitBefore
		);
		for ( const file of unrelated ) {
			expect( after[ file ] ).toBe( before[ file ] );
		}
		expect(
			fs.readFileSync(
				path.join( result.backupFolder as string, 'README.md' ),
				'utf8'
			)
		).toBe( 'client readme\n' );
		expect(
			fs.readFileSync(
				path.join( result.backupFolder as string, 'package.json' ),
				'utf8'
			)
		).toBe( '{"name":"old"}\n' );
		expect(
			fs.readFileSync( path.join( repo, 'README.md' ), 'utf8' )
		).toBe(
			fs.readFileSync( path.join( reference, 'README.md' ), 'utf8' )
		);
		const status = execFileSync(
			'git',
			[ '-C', repo, 'status', '--porcelain' ],
			{ encoding: 'utf8' }
		);
		expect(
			status.split( '\n' ).filter( ( l ) => /^ D|^D /.test( l ) )
		).toEqual( [] );
		expect(
			Object.keys( snapshot( repo, { mtime: false } ) ).filter( ( f ) =>
				f.includes( '.bps-' )
			)
		).toEqual( [] );
	} );
} );

describe( 'links and failures', () => {
	it( 'blocks on links and writes nothing through them', () => {
		const linked = path.join( work, 'linked' );
		const outside = path.join( work, 'outside' );
		fs.mkdirSync( path.join( linked, 'src' ), { recursive: true } );
		fs.mkdirSync( outside );
		fs.writeFileSync( path.join( outside, 'keep.txt' ), 'outside\n' );
		fs.symlinkSync( outside, path.join( linked, 'src', 'blocks' ) );
		fs.symlinkSync(
			path.join( outside, 'keep.txt' ),
			path.join( linked, 'README.md' )
		);
		const linkedBefore = snapshot( linked );
		const outsideBefore = snapshot( outside );

		const p = preview( linked );
		const failure = thrown( () =>
			generateFromPreview( approve( p ), { now } )
		);
		expect( failure.code ).toBe( 'CONFLICT' );
		expect( failure.details?.conflicts.length ).toBeGreaterThan( 1 );
		expect( snapshot( linked ) ).toEqual( linkedBefore );
		expect( snapshot( outside ) ).toEqual( outsideBefore );
	} );

	it( 'stops with PARTIAL_WRITE at a read-only folder, then completes', () => {
		const dest = path.join( work, 'perm' );
		fs.mkdirSync( path.join( dest, 'src' ), { recursive: true } );
		fs.writeFileSync( path.join( dest, 'README.md' ), 'perm readme\n' );
		const p = preview( dest );
		fs.chmodSync( path.join( dest, 'src' ), 0o555 );
		let failure;
		try {
			failure = thrown( () =>
				generateFromPreview( approve( p ), { now } )
			);
		} finally {
			fs.chmodSync( path.join( dest, 'src' ), 0o755 );
		}
		expect( failure.code ).toBe( 'PARTIAL_WRITE' );
		expect( failure.details?.failedAt.startsWith( 'src' ) ).toBe( true );
		expect( failure.details?.written.length ).toBeGreaterThan( 0 );
		expect( failure.details?.notWritten.length ).toBeGreaterThan( 0 );
		expect(
			fs.readFileSync(
				path.join( failure.details?.backupFolder, 'README.md' ),
				'utf8'
			)
		).toBe( 'perm readme\n' );
		expect( fs.readFileSync( failure.details?.journal, 'utf8' ) ).toContain(
			'"op":"failed"'
		);

		const retry = preview( dest );
		generateFromPreview( approve( retry ), { now } );
		expect( diffTrees( reference, dest ) ).toEqual( [] );
	} );

	it( 'leaves every file old or new when interrupted', () => {
		const dest = path.join( work, 'interrupted' );
		fs.mkdirSync( dest );
		fs.writeFileSync( path.join( dest, 'README.md' ), 'old\n' );
		const p = preview( dest );
		let count = 0;
		const failure = thrown( () =>
			generateFromPreview( approve( p ), {
				now,
				beforeWrite: () => {
					count++;
					if ( count === 40 ) {
						throw new Error( 'simulated crash' );
					}
				},
			} )
		);
		expect( failure.code ).toBe( 'PARTIAL_WRITE' );
		expect( failure.details?.written ).toHaveLength( 39 );
		for ( const rel of [
			...failure.details?.written,
			...failure.details?.notWritten,
		] ) {
			const target = path.join( dest, rel );
			if (
				! fs.existsSync( target ) ||
				fs.lstatSync( target ).isDirectory() ||
				fs.lstatSync( target ).isSymbolicLink()
			) {
				continue;
			}
			expect( [
				fs.readFileSync( path.join( reference, rel ), 'utf8' ),
				'old\n',
			] ).toContain( fs.readFileSync( target, 'utf8' ) );
		}
	} );

	it( 'does not overwrite a file edited while generating', () => {
		const dest = path.join( work, 'race' );
		fs.mkdirSync( dest );
		fs.writeFileSync( path.join( dest, 'README.md' ), 'before\n' );
		const p = preview( dest );
		const failure = thrown( () =>
			generateFromPreview( approve( p ), {
				now,
				beforeWrite: ( rel ) => {
					if ( rel === 'README.md' ) {
						fs.writeFileSync(
							path.join( dest, 'README.md' ),
							'edited mid-write\n'
						);
					}
				},
			} )
		);
		expect( failure.code ).toBe( 'PARTIAL_WRITE' );
		expect(
			fs.readFileSync( path.join( dest, 'README.md' ), 'utf8' )
		).toBe( 'edited mid-write\n' );
	} );

	it( 'stops when a folder on the way becomes a link mid-write', () => {
		const dest = path.join( work, 'race-link' );
		fs.mkdirSync( dest );
		const outside = path.join( work, 'race-outside' );
		fs.mkdirSync( outside );
		const p = preview( dest );
		const failure = thrown( () =>
			generateFromPreview( approve( p ), {
				now,
				beforeWrite: ( rel ) => {
					if ( rel === 'bin' ) {
						fs.symlinkSync( outside, path.join( dest, 'bin' ) );
					}
				},
			} )
		);
		expect( failure.code ).toBe( 'PARTIAL_WRITE' );
		expect( fs.readdirSync( outside ) ).toEqual( [] );
	} );

	it( 'is stale when the destination appears after the preview', () => {
		const dest = path.join( work, 'appears' );
		const p = preview( dest );
		fs.mkdirSync( dest );
		expect(
			thrown( () => generateFromPreview( approve( p ), { now } ) ).code
		).toBe( 'STALE_PREVIEW' );
	} );
} );
