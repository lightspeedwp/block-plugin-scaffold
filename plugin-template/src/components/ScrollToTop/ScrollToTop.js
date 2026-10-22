/**
 * @file ScrollToTop.js
 * @description Component for a scroll-to-top button.
 * @todo Add smooth scroll and keyboard accessibility.
 */
/**
 * ScrollToTop Component
 *
 * A reusable scroll-to-top button component for WordPress blocks.
 * Appears when user scrolls down and smoothly scrolls to top when clicked.
 *
 * Features:
 * - Auto-show/hide based on scroll position with smooth transitions
 * - Brand-compliant styling with hover effects
 * - Full keyboard navigation support (Enter, Space)
 * - Screen reader compatibility with ARIA labels
 * - Performance optimized with throttled scroll listeners
 * - Mobile responsive with proper touch targets
 * - Smooth scroll behavior with fallback for older browsers
 *
 * @package
 */

import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { arrowUp } from '@wordpress/icons';

import './style.scss';

/**
 * ScrollToTop component.
 *
 * @param {Object} props           Component props.
 * @param {number} props.showAfter Scroll position threshold (in pixels) before button appears.
 * @param {string} props.className Optional custom CSS classes for extending styling.
 * @param {string} props.ariaLabel Custom aria-label for accessibility.
 *
 * @return {Element|null} ScrollToTop button component or null if not visible.
 */
export default function ScrollToTop( {
	showAfter = 20,
	className = '',
	ariaLabel = __( 'Scroll to top of page', '{{textdomain}}' ),
} ) {
	const [ isVisible, setIsVisible ] = useState( false );
	const throttleTimeoutRef = useRef( null );

	/**
	 * Handle smooth scroll to top with fallback for older browsers.
	 */
	const scrollToTop = useCallback( () => {
		try {
			window.scrollTo( {
				top: 0,
				behavior: 'smooth',
			} );
		} catch {
			// Fallback for older browsers
			window.scrollTo( 0, 0 );
		}
	}, [] );

	/**
	 * Handle keyboard interactions for accessibility.
	 *
	 * @param {Object} event Keyboard event.
	 */
	const handleKeyDown = useCallback(
		( event ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				scrollToTop();
			}
		},
		[ scrollToTop ]
	);

	/**
	 * Throttled scroll handler for performance optimization.
	 */
	const handleScroll = useCallback( () => {
		if ( throttleTimeoutRef.current !== null ) {
			return;
		}

		throttleTimeoutRef.current = setTimeout( () => {
			const scrollTop =
				window.pageYOffset || document.documentElement.scrollTop;
			const shouldBeVisible = scrollTop > showAfter;

			if ( shouldBeVisible !== isVisible ) {
				setIsVisible( shouldBeVisible );
			}

			throttleTimeoutRef.current = null;
		}, 100 );
	}, [ showAfter, isVisible ] );

	/**
	 * Set up scroll listener with throttling for performance.
	 */
	useEffect( () => {
		// Check initial scroll position
		handleScroll();

		// Add scroll listener
		window.addEventListener( 'scroll', handleScroll, { passive: true } );

		// Cleanup
		return () => {
			window.removeEventListener( 'scroll', handleScroll );
			if ( throttleTimeoutRef.current !== null ) {
				clearTimeout( throttleTimeoutRef.current );
			}
		};
	}, [ handleScroll ] );

	// Don't render if not visible
	if ( ! isVisible ) {
		return null;
	}

	return (
		<Button
			className={ `{{namespace}}-scroll-to-top ${ className }` }
			onClick={ scrollToTop }
			onKeyDown={ handleKeyDown }
			icon={ arrowUp }
			label={ ariaLabel }
			aria-label={ ariaLabel }
			showTooltip={ false }
		/>
	);
}
