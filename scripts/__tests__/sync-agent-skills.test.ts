/**
 * Tests for scripts/sync-agent-skills.ts. A fake Git checkout builds the
 * upstream fixture, so no test touches the network.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
	AgentSkillVendor,
	GitCheckout,
	MANIFEST_PATH,
	SyncError,
	VENDORED_FILE,
	execRunner,
	run,
	sameTree,
	type CommandRunner,
	type SkillManifest,
} from '../sync-agent-skills';

const COMMIT = 'a'.repeat( 40 );

const manifest = ( overrides: Partial< SkillManifest > = {} ): SkillManifest => ( {
	source: { repository: 'https://example.test/skills.git', commit: COMMIT, path: 'skills' },
	skills: [ 'wp-one', 'wp-two' ],
	targets: [ '.', 'plugin-template' ],
	...overrides,
} );

/** Writes the upstream skills a real checkout would contain. */
class FakeGit extends GitCheckout {
	calls: string[][] = [];
	private readonly files: Record< string, string >;

	constructor( files: Record< string, string > ) {
		super( () => '' );
		this.files = files;
	}

	fetch( repository: string, commit: string, dir: string ): void {
		this.calls.push( [ repository, commit ] );
		for ( const [ file, content ] of Object.entries( this.files ) ) {
			fs.mkdirSync( path.dirname( path.join( dir, file ) ), { recursive: true } );
			fs.writeFileSync( path.join( dir, file ), content );
		}
	}
}

const upstreamFiles = (): Record< string, string > => ( {
	'skills/wp-one/SKILL.md': '---\nname: wp-one\n---\nOne\n',
	'skills/wp-one/references/a.md': 'A\n',
	'skills/wp-two/SKILL.md': '---\nname: wp-two\n---\nTwo {{curly}}\n',
	'skills/wp-unused/SKILL.md': 'unused\n',
} );

