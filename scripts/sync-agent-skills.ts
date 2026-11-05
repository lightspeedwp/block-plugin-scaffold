/**
 * Vendor upstream agent skills into `.agents/skills/` and link them for Claude Code.
 *
 * Reads `scripts/agent-skills.json`, checks out the pinned upstream commit, and for
 * each target folder (the repository root and the generator template):
 *
 * - copies every listed skill to `<target>/.agents/skills/<name>/`;
 * - links `<target>/.claude/skills/<name>` to `../../.agents/skills/<name>`;
 * - writes `<target>/.agents/skills/VENDORED.md`, recording the source and commit.
 *
 * Usage:
 *   npm run sync:agent-skills           # vendor and link
 *   npm run sync:agent-skills:check     # report drift, change nothing
 *
 * Node 24.18+ runs this file directly (type stripping), so it uses only
 * erasable TypeScript syntax: no enums, namespaces or parameter properties.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface SkillManifest {
	source: {
		/** Git URL of the upstream repository. */
		repository: string;
		/** Full commit SHA to vendor. */
		commit: string;
		/** Folder inside the repository that holds one folder per skill. */
		path: string;
	};
	/** Skill folder names to vendor. */
	skills: string[];
	/** Folders, relative to the repository root, that each get `.agents/` and `.claude/`. */
	targets: string[];
}

export const MANIFEST_PATH = 'scripts/agent-skills.json';
export const VENDORED_FILE = 'VENDORED.md';

/** Runs an external command and returns its standard output. */
export type CommandRunner = ( command: string, args: string[], cwd?: string ) => string;

export const execRunner: CommandRunner = ( command, args, cwd ) =>
	execFileSync( command, args, { cwd, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'pipe' ] } );

export class SyncError extends Error {}

/** Checks out a single commit of a Git repository into a folder. */
export class GitCheckout {
	private readonly run: CommandRunner;

	constructor( run: CommandRunner = execRunner ) {
		this.run = run;
	}

	fetch( repository: string, commit: string, dir: string ): void {
		this.run( 'git', [ 'init', '--quiet', dir ] );
		this.run( 'git', [ 'fetch', '--quiet', '--depth', '1', repository, commit ], dir );
		this.run( 'git', [ '-c', 'advice.detachedHead=false', 'checkout', '--quiet', 'FETCH_HEAD' ], dir );
	}
}

export interface Drift {
	target: string;
	skill: string;
	problem: string;
}

/** Lists every file under a folder as sorted relative paths. */
function listFiles( dir: string ): string[] {
	const files: string[] = [];
	const walk = ( current: string ) => {
		for ( const entry of fs.readdirSync( current, { withFileTypes: true } ) ) {
			const full = path.join( current, entry.name );
			if ( entry.isDirectory() ) {
				walk( full );
			} else {
				files.push( path.relative( dir, full ) );
			}
		}
	};
	walk( dir );
	return files.sort();
}

/** Whether two folders hold the same files with the same contents. */
export function sameTree( a: string, b: string ): boolean {
	const filesA = listFiles( a );
	const filesB = listFiles( b );
	if ( filesA.join( '\n' ) !== filesB.join( '\n' ) ) {
		return false;
	}
	return filesA.every( ( file ) =>
		fs.readFileSync( path.join( a, file ) ).equals( fs.readFileSync( path.join( b, file ) ) )
	);
}

export class AgentSkillVendor {
	private readonly root: string;
	private readonly manifest: SkillManifest;
	private readonly git: GitCheckout;
	private readonly makeTempDir: () => string;

	constructor(
		root: string,
		manifest: SkillManifest,
		git: GitCheckout = new GitCheckout(),
		makeTempDir: () => string = () => fs.mkdtempSync( path.join( os.tmpdir(), 'agent-skills-' ) )
	) {
		AgentSkillVendor.validate( manifest );
		this.root = root;
		this.manifest = manifest;
		this.git = git;
		this.makeTempDir = makeTempDir;
	}

	static validate( manifest: SkillManifest ): void {
		if ( ! /^[0-9a-f]{40}$/.test( manifest.source.commit ) ) {
			throw new SyncError( `source.commit must be a full 40-character SHA, got "${ manifest.source.commit }"` );
		}
		if ( manifest.skills.length === 0 || manifest.targets.length === 0 ) {
			throw new SyncError( 'The manifest needs at least one skill and one target' );
		}
		for ( const name of manifest.skills ) {
			if ( ! /^[a-z0-9][a-z0-9-]*$/.test( name ) ) {
				throw new SyncError( `Invalid skill name "${ name }"` );
			}
		}
	}

	/** Copies and links every skill. Returns the names written to each target. */
	sync(): string[] {
		return this.withCheckout( ( upstream ) => {
			const written: string[] = [];
			for ( const target of this.manifest.targets ) {
				for ( const skill of this.manifest.skills ) {
					const dest = this.skillDir( target, skill );
					fs.rmSync( dest, { recursive: true, force: true } );
					fs.mkdirSync( path.dirname( dest ), { recursive: true } );
					fs.cpSync( path.join( upstream, skill ), dest, { recursive: true } );
					this.link( target, skill );
					written.push( `${ target }/${ skill }` );
				}
				fs.writeFileSync( this.vendoredFile( target ), this.renderVendored() );
			}
			return written;
		} );
	}

