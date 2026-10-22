/**
 * {{name}} Divider
 * Accessible divider for WordPress blocks and frontend.
 * @param {Object} root0       Component props.
 * @param {string} root0.label
 */
export default function Divider( { label } ) {
	return <hr className="{{namespace}}-divider" aria-label={ label } />;
}
