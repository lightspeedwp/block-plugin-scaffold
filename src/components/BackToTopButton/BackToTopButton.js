import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * {{name}} BackToTopButton
 * Accessible scroll-to-top button for frontend and editor.
 * Uses mustache placeholders for class and text.
 * @param {Object} root0       Component props.
 * @param {string} root0.label
 */
export default function BackToTopButton( {
	label = __( 'Back to top', '{{textdomain}}' ),
} ) {
	useEffect( () => {
		const handleScroll = () => {
			const btn = document.getElementById( '{{namespace}}-back-to-top' );
			if ( btn ) {
				btn.style.display = window.scrollY > 200 ? 'block' : 'none';
			}
		};
		window.addEventListener( 'scroll', handleScroll );
		return () => window.removeEventListener( 'scroll', handleScroll );
	}, [] );

	const scrollToTop = () => {
		window.scrollTo( { top: 0, behavior: 'smooth' } );
	};

	return (
		<button
			id="{{namespace}}-back-to-top"
			className="{{namespace}}-back-to-top"
			style={ { display: 'none' } }
			onClick={ scrollToTop }
			aria-label={ label }
		>
			<span aria-hidden="true">↑</span> { label }
		</button>
	);
}