	/** Reports every difference from the pinned upstream commit, without changing anything. */
	check(): Drift[] {
		return this.withCheckout( ( upstream ) => {
			const drift: Drift[] = [];
			for ( const target of this.manifest.targets ) {
				for ( const skill of this.manifest.skills ) {
					const dest = this.skillDir( target, skill );
					if ( ! fs.existsSync( dest ) ) {
						drift.push( { target, skill, problem: 'missing from .agents/skills' } );
					} else if ( ! sameTree( path.join( upstream, skill ), dest ) ) {
						drift.push( { target, skill, problem: 'differs from the pinned commit' } );
					}
					if ( ! this.isLinked( target, skill ) ) {
						drift.push( { target, skill, problem: 'no .claude/skills symlink' } );
					}
				}
				const vendored = this.vendoredFile( target );
				if ( ! fs.existsSync( vendored ) || fs.readFileSync( vendored, 'utf8' ) !== this.renderVendored() ) {
					drift.push( { target, skill: VENDORED_FILE, problem: 'out of date' } );
				}
			}
			return drift;
		} );
	}

	renderVendored(): string {
		const { repository, commit, path: sourcePath } = this.manifest.source;
		const rows = this.manifest.skills.map( ( skill ) => `| \`${ skill }\` |` ).join( '\n' );
		return `# Vendored skills

These skills are unmodified copies from ${ repository.replace( /\.git$/, '' ) }
(\`${ sourcePath }/\`, commit \`${ commit }\`). Do not edit them here: change
\`${ MANIFEST_PATH }\` and run \`npm run sync:agent-skills\` from the scaffold root.

| Skill |
| --- |
${ rows }
`;
	}

	private withCheckout< T >( work: ( upstreamSkills: string ) => T ): T {
		const dir = this.makeTempDir();
		try {
			const { repository, commit, path: sourcePath } = this.manifest.source;
			this.git.fetch( repository, commit, dir );
			const upstream = path.join( dir, sourcePath );
			for ( const skill of this.manifest.skills ) {
				if ( ! fs.existsSync( path.join( upstream, skill, 'SKILL.md' ) ) ) {
					throw new SyncError( `Skill "${ skill }" has no SKILL.md at ${ sourcePath }/${ skill } in ${ commit }` );
				}
			}
			return work( upstream );
		} finally {
			fs.rmSync( dir, { recursive: true, force: true } );
		}
	}

	private skillDir( target: string, skill: string ): string {
		return path.join( this.root, target, '.agents', 'skills', skill );
	}

	private vendoredFile( target: string ): string {
		return path.join( this.root, target, '.agents', 'skills', VENDORED_FILE );
	}

	private linkPath( target: string, skill: string ): string {
		return path.join( this.root, target, '.claude', 'skills', skill );
	}

	private linkTarget( skill: string ): string {
		return path.join( '..', '..', '.agents', 'skills', skill );
	}

	private isLinked( target: string, skill: string ): boolean {
		try {
			return fs.readlinkSync( this.linkPath( target, skill ) ) === this.linkTarget( skill );
		} catch {
			return false;
		}
	}

	/** Creates the relative symlink, refusing to replace a real folder or file. */
	private link( target: string, skill: string ): void {
		const link = this.linkPath( target, skill );
		if ( this.isLinked( target, skill ) ) {
			return;
		}
		const existing = fs.lstatSync( link, { throwIfNoEntry: false } );
		if ( existing && ! existing.isSymbolicLink() ) {
			throw new SyncError( `${ path.relative( this.root, link ) } exists and is not a symlink; remove it first` );
		}
		fs.rmSync( link, { force: true } );
		fs.mkdirSync( path.dirname( link ), { recursive: true } );
		fs.symlinkSync( this.linkTarget( skill ), link );
	}
}

export interface CliIO {
	log: ( message: string ) => void;
	error: ( message: string ) => void;
}

/** Runs the CLI and returns the exit code. */
export function run(
	argv: string[],
	root: string,
	io: CliIO = { log: console.log, error: console.error },
	git: GitCheckout = new GitCheckout()
): number {
	try {
		const unknown = argv.filter( ( arg ) => arg !== '--check' );
		if ( unknown.length > 0 ) {
			throw new SyncError( `Unknown argument: ${ unknown[ 0 ] }` );
		}
		const manifest = JSON.parse( fs.readFileSync( path.join( root, MANIFEST_PATH ), 'utf8' ) ) as SkillManifest;
		const vendor = new AgentSkillVendor( root, manifest, git );

		if ( argv.includes( '--check' ) ) {
			const drift = vendor.check();
			for ( const item of drift ) {
				io.error( `DRIFT ${ item.target }: ${ item.skill } ${ item.problem }` );
			}
			if ( drift.length > 0 ) {
				io.error( 'Run npm run sync:agent-skills to update.' );
				return 1;
			}
			io.log( `All ${ manifest.skills.length } skills match ${ manifest.source.commit.slice( 0, 7 ) }.` );
			return 0;
		}

		const written = vendor.sync();
		io.log( `Vendored ${ written.length } skill copies from ${ manifest.source.commit.slice( 0, 7 ) }. Review the diff before committing.` );
		return 0;
	} catch ( error ) {
		io.error( `sync-agent-skills failed: ${ error instanceof Error ? error.message : String( error ) }` );
		return 1;
	}
}

if ( process.argv[ 1 ]?.endsWith( 'sync-agent-skills.ts' ) ) {
	process.exitCode = run( process.argv.slice( 2 ), process.cwd() );
}
