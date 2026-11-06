#!/usr/bin/env node
/**
 * Local MCP server for plugin generation (BPS-12).
 *
 * Exposes discover, validate_config, preview and generate over stdio for
 * Claude Desktop and Claude Code. Standard output carries protocol messages
 * only; everything else goes to standard error or the log files. The
 * contract is in docs/MCP-PLUGIN-GENERATION.md.
 *
 * Run: node scripts/mcp/server.ts (Node 24.18+ runs it directly, stripping
 * the types, so it uses only erasable TypeScript syntax).
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import pkg from '../../package.json' with { type: 'json' };
import { describeConfiguration, validateConfiguration } from './config.mts';
import { CODES, GenerationError } from './errors.mts';
import { generateFromPreview } from './merge.mts';
import { createPreview } from './preview.mts';

export interface ToolResult {
	[ key: string ]: unknown;
	isError?: boolean;
	content: { type: 'text'; text: string }[];
}

/**
 * A successful tool result.
 *
 * @param value Result.
 * @return MCP tool result.
 */
function ok( value: unknown ): ToolResult {
	return {
		content: [ { type: 'text', text: JSON.stringify( value, null, 2 ) } ],
	};
}

/**
 * Run a tool body and turn errors into contract error results.
 *
 * @param body Tool body.
 * @return MCP tool result.
 */
export function run( body: () => unknown ): ToolResult {
	try {
		return ok( body() );
	} catch ( error ) {
		const known =
			error instanceof GenerationError
				? error
				: new GenerationError(
						CODES.INTERNAL,
						( error as Error ).message,
						{}
					);
		if ( ! ( error instanceof GenerationError ) ) {
			process.stderr.write( `${ ( error as Error ).stack }\n` );
		}
		return {
			isError: true,
			content: [
				{
					type: 'text',
					text: JSON.stringify( { error: known.toJSON() }, null, 2 ),
				},
			],
		};
	}
}

const configSchema = z
	.record( z.string(), z.unknown() )
	.describe(
		'Plugin configuration. Requires slug, name and author; call discover for every field.'
	);

/**
 * Build the server with its four tools.
 *
 * @return Server.
 */
export function createServer(): McpServer {
	const server = new McpServer( {
		name: 'block-plugin-scaffold',
		version: pkg.version,
	} );

	server.registerTool(
		'discover',
		{
			title: 'Describe plugin configuration',
			description:
				'Describe every configuration field the block plugin generator accepts, with the defaults it really applies, the supported content-model combinations and limits. Read-only.',
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		() => run( describeConfiguration )
	);

	server.registerTool(
		'validate_config',
		{
			title: 'Validate plugin configuration',
			description:
				'Validate a plugin configuration without generating anything. Returns valid, errors, warnings and the normalised configuration with each value marked supplied, derived or default. Read-only.',
			inputSchema: { config: configSchema },
			annotations: { readOnlyHint: true, openWorldHint: false },
		},
		( { config } ) => run( () => validateConfiguration( config ) )
	);

	server.registerTool(
		'preview',
		{
			title: 'Preview plugin generation',
			description:
				'Generate the plugin into a private staging folder and report exactly what generate would do to the destination: every file marked create, overwrite, unchanged or conflict, the files left alone, and the process effects. Side effects: writes a staging folder under the system temporary folder, runs Prettier there, and writes a log in the scaffold; it never writes the destination. Tell the person about these effects before calling. Then show them the destination, the configuration and the file changes, and ask for their explicit approval before calling generate. destination is the final plugin folder (absolute path, or ~/...); omit it for generated-plugins/<slug> in the scaffold.',
			inputSchema: {
				config: configSchema,
				destination: z
					.string()
					.optional()
					.describe(
						'Final folder for the plugin files. Omit for the default.'
					),
				previousPreviewId: z
					.string()
					.optional()
					.describe(
						'An earlier preview, to list the configuration changes since then.'
					),
				detail: z
					.enum( [ 'summary', 'full' ] )
					.optional()
					.describe(
						'"summary" (default) lists every overwrite and conflict and counts new files by folder; "full" lists every path.'
					),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		( { config, destination, previousPreviewId, detail } ) =>
			run( () =>
				createPreview( {
					config,
					destination,
					previousPreviewId,
					detail,
				} )
			)
	);

	server.registerTool(
		'generate',
		{
			title: 'Generate plugin from an approved preview',
			description:
				'Write an approved preview into its destination. Call only after the person has explicitly approved that exact preview; never infer approval. Overwrites the files the preview marked overwrite (backing each one up first), creates the ones marked create, never deletes anything and never touches Git or unrelated files. Fails with STALE_PREVIEW if the destination changed since the preview, and with CONFLICT if the preview had conflicts.',
			inputSchema: {
				previewId: z.string().describe( 'previewId from preview.' ),
				approvalHash: z
					.string()
					.describe( 'approvalHash from the same preview.' ),
				approved: z
					.boolean()
					.describe(
						'True only when the person approved this preview.'
					),
			},
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		( { previewId, approvalHash, approved } ) =>
			run( () =>
				generateFromPreview( { previewId, approvalHash, approved } )
			)
	);

	return server;
}

/**
 * Start the server on stdio.
 */
async function main(): Promise< void > {
	process.on( 'uncaughtException', ( error ) => {
		process.stderr.write( `Uncaught: ${ error.stack }\n` );
	} );
	const server = createServer();
	await server.connect( new StdioServerTransport() );
	process.stderr.write(
		`block-plugin-scaffold MCP server ${ pkg.version } ready on stdio\n`
	);
}

if ( import.meta.main ) {
	main().catch( ( error: Error ) => {
		process.stderr.write( `Failed to start: ${ error.stack }\n` );
		process.exit( 1 );
	} );
}
