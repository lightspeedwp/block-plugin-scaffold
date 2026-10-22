import { __ } from '@wordpress/i18n';

/**
 * {{name}} SkipLink
 * Accessible skip to main content link for WordPress blocks and frontend.
 * @param {Object} root0        Component props.
 * @param {string} root0.target
 * @param {string} root0.label
 */
export default function SkipLink( {
	target = '#maincontent',
	label = __( 'Skip to main content', '{{textdomain}}' ),
} ) {
	return (
		<a href={ target } className="{{namespace}}-skip-link sr-only" tabIndex={ 0 }>
			{ label }
		</a>
	);
}
