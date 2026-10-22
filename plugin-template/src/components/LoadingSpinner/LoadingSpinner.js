import { __ } from '@wordpress/i18n';

/**
 * {{name}} LoadingSpinner
 * Accessible loading spinner for WordPress blocks and frontend.
 * @param {Object} root0       Component props.
 * @param {string} root0.label
 */
export default function LoadingSpinner( {
	label = __( 'Loading…', '{{textdomain}}' ),
} ) {
	return (
		<div
			className="{{namespace}}-loading-spinner"
			role="status"
			aria-live="polite"
		>
			<span className="{{namespace}}-spinner" aria-hidden="true">
				⏳
			</span>
			<span className="{{namespace}}-loading-label">{ label }</span>
		</div>
	);
}
