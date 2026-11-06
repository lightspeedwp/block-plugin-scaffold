/**
 * Preview and approval for local MCP plugin generation (BPS-12).
 *
 * A preview generates the plugin into a private staging folder, compares every
 * staged path with the destination, and binds an approval hash to the
 * configuration, the destination and the staged files. generate copies from
 * the stored preview only after its approval and freshness checks pass. The
 * rules are in docs/MCP-PLUGIN-GENERATION.md.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
	diffValues,
	validateConfiguration,
	type Issue,
	type ValidationResult,
	type ValueChange,
} from './config.mts';
import { CODES, GenerationError } from './errors.mts';
import { generatePlugin } from './generator.mts';

export const SCAFFOLD_DIR = path.resolve( import.meta.dirname, '../..' );
export const PREVIEW_TTL_MS = 30 * 60 * 1000;
const PRESERVED_COUNT_LIMIT = 50000;

// Destinations refused outright, with everything inside them.
const SYSTEM_DIRS = [
	'/System',
	'/Library',
	'/Applications',
	'/usr',
	'/bin',
	'/sbin',
	'/etc',
	'/dev',
	'/cores',
	'/private/etc',
	'/private/var/db',
];

export type PathType = 'missing' | 'file' | 'symlink' | 'dir' | 'other' | 'n/a';
export type Action = 'create' | 'overwrite' | 'unchanged' | 'conflict';
export type Detail = 'summary' | 'full';

export interface PathState {
	type: PathType;
	hash: string | null;
	/** Files only: whether any execute bit is set. */
	executable?: boolean;
}

export interface StagedEntry extends PathState {
	path: string;
}

export interface PlannedFile extends StagedEntry {
	action: Action;
	reason?: string;
	/** The destination state the action relied on. */
	state: PathState;
}

export interface Destination {
	path: string;
	exists: boolean;
	/** The default destination's generated-plugins/ folder must be created too. */
	createParent: boolean;
}

export interface Clock {
	now?: () => Date;
}

export interface PreviewOptions extends Clock {
	scaffoldDir?: string;
	homeDir?: string;
	tmpDir?: string;
}

export interface PreviewRequest {
	config: unknown;
	destination?: string;
	previousPreviewId?: string;
	detail?: Detail;
}

export interface ApprovalRequest {
	previewId: string;
	approvalHash: string;
	approved: boolean;
}

/** A preview as stored in memory. */
export interface StoredPreview {
	previewId: string;
	approvalHash: string;
	destination: string;
	destinationExisted: boolean;
	createParent: boolean;
	values: Record< string, unknown >;
	files: PlannedFile[];
	stagingDir: string;
	stagedPlugin: string;
	logFile: string;
	expiresAt: number;
	scaffoldDir: string;
	homeDir?: string;
}

export interface PreservedSummary {
	count: number;
	capped: boolean;
	hasGit: boolean;
}

// Previews by ID. A preview lives in memory and in its staging folder only.
const previews = new Map< string, StoredPreview >();

/**
 * Throw UNSAFE_DESTINATION.
 *
 * @param destination Path as supplied or resolved.
 * @param reason      Why it is refused.
 */
function refuse( destination: string, reason: string ): never {
	throw new GenerationError(
		CODES.UNSAFE_DESTINATION,
		`Destination refused: ${ reason }`,
		{ destination, reason }
	);
}

/**
 * Whether a path is a folder or inside it.
 *
 * @param child  Absolute path.
 * @param parent Absolute folder.
 * @return Inside or equal.
 */
function isWithin( child: string, parent: string ): boolean {
	return child === parent || child.startsWith( `${ parent }${ path.sep }` );
}

/**
 * The error code of a failed filesystem call.
 *
 * @param error Caught value.
 * @return Code, if any.
 */
function errorCode( error: unknown ): string | undefined {
	return ( error as NodeJS.ErrnoException )?.code;
}

/**
 * Resolve and check a destination folder.
 *
 * @param destination Folder from the client, or undefined for the default.
 * @param slug        Plugin slug, for the default.
 * @param options     Scaffold and home folders.
 * @return Real absolute path, and whether it exists.
 */
