/**
 * Webpack Configuration for Multi-Block Plugin.
 *
 * @package
 */

/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */

const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Find all block entry points.
const glob = require('glob');

const blockEntries = {};
const blockDirs = glob.sync('./src/blocks/*/index.js');

blockDirs.forEach((blockPath) => {
	const blockName = path.basename(path.dirname(blockPath));
	blockEntries[`blocks/${blockName}/index`] = path.resolve(
		process.cwd(),
		blockPath
	);
});

// Find all JS files in src/js directory.
const jsEntries = {};
const jsDirs = glob.sync('./src/js/**/*.js');

jsDirs.forEach((jsPath) => {
	const relativePath = path.relative('./src/js', jsPath);
	const entryName = relativePath.replace(/\.js$/, '');
	jsEntries[`js/${entryName}`] = path.resolve(process.cwd(), jsPath);
});

module.exports = {
	...defaultConfig,
	entry: {
		index: path.resolve(process.cwd(), 'src', 'index.js'),
		...blockEntries,
		...jsEntries,
	},
	output: {
		filename: '[name].js',
		path: path.resolve(process.cwd(), 'build'),
	},
	resolve: {
		...defaultConfig.resolve,
		alias: {
			...(defaultConfig.resolve?.alias || {}),
			'@': path.resolve(process.cwd(), 'src'),
			'@blocks': path.resolve(process.cwd(), 'src', 'blocks'),
			'@components': path.resolve(process.cwd(), 'src', 'components'),
			'@hooks': path.resolve(process.cwd(), 'src', 'hooks'),
			'@utils': path.resolve(process.cwd(), 'src', 'utils'),
		},
	},
	plugins: [
		...defaultConfig.plugins,
		new CopyWebpackPlugin({
			patterns: [
				{
					from: 'src/blocks/*/render.php',
					to: ({ context, absoluteFilename }) => {
						const blockName = path.basename(path.dirname(absoluteFilename));
						return `blocks/${blockName}/render.php`;
					},
				},
			],
		}),
	],
};
