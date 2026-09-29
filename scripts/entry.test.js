/**
 * Plugin entry tests.
 *
 * @package
 */

describe('Entry point', () => {
	beforeEach(() => {
		jest.resetModules();
		jest.clearAllMocks();
	});

	it('registers every block export', () => {
		require('../src/index');

		expect(global.wp.blocks.registerBlockType).toHaveBeenCalledTimes(3);
	});
});