describe( 'AgentSkillVendor', () => {
	let root: string;
	let tempDirs: string[];
	const makeTempDir = () => {
		const dir = fs.mkdtempSync( path.join( os.tmpdir(), 'upstream-' ) );
		tempDirs.push( dir );
		return dir;
	};
	const vendor = ( m = manifest(), files = upstreamFiles() ) =>
		new AgentSkillVendor( root, m, new FakeGit( files ), makeTempDir );

	beforeEach( () => {
		root = fs.mkdtempSync( path.join( os.tmpdir(), 'scaffold-' ) );
		tempDirs = [];
	} );

	afterEach( () => {
		fs.rmSync( root, { recursive: true, force: true } );
	} );

	it( 'copies each skill into every target and links it for Claude Code', () => {
		const written = vendor().sync();

		expect( written ).toEqual( [ './wp-one', './wp-two', 'plugin-template/wp-one', 'plugin-template/wp-two' ] );
		for ( const target of [ '.', 'plugin-template' ] ) {
			const skill = path.join( root, target, '.agents/skills/wp-one' );
			expect( fs.readFileSync( path.join( skill, 'references/a.md' ), 'utf8' ) ).toBe( 'A\n' );
			const link = path.join( root, target, '.claude/skills/wp-one' );
			expect( fs.readlinkSync( link ) ).toBe( '../../.agents/skills/wp-one' );
			expect( fs.readFileSync( path.join( link, 'SKILL.md' ), 'utf8' ) ).toContain( 'name: wp-one' );
		}
		expect( fs.existsSync( path.join( root, '.agents/skills/wp-unused' ) ) ).toBe( false );
	} );

	it( 'copies skill content byte for byte, including mustache-like text', () => {
		vendor().sync();
		expect( fs.readFileSync( path.join( root, 'plugin-template/.agents/skills/wp-two/SKILL.md' ), 'utf8' ) ).toContain(
			'{{curly}}'
		);
	} );

	it( 'records the source and commit in VENDORED.md', () => {
		vendor().sync();
		const vendored = fs.readFileSync( path.join( root, '.agents/skills', VENDORED_FILE ), 'utf8' );
		expect( vendored ).toContain( `commit \`${ COMMIT }\`` );
		expect( vendored ).toContain( 'https://example.test/skills' );
		expect( vendored ).toContain( '| `wp-two` |' );
	} );

	it( 'removes stale files when re-syncing a skill', () => {
		vendor().sync();
		const stale = path.join( root, '.agents/skills/wp-one/old.md' );
		fs.writeFileSync( stale, 'old' );
		vendor().sync();
		expect( fs.existsSync( stale ) ).toBe( false );
	} );

	it( 'keeps an existing correct symlink and replaces a wrong one', () => {
		vendor().sync();
		const link = path.join( root, '.claude/skills/wp-two' );
		fs.rmSync( link );
		fs.symlinkSync( '../elsewhere', link );
		vendor().sync();
		expect( fs.readlinkSync( link ) ).toBe( '../../.agents/skills/wp-two' );
	} );

	it( 'refuses to replace a real folder at the symlink path', () => {
		fs.mkdirSync( path.join( root, '.claude/skills/wp-one' ), { recursive: true } );
		expect( () => vendor().sync() ).toThrow( /exists and is not a symlink/ );
	} );

	it( 'fails when a listed skill is missing upstream, and removes the checkout', () => {
		const files = upstreamFiles();
		delete files[ 'skills/wp-two/SKILL.md' ];
		expect( () => vendor( manifest(), files ).sync() ).toThrow( /"wp-two" has no SKILL.md/ );
		expect( tempDirs.every( ( dir ) => ! fs.existsSync( dir ) ) ).toBe( true );
		expect( fs.existsSync( path.join( root, '.agents' ) ) ).toBe( false );
	} );

	it( 'reports no drift right after a sync', () => {
		vendor().sync();
		expect( vendor().check() ).toEqual( [] );
	} );

	it( 'reports missing, changed and unlinked skills and an outdated record', () => {
		expect( vendor().check() ).toEqual(
			expect.arrayContaining( [
				{ target: '.', skill: 'wp-one', problem: 'missing from .agents/skills' },
				{ target: '.', skill: 'wp-one', problem: 'no .claude/skills symlink' },
				{ target: '.', skill: VENDORED_FILE, problem: 'out of date' },
			] )
		);

		vendor().sync();
		fs.appendFileSync( path.join( root, 'plugin-template/.agents/skills/wp-two/SKILL.md' ), 'edit' );
		fs.rmSync( path.join( root, '.claude/skills/wp-one' ) );
		fs.writeFileSync( path.join( root, '.agents/skills', VENDORED_FILE ), 'stale' );

		expect( vendor().check() ).toEqual( [
			{ target: '.', skill: 'wp-one', problem: 'no .claude/skills symlink' },
			{ target: '.', skill: VENDORED_FILE, problem: 'out of date' },
			{ target: 'plugin-template', skill: 'wp-two', problem: 'differs from the pinned commit' },
		] );
	} );

	it.each( [
		[ { source: { repository: 'r', commit: 'abc123', path: 'skills' } }, /full 40-character SHA/ ],
		[ { skills: [] }, /at least one skill/ ],
		[ { targets: [] }, /at least one skill and one target/ ],
		[ { skills: [ '../escape' ] }, /Invalid skill name/ ],
	] )( 'rejects an invalid manifest: %j', ( overrides, message ) => {
		expect( () => vendor( manifest( overrides as Partial< SkillManifest > ) ) ).toThrow( message );
	} );
} );

