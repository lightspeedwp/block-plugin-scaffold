/**
 * Typed access to the generator engine (scripts/generate-plugin.js) for the
 * MCP modules (BPS-12).
 *
 * The engine is CommonJS JavaScript; this is the one place the MCP code
 * imports it, so its types are declared once.
 */

import engine from '../generate-plugin.js';

export type PluginConfig = Record< string, unknown >;

/** A diagnostic writer, or false for none. */
export type Output = ( ( level: string, message: string ) => void ) | false;

export interface GenerateOptions {
	inPlace?: boolean;
	outputDir?: string;
	outputBaseDir?: string;
	force?: boolean;
	now?: () => Date;
	logFile?: string;
	output?: Output;
}

export interface SchemaProperty {
	type?: string | string[];
	description?: string;
	[ rule: string ]: unknown;
}

export interface ConfigSchema {
	required?: string[];
	properties: Record< string, SchemaProperty >;
}

export interface SchemaError {
	instancePath?: string;
	message?: string;
}

interface Engine {
	generatePlugin: (
		config: PluginConfig,
		options?: GenerateOptions | boolean
	) => string;
	applyDefaults: (
		config: PluginConfig,
		now?: Date
	) => Record< string, unknown >;
	validateConfig: ( config: Record< string, unknown > ) => {
		valid: boolean;
		errors: SchemaError[] | null;
	};
	loadSchema: () => ConfigSchema;
}

const typed = engine as Engine;

export const generatePlugin = typed.generatePlugin;
export const applyDefaults = typed.applyDefaults;
export const validateConfig = typed.validateConfig;
export const loadSchema = typed.loadSchema;
