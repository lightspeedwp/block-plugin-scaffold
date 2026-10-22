/**
 * @file Slider.js
 * @description Component for rendering a slider/carousel UI.
 * @todo Add keyboard navigation and improve accessibility.
 */
/**
 * Slider Component
 *
 * A reusable slider/carousel component for the block editor and frontend.
 *
 * @package
 */

import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';

import './style.scss';

/**
 * Slider component.
 *
 * @param {Object}   props                Component props.
 * @param {Array}    props.slides         Array of slide objects.
 * @param {boolean}  props.autoplay       Enable autoplay.
 * @param {number}   props.autoplaySpeed  Autoplay interval in ms.
 * @param {boolean}  props.showDots       Show navigation dots.
 * @param {boolean}  props.showArrows     Show prev/next arrows.
 * @param {boolean}  props.infinite       Enable infinite loop.
 * @param {number}   props.slidesToShow   Number of slides visible.
 * @param {number}   props.slidesToScroll Number of slides to scroll.
 * @param {Function} props.renderSlide    Custom slide render function.
 * @param {string}   props.className      Additional CSS class.
 *
 * @return {Element} Slider component.
 */
export default function Slider( {
	slides = [],
	autoplay = false,
	autoplaySpeed = 5000,
	showDots = true,
	showArrows = true,
	infinite = true,
	slidesToShow = 1,
	slidesToScroll = 1,
	renderSlide,
	className = '',
} ) {
	const [ currentIndex, setCurrentIndex ] = useState( 0 );
	const [ isPlaying, setIsPlaying ] = useState( autoplay );
	const sliderRef = useRef( null );
	const autoplayRef = useRef( null );

	const totalSlides = slides.length;
	const maxIndex = Math.max( 0, totalSlides - slidesToShow );

	/**
	 * Go to next slide.
	 */
	const nextSlide = useCallback( () => {
		setCurrentIndex( ( prev ) => {
			if ( prev >= maxIndex ) {
				return infinite ? 0 : prev;
			}
			return Math.min( prev + slidesToScroll, maxIndex );
		} );
	}, [ maxIndex, infinite, slidesToScroll ] );

	/**
	 * Go to previous slide.
	 */
	const prevSlide = useCallback( () => {
		setCurrentIndex( ( prev ) => {
			if ( prev <= 0 ) {
				return infinite ? maxIndex : 0;
			}
			return Math.max( prev - slidesToScroll, 0 );
		} );
	}, [ maxIndex, infinite, slidesToScroll ] );

	/**
	 * Go to specific slide.
	 *
	 * @param {number} index Slide index.
	 */
	const goToSlide = ( index ) => {
		setCurrentIndex( Math.min( Math.max( 0, index ), maxIndex ) );
	};

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

	// Pause on hover.
	const handleMouseEnter = () => setIsPlaying( false );
	const handleMouseLeave = () => setIsPlaying( autoplay );

	// Keyboard navigation.
	const handleKeyDown = ( event ) => {
		if ( event.key === 'ArrowLeft' ) {
			prevSlide();
		} else if ( event.key === 'ArrowRight' ) {
			nextSlide();
		}
	};

	if ( totalSlides === 0 ) {
		return null;
	}

	const slideWidth = 100 / slidesToShow;
	const translateX = -currentIndex * slideWidth;

	return (
		/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
		<div
			className={ `{{namespace}}-slider ${ className }` }
			ref={ sliderRef }
			onMouseEnter={ handleMouseEnter }
			onMouseLeave={ handleMouseLeave }
			onKeyDown={ handleKeyDown }
			role="region"
			aria-label={ __( 'Slider', '{{textdomain}}' ) }
			aria-roledescription="carousel"
			tabIndex="0"
		>
			<div className="{{namespace}}-slider__viewport">
				<div
					className="{{namespace}}-slider__track"
					style={ {
						transform: `translateX(${ translateX }%)`,
						transition: 'transform 0.5s ease-in-out',
					} }
				>
					{ slides.map( ( slide, index ) => (
						<div
							key={ slide.id || index }
							className="{{namespace}}-slider__slide"
							style={ { width: `${ slideWidth }%` } }
							role="group"
							aria-roledescription="slide"
							aria-label={ `${ index + 1 } of ${ totalSlides }` }
						>
							{ renderSlide ? (
								renderSlide( slide, index )
							) : (
								<>
									{ slide.image && (
										<img
											src={ slide.image.url }
											alt={
												slide.image.alt ||
												slide.title ||
												''
											}
											className="{{namespace}}-slider__image"
										/>
									) }
									{ slide.title && (
										<h3 className="{{namespace}}-slider__title">
											{ slide.title }
										</h3>
									) }
									{ slide.caption && (
										<p className="{{namespace}}-slider__caption">
											{ slide.caption }
										</p>
									) }
								</>
							) }
						</div>
					) ) }
				</div>
			</div>

			{ showArrows && totalSlides > slidesToShow && (
				<>
					<Button
						className="{{namespace}}-slider__arrow {{namespace}}-slider__arrow--prev"
						onClick={ prevSlide }
						icon={ chevronLeft }
						label={ __( 'Previous slide', '{{textdomain}}' ) }
						disabled={ ! infinite && currentIndex === 0 }
					/>
					<Button
						className="{{namespace}}-slider__arrow {{namespace}}-slider__arrow--next"
						onClick={ nextSlide }
						icon={ chevronRight }
						label={ __( 'Next slide', '{{textdomain}}' ) }
						disabled={ ! infinite && currentIndex >= maxIndex }
					/>
				</>
			) }

			{ showDots && totalSlides > slidesToShow && (
				<div
					className="{{namespace}}-slider__dots"
					role="tablist"
					aria-label={ __( 'Slider navigation', '{{textdomain}}' ) }
				>
					{ Array.from( {
						length:
							Math.ceil(
								( totalSlides - slidesToShow ) / slidesToScroll
							) + 1,
					} ).map( ( _, index ) => (
						<button
							key={ index }
							className={ `{{namespace}}-slider__dot ${
								index ===
								Math.floor( currentIndex / slidesToScroll )
									? 'is-active'
									: ''
							}` }
							onClick={ () =>
								goToSlide( index * slidesToScroll )
							}
							role="tab"
							aria-selected={
								index ===
								Math.floor( currentIndex / slidesToScroll )
							}
							aria-label={ `Go to slide ${ index + 1 }` }
						/>
					) ) }
				</div>
			) }
		</div>
	);
}
