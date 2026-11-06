/**
 * Safe merge of an approved preview into its destination (BPS-12).
 *
 * Implements the merge rules in docs/MCP-PLUGIN-GENERATION.md: never delete,
 * overwrite only planned files, leave everything else (and every Git path)
 * alone, never write through links, write each file atomically, and back up
 * every file before overwriting it.
 *
 * @package
 */

const crypto = require( 'crypto' );
const fs = require( 'fs' );
const path = require( 'path' );

const {
	assertPreviewCurrent,
	describePath,
	discardPreview,
	getApprovedPreview,
} = require( './preview' );
const { CODES, GenerationError } = require( './errors' );

/**
 * Append one line to the journal.
 *
 * @param {string} journal Journal file.
 * @param {Object} entry   Entry.
 */
function record( journal, entry ) {
	fs.appendFileSync( journal, `${ JSON.stringify( entry ) }\n`, 'utf8' );
}

/**
 * Check that a path is still in the state the preview saw, just before
 * writing it, and that no folder on the way has become a link.
 *
 * @param {string} destRoot Destination folder.
 * @param {Object} file     Planned file from the preview.
 */
function assertUnchangedSincePreview( destRoot, file ) {
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
	const now = describePath( path.join( destRoot, ...parts ) );
	const expected =
		file.action === 'create' ? { type: 'missing', hash: null } : file.state;
	if ( now.type !== expected.type || now.hash !== expected.hash ) {
		throw new Error( `${ file.path } changed after the preview` );
	}
}

/**
 * Write one staged file into place: a temporary file beside the target,
 * then a rename, so the target is never half-written.
 *
 * @param {string} source Staged file.
 * @param {string} target Destination path.
 */
function writeAtomically( source, target ) {
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
 * @param {Object}   preview          Stored preview, already approved.
 * @param {Object}   [options]
 * @param {Function} [options.now]    Clock returning a Date.
 * @param {Function} [options.beforeWrite] Called with each path before it is written; for fault-injection checks.
 * @return {Object} Result for the client.
 */
function applyPreview( preview, options = {} ) {
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
	const written = [];
	const backedUp = [];
	let current = null;

	try {
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
		const done = new Set( written );
		const notWritten = planned
			.map( ( file ) => file.path )
			.filter( ( file ) => ! done.has( file ) );
		record( journal, {
			op: 'failed',
			at: now().toISOString(),
			path: current,
			error: error.message,
		} );
		throw new GenerationError(
			CODES.PARTIAL_WRITE,
			`Writing stopped at ${ current }: ${ error.message }`,
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
 * @param {Object}  request
 * @param {string}  request.previewId    Preview ID.
 * @param {string}  request.approvalHash Approval hash from the preview.
 * @param {boolean} request.approved     Must be true.
 * @param {Object}  [options]            See applyPreview().
 * @return {Object} Result for the client.
 */
function generateFromPreview( request, options = {} ) {
	const preview = getApprovedPreview( request, options );
	return applyPreview( preview, options );
}

module.exports = { applyPreview, generateFromPreview };
