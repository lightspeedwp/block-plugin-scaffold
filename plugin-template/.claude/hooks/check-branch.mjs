#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook: keep work on a valid branch.
 *
 * Refuses (exit 2, with the reason on stderr for Claude):
 * - file edits inside the repository, and `git commit` or `git push`, while
 *   the current branch cannot take commits (main, develop, release/* or a
 *   name outside the LightSpeed branching strategy);
 * - creating a branch with a name outside the strategy
 *   (`git checkout -b`, `git switch -c`, `git branch`).
 *
 * The rules are bin/check-branch-name.js, which the pre-commit hook also
 * uses. Start the session with LS_ENFORCE_BRANCH_NAMES=0 to turn refusals
 * into warnings. Adapted from the hook in lightspeedwp/.github.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

let checkBranch;
try {
	( { checkBranch } = createRequire( import.meta.url )(
		path.join( projectDir, 'bin/check-branch-name.js' )
	) );
} catch {
	// An older checkout without the checker: warn, and allow the call.
	process.stderr.write(
		'Branch check skipped: bin/check-branch-name.js is missing.\n'
	);
	process.exit( 0 );
}

const EDIT_TOOLS = new Set( [ 'Edit', 'Write', 'MultiEdit', 'NotebookEdit' ] );
const NEW_BRANCH =
	/\bgit\s+(?:checkout\s+-[bB]|switch\s+(?:-c|--create)|branch)\s+(?!-)(\S+)/g;

/**
 * The current branch, or an empty string on a detached HEAD.
 *
 * @return {string} Branch name.
 */
function currentBranch() {
	try {
		return execFileSync(
			'git',
			[ 'symbolic-ref', '--quiet', '--short', 'HEAD' ],
			{
				cwd: projectDir,
				encoding: 'utf8',
				stdio: [ 'ignore', 'pipe', 'ignore' ],
			}
		).trim();
	} catch {
		return '';
	}
}

/**
 * Why the tool call should be refused, if it should.
 *
 * @param {string} toolName  Claude Code tool name.
 * @param {Object} toolInput The tool's input.
 * @return {string|null} The reason, or null to allow the call.
 */
function refusal( toolName, toolInput ) {
	const branch = currentBranch();
	if ( EDIT_TOOLS.has( toolName ) ) {
		const file = path.resolve(
			projectDir,
			toolInput.file_path || toolInput.notebook_path || ''
		);
		const insideRepo = ! path
			.relative( projectDir, file )
			.startsWith( '..' );
		const reason = branch && insideRepo && checkBranch( branch );
		return reason ? `Before editing, ${ reason }` : null;
	}
	if ( toolName !== 'Bash' ) {
		return null;
	}
	const command = toolInput.command || '';
	// A command that creates a branch commits on it, not on the current one.
	let target = branch;
	for ( const [ , name ] of command.matchAll( NEW_BRANCH ) ) {
		target = name.replace( /^['"]|['"]$/g, '' );
		const reason = checkBranch( target );
		if ( reason ) {
			return reason;
		}
	}
	if ( target && /\bgit\s+(?:commit|push)\b/.test( command ) ) {
		const reason = checkBranch( target );
		return reason ? `Before committing or pushing, ${ reason }` : null;
	}
	return null;
}

let input = '';
for await ( const chunk of process.stdin ) {
	input += chunk;
}
const { tool_name: toolName, tool_input: toolInput = {} } = JSON.parse(
	input || '{}'
);
const reason = refusal( toolName, toolInput );
if ( reason ) {
	const enforce = process.env.LS_ENFORCE_BRANCH_NAMES !== '0';
	process.stderr.write(
		`${ enforce ? '' : 'Warning: ' }${ reason } See bin/check-branch-name.js.\n`
	);
	process.exit( enforce ? 2 : 0 );
}
