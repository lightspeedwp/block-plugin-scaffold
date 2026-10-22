/**
 * Block Tests
 *
 * @package
 */

const { render, screen, fireEvent } = require('@testing-library/react');
const { useSelect } = require('@wordpress/data');
const { DRY_RUN_VALUES } = require('../scripts/dry-run/dry-run-config');

function requireBlock(modulePathTemplate) {
	try {
		return require(modulePathTemplate);
	} catch (error) {
		if (!modulePathTemplate.includes('{{slug}}')) {
			throw error;
		}

		const slug = DRY_RUN_VALUES.slug || 'example-plugin';
		const resolvedPath = modulePathTemplate.replace(/{{slug}}/g, slug);
		return require(resolvedPath);
	}
}

const CardEdit = requireBlock('../plugin-template/src/blocks/{{slug}}-card/edit').default;

describe('Example Plugin Blocks', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Card Block edit component', () => {
		const toggleAttributes = [
			['Display Featured Image', 'displayFeaturedImage'],
			['Display Title', 'displayTitle'],
			['Display Subtitle', 'displaySubtitle'],
			['Display Excerpt', 'displayExcerpt'],
			['Display Meta', 'displayMeta'],
			['Link to Post', 'linkToPost'],
		];

		function mockSelectWithPost(post, media) {
			useSelect.mockReset();

			const coreSelect = {
				getEntityRecord: jest.fn(() => post),
				getMedia: jest.fn(() => media),
			};

			useSelect.mockImplementation((selector) =>
				selector((storeName) =>
					storeName === 'core' ? coreSelect : {}
				)
			);

			return coreSelect;
		}

		it('renders toggles and entity-driven content when display flags are true', () => {
			const post = {
				title: { rendered: 'Test Post Title' },
				excerpt: { rendered: '<p>Summary text</p>' },
				featured_media: 123,
				date: '2025-01-05T12:00:00Z',
			};
			const media = {
				source_url: 'https://example.com/image.jpg',
				alt_text: 'Feature art',
			};

			mockSelectWithPost(post, media);

			const setAttributes = jest.fn();

			render(
				<CardEdit
					attributes={{
						displayFeaturedImage: true,
						displayTitle: true,
						displaySubtitle: true,
						displayExcerpt: true,
						displayMeta: true,
						linkToPost: true,
					}}
					setAttributes={setAttributes}
					context={{ postId: 1, postType: 'post' }}
				/>
			);

			const expectedDate = new Date(post.date).toLocaleDateString();

			expect(
				screen.getByRole('img', { name: media.alt_text })
			).toHaveAttribute('src', media.source_url);
			expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
				'Test Post Title'
			);
			expect(
				screen.getByText('Subtitle placeholder')
			).toBeInTheDocument();
			expect(screen.getByText('Summary text')).toBeInTheDocument();
			expect(screen.getByText(expectedDate)).toBeInTheDocument();
			expect(
				screen.queryByText('Select a post to display.')
			).not.toBeInTheDocument();

			toggleAttributes.forEach(([label, attribute], index) => {
				fireEvent.click(screen.getByLabelText(label));
				expect(setAttributes).toHaveBeenNthCalledWith(index + 1, {
					[attribute]: false,
				});
			});

			expect(setAttributes).toHaveBeenCalledTimes(
				toggleAttributes.length
			);
		});

		it('displays the placeholder message when no post is selected', () => {
			useSelect.mockReset();
			useSelect.mockImplementation((selector) => selector(() => ({})));

			const setAttributes = jest.fn();

			render(
				<CardEdit
					attributes={{
						displayFeaturedImage: true,
						displayTitle: true,
						displaySubtitle: true,
						displayExcerpt: true,
						displayMeta: true,
						linkToPost: true,
					}}
					setAttributes={setAttributes}
					context={{ postId: null }}
				/>
			);

			expect(
				screen.getByText('Select a post to display.')
			).toBeInTheDocument();
			expect(screen.queryByRole('img')).not.toBeInTheDocument();
			expect(screen.queryByRole('heading')).not.toBeInTheDocument();
			expect(setAttributes).not.toHaveBeenCalled();
		});
	});

	describe('Card Block', () => {
		it('should be defined', () => {
			// Block registration test placeholder.
			expect(true).toBe(true);
		});
	});

	describe('Collection Block', () => {
		it('should be defined', () => {
			// Block registration test placeholder.
			expect(true).toBe(true);
		});
	});

	describe('Slider Block', () => {
		it('should be defined', () => {
			// Block registration test placeholder.
			expect(true).toBe(true);
		});
	});

	describe('Featured Block', () => {
		it('should be defined', () => {
			// Block registration test placeholder.
			expect(true).toBe(true);
		});
	});
});
