/**
 * Errors for local MCP plugin generation (BPS-12).
 *
 * Every failure the MCP tools report carries one of the codes defined in
 * docs/MCP-PLUGIN-GENERATION.md, so the consuming skill can act on it.
 *
 * Node 24.18+ runs this file directly (type stripping), so it uses only
 * erasable TypeScript syntax.
 */

export const CODES = Object.freeze( {
	INVALID_CONFIG: 'INVALID_CONFIG',
	UNSAFE_DESTINATION: 'UNSAFE_DESTINATION',
	CONFLICT: 'CONFLICT',
	PREVIEW_NOT_FOUND: 'PREVIEW_NOT_FOUND',
	APPROVAL_MISMATCH: 'APPROVAL_MISMATCH',
	STALE_PREVIEW: 'STALE_PREVIEW',
	STAGING_FAILED: 'STAGING_FAILED',
	PARTIAL_WRITE: 'PARTIAL_WRITE',
	INTERNAL: 'INTERNAL',
} as const );

export type ErrorCode = ( typeof CODES )[ keyof typeof CODES ];

/** An error with a contract code and structured details. */
export class GenerationError extends Error {
	code: ErrorCode;
	details: Record< string, unknown >;

	/**
	 * @param code    One of CODES.
	 * @param message Human-readable message.
	 * @param details Structured details for the client.
	 */
	constructor(
		code: ErrorCode,
		message: string,
		details: Record< string, unknown > = {}
	) {
		super( message );
		this.name = 'GenerationError';
		this.code = code;
		this.details = details;
	}

	/** The error as JSON for a tool result. */
	toJSON(): {
		code: ErrorCode;
		message: string;
		details: Record< string, unknown >;
	} {
		return {
			code: this.code,
			message: this.message,
			details: this.details,
		};
	}
}
