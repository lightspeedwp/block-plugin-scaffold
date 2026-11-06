/**
 * Preview and approval for local MCP plugin generation (BPS-12).
 *
 * A preview generates the plugin into a private staging folder, compares every
 * staged path with the destination, and binds an approval hash to the
 * configuration, the destination and the staged files. generate (phase 3)
 * copies from the stored preview only after its approval and freshness checks
 * pass. The rules are in docs/MCP-PLUGIN-GENERATION.md.
 *
 * @package
 */

const crypto = require( 'crypto' );
const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );

const { generatePlugin } = require( '../generate-plugin' );
const { validateConfiguration, diffValues } = require( './config' );
const { CODES, GenerationError } = require( './errors' );

const SCAFFOLD_DIR = path.resolve( __dirname, '../..' );
const PREVIEW_TTL_MS = 30 * 60 * 1000;
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

// Previews by ID. A preview lives in memory and in its staging folder only.
const previews = new Map();

/**
 * Throw UNSAFE_DESTINATION.
 *
 * @param {string} destination Path as supplied or resolved.
 * @param {string} reason      Why it is refused.
 */
function refuse( destination, reason ) {
	throw new GenerationError(
		CODES.UNSAFE_DESTINATION,
		`Destination refused: ${ reason }`,
		{ destination, reason }
	);
}

/**
 * Whether a path is a folder or inside it.
 *
 * @param {string} child  Absolute path.
 * @param {string} parent Absolute folder.
 * @return {boolean} Inside or equal.
 */
function isWithin( child, parent ) {
	return child === parent || child.startsWith( `${ parent }${ path.sep }` );
}

/**
 * Resolve and check a destination folder.
 *
 * @param {string|undefined} destination Folder from the client, or undefined for the default.
 * @param {string}           slug        Plugin slug, for the default.
 * @param {Object}           [options]
 * @param {string}           [options.scaffoldDir] Scaffold checkout.
 * @param {string}           [options.homeDir]     Home folder.
 * @return {{path: string, exists: boolean}} Real absolute path, and whether it exists.
 */
function resolveDestination( destination, slug, options = {} ) {
	const scaffoldDir = options.scaffoldDir || SCAFFOLD_DIR;
	const homeDir = options.homeDir || os.homedir();

	let raw =
		destination === undefined || destination === null
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
	let stat = null;
	try {
		stat = fs.lstatSync( absolute );
	} catch ( error ) {
		if ( error.code !== 'ENOENT' ) {
			throw error;
		}
	}

	let real;
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
		let parentStat;
		try {
			parentStat = fs.statSync( parent );
		} catch ( error ) {
			refuse( absolute, 'its parent folder does not exist' );
		}
		if ( ! parentStat.isDirectory() ) {
			refuse( absolute, 'its parent is not a folder' );
		}
		real = path.join(
			fs.realpathSync( parent ),
			path.basename( absolute )
		);
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

	return { path: real, exists: Boolean( stat ) };
}

/**
 * SHA-256 of a string or buffer, as hex.
 *
 * @param {string|Buffer} value Value.
 * @return {string} Hash.
 */
function sha256( value ) {
	return crypto.createHash( 'sha256' ).update( value ).digest( 'hex' );
}

/**
 * JSON with object keys sorted at every level, so equal values hash equally.
 *
 * @param {*} value Value.
 * @return {string} Canonical JSON.
 */
function canonicalJson( value ) {
	if ( Array.isArray( value ) ) {
		return `[${ value.map( canonicalJson ).join( ',' ) }]`;
	}
	if ( value && typeof value === 'object' ) {
		return `{${ Object.keys( value )
			.sort()
			.map(
				( key ) =>
					`${ JSON.stringify( key ) }:${ canonicalJson( value[ key ] ) }`
			)
			.join( ',' ) }}`;
	}
	return JSON.stringify( value === undefined ? null : value );
}

