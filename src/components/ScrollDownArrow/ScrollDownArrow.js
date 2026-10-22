/**
 * @file ScrollDownArrow.js
 * @description Component for a scroll-down arrow indicator.
 * @todo Add animation and ARIA attributes for accessibility.
 */
/**
 * ScrollDownArrow Component
 *
 * Animated arrow with circle background that scrolls to next section on click.
 * Perfect for hero sections and landing pages.
 *
 * Features:
 * - Circular background with gradient border
 * - Smooth bounce animation
 * - Hover and focus states with scale effects
 * - Accessibility compliant with proper ARIA labels
 * - Smooth scrolling to target section
 * - Screen reader announcements
 *
 * @package
 */

import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { chevronDown } from '@wordpress/icons';

import './style.scss';

/**
 * ScrollDownArrow component.
 *
 * @param {Object}   props                 Component props.
 * @param {string}   props.targetSectionId Optional target section ID to scroll to.
 * @param {string}   props.ariaLabel       Optional aria label for accessibility.
 * @param {string}   props.className       Optional additional CSS classes.
 * @param {Function} props.onClick         Optional click handler.
 *
 * @return {Element} Animated scroll down arrow button.
 */
export default function ScrollDownArrow( {
	targetSectionId,
	ariaLabel = __( 'Scroll to next section', '{{textdomain}}' ),
	className = '',
	onClick,
} ) {
	/**
	 * Handle click event with smooth scrolling.
	 */
	const handleClick = useCallback( () => {
		// Use custom onClick if provided
		if ( onClick ) {
			onClick();
			return;
		}

		let targetElement = null;

		if ( targetSectionId ) {
			// Scroll to specific section
			targetElement = document.getElementById( targetSectionId );
		} else {
			// Find the next section after current hero
			const heroSections = document.querySelectorAll( 'section' );
			if ( heroSections.length > 1 ) {
				targetElement = heroSections[ 1 ]; // Second section (after hero)
			}
		}

		if ( targetElement ) {
			targetElement.scrollIntoView( {
				behavior: 'smooth',
				block: 'start',
			} );

			// Announce to screen readers
			const announcement = targetSectionId
				? `Scrolled to ${ targetSectionId }`
				: __( 'Scrolled to next section', '{{textdomain}}' );
			const ariaLive = document.createElement( 'div' );
			ariaLive.setAttribute( 'aria-live', 'polite' );
			ariaLive.setAttribute( 'class', 'screen-reader-text' );
			ariaLive.textContent = announcement;
			document.body.appendChild( ariaLive );
			setTimeout( () => document.body.removeChild( ariaLive ), 1000 );
		}
	}, [ targetSectionId, onClick ] );

	return (
		<Button
			className={ `{{namespace}}-scroll-down-arrow ${ className }` }
			onClick={ handleClick }
			icon={ chevronDown }
			label={ ariaLabel }
			aria-label={ ariaLabel }
			showTooltip={ false }
		/>
	);
}
