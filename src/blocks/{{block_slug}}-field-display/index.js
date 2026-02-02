/**
 * {{cpt_name}} Field Display Block
 *
 * Displays a custom field value with optional prefix.
 *
 * @package {{namespace}}
 */

import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';

import './editor.scss';
import './style.scss';
import metadata from './block.json';

/**
 * Edit component for the field display block.
 *
 * @param {Object} props Block props.
 * @return {JSX.Element} Block edit component.
 */
const Edit = (props) => {
	const { attributes, setAttributes, context } = props;
	const { fieldKey, prefix, prefixBold, fallbackText } = attributes;
	const { postId, postType } = context;

	const blockProps = useBlockProps({
		className: 'wp-block-{{slug}}-{{block_slug}}-field-display',
	});

	// Get the field value from post meta.
	const [meta] = useEntityProp('postType', postType, 'meta', postId);
	const fieldValue = meta?.[fieldKey] || fallbackText || __('(No value set)', '{{textdomain}}');

	// Format display value with prefix.
	const displayValue = () => {
		let display = '';
		
		if (prefix) {
			const prefixText = prefix.trim();
			const needsSpace = !/[\s\p{P}]$/u.test(prefixText);
			const formattedPrefix = prefixText + (needsSpace ? ' ' : '');
			
			if (prefixBold) {
				display = <><strong>{formattedPrefix}</strong>{fieldValue}</>;
			} else {
				display = <>{formattedPrefix}{fieldValue}</>;
			}
		} else {
			display = fieldValue;
		}
		
		return display;
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={__('Field Settings', '{{textdomain}}')} initialOpen={true}>
					<TextControl
						label={__('Field Key', '{{textdomain}}')}
						value={fieldKey}
						onChange={(value) => setAttributes({ fieldKey: value })}
						help={__('Enter the meta key of the custom field to display.', '{{textdomain}}')}
					/>
					<TextControl
						label={__('Fallback Text', '{{textdomain}}')}
						value={fallbackText}
						onChange={(value) => setAttributes({ fallbackText: value })}
						help={__('Text to display when field is empty.', '{{textdomain}}')}
					/>
				</PanelBody>
				<PanelBody title={__('Prefix Settings', '{{textdomain}}')} initialOpen={false}>
					<TextControl
						label={__('Prefix Text', '{{textdomain}}')}
						value={prefix}
						onChange={(value) => setAttributes({ prefix: value })}
						help={__('Text to display before the field value (e.g., "Price:", "From:").', '{{textdomain}}')}
					/>
					<ToggleControl
						label={__('Bold Prefix', '{{textdomain}}')}
						checked={prefixBold}
						onChange={(value) => setAttributes({ prefixBold: value })}
						help={__('Make the prefix text bold.', '{{textdomain}}')}
					/>
				</PanelBody>
			</InspectorControls>

			<div {...blockProps}>
				<p className="field-display-value">
					{displayValue()}
				</p>
			</div>
		</>
	);
};

registerBlockType(metadata.name, {
	...metadata,
	edit: Edit,
	save: () => null, // Dynamic block - uses PHP render callback
});