export function resolveDestination(
	destination: unknown,
	slug: string,
	options: { scaffoldDir?: string; homeDir?: string } = {}
): Destination {
	const scaffoldDir = options.scaffoldDir || SCAFFOLD_DIR;
	const homeDir = options.homeDir || os.homedir();

	const isDefault = destination === undefined || destination === null;
	let raw = isDefault
		? path.join( scaffoldDir, 'generated-plugins', slug )
		: destination;
	if ( typeof raw !== 'string' || ! raw.trim() ) {
		refuse( String( raw ), 'it must be a non-empty path' );
	}
	if ( raw === '~' || raw.startsWith( '~/' ) ) {
		raw = path.join( homeDir, raw.slice( 1 ) );
	}
	if ( ! path.isAbsolute( raw ) ) {
		refuse( raw, 'it must be an absolute path' );
	}
	if ( raw.split( /[\\/]/ ).includes( '..' ) ) {
		refuse( raw, 'it must not contain ".."' );
	}

	const absolute = path.resolve( raw );
	let stat: fs.Stats | null = null;
	try {
		stat = fs.lstatSync( absolute );
	} catch ( error ) {
		// ENOTDIR: something on the way is a file; the parent check refuses it.
		const code = errorCode( error );
		if ( code !== 'ENOENT' && code !== 'ENOTDIR' ) {
			throw error;
		}
	}

	let real: string;
	let createParent = false;
	if ( stat ) {
		if ( stat.isSymbolicLink() ) {
			refuse( absolute, 'it is a symbolic link' );
		}
		if ( ! stat.isDirectory() ) {
			refuse( absolute, 'it exists and is not a folder' );
		}
		real = fs.realpathSync( absolute );
	} else {
		const parent = path.dirname( absolute );
		let parentStat: fs.Stats | null = null;
		try {
			parentStat = fs.lstatSync( parent );
		} catch ( error ) {
			const code = errorCode( error );
			if ( code !== 'ENOENT' && code !== 'ENOTDIR' ) {
				throw error;
			}
		}
		if ( ! parentStat && isDefault ) {
			// A fresh checkout has no generated-plugins/ (Git ignores it), so
			// generate creates it for the default destination only.
			createParent = true;
			real = path.join(
				fs.realpathSync( scaffoldDir ),
				'generated-plugins',
				path.basename( absolute )
			);
		} else {
			if ( ! parentStat ) {
				refuse( absolute, 'its parent folder does not exist' );
			}
			if ( parentStat.isSymbolicLink() ) {
				parentStat = fs.statSync( parent );
			}
			if ( ! parentStat.isDirectory() ) {
				refuse( absolute, 'its parent is not a folder' );
			}
			real = path.join(
				fs.realpathSync( parent ),
				path.basename( absolute )
			);
		}
	}

	const realHome = fs.realpathSync( homeDir );
	if ( real === path.parse( real ).root ) {
		refuse( real, 'it is the filesystem root' );
	}
	if ( real === realHome ) {
		refuse( real, 'it is your home folder' );
	}
	for ( const candidate of [ absolute, real ] ) {
		const system = SYSTEM_DIRS.find( ( dir ) =>
			isWithin( candidate, dir )
		);
		if ( system ) {
			refuse( real, `it is in the system folder ${ system }` );
		}
	}
	const realScaffold = fs.realpathSync( scaffoldDir );
	const generatedDir = path.join( realScaffold, 'generated-plugins' );
	if (
		isWithin( real, realScaffold ) &&
		! ( isWithin( real, generatedDir ) && real !== generatedDir )
	) {
		refuse(
			real,
			'it is inside the scaffold checkout (only generated-plugins/<folder> is allowed)'
		);
	}

	return { path: real, exists: Boolean( stat ), createParent };
}

/**
 * SHA-256 of a string or buffer, as hex.
 *
 * @param value Value.
 * @return Hash.
 */
function sha256( value: string | Buffer ): string {
	return crypto.createHash( 'sha256' ).update( value ).digest( 'hex' );
}

/**
 * JSON with object keys sorted at every level, so equal values hash equally.
 *
 * @param value Value.
 * @return Canonical JSON.
 */
export function canonicalJson( value: unknown ): string {
	if ( Array.isArray( value ) ) {
		return `[${ value.map( canonicalJson ).join( ',' ) }]`;
	}
	if ( value && typeof value === 'object' ) {
		const record = value as Record< string, unknown >;
		return `{${ Object.keys( record )
			.sort()
			.map(
				( key ) =>
					`${ JSON.stringify( key ) }:${ canonicalJson(
						record[ key ]
					) }`
			)
			.join( ',' ) }}`;
	}
	return JSON.stringify( value === undefined ? null : value );
}

