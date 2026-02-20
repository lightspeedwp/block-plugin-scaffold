/**
 * Paragraph Prefix Support
 *
 * Adds prefix text controls and display to paragraph blocks
 * that use block bindings or specific CSS classes.
 *
 * @package {{namespace}}
 */

(function (blocks, element, editor, components) {
	const el = element.createElement;
	const InspectorControls = editor.InspectorControls;
	const PanelBody = components.PanelBody;
	const CheckboxControl = components.CheckboxControl;
	const TextControl = components.TextControl;

	/**
	 * Add Inspector Controls for prefix settings.
	 */
	const withInspectorControls = wp.compose.createHigherOrderComponent(
		function (BlockEdit) {
			return function (props) {
				if (props.name !== 'core/paragraph') {
					return el(BlockEdit, props);
				}

				// Only show prefix controls for paragraphs with bindings.
				const hasMetadataBindings =
					props.attributes.metadata &&
					props.attributes.metadata.bindings &&
					props.attributes.metadata.bindings.content;

				if (!hasMetadataBindings) {
					return el(BlockEdit, props);
				}

				let prefix = props.attributes.prefix || '';
				let prefixBold = props.attributes.prefixBold || false;

				return el(
					element.Fragment,
					{},
					el(BlockEdit, props),
					el(
						InspectorControls,
						{},
						el(
							PanelBody,
							{ title: '{{name}}', initialOpen: true },
							el(TextControl, {
								label: 'Prefix Text',
								value: prefix,
								onChange(value) {
									props.setAttributes({
										prefix: value,
									});
								},
								help: 'Text to display before the field value (e.g., "Price:", "From:").',
							}),
							el(CheckboxControl, {
								label: 'Bold Prefix',
								checked: prefixBold,
								onChange(value) {
									props.setAttributes({
										prefixBold: value,
									});
								},
								help: 'Make the prefix text bold.',
							})
						)
					)
				);
			};
		},
		'withInspectorControls'
	);

	wp.hooks.addFilter(
		'editor.BlockEdit',
		'{{slug}}/paragraph-prefix-panel',
		withInspectorControls
	);

	/**
	 * Register custom attributes for the paragraph block.
	 */
	wp.hooks.addFilter(
		'blocks.registerBlockType',
		'{{slug}}/paragraph-prefix-attributes',
		function (settings, name) {
			if (name === 'core/paragraph') {
				settings.attributes = {
					...settings.attributes,
					prefix: {
						type: 'string',
						default: '',
					},
					prefixBold: {
						type: 'boolean',
						default: false,
					},
				};
			}
			return settings;
		}
	);

	/**
	 * Add visual prefix display in the editor using CSS.
	 */
	const withPrefixDisplay = wp.compose.createHigherOrderComponent(
		function (BlockListBlock) {
			return function (props) {
				if (props.name !== 'core/paragraph') {
					return el(BlockListBlock, props);
				}

				const { attributes } = props;
				const prefix = attributes.prefix || '';
				const prefixBold = attributes.prefixBold || false;

				if (!prefix) {
					return el(BlockListBlock, props);
				}

				// Add a space after prefix if it doesn't end with punctuation or space.
				const needsSpace = !/[\s\p{P}]$/u.test(prefix);
				const displayPrefix = prefix + (needsSpace ? ' ' : '');

				// Create CSS for the pseudo-element.
				const uniqueId = 'prefix-' + props.clientId;
				const css = `
					p.${uniqueId}::before {
						content: "${displayPrefix
							.replace(/\\/g, '\\\\')
							.replace(/"/g, '\\"')
							.replace(/\n/g, '\\A ')} ";
						font-weight: ${prefixBold ? 'bold' : 'normal'};
					}
				`;

				// Inject the style into the editor iframe.
				if (typeof document !== 'undefined') {
					// Find the editor iframe (canvas).
					const editorCanvas = document.querySelector(
						'iframe[name="editor-canvas"]'
					);
					const targetDoc = editorCanvas
						? editorCanvas.contentDocument
						: document;

					if (targetDoc) {
						let styleEl = targetDoc.getElementById(uniqueId);
						if (!styleEl) {
							styleEl = targetDoc.createElement('style');
							styleEl.id = uniqueId;
							targetDoc.head.appendChild(styleEl);
						}
						styleEl.textContent = css;
					}
				}

				// Add custom wrapper props with the unique class.
				const wrapperProps = {
					...(props.wrapperProps || {}),
					className: [props.wrapperProps?.className, uniqueId]
						.filter(Boolean)
						.join(' '),
				};

				return el(BlockListBlock, { ...props, wrapperProps });
			};
		},
		'withPrefixDisplay'
	);

	wp.hooks.addFilter(
		'editor.BlockListBlock',
		'{{slug}}/paragraph-prefix-display',
		withPrefixDisplay
	);
})(
	window.wp.blocks,
	window.wp.element,
	window.wp.blockEditor,
	window.wp.components
);
