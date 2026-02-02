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
import { PanelBody, TextControl, ToggleControl, RadioControl, SelectControl } from '@wordpress/components';
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
	const { fieldKey, prefix, prefixBold, fallbackText, iconType, iconName } = attributes;
	const { postId, postType } = context;

	// Icon types and names - this should match your icon library structure
	const iconTypes = ['outline', 'solid'];
	const iconNames = [
		{ label: __('None', '{{textdomain}}'), value: '' },
		{ label: __('Check In', '{{textdomain}}'), value: 'checkInAccommodationIcon' },
		{ label: __('Check Out', '{{textdomain}}'), value: 'checkOutAccommodationIcon' },
		{ label: __('Clock', '{{textdomain}}'), value: 'clockIcon' },
		{ label: __('Calendar', '{{textdomain}}'), value: 'calendarIcon' },
		{ label: __('Person', '{{textdomain}}'), value: 'personIcon' },
	];

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
				<PanelBody title={__('Icon Settings', '{{textdomain}}')} initialOpen={false}>
					<SelectControl
						label={__('Icon', '{{textdomain}}')}
						value={iconName}
						onChange={(value) => setAttributes({ iconName: value })}
						options={iconNames}
						help={__('Select an icon to display before the field value.', '{{textdomain}}')}
					/>
					{iconName && (
						<RadioControl
							label={__('Icon Type', '{{textdomain}}')}
							selected={iconType}
							onChange={(value) => setAttributes({ iconType: value })}
							options={iconTypes.map((type) => ({
								label: type.charAt(0).toUpperCase() + type.slice(1),
								value: type,
							}))}
						/>
					)}
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
