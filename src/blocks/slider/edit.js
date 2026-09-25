/*
 * @file edit.js
 * @description Block editor component for the example slider block.
 * @todo Add accessibility and responsive design improvements.
 */
/**
 * Example Plugin Slider Block - Editor Component
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	MediaUploadCheck,
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	RangeControl,
	SelectControl,
	Button,
	TextControl,
	TextareaControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Slider block edit component.
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Function to update attributes.
 *
 * @return {Element} Block editor component.
 */
export default function Edit({ attributes, setAttributes }) {
	const {
		source,
		slides,
		autoplay,
		autoplaySpeed,
		showDots,
		showArrows,
		infinite,
		slidesToShow,
		slidesToScroll,
	} = attributes;

	const [currentSlide, setCurrentSlide] = useState(0);

	const addSlide = () => {
		const newSlides = [
			...slides,
			{
				id: Date.now(),
				image: null,
				title: '',
				caption: '',
				link: '',
			},
		];
		setAttributes({ slides: newSlides });
		setCurrentSlide(newSlides.length - 1);
	};

	const updateSlide = (index, updates) => {
		const newSlides = [...slides];
		newSlides[index] = { ...newSlides[index], ...updates };
		setAttributes({ slides: newSlides });
	};

	const removeSlide = (index) => {
		const newSlides = slides.filter((_, i) => i !== index);
		setAttributes({ slides: newSlides });
		setCurrentSlide(Math.max(0, currentSlide - 1));
	};

	const blockProps = useBlockProps({
		className: 'wp-block-{{namespace}}-{{block_slug}}-slider',
	});

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Slider Source', '{{textdomain}}')}>
					<SelectControl
						label={__('Slide Source', '{{textdomain}}')}
						value={source}
						options={[
							{
								label: __('Custom Slides', '{{textdomain}}'),
								value: 'custom',
							},
							{
								label: __('Posts', '{{textdomain}}'),
								value: 'posts',
							},
							{
								label: __('Repeater Field', '{{textdomain}}'),
								value: 'repeater',
							},
						]}
						onChange={(value) => setAttributes({ source: value })}
					/>
				</PanelBody>
				<PanelBody title={__('Slider Settings', '{{textdomain}}')}>
					<ToggleControl
						label={__('Autoplay', '{{textdomain}}')}
						checked={autoplay}
						onChange={(value) => setAttributes({ autoplay: value })}
					/>
					{autoplay && (
						<RangeControl
							label={__('Autoplay Speed (ms)', '{{textdomain}}')}
							value={autoplaySpeed}
							onChange={(value) =>
								setAttributes({ autoplaySpeed: value })
							}
							min={100}
							max={10000}
						/>
					)}
					<ToggleControl
						label={__('Show Dots', '{{textdomain}}')}
						checked={showDots}
						onChange={(value) => setAttributes({ showDots: value })}
					/>
					<ToggleControl
						label={__('Show Arrows', '{{textdomain}}')}
						checked={showArrows}
						onChange={(value) =>
							setAttributes({ showArrows: value })
						}
					/>
					<ToggleControl
						label={__('Infinite Loop', '{{textdomain}}')}
						checked={infinite}
						onChange={(value) => setAttributes({ infinite: value })}
					/>
					<RangeControl
						label={__('Slides to Show', '{{textdomain}}')}
						value={slidesToShow}
						onChange={(value) =>
							setAttributes({ slidesToShow: value })
						}
						min={1}
						max={6}
					/>
					<RangeControl
						label={__('Slides to Scroll', '{{textdomain}}')}
						value={slidesToScroll}
						onChange={(value) =>
							setAttributes({ slidesToScroll: value })
						}
						min={1}
						max={6}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				{source === 'custom' && (
					<>
						<div className="wp-block-{{namespace}}-{{block_slug}}-slider__viewport">
							<div className="wp-block-{{namespace}}-{{block_slug}}-slider__track">
								{slides.length > 0 ? (
									slides.map((slide, index) => (
										<div
											key={slide.id}
											className={`wp-block-{{namespace}}-{{block_slug}}-slider__slide ${index === currentSlide ? 'is-active' : ''}`}
										>
											<MediaUploadCheck>
												<div
													className="wp-block-{{namespace}}-{{block_slug}}-slider__image-wrapper"
													onClick={() => {}}
													role="button"
													tabIndex={0}
												>
													{slide.image ? (
														<img
															src={
																slide.image.url
															}
															alt={
																slide.image
																	.alt || ''
															}
														/>
													) : (
														<div className="wp-block-{{namespace}}-{{block_slug}}-slider__placeholder">
															{__(
																'Click to select image',
																'{{textdomain}}'
															)}
														</div>
													)}
												</div>
											</MediaUploadCheck>
											<div className="wp-block-{{namespace}}-{{block_slug}}-slider__slide-content">
												<TextControl
													label={__(
														'Title',
														'{{textdomain}}'
													)}
													value={slide.title}
													onChange={(value) =>
														updateSlide(index, {
															title: value,
														})
													}
												/>
												<TextareaControl
													label={__(
														'Caption',
														'{{textdomain}}'
													)}
													value={slide.caption}
													onChange={(value) =>
														updateSlide(index, {
															caption: value,
														})
													}
												/>
												<TextControl
													label={__(
														'Link URL',
														'{{textdomain}}'
													)}
													value={slide.link}
													onChange={(value) =>
														updateSlide(index, {
															link: value,
														})
													}
													type="url"
												/>
											</div>
											<Button
												isDestructive
												onClick={() =>
													removeSlide(index)
												}
												className="wp-block-{{namespace}}-{{block_slug}}-slider__remove-slide"
											>
												{__(
													'Remove Slide',
													'{{textdomain}}'
												)}
											</Button>
										</div>
									))
								) : (
									<div className="wp-block-{{namespace}}-{{block_slug}}-slider__empty">
										{__(
											'No slides added yet. Click the button below to add slides.',
											'{{textdomain}}'
										)}
									</div>
								)}
							</div>
							{slides.length > 1 && (
								<div className="wp-block-{{namespace}}-{{block_slug}}-slider__nav">
									{slides.map((_, index) => (
										<button
											key={index}
											className={`wp-block-{{namespace}}-{{block_slug}}-slider__dot ${index === currentSlide ? 'is-active' : ''}`}
											onClick={() =>
												setCurrentSlide(index)
											}
											aria-label={`Go to slide ${index + 1}`}
										/>
									))}
								</div>
							)}
							<Button
								variant="primary"
								onClick={addSlide}
								className="wp-block-{{namespace}}-{{block_slug}}-slider__add-slide"
							>
								{__('Add Slide', '{{textdomain}}')}
							</Button>
						</div>
					</>
				)}

				{source === 'posts' && (
					<div className="wp-block-{{namespace}}-{{block_slug}}-slider__posts-notice">
						{__(
							'Slider will display posts from the Example Plugin post type.',
							'{{textdomain}}'
						)}
					</div>
				)}

				{source === 'repeater' && (
					<div className="wp-block-{{namespace}}-{{block_slug}}-slider__repeater-notice">
						{__(
							'Slider will display slides from the repeater field.',
							'{{textdomain}}'
						)}
					</div>
				)}
			</div>
		</>
	);
}
// ...existing code from edit.js for slider block...
