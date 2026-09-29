/**
 * Tests for scan utilities
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
	loadIgnorePatterns,
	shouldIgnorePath,
	scanDirectory,
} = require('../scan');

describe('loadIgnorePatterns', () => {
	const tempDir = path.join(__dirname, 'temp-ignore-test');
	const ignorePath = path.join(tempDir, '.mustacheignore');

	beforeEach(() => {
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}
	});

	afterEach(() => {
		if (fs.existsSync(ignorePath)) {
			fs.unlinkSync(ignorePath);
		}
		if (fs.existsSync(tempDir)) {
			fs.rmdirSync(tempDir);
		}
	});

	test('returns empty array when .mustacheignore does not exist', () => {
		const patterns = loadIgnorePatterns(tempDir);
		expect(patterns).toEqual([]);
	});

	test('loads patterns from .mustacheignore file', () => {
		fs.writeFileSync(ignorePath, 'node_modules/\nbuild/\n# comment\n\ndocs/');
		const patterns = loadIgnorePatterns(tempDir);
		expect(patterns).toEqual(['node_modules/', 'build/', 'docs/']);
	});

	test('shouldIgnorePath matches simple patterns', () => {
		const patterns = ['node_modules/', 'build/'];
		expect(shouldIgnorePath('node_modules/package', patterns)).toBe(true);
		expect(shouldIgnorePath('src/index.js', patterns)).toBe(false);
	});

	test('shouldIgnorePath matches glob patterns', () => {
		const patterns = ['**/*.test.js', 'src/experimental/**'];
		expect(shouldIgnorePath('src/utils/scan.test.js', patterns)).toBe(true);
		expect(shouldIgnorePath('src/experimental/feature.js', patterns)).toBe(true);
		expect(shouldIgnorePath('src/utils/scan.js', patterns)).toBe(false);
	});
});

describe('scanDirectory', () => {
	test('skips generator output directories', () => {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-exclude-'));
		try {
			fs.writeFileSync(path.join(root, 'readme.txt'), '{{name}}');
			['generated-plugins/demo', 'output-plugin'].forEach((dir) => {
				fs.mkdirSync(path.join(root, dir), { recursive: true });
				fs.writeFileSync(path.join(root, dir, 'readme.txt'), '{{name}}');
			});

			expect(scanDirectory(root).map((file) => file.path)).toEqual([
				'readme.txt',
			]);
		} finally {
			fs.rmSync(root, { recursive: true, force: true });
		}
	});
});
