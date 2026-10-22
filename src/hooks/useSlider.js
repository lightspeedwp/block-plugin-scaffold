/**
 * @file useSlider.js
 * @description React hook for slider/carousel logic.
 * @todo Refactor for accessibility and add more tests.
 */
/**
 * useSlider Hook
 *
 * Custom hook for managing slider/carousel state and navigation controls.
 *
 * @package
 * @since 1.0.0
 */

import { useState, useCallback, useEffect, useRef } from '@wordpress/element';

/**
 * useSlider hook.
 *
 * Manages the state and behavior of a slider component, including current slide index,
 * autoplay functionality, and navigation controls. Supports both infinite and finite loops.
 *
 * @param {Object}  options                Slider options.
 * @param {number}  options.totalSlides    Total number of slides. Default: 0.
 * @param {number}  options.slidesToShow   Number of slides visible at once. Default: 1.
 * @param {number}  options.slidesToScroll Number of slides to scroll per navigation action. Default: 1.
 * @param {boolean} options.infinite       Enable infinite loop (wraps around at ends). Default: true.
 * @param {boolean} options.autoplay       Enable automatic slide progression. Default: false.
 * @param {number}  options.autoplaySpeed  Autoplay interval in milliseconds. Default: 5000.
 *
 * @return {Object} Hook return value:
 *   - currentIndex: {number} Current slide index position.
 *   - maxIndex: {number} Maximum reachable slide index.
 *   - isPlaying: {boolean} Current autoplay state.
 *   - nextSlide: {Function} Navigate to next slide.
 *   - prevSlide: {Function} Navigate to previous slide.
 *   - goToSlide: {Function} Navigate to specific slide by index.
 *   - play: {Function} Start autoplay.
 *   - pause: {Function} Stop autoplay.
 *   - canGoPrev: {boolean} Whether previous navigation is available.
 *   - canGoNext: {boolean} Whether next navigation is available.
 *
 * @example
 * const slider = useSlider({
 *   totalSlides: 5,
 *   slidesToShow: 1,
 *   infinite: true,
 *   autoplay: true,
 *   autoplaySpeed: 5000,
 * });
 *
 * // Use in component
 * slider.nextSlide();
 * slider.goToSlide(2);
 * slider.play();
 */
export default function useSlider( {
	totalSlides = 0,
	slidesToShow = 1,
	slidesToScroll = 1,
	infinite = true,
	autoplay = false,
	autoplaySpeed = 5000,
} = {} ) {
	const [ currentIndex, setCurrentIndex ] = useState( 0 );
	const [ isPlaying, setIsPlaying ] = useState( autoplay );
	const autoplayRef = useRef( null );

	const maxIndex = Math.max( 0, totalSlides - slidesToShow );

	const nextSlide = useCallback( () => {
		setCurrentIndex( ( prev ) => {
			if ( prev >= maxIndex ) {
				return infinite ? 0 : prev;
			}
			return Math.min( prev + slidesToScroll, maxIndex );
		} );
	}, [ maxIndex, infinite, slidesToScroll ] );

	const prevSlide = useCallback( () => {
		setCurrentIndex( ( prev ) => {
			if ( prev <= 0 ) {
				return infinite ? maxIndex : 0;
			}
			return Math.max( prev - slidesToScroll, 0 );
		} );
	}, [ maxIndex, infinite, slidesToScroll ] );

	const goToSlide = useCallback(
		( index ) => {
			setCurrentIndex( Math.min( Math.max( 0, index ), maxIndex ) );
		},
		[ maxIndex ]
	);

	const play = useCallback( () => setIsPlaying( true ), [] );
	const pause = useCallback( () => setIsPlaying( false ), [] );

	// Autoplay effect.
	useEffect( () => {
		if ( isPlaying && totalSlides > slidesToShow ) {
			autoplayRef.current = setInterval( nextSlide, autoplaySpeed );
		}

		return () => {
			if ( autoplayRef.current ) {
				clearInterval( autoplayRef.current );
			}
		};
	}, [ isPlaying, nextSlide, autoplaySpeed, totalSlides, slidesToShow ] );

	return {
		currentIndex,
		maxIndex,
		isPlaying,
		nextSlide,
		prevSlide,
		goToSlide,
		play,
		pause,
		canGoPrev: infinite || currentIndex > 0,
		canGoNext: infinite || currentIndex < maxIndex,
	};
}
