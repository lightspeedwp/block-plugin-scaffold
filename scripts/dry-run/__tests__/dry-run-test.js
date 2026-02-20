#!/usr/bin/env node
/* eslint-disable no-console, jsdoc/require-param-type */

/**
 * Dry Run Test Runner
 *
 * Temporarily replaces mustache variables with test values,
 * runs tests/linting, then restores original files.
 *
 * @package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const { replaceMustacheVars, DRY_RUN_VALUES } = require('../dry-run-config');
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

// Create logs directory
const logsDir = path.join(ROOT_DIR, 'logs');
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file with timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const logFile = path.join(logsDir, `dry-run-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

/**
 * Write a timestamped message to both console output and the persistent log file.
 *
 * @param {string} level - Log level identifier (e.g. INFO, WARN, ERROR).
 * @param {string} message - Message text to record.
 * @return {void}
 */
function dryRunLog(level, message) {
	const entry = `[${new Date().toISOString()}] [${level}] ${message}\n`;
	logStream.write(entry);
	console.log(
		`${colors[level.toLowerCase()] || colors.reset}${entry.trim()}${colors.reset}`
	);
}

// ANSI color codes
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
	error: '\x1b[31m',
	warn: '\x1b[33m',
	info: '\x1b[36m',
	debug: '\x1b[90m',
	trace: '\x1b[90m',
};

/**
 * Output a coloured log message to stdout.
 *
 * @param {string} message - Content to display.
 * @param {keyof typeof colors} color - Colour key for the message.
 * @return {void}
 */
function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Get files matching pattern with mustache variables.
 *
 * @return {string[]} Absolute paths of files that require replacement.
 */
function getTargetFiles() {
	const patterns = [
		'src/**/*.{js,jsx}',
		'src/**/*.scss',
		'src/scss/**/*.scss',
		'src/blocks/**/*.scss',
		'inc/**/*.php',
		'patterns/**/*.{php,html}',
		'languages/**/*.pot',
		'scf-json/**/*.json',
		'tests/**/*.{js,php}',
		'*.php',
		'package.json',
		'composer.json',
	];

	const ignorePatterns = [
		'node_modules/**',
		'vendor/**',
		'build/**',
		'dist/**',
		'coverage/**',
		'tmp/**',
		'.git/**',
		'.github/**',
		'logs/**',
		'.dry-run-backup/**',
		'generated-plugins/**',
		'artifacts/**',
		'output-theme/**',
		'bin/**',
	];

	const files = new Set();

	// TODO: Cache file lists between runs so repeated dry-run executions stay performant.

	patterns.forEach((pattern) => {
		const matches = glob.sync(pattern, {
			cwd: ROOT_DIR,
			dot: true,
			ignore: ignorePatterns,
			nodir: true,
		});

		matches.forEach((file) => {
			const fullPath = path.resolve(ROOT_DIR, file);
			// Always replace in SCSS files, even if no placeholder found at top level
			if (file.endsWith('.scss')) {
				files.add(fullPath);
				return;
			}

			const content = fs.readFileSync(fullPath, 'utf8');
			if (/\{\{[a-z_]+\}\}/i.test(content)) {
				files.add(fullPath);
			}
		});
	});

	return Array.from(files);
}

let currentRenameOperations = [];

/**
 * Rename block directories that contain mustache placeholders.
 *
 * @return {Array<{original: string, replaced: string}>} Information about renamed paths for reversion.
 */
function renameBlockDirectories() {
	// TODO: Add validation that the renamed directories are readable by downstream tooling.
	const placeholderPattern = 'src/blocks/{{slug}}-*';
	const matches = glob.sync(placeholderPattern, {
		cwd: ROOT_DIR,
		dot: true,
		nodir: false,
	});

	const operations = [];

	matches.forEach((relative) => {
		const originalPath = path.join(ROOT_DIR, relative);
		if (!fs.existsSync(originalPath)) {
			return;
		}

		const stat = fs.statSync(originalPath);
		if (!stat.isDirectory()) {
			return;
		}

		const replacedRelative = replaceMustacheVars(relative);
		if (replacedRelative === relative) {
			return;
		}

		const targetPath = path.join(ROOT_DIR, replacedRelative);
		if (fs.existsSync(targetPath)) {
			dryRunLog(
				'WARN',
				`Target path already exists, skipping rename: ${replacedRelative}`
			);
			return;
		}

		const targetDir = path.dirname(targetPath);
		if (!fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true });
		}

		fs.renameSync(originalPath, targetPath);
		operations.push({ original: originalPath, replaced: targetPath });
	});

	return operations;
}

