/**
 * The MCP server and its four tools (BPS-12, T5).
 */

import fs from 'node:fs';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { createServer, run } from '../server.mts';
import { SCAFFOLD, fixture, tempDir } from './helpers.mts';

type Json = Record< string, any >;
type CallResult = { isError?: boolean; content: { text: string }[] };

const work = tempDir( 'server' );
afterAll( () => fs.rmSync( work, { recursive: true, force: true } ) );

const config = fixture( {
	slug: 'tsp-mcp',
	name: 'TSP MCP',
	repository_url: 'https://github.com/lightspeedwp/tsp-mcp',
} );
const parse = ( result: unknown ): Json =>
	JSON.parse( ( result as CallResult ).content[ 0 ].text );

describe( 'tool results', () => {
	it( 'turns unexpected errors into INTERNAL results, with the stack on standard error', () => {
		const stderr = vi
			.spyOn( process.stderr, 'write' )
			.mockImplementation( () => true );
		const result = run( () => {
			throw new Error( 'boom' );
		} );
		expect( stderr ).toHaveBeenCalledWith(
			expect.stringContaining( 'Error: boom' )
		);
		stderr.mockRestore();
		expect( result.isError ).toBe( true );
		expect( parse( result ).error.code ).toBe( 'INTERNAL' );
	} );
} );

describe( 'server over an in-memory transport', () => {
	const client = new Client( { name: 'bps12-test', version: '1.0.0' } );

	beforeAll( async () => {
		const [ clientSide, serverSide ] = InMemoryTransport.createLinkedPair();
		await createServer().connect( serverSide );
		await client.connect( clientSide );
	} );
	afterAll( () => client.close() );

	const call = ( name: string, args: Json = {} ) =>
		client.callTool( { name, arguments: args } ) as Promise< CallResult >;

	it( 'lists four annotated tools', async () => {
		const { tools } = await client.listTools();
		const byName = Object.fromEntries(
			tools.map( ( t ) => [ t.name, t ] )
		);
		expect( Object.keys( byName ).sort() ).toEqual( [
			'discover',
			'generate',
			'preview',
			'validate_config',
		] );
		expect( byName.discover.annotations?.readOnlyHint ).toBe( true );
		expect( byName.validate_config.annotations?.readOnlyHint ).toBe( true );
		expect( byName.preview.annotations?.destructiveHint ).toBe( false );
		expect( byName.generate.annotations?.destructiveHint ).toBe( true );
	} );

	it( 'discovers and validates', async () => {
		expect(
			parse( await call( 'discover' ) ).fields.blocks.default
		).toEqual( [] );
		expect(
			parse( await call( 'validate_config', { config } ) ).valid
		).toBe( true );
		const invalid = parse(
			await call( 'validate_config', {
				config: { slug: 'Bad Slug', name: 'X' },
			} )
		);
		expect( invalid.valid ).toBe( false );
	} );

	it( 'refuses unsafe destinations and unapproved generation', async () => {
		const unsafe = await call( 'preview', {
			config,
			destination: 'relative/folder',
		} );
		expect( unsafe.isError ).toBe( true );
		expect( parse( unsafe ).error.code ).toBe( 'UNSAFE_DESTINATION' );

		const dest = path.join( work, 'refused' );
		const p = parse(
			await call( 'preview', { config, destination: dest } )
		);
		const refused = await call( 'generate', {
			previewId: p.previewId,
			approvalHash: p.approvalHash,
			approved: false,
		} );
		expect( parse( refused ).error.code ).toBe( 'APPROVAL_MISMATCH' );
		expect( fs.existsSync( dest ) ).toBe( false );
	} );

	it( 'previews compactly and generates twice in one server', async () => {
		const dest = path.join( work, 'tsp-mcp' );
		const raw = await call( 'preview', { config, destination: dest } );
		const p = parse( raw );
		expect( raw.content[ 0 ].text.length ).toBeLessThan( 20000 );
		expect( p.summary.conflict ).toBe( 0 );

		const approval = {
			previewId: p.previewId,
			approvalHash: p.approvalHash,
			approved: true,
		};
		const generated = parse( await call( 'generate', approval ) );
		expect( generated.written ).toHaveLength( p.summary.create );
		expect( fs.existsSync( path.join( dest, 'tsp-mcp.php' ) ) ).toBe(
			true
		);
		expect( parse( await call( 'generate', approval ) ).error.code ).toBe(
			'PREVIEW_NOT_FOUND'
		);

		const second = { ...config, slug: 'tsp-mcp-two', name: 'TSP Two' };
		const p2 = parse(
			await call( 'preview', {
				config: second,
				destination: path.join( work, 'two' ),
				detail: 'full',
			} )
		);
		expect( p2.files.length ).toBe( p2.summary.create );
		await call( 'generate', {
			previewId: p2.previewId,
			approvalHash: p2.approvalHash,
			approved: true,
		} );
		expect(
			fs.existsSync( path.join( work, 'two', 'tsp-mcp-two.php' ) )
		).toBe( true );
		const log = fs.readFileSync( p2.processEffects.logFile, 'utf8' );
		expect( log ).not.toContain( '"tsp-mcp"' );
	} );
} );

describe( 'server over stdio', () => {
	it( 'starts from / and keeps standard output for the protocol', async () => {
		let stderr = '';
		const transport = new StdioClientTransport( {
			command: process.execPath,
			args: [ path.join( SCAFFOLD, 'scripts/mcp/server.mts' ) ],
			// Claude Desktop does not start servers in the scaffold.
			cwd: '/',
			stderr: 'pipe',
		} );
		transport.stderr?.on( 'data', ( chunk ) => ( stderr += chunk ) );
		const client = new Client( { name: 'bps12-stdio', version: '1.0.0' } );
		await client.connect( transport );
		const result = ( await client.callTool( {
			name: 'discover',
			arguments: {},
		} ) ) as CallResult;
		expect( parse( result ).contract ).toBe(
			'docs/MCP-PLUGIN-GENERATION.md'
		);
		await client.close();
		expect( stderr ).toContain( 'ready on stdio' );
		expect( stderr ).not.toContain( 'MODULE_TYPELESS_PACKAGE_JSON' );
	} );
} );