/**
 * Describe a path on disk without following links.
 *
 * @param fullPath Absolute path.
 * @return Its type, and a hash for files and links.
 */
export function describePath( fullPath: string ): PathState {
	let stat: fs.Stats;
	try {
		stat = fs.lstatSync( fullPath );
	} catch ( error ) {
		const code = errorCode( error );
		if ( code === 'ENOENT' || code === 'ENOTDIR' ) {
			return { type: 'missing', hash: null };
		}
		throw error;
	}
	if ( stat.isSymbolicLink() ) {
		return {
			type: 'symlink',
			hash: sha256( `link:${ fs.readlinkSync( fullPath ) }` ),
		};
	}
	if ( stat.isDirectory() ) {
		return { type: 'dir', hash: null };
	}
	if ( stat.isFile() ) {
		return {
			type: 'file',
			hash: sha256( fs.readFileSync( fullPath ) ),
			executable: ( stat.mode & 0o111 ) !== 0,
		};
	}
	return { type: 'other', hash: null };
}

/**
 * Whether two path states are the same: type, contents and, for files,
 * whether they are executable.
 *
 * @param a First state.
 * @param b Second state.
 * @return True when equal.
 */
export function sameState( a: PathState, b: PathState ): boolean {
	return (
		a.type === b.type &&
		a.hash === b.hash &&
		Boolean( a.executable ) === Boolean( b.executable )
	);
}

/**
 * List every file, link and folder in the staged plugin.
 *
 * @param root Staged plugin folder.
 * @return Entries, sorted, with POSIX paths.
 */
function listStaged( root: string ): StagedEntry[] {
	const entries: StagedEntry[] = [];
	const walk = ( dir: string ) => {
		for ( const name of fs.readdirSync( dir ).sort() ) {
			const full = path.join( dir, name );
			const rel = path
				.relative( root, full )
				.split( path.sep )
				.join( '/' );
			const described = describePath( full );
			entries.push( { path: rel, ...described } );
			if ( described.type === 'dir' ) {
				walk( full );
			}
		}
	};
	walk( root );
	return entries;
}

/**
 * Decide what generate would do with one staged entry.
 *
 * @param destRoot Destination folder (real path).
 * @param entry    Staged entry.
 * @return Action, any conflict reason, and the destination state it relied on.
 */
function classify(
	destRoot: string,
	entry: StagedEntry
): { action: Action; reason?: string; state: PathState } {
	const parts = entry.path.split( '/' );
	if ( parts.includes( '.git' ) ) {
		return {
			action: 'conflict',
			reason: 'Git paths are never written',
			state: { type: 'n/a', hash: null },
		};
	}

	// Every folder on the way must be a real folder, or not exist yet.
	for ( let i = 1; i < parts.length; i++ ) {
		const ancestor = describePath(
			path.join( destRoot, ...parts.slice( 0, i ) )
		);
		if ( ancestor.type === 'missing' ) {
			return { action: 'create', state: ancestor };
		}
		if ( ancestor.type === 'symlink' ) {
			return {
				action: 'conflict',
				reason: `${ parts.slice( 0, i ).join( '/' ) } is a symbolic link`,
				state: ancestor,
			};
		}
		if ( ancestor.type !== 'dir' ) {
			return {
				action: 'conflict',
				reason: `${ parts.slice( 0, i ).join( '/' ) } is not a folder`,
				state: ancestor,
			};
		}
	}

	const state = describePath( path.join( destRoot, ...parts ) );
	if ( state.type === 'missing' ) {
		return { action: 'create', state };
	}
	if ( entry.type === 'file' ) {
		if ( state.type === 'file' ) {
			return {
				// An executable bit that differs is restored, like contents.
				action: sameState( state, entry ) ? 'unchanged' : 'overwrite',
				state,
			};
		}
		return {
			action: 'conflict',
			reason: `the destination has a ${ state.type } here`,
			state,
		};
	}
	if ( entry.type === 'symlink' ) {
		if ( state.type === 'symlink' && state.hash === entry.hash ) {
			return { action: 'unchanged', state };
		}
		return {
			action: 'conflict',
			reason: `the plugin has a symbolic link here and the destination has a different ${ state.type }`,
			state,
		};
	}
	if ( entry.type === 'dir' ) {
		if ( state.type === 'dir' ) {
			return { action: 'unchanged', state };
		}
		return {
			action: 'conflict',
			reason: `the plugin has a folder here and the destination has a ${ state.type }`,
			state,
		};
	}
	return {
		action: 'conflict',
		reason: 'unsupported file type',
		state,
	};
}