/**
 * Describe a path on disk without following links.
 *
 * @param {string} fullPath Absolute path.
 * @return {{type: string, hash: string|null}} 'missing', 'file', 'symlink', 'dir' or 'other'.
 */
function describePath( fullPath ) {
	let stat;
	try {
		stat = fs.lstatSync( fullPath );
	} catch ( error ) {
		if ( error.code === 'ENOENT' || error.code === 'ENOTDIR' ) {
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
		return { type: 'file', hash: sha256( fs.readFileSync( fullPath ) ) };
	}
	return { type: 'other', hash: null };
}

/**
 * List every file, link and folder in the staged plugin.
 *
 * @param {string} root Staged plugin folder.
 * @return {{path: string, type: string, hash: string|null}[]} Entries, sorted, with POSIX paths.
 */
function listStaged( root ) {
	const entries = [];
	const walk = ( dir ) => {
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
 * @param {string} destRoot Destination folder (real path).
 * @param {Object} entry    Staged entry.
 * @return {{action: string, reason?: string, state: Object}} Action, any conflict reason, and the destination state it relied on.
 */
function classify( destRoot, entry ) {
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
				action: state.hash === entry.hash ? 'unchanged' : 'overwrite',
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
 * @param {string}      destRoot Destination folder.
 * @param {Set<string>} planned  Planned paths.
 * @return {{count: number, capped: boolean, hasGit: boolean}} Summary.
 */
function summarisePreserved( destRoot, planned ) {
	const summary = { count: 0, capped: false, hasGit: false };
	const walk = ( dir ) => {
		let names;
		try {
			names = fs.readdirSync( dir );
		} catch ( error ) {
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
 * @param {Object}   values      Normalised configuration values.
 * @param {string}   destination Destination real path.
 * @param {Object[]} files       Planned files.
 * @return {string} SHA-256 hex.
 */
function approvalHashFor( values, destination, files ) {
	return sha256(
		canonicalJson( {
			config: values,
			destination,
			manifest: files.map( ( { path: file, type, action, hash } ) => ( {
				path: file,
				type,
				action,
				hash,
			} ) ),
		} )
	);
}

/**
 * Delete a preview and its staging folder.
 *
 * @param {string} previewId Preview ID.
 */
function discardPreview( previewId ) {
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
 * @param {Date} now Current time.
 */
function sweepExpired( now ) {
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
 * @param {Object}   request
 * @param {Object}   request.config              Plugin configuration.
 * @param {string}   [request.destination]       Final folder; defaults to generated-plugins/<slug>.
 * @param {string}   [request.previousPreviewId] Earlier preview to compare the configuration with.
 * @param {string}   [request.detail]            "summary" (default) or "full" file list.
 * @param {Object}   [options]
 * @param {Function} [options.now]               Clock returning a Date.
 * @param {string}   [options.scaffoldDir]       Scaffold checkout.
 * @param {string}   [options.homeDir]           Home folder.
 * @param {string}   [options.tmpDir]            Parent of staging folders.
 * @return {Object} The preview as reported to the client.
 */
function createPreview( request, options = {} ) {
	const now = options.now || ( () => new Date() );
	const scaffoldDir = options.scaffoldDir || SCAFFOLD_DIR;
	const startedAt = now();
	sweepExpired( startedAt );

	const { config, destination, previousPreviewId, detail } = request || {};
	const validation = validateConfiguration( config );
	if ( ! validation.valid ) {
		throw new GenerationError(
			CODES.INVALID_CONFIG,
			'The configuration is not valid.',
			{ errors: validation.errors, warnings: validation.warnings }
		);
	}
	const slug = validation.values.slug;
	const dest = resolveDestination( destination, slug, {
		scaffoldDir,
		homeDir: options.homeDir,
	} );

	const previewId = crypto.randomUUID();
	let stagingDir;
	try {
		stagingDir = fs.mkdtempSync(
			path.join( options.tmpDir || os.tmpdir(), 'bps-preview-' )
		);
	} catch ( error ) {
		throw new GenerationError(
			CODES.STAGING_FAILED,
			`Creating the staging folder failed: ${ error.message }`,
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
		generatePlugin( config, {
			outputDir: stagedPlugin,
			now,
			logFile,
			output: false,
		} );
	} catch ( error ) {
		fs.rmSync( stagingDir, { recursive: true, force: true } );
		throw new GenerationError(
			CODES.STAGING_FAILED,
			`Generating into staging failed: ${ error.message }`,
			{ logFile }
		);
	}

	const files = listStaged( stagedPlugin ).map( ( entry ) => {
		const { action, reason, state } = classify( dest.path, entry );
		return { ...entry, action, ...( reason && { reason } ), state };
	} );
	const planned = new Set( files.map( ( file ) => file.path ) );
	const preserved = summarisePreserved( dest.path, planned );

	let configurationChanges = null;
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

	const approvalHash = approvalHashFor( validation.values, dest.path, files );
	const expiresAt = startedAt.getTime() + PREVIEW_TTL_MS;
	previews.set( previewId, {
		previewId,
		approvalHash,
		destination: dest.path,
		destinationExisted: dest.exists,
		values: validation.values,
		files,
		stagingDir,
		stagedPlugin,
		logFile,
		expiresAt,
		scaffoldDir,
		homeDir: options.homeDir,
	} );

	return publicPreview( previews.get( previewId ), {
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
 * @param {Object[]} files  Planned files.
 * @param {string}   detail "summary" or "full".
 * @return {Object} files, and for summary, createByFolder and unchangedByFolder.
 */
function listFiles( files, detail ) {
	const toClient = ( { path: file, type, action, reason } ) => ( {
		path: file,
		type,
		action,
		...( reason && { reason } ),
	} );
	if ( detail === 'full' ) {
		return { files: files.map( toClient ) };
	}
	const byFolder = ( action ) => {
		const counts = {};
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
 * @param {Object} preview Stored preview.
 * @param {Object} extra   Values only known when the preview was made.
 * @return {Object} Preview for the client.
 */
function publicPreview( preview, extra ) {
	const count = ( action ) =>
		preview.files.filter( ( file ) => file.action === action ).length;
	return {
		previewId: preview.previewId,
		approvalHash: preview.approvalHash,
		destination: {
			path: preview.destination,
			exists: preview.destinationExisted,
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
 * @param {Object}  request
 * @param {string}  request.previewId    Preview ID.
 * @param {string}  request.approvalHash Hash from the preview.
 * @param {boolean} request.approved     Must be true.
 * @param {Object}  [options]
 * @param {Function} [options.now]       Clock returning a Date.
 * @return {Object} Stored preview.
 */
function getApprovedPreview( request, options = {} ) {
	const now = options.now || ( () => new Date() );
	sweepExpired( now() );
	const { previewId, approvalHash, approved } = request || {};
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
 * @param {Object} preview Stored preview.
 */
function assertPreviewCurrent( preview ) {
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

	let dest;
	try {
		dest = resolveDestination( preview.destination, preview.values.slug, {
			scaffoldDir: preview.scaffoldDir,
			homeDir: preview.homeDir,
		} );
	} catch ( error ) {
		throw new GenerationError(
			CODES.STALE_PREVIEW,
			'The destination changed after the preview. Preview again and ask again.',
			{ reason: error.message }
		);
	}
	const changed = [];
	if (
		dest.path !== preview.destination ||
		dest.exists !== preview.destinationExisted
	) {
		changed.push( '.' );
	}
	for ( const file of preview.files ) {
		const now = classify( dest.path, file );
		if (
			now.action !== file.action ||
			now.state.type !== file.state.type ||
			now.state.hash !== file.state.hash
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

module.exports = {
	PREVIEW_TTL_MS,
	resolveDestination,
	createPreview,
	getApprovedPreview,
	assertPreviewCurrent,
	discardPreview,
	canonicalJson,
	describePath,
};