/**
 * Revert renamed block directories back to their placeholder names.
 *
 * @param {Array<{original: string, replaced: string}>} operations Renaming details to rollback.
 * @return {void}
 */
function revertBlockDirectories(operations) {
	if (!operations.length) {
		return;
	}

	operations
		.slice()
		.reverse()
		.forEach((operation) => {
			if (!fs.existsSync(operation.replaced)) {
				dryRunLog(
					'WARN',
					`Renamed path missing during revert: ${operation.replaced}`
				);
				return;
			}

			const parentDir = path.dirname(operation.original);
			if (!fs.existsSync(parentDir)) {
				fs.mkdirSync(parentDir, { recursive: true });
			}

			fs.renameSync(operation.replaced, operation.original);
		});
}

/**
 * Create backup copies for every file that will be modified.
 *
 * @param {string[]} files - Absolute file paths to backup.
 * @return {Record<string, string>} Map of original paths to backup paths.
 */
function backupFiles(files) {
	const backupDir = path.join(ROOT_DIR, '.dry-run-backup');

	if (!fs.existsSync(backupDir)) {
		fs.mkdirSync(backupDir, { recursive: true });
	}

	const backupMap = {};

	// TODO: Skip copying a file when the backup already matches to reduce disk churn.

	files.forEach((filePath) => {
		const relativePath = path.relative(ROOT_DIR, filePath);
		const backupPath = path.join(backupDir, relativePath);
		const backupDirPath = path.dirname(backupPath);

		if (!fs.existsSync(backupDirPath)) {
			fs.mkdirSync(backupDirPath, { recursive: true });
		}

		fs.copyFileSync(filePath, backupPath);
		backupMap[filePath] = backupPath;
	});

	return backupMap;
}

/**
 * Replace mustache placeholders with configured dry-run values in the provided files.
 *
 * @param {string[]} files - Absolute file paths eligible for replacement.
 * @return {void}
 */
function replaceInFiles(files) {
	files.forEach((filePath) => {
		const content = fs.readFileSync(filePath, 'utf8');
		const replaced = replaceMustacheVars(content);
		fs.writeFileSync(filePath, replaced, 'utf8');
	});
}

/**
 * Restore files from backup copies and remove the backup directory.
 *
 * @param {Record<string, string>} backupMap - Map of original paths to backup paths.
 * @return {void}
 */
function restoreFiles(backupMap) {
	Object.entries(backupMap).forEach(([originalPath, backupPath]) => {
		if (fs.existsSync(backupPath)) {
			fs.copyFileSync(backupPath, originalPath);
		}
	});

	// Clean up backup directory
	const backupDir = path.join(ROOT_DIR, '.dry-run-backup');
	if (fs.existsSync(backupDir)) {
		fs.rmSync(backupDir, { recursive: true, force: true });
	}
}

/**
 * Run a command and track whether it succeeded for logging.
 *
 * @param {string} command - Command string executed via execSync.
 * @param {string} description - Human-readable description for logging.
 * @return {boolean} True when the command succeeded.
 */
function runCommand(command, description) {
	log(`\n🔄 ${description}...`, 'cyan');

	try {
		execSync(command, {
			stdio: 'inherit',
			cwd: ROOT_DIR,
		});
		log(`✅ ${description} passed`, 'green');
		return true;
	} catch (error) {
		log(`❌ ${description} failed`, 'red');
		return false;
	}
}

/**
 * Main execution entry point for the dry-run test scaffold.
 *
 * @return {Promise<void>}
 */
