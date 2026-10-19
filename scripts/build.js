#!/usr/bin/env node

/**
 * Build Script for Multi-Block Plugin Scaffold
 *
 * This script handles building the plugin for distribution.
 * It compiles JavaScript, processes styles, and prepares the build directory.
 *
 * @package multi-block-plugin-scaffold
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Run wp-scripts build
try {
	console.log('🔨 Building assets...');
	execSync('wp-scripts build --experimental-modules', { stdio: 'inherit' });
	console.log('✅ Build completed');
} catch (error) {
	console.error('❌ Build failed');
	process.exit(1);
}
