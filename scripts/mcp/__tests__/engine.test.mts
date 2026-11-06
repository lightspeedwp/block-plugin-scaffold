/**
 * The generator engine as the MCP server uses it (BPS-12, T2): no side
 * effects on import, nothing on standard output, a log per call, and output
 * that matches the CLI.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { generatePlugin } from '../generator.mts';
import { SCAFFOLD, diffTrees, fixedNow, fixture, tempDir } from './helpers.mts';

const work = tempDir( 'engine' );
afterAll( () => fs.rmSync( work, { recursive: true, force: true } ) );

describe( 'engine boundary', () => {
	it( 'writes nothing and registers no process handlers on import', () => {
		const probe = `
const fs = await import('node:fs');
const calls = [];
for (const k of ['mkdirSync', 'writeFileSync', 'rmSync', 'mkdtempSync']) {
	const original = fs.default[k];
	fs.default[k] = (...a) => { calls.push(k + ' ' + a[0]); return original(...a); };
}
const handlers = [];
const on = process.on.bind(process);
process.on = (e, ...r) => { handlers.push(e); return on(e, ...r); };
await import(${ JSON.stringify(
			path.join( SCAFFOLD, 'scripts/mcp/preview.mts' )
		) });
process.stdout.write(JSON.stringify({ calls, handlers }));`;
		const out = execFileSync(
			process.execPath,
			[ '--input-type=module', '-e', probe ],
			{ encoding: 'utf8' }
		);
		expect( JSON.parse( out ) ).toEqual( { calls: [], handlers: [] } );
	} );

	it( 'keeps standard output empty and logs each call separately', () => {
		const one = path.join( work, 'one.log' );
		const two = path.join( work, 'two.log' );
		const script = `
import engine from ${ JSON.stringify(
			path.join( SCAFFOLD, 'scripts/generate-plugin.js' )
		) };
const cfg = ${ JSON.stringify( fixture() ) };
const now = () => new Date('2026-01-02T03:04:05.000Z');
engine.generatePlugin({ ...cfg, slug: 'probe-one' }, { outputDir: ${ JSON.stringify(
			path.join( work, 'probe-one' )
		) }, now, logFile: ${ JSON.stringify( one ) } });
engine.generatePlugin({ ...cfg, slug: 'probe-two' }, { outputDir: ${ JSON.stringify(
			path.join( work, 'probe-two' )
		) }, now, logFile: ${ JSON.stringify( two ) } });`;
		const child = spawnSync(
			process.execPath,
			[ '--input-type=module', '-e', script ],
			{ encoding: 'utf8' }
		);
		expect( child.status ).toBe( 0 );
		expect( child.stdout ).toBe( '' );

		const first = fs.readFileSync( one, 'utf8' );
		const second = fs.readFileSync( two, 'utf8' );
		expect( first ).toContain( 'probe-one' );
		expect( first ).not.toContain( 'probe-two' );
		expect( second ).toContain( 'probe-two' );
		expect( second ).not.toContain( 'probe-one' );
		for ( const entry of JSON.parse( first ) ) {
			expect( entry.timestamp ).toBe( '2026-01-02T03:04:05.000Z' );
		}
	} );

	it( 'produces identical output for the same configuration and clock', () => {
		const options = { now: fixedNow, output: false as const };
		const a = generatePlugin( fixture(), {
			...options,
			outputDir: path.join( work, 'a', 'gen-check' ),
			logFile: path.join( work, 'a.log' ),
		} );
		const b = generatePlugin( fixture(), {
			...options,
			outputDir: path.join( work, 'b', 'gen-check' ),
			logFile: path.join( work, 'b.log' ),
		} );
		expect( diffTrees( a, b ) ).toEqual( [] );
	} );

	it( 'matches the CLI apart from the .pot creation date', () => {
		const config = path.join( work, 'cli-config.json' );
		fs.writeFileSync( config, JSON.stringify( fixture() ) );
		const cliBase = path.join( work, 'cli' );
		const cli = spawnSync(
			process.execPath,
			[
				path.join( SCAFFOLD, 'scripts/generate-plugin.js' ),
				'--config',
				config,
				'--output-dir',
				cliBase,
			],
			{ encoding: 'utf8', cwd: SCAFFOLD }
		);
		expect( cli.status ).toBe( 0 );
		const library = generatePlugin( fixture(), {
			now: fixedNow,
			output: false,
			outputDir: path.join( work, 'library', 'gen-check' ),
			logFile: path.join( work, 'library.log' ),
		} );
		const differences = diffTrees(
			library,
			path.join( cliBase, 'gen-check' )
		).filter(
			( line ) =>
				! /POT-Creation-Date|^diff -r|^---$|^\d+c\d+$/.test( line )
		);
		expect( differences ).toEqual( [] );
	} );

	it( 'keeps the author URI when it is set', () => {
		const dir = generatePlugin( fixture( { slug: 'with-author-uri' } ), {
			outputDir: path.join( work, 'with-author-uri' ),
			now: fixedNow,
			output: false,
			logFile: path.join( work, 'with-author-uri.log' ),
		} );
		const uri = fixture().author_uri as string;
		expect(
			fs.readFileSync( path.join( dir, 'with-author-uri.php' ), 'utf8' )
		).toContain( ` * Author URI:        ${ uri }\n * License:` );
		expect(
			JSON.parse(
				fs.readFileSync( path.join( dir, 'composer.json' ), 'utf8' )
			).authors[ 0 ].homepage
		).toBe( uri );
	} );

	it( 'leaves the author URI out of composer.json and the header when it is not set', () => {
		const config = fixture( { slug: 'no-author-uri' } );
		delete config.author_uri;
		const dir = generatePlugin( config, {
			outputDir: path.join( work, 'no-author-uri' ),
			now: fixedNow,
			output: false,
			logFile: path.join( work, 'no-author-uri.log' ),
		} );
		const composer = JSON.parse(
			fs.readFileSync( path.join( dir, 'composer.json' ), 'utf8' )
		);
		// Composer rejects an empty homepage URL, so it is left out.
		expect( composer.authors ).toEqual( [ { name: config.author } ] );
		// No empty "Author URI:" header line, which PHPCS flags.
		const header = fs.readFileSync(
			path.join( dir, 'no-author-uri.php' ),
			'utf8'
		);
		expect( header ).not.toContain( 'Author URI' );
		expect( header ).not.toMatch( /[ \t]$/m );
	} );
} );
