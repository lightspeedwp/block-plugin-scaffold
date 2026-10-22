/**
 * Paragraph Prefix Support
 *
 * Adds prefix text controls and display to paragraph blocks
 * that use block bindings.
 *
 * @package
 */

import { InspectorControls } from '@wordpress/block-editor';
import { CheckboxControl, PanelBody, TextControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Add Inspector Controls for prefix settings.
 */
const withInspectorControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'core/paragraph' ) {
			return <BlockEdit { ...props } />;
		}

		// Only show prefix controls for paragraphs with bindings.
		const hasMetadataBindings =
			props.attributes.metadata?.bindings?.content;

		if ( ! hasMetadataBindings ) {
			return <BlockEdit { ...props } />;
		}

		const { prefix = '', prefixBold = false } = props.attributes;

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody
						title={ __( '{{name}}', '{{textdomain}}' ) }
						initialOpen
					>
						<TextControl
							label={ __( 'Prefix Text', '{{textdomain}}' ) }
							value={ prefix }
							onChange={ ( value ) =>
								props.setAttributes( { prefix: value } )
							}
							help={ __(
								'Text to display before the field value (e.g., "Price:", "From:").',
								'{{textdomain}}'
							) }
						/>
						<CheckboxControl
							label={ __( 'Bold Prefix', '{{textdomain}}' ) }
							checked={ prefixBold }
							onChange={ ( value ) =>
								props.setAttributes( { prefixBold: value } )
							}
							help={ __(
								'Make the prefix text bold.',
								'{{textdomain}}'
							) }
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	},
	'withInspectorControls'
);

addFilter(
	'editor.BlockEdit',
	'{{slug}}/paragraph-prefix-panel',
	withInspectorControls
);

/**
 * Register custom attributes for the paragraph block.
 */
addFilter(
	'blocks.registerBlockType',
	'{{slug}}/paragraph-prefix-attributes',
	( settings, name ) => {
		if ( name !== 'core/paragraph' ) {
			return settings;
		}

		return {
			...settings,
			attributes: {
				...settings.attributes,
				prefix: {
					type: 'string',
					default: '',
				},
				prefixBold: {
					type: 'boolean',
					default: false,
				},
			},
		};
	}
);

/**
 * Add visual prefix display in the editor using CSS.
 */
const withPrefixDisplay = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		if ( props.name !== 'core/paragraph' ) {
			return <BlockListBlock { ...props } />;
		}

		const { prefix = '', prefixBold = false } = props.attributes;

		if ( ! prefix ) {
			return <BlockListBlock { ...props } />;
		}

		// Add a space after prefix if it doesn't end with punctuation or space.
		const needsSpace = ! /[\s\p{P}]$/u.test( prefix );
		const displayPrefix = prefix + ( needsSpace ? ' ' : '' );

		// Create CSS for the pseudo-element.
		const uniqueId = 'prefix-' + props.clientId;
		const css = `
			p.${ uniqueId }::before {
				content: "${ displayPrefix
					.replace( /\\/g, '\\\\' )
					.replace( /"/g, '\\"' )
					.replace( /\n/g, '\\A ' ) } ";
				font-weight: ${ prefixBold ? 'bold' : 'normal' };
			}
		`;

		// Inject the style into the editor iframe.
		const editorCanvas = document.querySelector(
			'iframe[name="editor-canvas"]'
		);
		const targetDoc = editorCanvas
			? editorCanvas.contentDocument
			: document;

		if ( targetDoc ) {
			let styleEl = targetDoc.getElementById( uniqueId );
			if ( ! styleEl ) {
				styleEl = targetDoc.createElement( 'style' );
				styleEl.id = uniqueId;
				targetDoc.head.appendChild( styleEl );
			}
			styleEl.textContent = css;
		}

		// Add custom wrapper props with the unique class.
		const wrapperProps = {
			...( props.wrapperProps || {} ),
			className: [ props.wrapperProps?.className, uniqueId ]
				.filter( Boolean )
				.join( ' ' ),
		};

		return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
	},
	'withPrefixDisplay'
);

addFilter(
	'editor.BlockListBlock',
	'{{slug}}/paragraph-prefix-display',
	withPrefixDisplay
);