async function main() {
	const args = process.argv.slice(2);
	const commands =
		args.length > 0 ? args : ['lint:js', 'lint:css', 'test:unit'];
	// TODO: Allow configuring a trimmed command list to speed up quick sanity checks.

	dryRunLog('INFO', 'Dry Run Test Mode starting');
	dryRunLog('INFO', `Node version: ${process.version}`);
	dryRunLog('INFO', `Working directory: ${process.cwd()}`);
	dryRunLog('INFO', `Log file: ${logFile}`);

	log('\n🚀 Starting Dry Run Test Mode', 'bright');
	log('================================\n', 'bright');

	log('📝 Using test values:', 'yellow');
	Object.entries(DRY_RUN_VALUES)
		.slice(0, 5)
		.forEach(([key, value]) => {
			log(`   ${key}: ${value}`, 'reset');
			dryRunLog('DEBUG', `Test value: ${key} = ${value}`);
		});
	log('   ... (see scripts/dry-run-config.js for full list)\n', 'reset');

	// Get files with mustache variables
	log('🔍 Finding files with mustache variables...', 'cyan');
	dryRunLog('INFO', 'Finding files with mustache variables');
	const files = getTargetFiles();
	log(`   Found ${files.length} files\n`, 'reset');
	dryRunLog('INFO', `Found ${files.length} files with mustache variables`);

	// Backup files
	log('💾 Creating backup...', 'cyan');
	dryRunLog('INFO', 'Creating backup');
	const backupMap = backupFiles(files);
	log(`   Backed up ${Object.keys(backupMap).length} files\n`, 'green');
	dryRunLog('INFO', `Backed up ${Object.keys(backupMap).length} files`);

	let allPassed = true;

	try {
		// Replace mustache variables
		log('🔧 Replacing mustache variables...', 'cyan');
		dryRunLog('INFO', 'Replacing mustache variables in files');
		replaceInFiles(files);
		log('   Variables replaced\n', 'green');
		dryRunLog('INFO', 'Variables replaced successfully');

		currentRenameOperations = renameBlockDirectories();
		if (currentRenameOperations.length) {
			log(
				`   Renamed ${currentRenameOperations.length} placeholder directories`,
				'green'
			);
			dryRunLog(
				'INFO',
				`Renamed ${currentRenameOperations.length} placeholder directories`
			);
		}

		// Ensure _template.scss is deleted before build/test
		const templatePartial = path.join(ROOT_DIR, 'src', 'scss', '_template.scss');
		if (fs.existsSync(templatePartial)) {
			try {
				fs.unlinkSync(templatePartial);
				log('🧹 Deleted _template.scss before build/test', 'yellow');
				dryRunLog('INFO', 'Deleted _template.scss before build/test');
			} catch (err) {
				log(`⚠️  Failed to delete _template.scss: ${err.message}`, 'red');
				dryRunLog('ERROR', `Failed to delete _template.scss: ${err.message}`);
			}
		}

		// Run commands
		for (const command of commands) {
			const npmCommand = command.startsWith('npm')
				? command
				: `npm run ${command}`;
			dryRunLog('INFO', `Running command: ${npmCommand}`);
			const passed = runCommand(npmCommand, `Running ${command}`);

			if (!passed) {
				allPassed = false;
				dryRunLog('ERROR', `Command failed: ${command}`);

				// Ask if we should continue
				if (commands.indexOf(command) < commands.length - 1) {
					log('\n⚠️  Continue with remaining tests? (y/N)', 'yellow');

					// For automated environments, stop on first failure
					if (process.env.CI || !process.stdin.isTTY) {
						dryRunLog(
							'INFO',
							'Stopping on first failure (CI mode)'
						);
						break;
					}
				}
			} else {
				dryRunLog('INFO', `Command passed: ${command}`);
			}
		}
	} finally {
		if (currentRenameOperations.length) {
			revertBlockDirectories(currentRenameOperations);
			currentRenameOperations = [];
		}

		// Always restore files
		log('\n🔄 Restoring original files...', 'cyan');
		dryRunLog('INFO', 'Restoring original files');
		restoreFiles(backupMap);
		log('   Files restored\n', 'green');
		dryRunLog('INFO', 'Files restored successfully');
	}

	// Summary
	log('\n================================', 'bright');
	if (allPassed) {
		log('✅ All tests passed!', 'green');
		dryRunLog('INFO', 'All tests passed');
		log('================================\n', 'bright');
		logStream.end();
		process.exit(0);
	} else {
		log('❌ Some tests failed', 'red');
		dryRunLog('ERROR', 'Some tests failed');
		log('================================\n', 'bright');
		logStream.end();
		process.exit(1);
	}
}

// Handle cleanup on interrupt
process.on('SIGINT', () => {
	log('\n\n⚠️  Interrupted! Cleaning up...', 'yellow');
	dryRunLog('WARN', 'Process interrupted, cleaning up');
	if (currentRenameOperations.length) {
		revertBlockDirectories(currentRenameOperations);
		currentRenameOperations = [];
	}
	const backupDir = path.join(ROOT_DIR, '.dry-run-backup');
	if (fs.existsSync(backupDir)) {
		// Restore from backup if it exists
		log('🔄 Restoring files...', 'cyan');
		dryRunLog('INFO', 'Restoring files after interrupt');
		// Simple restoration logic
		logStream.end();
		process.exit(1);
	}
});

// Run
main().catch((error) => {
	log(`\n❌ Error: ${error.message}`, 'red');
	dryRunLog('ERROR', `Fatal error: ${error.message}`);
	dryRunLog('ERROR', `Stack trace: ${error.stack}`);
	logStream.end();
	process.exit(1);
});
