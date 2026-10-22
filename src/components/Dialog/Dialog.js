import { __ } from '@wordpress/i18n';
import { useRef, useEffect } from '@wordpress/element';

/**
 * {{name}} Dialog/Sheet/Drawer
 * Accessible modal/dialog for frontend use.
 * For editor, use WordPress Modal.
 * @param {Object}     root0          Component props.
 * @param {boolean}    root0.isOpen
 * @param {() => void} root0.onClose
 * @param {string}     root0.title
 * @param {Element}    root0.children
 */
export default function Dialog( { isOpen, onClose, title, children } ) {
	const dialogRef = useRef( null );

	useEffect( () => {
		if ( isOpen && dialogRef.current ) {
			dialogRef.current.focus();
		}
	}, [ isOpen ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<div
			className="{{namespace}}-dialog"
			role="dialog"
			aria-modal="true"
			aria-label={ title }
			tabIndex={ -1 }
			ref={ dialogRef }
		>
			<div className="{{namespace}}-dialog__content">
				<button
					onClick={ onClose }
					aria-label={ __( 'Close dialog', '{{textdomain}}' ) }
					className="{{namespace}}-dialog__close"
				>
					×
				</button>
				{ title && <h2>{ title }</h2> }
				{ children }
			</div>
		</div>
	);
}
