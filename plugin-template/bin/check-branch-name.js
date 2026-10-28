#!/usr/bin/env node
/**
 * Check that a branch can take commits under the LightSpeed branching
 * strategy.
 *
 * Usage: node bin/check-branch-name.js [branch]
 * Defaults to the current branch. Exits with 1 and the reason when commits
 * on the branch are not allowed. Used by .husky/pre-commit, the Claude Code
 * hook in .claude/hooks/ and the branch-validation skill.
 *
 * The types and pattern copy the organisation's validator,
 * scripts/validation/validate-branch-name.cjs in lightspeedwp/.github, which
 * stays the source of truth: update this list when that one changes.
 */
const { execFileSync } = require( 'node:child_process' );

const TYPES = [
	'feat',
	'fix',
	'hotfix',
	'refactor',
	'chore',
	'task',
	'doc',
	'docs',
	'test',
	'perf',
	'ci',
	'build',
	'deps',
	'security',
	'revert',
	'research',
	'design',
	'a11y',
	'ux',
	'i18n',
	'ops',
	'proto',
	'ds',
	'api',
	'schema',
	'telemetry',
	'content',
	'seo',
	'config',
	'migrate',
	'qa',
	'uat',
	'audit',
	'codex',
	'aiops',
	'automation',
	'epic',
];
const SEGMENT = '[a-z0-9]+(?:-[a-z0-9]+)*';
// {type}/{scope}-{title}, lowercase kebab-case.
const PATTERN = new RegExp(
	`^(${ TYPES.join( '|' ) })/${ SEGMENT }-${ SEGMENT }$`
);
// Reserved for tools, and replaced by an organisation type.
const FORBIDDEN = /^(claude|copilot|openai|feature)\//;

/**
 * Why commits on a branch are not allowed.
 *
 * @param {string} branch Branch name.
 * @return {string|null} The reason, or null when commits are allowed.
 */
function checkBranch( branch ) {
	if (
		[ 'main', 'develop' ].includes( branch ) ||
		/^release\//.test( branch )
	) {
		return `commit on a working branch, not directly on ${ branch }.`;
	}
	if ( FORBIDDEN.test( branch ) ) {
		return `'${ branch.split( '/' )[ 0 ] }/' is not an allowed branch prefix.`;
	}
	if ( ! PATTERN.test( branch ) ) {
		return `branch '${ branch }' must be {type}/{scope}-{title} in lowercase kebab-case, with a type such as feat, fix, chore, test or docs.`;
	}
	return null;
}

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
			{ encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'ignore' ] }
		).trim();
	} catch {
		return '';
	}
}

if ( require.main === module ) {
	const branch = process.argv[ 2 ] || currentBranch();
	// A detached HEAD (a rebase, or a tag checkout) has no branch to check.
	if ( ! branch ) {
		process.exit( 0 );
	}
	const reason = checkBranch( branch );
	if ( reason ) {
		process.stderr.write( `${ reason }\n` );
		process.exit( 1 );
	}
	process.stdout.write( `Branch '${ branch }' can take commits.\n` );
}

module.exports = { checkBranch, TYPES };
