/**
 * A generator failure during preview is reported as STAGING_FAILED and
 * leaves no staging folder (BPS-12, T3). The generator is replaced with one
 * that throws, so this lives in its own file.
 */

import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';

import { fixture, tempDir, thrown } from './helpers.mts';

vi.mock( '../generator.mts', async ( original ) => ( {
	...( await original< typeof import( '../generator.mts' ) >() ),
	generatePlugin: () => {
		throw new Error( 'simulated generator failure' );
	},
} ) );

const { createPreview } = await import( '../preview.mts' );

const work = tempDir( 'staging-failure' );
const staging = tempDir( 'staging-parent' );
afterAll( () => {
	fs.rmSync( work, { recursive: true, force: true } );
	fs.rmSync( staging, { recursive: true, force: true } );
} );

describe( 'staging failure', () => {
	it( 'reports STAGING_FAILED with the log, and removes the staging folder', () => {
		const failure = thrown( () =>
			createPreview(
				{
					config: fixture( { slug: 'tsp-fail' } ),
					destination: path.join( work, 'dest' ),
				},
				{ tmpDir: staging }
			)
		);
		expect( failure.code ).toBe( 'STAGING_FAILED' );
		expect( failure.message ).toContain( 'simulated generator failure' );
		expect( failure.details?.logFile ).toMatch( /mcp-tsp-fail-.*\.log$/ );
		expect( fs.readdirSync( staging ) ).toEqual( [] );
		expect( fs.existsSync( path.join( work, 'dest' ) ) ).toBe( false );
	} );
} );