describe( 'sameTree', () => {
	it( 'compares file lists and contents', () => {
		const a = fs.mkdtempSync( path.join( os.tmpdir(), 'tree-a-' ) );
		const b = fs.mkdtempSync( path.join( os.tmpdir(), 'tree-b-' ) );
		fs.writeFileSync( path.join( a, 'x' ), '1' );
		fs.writeFileSync( path.join( b, 'x' ), '1' );
		expect( sameTree( a, b ) ).toBe( true );
		fs.writeFileSync( path.join( b, 'y' ), '2' );
		expect( sameTree( a, b ) ).toBe( false );
		fs.rmSync( path.join( b, 'y' ) );
		fs.writeFileSync( path.join( b, 'x' ), '2' );
		expect( sameTree( a, b ) ).toBe( false );
	} );
} );

describe( 'GitCheckout', () => {
	it( 'fetches only the pinned commit and checks it out', () => {
		const calls: Array< [ string, string[], string | undefined ] > = [];
		const runner: CommandRunner = ( command, args, cwd ) => {
			calls.push( [ command, args, cwd ] );
			return '';
		};
		new GitCheckout( runner ).fetch( 'https://example.test/r.git', COMMIT, '/tmp/x' );
		expect( calls ).toEqual( [
			[ 'git', [ 'init', '--quiet', '/tmp/x' ], undefined ],
			[ 'git', [ 'fetch', '--quiet', '--depth', '1', 'https://example.test/r.git', COMMIT ], '/tmp/x' ],
			[ 'git', [ '-c', 'advice.detachedHead=false', 'checkout', '--quiet', 'FETCH_HEAD' ], '/tmp/x' ],
		] );
	} );

	it( 'runs real commands through execFileSync', () => {
		expect( execRunner( process.execPath, [ '-e', 'process.stdout.write("ok")' ] ) ).toBe( 'ok' );
	} );
} );

describe( 'run', () => {
	let root: string;
	const io = () => ( { log: jest.fn(), error: jest.fn() } );

	beforeEach( () => {
		root = fs.mkdtempSync( path.join( os.tmpdir(), 'scaffold-run-' ) );
		fs.mkdirSync( path.join( root, 'scripts' ) );
		fs.writeFileSync( path.join( root, MANIFEST_PATH ), JSON.stringify( manifest() ) );
	} );

	afterEach( () => {
		fs.rmSync( root, { recursive: true, force: true } );
	} );

	it( 'syncs, then --check passes', () => {
		const out = io();
		expect( run( [], root, out, new FakeGit( upstreamFiles() ) ) ).toBe( 0 );
		expect( out.log ).toHaveBeenCalledWith( expect.stringContaining( 'Vendored 4 skill copies from aaaaaaa' ) );

		const check = io();
		expect( run( [ '--check' ], root, check, new FakeGit( upstreamFiles() ) ) ).toBe( 0 );
		expect( check.log ).toHaveBeenCalledWith( 'All 2 skills match aaaaaaa.' );
	} );

	it( 'returns 1 from --check when skills drift', () => {
		const out = io();
		expect( run( [ '--check' ], root, out, new FakeGit( upstreamFiles() ) ) ).toBe( 1 );
		expect( out.error ).toHaveBeenCalledWith( 'Run npm run sync:agent-skills to update.' );
	} );

	it( 'returns 1 for unknown arguments and a missing manifest', () => {
		expect( run( [ '--force' ], root, io(), new FakeGit( {} ) ) ).toBe( 1 );
		fs.rmSync( path.join( root, MANIFEST_PATH ) );
		const out = io();
		expect( run( [], root, out, new FakeGit( {} ) ) ).toBe( 1 );
		expect( out.error ).toHaveBeenCalledWith( expect.stringMatching( /^sync-agent-skills failed: / ) );
	} );

	it( 'reports non-Error failures', () => {
		const git = new FakeGit( {} );
		git.fetch = () => {
			throw 'offline';
		};
		const out = io();
		expect( run( [], root, out, git ) ).toBe( 1 );
		expect( out.error ).toHaveBeenCalledWith( 'sync-agent-skills failed: offline' );
	} );

	it( 'rejects a SyncError subclass of Error', () => {
		expect( new SyncError( 'x' ) ).toBeInstanceOf( Error );
	} );
} );
