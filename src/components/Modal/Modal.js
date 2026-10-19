import { __ } from '@wordpress/i18n';
import { useRef, useEffect } from '@wordpress/element';

/**
 * {{name}} Modal
 * Accessible modal dialog for frontend use.
 * For editor, use WordPress Modal.
 * @param {Object}     root0          Component props.
 * @param {boolean}    root0.isOpen
 * @param {() => void} root0.onClose
 * @param {string}     root0.title
 * @param {Element}    root0.children
 */
export default function Modal( { isOpen, onClose, title, children } ) {
	const modalRef = useRef( null );

	useEffect( () => {
		if ( isOpen && modalRef.current ) {
			modalRef.current.focus();
		}
	}, [ isOpen ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<div
			className="{{namespace}}-modal"
			role="dialog"
			aria-modal="true"
			aria-label={ title }
			tabIndex={ -1 }
			ref={ modalRef }
		>
			<div className="{{namespace}}-modal__content">
				<button
					onClick={ onClose }
					aria-label={ __( 'Close modal', '{{textdomain}}' ) }
					className="{{namespace}}-modal__close"
				>
					×
				</button>
				{ title && <h2>{ title }</h2> }
				{ children }
			</div>
		</div>
	);
}
