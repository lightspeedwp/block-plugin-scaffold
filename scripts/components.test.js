/**
 * Components Tests
 *
 * @package
 */

const { render, screen, fireEvent, act } = require('@testing-library/react');
const Slider = require('../plugin-template/src/components/Slider/Slider').default;

describe('Example Plugin Components', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const sliderSlides = [
		{
			id: 1,
			title: 'First Slide',
			caption: 'Caption one',
			image: { url: 'https://example.com/1.jpg', alt: 'Slide one' },
		},
		{
			id: 2,
			title: 'Second Slide',
			caption: 'Caption two',
			image: { url: 'https://example.com/2.jpg', alt: 'Slide two' },
		},
		{
			id: 3,
			title: 'Third Slide',
			caption: 'Caption three',
			image: { url: 'https://example.com/3.jpg', alt: 'Slide three' },
		},
	];

	describe('Slider Component', () => {
		beforeEach(() => {
			global.wp.components.Button.mockImplementation(
				({ label, icon, ...props }) => (
					<button aria-label={label} {...props} />
				)
			);
		});

		it('renders navigation controls, dots, and respects non-infinite bounds', () => {
			const { container } = render(
				<Slider slides={sliderSlides} infinite={false} />
			);
			const track = container.querySelector(
				'.example_plugin-slider__track'
			);

			expect(track.style.transform).toContain('translateX(0');

			const prevButton = screen.getByLabelText('Previous slide');
			const nextButton = screen.getByLabelText('Next slide');

			expect(prevButton).toBeDisabled();
			expect(prevButton).toHaveAttribute('aria-label', 'Previous slide');
			expect(nextButton).not.toBeDisabled();

			fireEvent.click(nextButton);
			expect(track.style.transform).toContain('translateX(-100%');

			fireEvent.click(nextButton);
			expect(track.style.transform).toContain('translateX(-200%');

			fireEvent.click(nextButton);
			expect(track.style.transform).toContain('translateX(-200%');

			fireEvent.click(prevButton);
			expect(track.style.transform).toContain('translateX(-100%');

			fireEvent.click(prevButton);
			expect(track.style.transform).toContain('translateX(0%');

			const dots = screen.getAllByRole('tab');
			expect(dots).toHaveLength(3);

			fireEvent.click(dots[1]);
			expect(track.style.transform).toContain('translateX(-100%');
		});

		it('clamps goToSlide to the max index even when slidesToScroll is large', () => {
			const { container } = render(
				<Slider slides={sliderSlides} slidesToScroll={100} />
			);
			const dots = screen.getAllByRole('tab');
			const track = container.querySelector(
				'.example_plugin-slider__track'
			);

			fireEvent.click(dots[1]);
			expect(track.style.transform).toContain('translateX(-200%');
		});

		it('autoplay advances slides, pauses on hover, and responds to keyboard', () => {
			jest.useFakeTimers();

			try {
				render(
					<Slider
						slides={sliderSlides}
						autoplay
						autoplaySpeed={500}
					/>
				);
				const track = document.querySelector(
					'.example_plugin-slider__track'
				);
				const sliderRoot = screen.getByRole('region', {
					name: 'Slider',
				});

				expect(track.style.transform).toContain('translateX(0');

				act(() => {
					jest.advanceTimersByTime(500);
				});
				expect(track.style.transform).toContain('translateX(-100%');

				fireEvent.mouseEnter(sliderRoot);
				act(() => {
					jest.advanceTimersByTime(2000);
				});
				expect(track.style.transform).toContain('translateX(-100%');

				fireEvent.mouseLeave(sliderRoot);
				act(() => {
					jest.advanceTimersByTime(500);
				});
				expect(track.style.transform).toContain('translateX(-200%');

				fireEvent.keyDown(sliderRoot, { key: 'ArrowLeft' });
				expect(track.style.transform).toContain('translateX(-100%');

				fireEvent.keyDown(sliderRoot, { key: 'ArrowRight' });
				expect(track.style.transform).toContain('translateX(-200%');
			} finally {
				jest.useRealTimers();
			}
		});
	});

	describe('PostSelector Component', () => {
		it('should be defined', () => {
			// Component test placeholder.
			expect(true).toBe(true);
		});
	});

	describe('TaxonomyFilter Component', () => {
		it('should be defined', () => {
			// Component test placeholder.
			expect(true).toBe(true);
		});
	});

	describe('Gallery Component', () => {
		it('should be defined', () => {
			// Component test placeholder.
			expect(true).toBe(true);
		});
	});
});