/**
 * Count destination files the plugin does not contain, and look for Git.
 *
 * @param destRoot Destination folder.
 * @param planned  Planned paths.
 * @return Summary.
 */
function summarisePreserved(
	destRoot: string,
	planned: Set< string >
): PreservedSummary {
	const summary: PreservedSummary = {
		count: 0,
		capped: false,
		hasGit: false,
	};
	const walk = ( dir: string ) => {
		let names: string[];
		try {
			names = fs.readdirSync( dir );
		} catch {
			return;
		}
		for ( const name of names ) {
			if ( summary.count >= PRESERVED_COUNT_LIMIT ) {
				summary.capped = true;
				return;
			}
			const full = path.join( dir, name );
			const rel = path
				.relative( destRoot, full )
				.split( path.sep )
				.join( '/' );
			if ( name === '.git' ) {
				summary.hasGit = true;
				continue;
			}
			const stat = fs.lstatSync( full );
			if ( stat.isDirectory() ) {
				walk( full );
			} else if ( ! planned.has( rel ) ) {
				summary.count++;
			}
		}
	};
	if ( fs.existsSync( destRoot ) ) {
		walk( destRoot );
	}
	return summary;
}

/**
 * The approval hash for a preview.
 *
 * @param values      Normalised configuration values.
 * @param destination Destination real path.
 * @param files       Planned files.
 * @return SHA-256 hex.
 */
function approvalHashFor(
	values: Record< string, unknown >,
	destination: string,
	files: PlannedFile[]
): string {
	return sha256(
		canonicalJson( {
			config: values,
			destination,
			manifest: files.map(
				( { path: file, type, action, hash, executable } ) => ( {
					path: file,
					type,
					action,
					hash,
					...( type === 'file' && {
						executable: Boolean( executable ),
					} ),
				} )
			),
		} )
	);
}

/**
 * Delete a preview and its staging folder.
 *
 * @param previewId Preview ID.
 */
export function discardPreview( previewId: string ): void {
	const preview = previews.get( previewId );
	if ( ! preview ) {
		return;
	}
	previews.delete( previewId );
	fs.rmSync( preview.stagingDir, { recursive: true, force: true } );
}

/**
 * Delete expired previews.
 *
 * @param now Current time.
 */
function sweepExpired( now: Date ): void {
	for ( const [ id, preview ] of previews ) {
		if ( preview.expiresAt <= now.getTime() ) {
			discardPreview( id );
		}
	}
}

/**
 * Generate into staging and report what generate would do.
 *
 * Side effects: writes a staging folder under the system temporary folder,
 * runs Prettier there, and writes a log file in <scaffold>/logs/. Reads, but
 * never writes, the destination.
 *
 * @param request Configuration, destination, previous preview and detail.
 * @param options Clock, scaffold, home and temporary folders.
 * @return The preview as reported to the client.
 */
