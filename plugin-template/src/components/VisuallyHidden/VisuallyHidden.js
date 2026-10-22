/**
 * {{name}} VisuallyHidden
 * Utility for visually hiding content but keeping it accessible to screen readers.
 * @param {Object}  root0          Component props.
 * @param {Element} root0.children
 */
export default function VisuallyHidden( { children, ...props } ) {
	return (
		<span
			className="{{namespace}}-visually-hidden"
			style={ {
				border: 0,
				clip: 'rect(0 0 0 0)',
				clipPath: 'inset(50%)',
				height: '1px',
				margin: '-1px',
				overflow: 'hidden',
				padding: 0,
				position: 'absolute',
				whiteSpace: 'nowrap',
				width: '1px',
			} }
			{ ...props }
		>
			{ children }
		</span>
	);
}
