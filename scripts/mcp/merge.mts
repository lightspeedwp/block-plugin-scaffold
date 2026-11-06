/**
 * Safe merge of an approved preview into its destination (BPS-12).
 *
 * Implements the merge rules in docs/MCP-PLUGIN-GENERATION.md: never delete,
 * overwrite only planned files, leave everything else (and every Git path)
 * alone, never write through links, write each file atomically, and back up
 * every file before overwriting it.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { CODES, GenerationError } from './errors.mts';
import {
	assertPreviewCurrent,
	describePath,
	discardPreview,
	getApprovedPreview,
	sameState,
	type Action,
	type ApprovalRequest,
	type Clock,
	type PathState,
	type PlannedFile,
	type StoredPreview,
} from './preview.mts';

export interface MergeOptions extends Clock {
	/** Called with each path before it is written; for fault-injection checks. */
	beforeWrite?: ( file: string ) => void;
}

export interface MergeResult {
	destination: string;
	written: { path: string; action: Action }[];
	unchanged: number;
	backupFolder: string | null;
	journal: string;
	logFile: string;
}

/**
 * Append one line to the journal.
 *
 * @param journal Journal file.
 * @param entry   Entry.
 */
function record( journal: string, entry: Record< string, unknown > ): void {
	fs.appendFileSync( journal, `${ JSON.stringify( entry ) }\n`, 'utf8' );
}

/**
 * Check that a path is still in the state the preview saw, just before
 * writing it, and that no folder on the way has become a link.
 *
 * @param destRoot Destination folder.
 * @param file     Planned file from the preview.
 */
function assertUnchangedSincePreview(
	destRoot: string,
	file: PlannedFile
): void {
	const parts = file.path.split( '/' );
	for ( let i = 1; i < parts.length; i++ ) {
		const ancestor = describePath(
			path.join( destRoot, ...parts.slice( 0, i ) )
		);
		if ( ancestor.type !== 'dir' ) {
			throw new Error(
				`${ parts.slice( 0, i ).join( '/' ) } is no longer a folder`
			);
		}
	}
	const current = describePath( path.join( destRoot, ...parts ) );
	const expected: PathState =
		file.action === 'create' ? { type: 'missing', hash: null } : file.state;
	if ( ! sameState( current, expected ) ) {
		throw new Error( `${ file.path } changed after the preview` );
	}
}

/**
 * Create the scaffold's generated-plugins/ folder for the default destination.
 * Only that one folder is created; if something appeared there since the
 * preview, it must be a real folder.
 *
 * @param folder generated-plugins/ path.
 */
function createGeneratedPluginsFolder( folder: string ): void {
	try {
		fs.mkdirSync( folder );
	} catch ( error ) {
		if ( ( error as NodeJS.ErrnoException ).code !== 'EEXIST' ) {
			throw error;
		}
	}
	if ( ! fs.lstatSync( folder ).isDirectory() ) {
		throw new Error( `${ folder } is not a folder` );
	}
}

/**
 * Write one staged file into place: a temporary file beside the target,
 * then a rename, so the target is never half-written.
 *
 * @param source Staged file.
 * @param target Destination path.
 */
function writeAtomically( source: string, target: string ): void {
	const temp = path.join(
		path.dirname( target ),
		`.${ path.basename( target ) }.bps-${ crypto
			.randomBytes( 6 )
			.toString( 'hex' ) }.tmp`
	);
	try {
		// 'wx' refuses to open anything already at the temporary name.
		fs.writeFileSync( temp, fs.readFileSync( source ), { flag: 'wx' } );
		fs.chmodSync( temp, fs.statSync( source ).mode & 0o7777 );
		fs.renameSync( temp, target );
	} catch ( error ) {
		fs.rmSync( temp, { force: true } );
		throw error;
	}
}

/**
 * Copy an approved preview's files into its destination.
 *
 * @param preview Stored preview, already approved.
 * @param options Clock and fault-injection hook.
 * @return Result for the client.
 */