export function createPreview(
	request: PreviewRequest,
	options: PreviewOptions = {}
): Record< string, unknown > {
	const now = options.now || ( () => new Date() );
	const scaffoldDir = options.scaffoldDir || SCAFFOLD_DIR;
	const startedAt = now();
	sweepExpired( startedAt );

	const { config, destination, previousPreviewId, detail } =
		request || ( {} as PreviewRequest );
	const validation = validateConfiguration( config );
	if ( ! validation.valid ) {
		throw new GenerationError(
			CODES.INVALID_CONFIG,
			'The configuration is not valid.',
			{ errors: validation.errors, warnings: validation.warnings }
		);
	}
	const slug = String( validation.values.slug );
	const dest = resolveDestination( destination, slug, {
		scaffoldDir,
		homeDir: options.homeDir,
	} );

	const previewId = crypto.randomUUID();
	let stagingDir: string;
	try {
		stagingDir = fs.mkdtempSync(
			path.join( options.tmpDir || os.tmpdir(), 'bps-preview-' )
		);
	} catch ( error ) {
		throw new GenerationError(
			CODES.STAGING_FAILED,
			`Creating the staging folder failed: ${
				( error as Error ).message
			}`,
			{}
		);
	}
	const stagedPlugin = path.join( stagingDir, 'plugin' );
	const stamp = startedAt.toISOString().replace( /[:.]/g, '-' );
	const logFile = path.join(
		scaffoldDir,
		'logs',
		// The preview ID keeps names unique for previews in the same millisecond.
		`mcp-${ slug }-${ stamp }-${ previewId.slice( 0, 8 ) }.log`
	);

	try {
		generatePlugin( config as Record< string, unknown >, {
			outputDir: stagedPlugin,
			now,
			logFile,
			output: false,
		} );
	} catch ( error ) {
		fs.rmSync( stagingDir, { recursive: true, force: true } );
		throw new GenerationError(
			CODES.STAGING_FAILED,
			`Generating into staging failed: ${ ( error as Error ).message }`,
			{ logFile }
		);
	}

	const files: PlannedFile[] = listStaged( stagedPlugin ).map( ( entry ) => {
		const { action, reason, state } = classify( dest.path, entry );
		return { ...entry, action, ...( reason && { reason } ), state };
	} );
	const planned = new Set( files.map( ( file ) => file.path ) );
	const preserved = summarisePreserved( dest.path, planned );

	let configurationChanges: ValueChange[] | null = null;
	if ( previousPreviewId ) {
		const previous = previews.get( previousPreviewId );
		configurationChanges = previous
			? diffValues( previous.values, validation.values )
			: null;
	}

	// A newer preview for the same destination replaces older ones.
	for ( const [ id, existing ] of previews ) {
		if ( existing.destination === dest.path ) {
			discardPreview( id );
		}
	}

	const stored: StoredPreview = {
		previewId,
		approvalHash: approvalHashFor( validation.values, dest.path, files ),
		destination: dest.path,
		destinationExisted: dest.exists,
		createParent: dest.createParent,
		values: validation.values,
		files,
		stagingDir,
		stagedPlugin,
		logFile,
		expiresAt: startedAt.getTime() + PREVIEW_TTL_MS,
		scaffoldDir,
		homeDir: options.homeDir,
	};
	previews.set( previewId, stored );

	return publicPreview( stored, {
		normalised: validation.normalised,
		warnings: validation.warnings,
		configurationChanges,
		preserved,
		detail,
	} );
}

/**
 * The file list for the client. "summary" (the default) lists every
 * overwrite and conflict, and counts new and unchanged paths by top-level
 * folder, so the result stays small enough for a client to read in full.
 * "full" lists every path.
 *
 * @param files  Planned files.
 * @param detail "summary" or "full".
 * @return files, and for summary, createByFolder and unchangedByFolder.
 */
function listFiles(
	files: PlannedFile[],
	detail: Detail | undefined
): Record< string, unknown > {
	const toClient = ( {
		path: file,
		type,
		action,
		reason,
		executable,
	}: PlannedFile ) => ( {
		path: file,
		type,
		action,
		...( executable && { executable } ),
		...( reason && { reason } ),
	} );
	if ( detail === 'full' ) {
		return { files: files.map( toClient ) };
	}
	const byFolder = ( action: Action ) => {
		const counts: Record< string, number > = {};
		for ( const file of files ) {
			if ( file.action === action && file.type !== 'dir' ) {
				const top = file.path.includes( '/' )
					? `${ file.path.split( '/' )[ 0 ] }/`
					: '(top level)';
				counts[ top ] = ( counts[ top ] || 0 ) + 1;
			}
		}
		return counts;
	};
	return {
		files: files
			.filter(
				( file ) =>
					file.action === 'overwrite' || file.action === 'conflict'
			)
			.map( toClient ),
		createByFolder: byFolder( 'create' ),
		unchangedByFolder: byFolder( 'unchanged' ),
		detail: 'summary: files lists every overwrite and conflict; preview again with detail "full" for every path.',
	};
}

/**
 * The client's view of a stored preview.
 *
 * @param preview Stored preview.
 * @param extra   Values only known when the preview was made.
 * @return Preview for the client.
 */
