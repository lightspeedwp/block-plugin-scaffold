/**
 * Errors for local MCP plugin generation (BPS-12).
 *
 * Every failure the MCP tools report carries one of the codes defined in
 * docs/MCP-PLUGIN-GENERATION.md, so the consuming skill can act on it.
 *
 * @package
 */

const CODES = Object.freeze( {
	INVALID_CONFIG: 'INVALID_CONFIG',
	UNSAFE_DESTINATION: 'UNSAFE_DESTINATION',
	CONFLICT: 'CONFLICT',
	PREVIEW_NOT_FOUND: 'PREVIEW_NOT_FOUND',
	APPROVAL_MISMATCH: 'APPROVAL_MISMATCH',
	STALE_PREVIEW: 'STALE_PREVIEW',
	STAGING_FAILED: 'STAGING_FAILED',
	PARTIAL_WRITE: 'PARTIAL_WRITE',
	INTERNAL: 'INTERNAL',
} );

/**
 * An error with a contract code and structured details.
 */
class GenerationError extends Error {
	/**
	 * @param {string} code    One of CODES.
	 * @param {string} message Human-readable message.
	 * @param {Object} [details] Structured details for the client.
	 */
	constructor( code, message, details = {} ) {
		super( message );
		this.name = 'GenerationError';
		this.code = code;
		this.details = details;
	}

	/**
	 * The error as JSON for a tool result.
	 *
	 * @return {{code: string, message: string, details: Object}} Error.
	 */
	toJSON() {
		return {
			code: this.code,
			message: this.message,
			details: this.details,
		};
	}
}

module.exports = { CODES, GenerationError };