export function applyPreview(
	preview: StoredPreview,
	options: MergeOptions = {}
): MergeResult {
	const now = options.now || ( () => new Date() );
	assertPreviewCurrent( preview );

	const destRoot = preview.destination;
	const runBase = preview.logFile.replace( /\.log$/, '' );
	const journal = `${ runBase }.journal.jsonl`;
	const backupDir = `${ runBase }-backup`;
	fs.mkdirSync( path.dirname( journal ), { recursive: true } );
	record( journal, {
		op: 'start',
		at: now().toISOString(),
		previewId: preview.previewId,
		destination: destRoot,
	} );

	// Folders before their contents; files in a stable order.
	const planned = preview.files
		.filter(
			( file ) => file.action === 'create' || file.action === 'overwrite'
		)
		.sort( ( a, b ) => ( a.path < b.path ? -1 : 1 ) );
	const written: string[] = [];
	const backedUp: string[] = [];
	let current: string | null = null;

	try {
		if ( preview.createParent ) {
			current = '..';
			createGeneratedPluginsFolder( path.dirname( destRoot ) );
			record( journal, { op: 'mkdir', path: '..' } );
		}
		if ( ! preview.destinationExisted ) {
			current = '.';
			// Not recursive: only the destination itself is created.
			fs.mkdirSync( destRoot );
			record( journal, { op: 'mkdir', path: '.' } );
		}

		for ( const file of planned ) {
			current = file.path;
			if ( options.beforeWrite ) {
				options.beforeWrite( file.path );
			}
			assertUnchangedSincePreview( destRoot, file );
			const target = path.join( destRoot, ...file.path.split( '/' ) );
			const source = path.join(
				preview.stagedPlugin,
				...file.path.split( '/' )
			);

			if ( file.type === 'dir' ) {
				fs.mkdirSync( target );
			} else if ( file.type === 'symlink' ) {
				fs.symlinkSync( fs.readlinkSync( source ), target );
			} else {
				if ( file.action === 'overwrite' ) {
					const backup = path.join(
						backupDir,
						...file.path.split( '/' )
					);
					fs.mkdirSync( path.dirname( backup ), { recursive: true } );
					// Never replace an existing backup.
					fs.copyFileSync(
						target,
						backup,
						fs.constants.COPYFILE_EXCL
					);
					backedUp.push( file.path );
					record( journal, {
						op: 'backup',
						path: file.path,
						backup,
					} );
				}
				writeAtomically( source, target );
			}
			written.push( file.path );
			record( journal, {
				op: file.action,
				type: file.type,
				path: file.path,
			} );
		}
	} catch ( error ) {
		const message = ( error as Error ).message;
		const done = new Set( written );
		const notWritten = planned
			.map( ( file ) => file.path )
			.filter( ( file ) => ! done.has( file ) );
		record( journal, {
			op: 'failed',
			at: now().toISOString(),
			path: current,
			error: message,
		} );
		throw new GenerationError(
			CODES.PARTIAL_WRITE,
			`Writing stopped at ${ current }: ${ message }`,
			{
				failedAt: current,
				written,
				notWritten,
				backupFolder: backedUp.length ? backupDir : null,
				backedUp,
				journal,
				logFile: preview.logFile,
			}
		);
	}

	record( journal, { op: 'done', at: now().toISOString() } );
	discardPreview( preview.previewId );

	return {
		destination: destRoot,
		written: planned.map( ( { path: file, action } ) => ( {
			path: file,
			action,
		} ) ),
		unchanged: preview.files.filter(
			( file ) => file.action === 'unchanged'
		).length,
		backupFolder: backedUp.length ? backupDir : null,
		journal,
		logFile: preview.logFile,
	};
}

/**
 * The generate operation: check the approval, then merge.
 *
 * @param request Preview ID, approval hash and approved flag.
 * @param options See applyPreview().
 * @return Result for the client.
 */
export function generateFromPreview(
	request: ApprovalRequest,
	options: MergeOptions = {}
): MergeResult {
	const preview = getApprovedPreview( request, options );
	return applyPreview( preview, options );
}
