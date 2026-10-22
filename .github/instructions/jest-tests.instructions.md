---
title: Jest Tests Instructions
description: How to write, organise, and configure Jest tests in the multi-block-plugin-scaffold repository
category: Testing
audience: Developers
created: 2025-12-16
updated: 2025-12-16
---

# Jest Tests Instructions

This document explains how Jest tests are organized and written in the multi-block-plugin-scaffold repository, based on [Jest Documentation](https://jestjs.io/docs/getting-started) and WordPress block development standards.

> **Scope**: Jest covers the **scaffold repository's own** tests (the generator CLI, validation and agent scripts), run with `npm run test:unit` (`wp-scripts test-unit-jest` with `@wordpress/jest-preset-default`). **Generated plugins use Vitest**, because `@wordpress/scripts` 36 retired its Jest defaults. For plugin unit tests, see `templates/tests/js/` and the Vitest section of [javascript-react-development.instructions.md](./javascript-react-development.instructions.md).

## Table of Contents

- [Test File Organization](#test-file-organization)
- [Test File Naming](#test-file-naming)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Configuration](#configuration)
- [Mocking](#mocking)
- [Code Coverage](#code-coverage)
- [Best Practices](#best-practices)

## Test File Organization

### Directory Structure

Place all Jest test files in a `__tests__` subfolder next to the code under test. This is the Jest convention and makes it easy to locate tests.

```
scripts/
├── __tests__/             # Tests for scripts in root scripts/ folder
│   ├── generate-plugin.agent.test.js
│   └── validate-plugin-config.test.js
├── agents/
│   └── __tests__/         # Tests for agent scripts
│       ├── generate-plugin.agent.test.js
│       ├── release.agent.test.js
│       └── release-scaffold.agent.test.js
├── dry-run/
│   └── __tests__/         # Tests for dry-run functionality
│       ├── dry-run-config.test.js
│       └── dry-run-mustache-vars.test.js
├── lib/
│   └── __tests__/         # Tests for shared library functions
│       └── logger.test.js
├── utils/
│   └── __tests__/         # Tests for utility functions
│       └── file-utils.test.js
└── validation/
    └── __tests__/         # Tests for validation logic
        └── schema-validator.test.js
```

### Current Test Locations

The repository currently has Jest tests in these locations:

- **`scripts/__tests__/`** - Tests for top-level scripts (generate-plugin, validation, etc.)
- **`scripts/agents/__tests__/`** - Tests for agent scripts (generate-plugin.agent.js, release.agent.js, etc.)
- **`scripts/dry-run/__tests__/`** - Tests for dry-run configuration and mustache variable handling
- **`scripts/lib/__tests__/`** - Tests for shared library functions (logger, file operations)
- **`scripts/utils/__tests__/`** - Tests for utility functions
- **`scripts/validation/__tests__/`** - Tests for schema validation logic

### Additional Test Locations

- **`tests/js/`** - Tests for JavaScript blocks and components
- **`tests/setup-tests.js`** - Global test setup file

## Test File Naming

### Conventions

- Use `.test.js` suffix for test files (primary convention)
- Alternatively, use `.spec.js` suffix (also supported)
- Test file name should match the file being tested

### Examples

```
my-script.js          → my-script.test.js
logger.js             → logger.test.js
generate-plugin.js    → generate-plugin.test.js
```

### Special Cases

- For agent scripts: `generate-plugin.agent.js` → `generate-plugin.agent.test.js`
- For multiple related tests: Use descriptive names like `dry-run-config.test.js`, `dry-run-mustache-vars.test.js`

## Writing Tests

### Basic Test Structure

```javascript
/**
 * Tests for MyModule
 */

const MyModule = require('../my-module');

describe('MyModule', () => {
	// Setup before each test
	beforeEach(() => {
		// Reset state, clear mocks, etc.
	});

	// Teardown after each test
	afterEach(() => {
		// Cleanup
	});

	describe('methodName', () => {
		test('should do something specific', () => {
			const result = MyModule.methodName('input');
			expect(result).toBe('expected output');
		});

		test('should handle edge cases', () => {
			expect(() => {
				MyModule.methodName(null);
			}).toThrow('Expected error message');
		});
	});
});
```

### Describe Blocks

Use `describe()` to group related tests:

```javascript
describe('PluginGenerator', () => {
	describe('constructor', () => {
		test('initializes with default options', () => {
			const generator = new PluginGenerator();
			expect(generator.options).toEqual({});
		});

		test('accepts custom options', () => {
			const generator = new PluginGenerator({ custom: 'value' });
			expect(generator.options.custom).toBe('value');
		});
	});

	describe('generatePlugin', () => {
		test('creates plugin files', async () => {
			// Test implementation
		});

		test('validates configuration', async () => {
			// Test implementation
		});
	});
});
```

### Test Assertions

Common Jest matchers:

```javascript
// Equality
expect(value).toBe(expectedValue);          // Strict equality (===)
expect(value).toEqual(expectedValue);       // Deep equality
expect(value).not.toBe(unexpectedValue);    // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeLessThanOrEqual(5);
expect(value).toBeCloseTo(0.3, 1);         // Floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays and Iterables
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(set).toContain(value);

// Objects
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', value);
expect(object).toMatchObject({ key: 'value' });

// Exceptions
expect(() => {
	throwingFunction();
}).toThrow();
expect(() => {
	throwingFunction();
}).toThrow('error message');
expect(() => {
	throwingFunction();
}).toThrow(ErrorType);

// Async
await expect(asyncFunction()).resolves.toBe(value);
await expect(asyncFunction()).rejects.toThrow();
```

### Async Tests

```javascript
// Using async/await
test('async test', async () => {
	const data = await fetchData();
	expect(data).toBe('expected');
});

// Using resolves/rejects
test('async with resolves', async () => {
	await expect(fetchData()).resolves.toBe('expected');
});

test('async with rejects', async () => {
	await expect(fetchData()).rejects.toThrow('error');
});
```

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test path/to/test.test.js

# Run tests matching pattern
npm test -- --testNamePattern="describe or test name"

# Run tests with coverage
npm test -- --coverage

# Update snapshots
npm test -- --updateSnapshot
```

### Jest CLI Options

```bash
# Verbose output
npm test -- --verbose

# Run only failed tests
npm test -- --onlyFailures

# Run tests in specific order
npm test -- --runInBand

# Set timeout
npm test -- --testTimeout=10000
```

## Configuration

### Jest Config File

Located at `jest.config.js` in repository root.

```javascript
module.exports = {
	// Test file patterns
	testMatch: [
		'**/tests/js/**/*.test.js',
		'**/tests/**/*.test.js',
		'**/?(*.)+(spec|test).js',
	],

	// Files to ignore
	testPathIgnorePatterns: [
		'/node_modules/',
		'/vendor/',
		'/build/',
		'/tests/e2e/',
		'/.dry-run-backup/',
	],

	// Setup files
	setupFilesAfterEnv: ['<rootDir>/tests/setup-tests.js'],

	// Module name mapping
	moduleNameMapper: {
		'\\.(css|less|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
		'\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js',
	},
};
```

### Setup Files

Global setup is defined in `tests/setup-tests.js`:

```javascript
// Configure testing environment
global.console = {
	...console,
	// Suppress console output during tests if needed
	// log: jest.fn(),
	// error: jest.fn(),
};
```

## Mocking

### Mock Functions

```javascript
// Create mock function
const mockFn = jest.fn();

// Mock with return value
const mockFn = jest.fn().mockReturnValue('value');

// Mock with implementation
const mockFn = jest.fn((x) => x * 2);

// Mock promises
const mockFn = jest.fn().mockResolvedValue('value');
const mockFn = jest.fn().mockRejectedValue(new Error('error'));

// Assert mock was called
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenLastCalledWith('arg');

// Reset mock
mockFn.mockReset();
mockFn.mockClear();
```

### Mock Modules

```javascript
// Mock entire module
jest.mock('../module-name');

// Mock with return value
jest.mock('../module-name', () => ({
	functionName: jest.fn().mockReturnValue('value'),
}));

// Partial mock
jest.mock('../module-name', () => ({
	...jest.requireActual('../module-name'),
	functionName: jest.fn(),
}));
```

### Mock Files

Create `__mocks__` directory next to module:

```
scripts/
├── lib/
│   ├── __mocks__/
│   │   └── logger.js      # Mock implementation
│   └── logger.js          # Real implementation
```

Mock implementation:

```javascript
// scripts/lib/__mocks__/logger.js
module.exports = {
	writeLog: jest.fn(),
	createLogEntry: jest.fn(),
	ensureLogsDirectory: jest.fn(),
};
```

### Mocking File System

```javascript
const fs = require('fs');
jest.mock('fs');

test('reads file', () => {
	fs.readFileSync.mockReturnValue('file contents');
	const result = myFunction();
	expect(result).toContain('file contents');
});
```

## Code Coverage

### Collecting Coverage

```bash
# Run tests with coverage
npm test -- --coverage

# Coverage for specific files
npm test -- --coverage --collectCoverageFrom="scripts/**/*.js"
```

### Coverage Reports

Coverage reports are generated in `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/coverage-final.json` - JSON format

### Coverage Thresholds

Defined in `jest.config.js`:

```javascript
coverageThreshold: {
	global: {
		branches: 0,
		functions: 0,
		lines: 5,
		statements: 5,
	},
}
```

## Best Practices

### Test Organization

1. **Group Related Tests** - Use `describe` blocks to organize tests logically
2. **One Assertion Per Test** - Tests should be focused and test one thing
3. **Descriptive Test Names** - Test names should clearly describe what is being tested
4. **AAA Pattern** - Arrange, Act, Assert

```javascript
test('should calculate total price with tax', () => {
	// Arrange
	const cart = new ShoppingCart();
	cart.addItem({ price: 100, quantity: 2 });

	// Act
	const total = cart.calculateTotal(0.1); // 10% tax

	// Assert
	expect(total).toBe(220);
});
```

### Test Independence

1. **No Shared State** - Each test should be independent
2. **Clean Up** - Use `beforeEach`/`afterEach` to reset state
3. **No Test Order Dependencies** - Tests should pass in any order

```javascript
describe('Counter', () => {
	let counter;

	beforeEach(() => {
		counter = new Counter(); // Fresh instance for each test
	});

	test('starts at zero', () => {
		expect(counter.value).toBe(0);
	});

	test('increments', () => {
		counter.increment();
		expect(counter.value).toBe(1);
	});
});
```

### Mocking Best Practices

1. **Mock External Dependencies** - Don't test external libraries
2. **Mock I/O Operations** - File system, network requests, databases
3. **Don't Over-Mock** - Mock only what's necessary
4. **Clear Mocks** - Reset mocks between tests

```javascript
beforeEach(() => {
	jest.clearAllMocks();
});
```

### Test Naming

Use clear, descriptive names that explain what is being tested:

```javascript
// ❌ Bad
test('test1', () => {});
test('it works', () => {});

// ✅ Good
test('should throw error when config is invalid', () => {});
test('should create plugin with default options', () => {});
test('should preserve mustache variables during generation', () => {});
```

### Avoid Testing Implementation Details

Test behavior, not implementation:

```javascript
// ❌ Bad - Testing internal implementation
test('should call private method', () => {
	const spy = jest.spyOn(generator, '_internalMethod');
	generator.generate();
	expect(spy).toHaveBeenCalled();
});

// ✅ Good - Testing behavior
test('should generate valid plugin structure', () => {
	const result = generator.generate();
	expect(result.files).toContain('plugin.php');
	expect(result.blocks).toHaveLength(4);
});
```

### Test Edge Cases

Always test edge cases and error conditions:

```javascript
describe('divide', () => {
	test('divides two numbers', () => {
		expect(divide(10, 2)).toBe(5);
	});

	test('handles decimal results', () => {
		expect(divide(10, 3)).toBeCloseTo(3.33, 2);
	});

	test('throws error when dividing by zero', () => {
		expect(() => divide(10, 0)).toThrow('Division by zero');
	});

	test('handles negative numbers', () => {
		expect(divide(-10, 2)).toBe(-5);
	});
});
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Jest API Reference](https://jestjs.io/docs/api)
- [Jest Expect Matchers](https://jestjs.io/docs/expect)
- [WordPress Scripts Testing](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#test-unit)
- [Repository CONTRIBUTING.md](../../CONTRIBUTING.md)
- [Repository Testing Documentation](../../tests/README.md)

## Examples from This Repository

### Agent Tests

See `scripts/agents/__tests__/generate-plugin.agent.test.js` for examples of:
- Testing class constructors
- Testing async methods
- Testing validation logic
- Mocking file system operations

### Configuration Tests

See `scripts/dry-run/__tests__/dry-run-config.test.js` for examples of:
- Testing configuration loading
- Testing default values
- Testing validation errors

### Utility Tests

See `scripts/lib/__tests__/logger.test.js` for examples of:
- Testing utility functions
- Mocking file operations
- Testing error handling
