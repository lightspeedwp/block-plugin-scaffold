/**
 * @file FieldDisplay.js
 * @description Component for displaying a custom field value.
 * @todo Add prop types and improve accessibility.
 */
/**
 * Field Display Component
 *
 * Display ACF/SCF field values in blocks.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';

/**
 * FieldDisplay component.
 *
 * @param {Object} props           Component props.
 * @param {number} props.postId    Post ID.
 * @param {string} props.postType  Post type of the post (e.g. from block context).
 * @param {string} props.fieldName Field name.
 * @param {string} props.fieldType Field type for formatting.
 * @param {string} props.className Additional CSS class.
 *
 * @return {Element} FieldDisplay component.
 */
export default function FieldDisplay({
	postId,
	postType = 'post',
	fieldName,
	fieldType = 'text',
	className = '',
}) {
	const { fieldValue, isLoading } = useSelect(
		(select) => {
			if (!postId || !fieldName) {
				return { fieldValue: null, isLoading: false };
			}

			const post = select('core').getEntityRecord(
				'postType',
				postType,
				postId
			);

			return {
				fieldValue:
					post?.acf?.[fieldName] ?? post?.meta?.[fieldName] ?? null,
				isLoading: !post,
			};
		},
		[postId, postType, fieldName]
	);

	if (isLoading) {
		return <Spinner />;
	}

	if (fieldValue === null || fieldValue === undefined) {
		return null;
	}

	const renderValue = () => {
		switch (fieldType) {
			case 'image':
				if (typeof fieldValue === 'object' && fieldValue.url) {
					return (
						<img
							src={fieldValue.url}
							alt={fieldValue.alt || ''}
							className={`{{namespace}}-field-display__image ${className}`}
						/>
					);
				}
				return null;

			case 'gallery':
				if (Array.isArray(fieldValue)) {
					return (
						<div
							className={`{{namespace}}-field-display__gallery ${className}`}
						>
							{fieldValue.map((image, index) => (
								<img
									key={image.id || index}
									src={image.url}
									alt={image.alt || ''}
								/>
							))}
						</div>
					);
				}
				return null;

			case 'link':
				if (typeof fieldValue === 'object' && fieldValue.url) {
					return (
						<a
							href={fieldValue.url}
							target={fieldValue.target || '_self'}
						>
							{fieldValue.title || fieldValue.url}
						</a>
					);
				}
				return null;

			case 'boolean':
				return fieldValue
					? __('Yes', '{{textdomain}}')
					: __('No', '{{textdomain}}');

			default:
				return String(fieldValue);
		}
	};

	return (
		<div className={`{{namespace}}-field-display ${className}`}>
			{renderValue()}
		</div>
	);
}