function publicPreview(
	preview: StoredPreview,
	extra: {
		normalised: ValidationResult[ 'normalised' ];
		warnings: Issue[];
		configurationChanges: ValueChange[] | null;
		preserved: PreservedSummary;
		detail: Detail | undefined;
	}
): Record< string, unknown > {
	const count = ( action: Action ) =>
		preview.files.filter( ( file ) => file.action === action ).length;
	return {
		previewId: preview.previewId,
		approvalHash: preview.approvalHash,
		destination: {
			path: preview.destination,
			exists: preview.destinationExisted,
			// Shown only when generate also creates generated-plugins/.
			...( preview.createParent && { createsParentFolder: true } ),
		},
		configuration: {
			normalised: extra.normalised,
			warnings: extra.warnings,
			changesSincePreviousPreview: extra.configurationChanges,
		},
		summary: {
			create: count( 'create' ),
			overwrite: count( 'overwrite' ),
			unchanged: count( 'unchanged' ),
			conflict: count( 'conflict' ),
		},
		...listFiles( preview.files, extra.detail ),
		preserved: extra.preserved,
		processEffects: {
			stagingFolder: preview.stagingDir,
			processes: [
				'node (generator)',
				'node (Prettier, in the staging folder)',
			],
			logFile: preview.logFile,
		},
		expiresAt: new Date( preview.expiresAt ).toISOString(),
	};
}

/**
 * Return a preview if the approval matches it exactly.
 *
 * @param request Preview ID, approval hash and approved flag.
 * @param options Clock.
 * @return Stored preview.
 */
export function getApprovedPreview(
	request: ApprovalRequest,
	options: Clock = {}
): StoredPreview {
	const now = options.now || ( () => new Date() );
	sweepExpired( now() );
	const { previewId, approvalHash, approved } =
		request || ( {} as ApprovalRequest );
	const preview = previews.get( previewId );
	if ( ! preview ) {
		throw new GenerationError(
			CODES.PREVIEW_NOT_FOUND,
			'No preview with that ID. It may have expired or been replaced; preview again.',
			{ previewId }
		);
	}
	const expected = approvalHashFor(
		preview.values,
		preview.destination,
		preview.files
	);
	if (
		approved !== true ||
		approvalHash !== preview.approvalHash ||
		approvalHash !== expected
	) {
		throw new GenerationError(
			CODES.APPROVAL_MISMATCH,
			'The approval does not match this preview. Show the preview and ask again.',
			{ previewId }
		);
	}
	return preview;
}

/**
 * Check a preview against the destination as it is now.
 *
 * Throws CONFLICT if the preview had conflicts, and STALE_PREVIEW if the
 * destination changed in any way the preview relied on.
 *
 * @param preview Stored preview.
 */
export function assertPreviewCurrent( preview: StoredPreview ): void {
	const conflicts = preview.files.filter(
		( file ) => file.action === 'conflict'
	);
	if ( conflicts.length ) {
		throw new GenerationError(
			CODES.CONFLICT,
			'The preview has conflicts. Resolve them in the destination, then preview again.',
			{
				conflicts: conflicts.map( ( { path: file, reason } ) => ( {
					path: file,
					reason,
				} ) ),
			}
		);
	}

	let dest: Destination;
	try {
		dest = resolveDestination(
			// Resolve the default again as the default, so it may still
			// create generated-plugins/.
			preview.createParent ? undefined : preview.destination,
			String( preview.values.slug ),
			{
				scaffoldDir: preview.scaffoldDir,
				homeDir: preview.homeDir,
			}
		);
	} catch ( error ) {
		throw new GenerationError(
			CODES.STALE_PREVIEW,
			'The destination changed after the preview. Preview again and ask again.',
			{ reason: ( error as Error ).message }
		);
	}
	const changed: string[] = [];
	if (
		dest.path !== preview.destination ||
		dest.exists !== preview.destinationExisted
	) {
		changed.push( '.' );
	}
	for ( const file of preview.files ) {
		const current = classify( dest.path, file );
		if (
			current.action !== file.action ||
			! sameState( current.state, file.state )
		) {
			changed.push( file.path );
		}
	}
	if ( changed.length ) {
		throw new GenerationError(
			CODES.STALE_PREVIEW,
			'The destination changed after the preview. Preview again and ask again.',
			{ changed }
		);
	}
}
