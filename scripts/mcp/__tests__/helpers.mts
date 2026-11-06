/**
 * Shared helpers for the MCP generation tests (BPS-12).
 */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const SCAFFOLD = path.resolve( import.meta.dirname, '../../..' );

/** A fixed clock, so generated output can be compared exactly. */
export const fixedNow = () => new Date( '2026-01-02T03:04:05.000Z' );

/**
 * The default generation fixture, with optional overrides.
 *
 * @param overrides Values to replace.
 * @return Configuration.
 */
export function fixture(
	overrides: Record< string, unknown > = {}
): Record< string, unknown > {
	const base = JSON.parse(
		fs.readFileSync(
			path.join( SCAFFOLD, 'tests/fixtures/generation/default.json' ),
			'utf8'
		)
	);
	return { ...base, ...overrides };
}

/**
 * A new empty temporary folder (its real path).
 *
 * @param prefix Folder name prefix.
 * @return Path.
 */
export function tempDir( prefix: string ): string {
	return fs.realpathSync(
		fs.mkdtempSync( path.join( os.tmpdir(), `bps-test-${ prefix }-` ) )
	);
}

/**
 * Every path in a tree, with its type, content hash, mode and (optionally)
 * modification time, without following links.
 *
 * @param root    Folder.
 * @param options Whether to include modification times.
 * @return Signature per relative path.
 */
export function snapshot(
	root: string,
	{ mtime = true }: { mtime?: boolean } = {}
): Record< string, string > {
	const out: Record< string, string > = {};
	const walk = ( dir: string ) => {
		for ( const name of fs.readdirSync( dir ) ) {
			const full = path.join( dir, name );
			const rel = path.relative( root, full );
			const stat = fs.lstatSync( full );
			let sig: string;
			if ( stat.isSymbolicLink() ) {
				sig = `link:${ fs.readlinkSync( full ) }`;
			} else if ( stat.isDirectory() ) {
				sig = 'dir';
			} else {
				sig = `file:${ crypto
					.createHash( 'sha256' )
					.update( fs.readFileSync( full ) )
					.digest( 'hex' ) }`;
			}
			const time =
				mtime && ! stat.isDirectory() ? `:${ stat.mtimeMs }` : '';
			out[ rel ] = `${ sig }:${ ( stat.mode & 0o7777 ).toString(
				8
			) }${ time }`;
			if ( stat.isDirectory() && ! stat.isSymbolicLink() ) {
				walk( full );
			}
		}
	};
	walk( root );
	return out;
}

/**
 * Lines of `diff -r` between two trees, comparing links as links.
 *
 * @param a First folder.
 * @param b Second folder.
 * @return Differences; empty when identical.
 */
export function diffTrees( a: string, b: string ): string[] {
	try {
		execFileSync( 'diff', [ '-r', '--no-dereference', a, b ], {
			encoding: 'utf8',
		} );
		return [];
	} catch ( error ) {
		return String( ( error as { stdout?: string } ).stdout || '' )
			.split( '\n' )
			.filter( Boolean );
	}
}

/**
 * Call a function and return what it threw.
 *
 * @param fn Function.
 * @return The thrown value, with its contract code if any.
 */
export function thrown( fn: () => unknown ): {
	code?: string;
	message: string;
	details?: Record< string, any >;
} {
	try {
		fn();
	} catch ( error ) {
		return error as {
			code?: string;
			message: string;
			details?: Record< string, any >;
		};
	}
	throw new Error( 'Expected an error, but none was thrown' );
}
