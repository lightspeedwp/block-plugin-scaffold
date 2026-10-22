import { __ } from '@wordpress/i18n';

/**
 * {{name}} Logo
 * Accessible logo component for WordPress blocks and frontend.
 * @param {Object} root0     Component props.
 * @param {string} root0.src
 * @param {string} root0.alt
 */
export default function Logo( {
	src,
	alt = __( 'Logo', '{{textdomain}}' ),
	...props
} ) {
	return (
		<img src={ src } alt={ alt } className="{{namespace}}-logo" { ...props } />
	);
}
