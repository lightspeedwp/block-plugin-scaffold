/**
 * @file RepeaterField.js
 * @description Component for displaying and editing repeater fields.
 * @todo Add drag-and-drop reordering and validation.
 */
/**
 * Repeater Field Component
 *
 * Display ACF/SCF repeater field data in blocks.
 *
 * @package {{namespace}}
 */

import { useSelect } from '@wordpress/data';
import { Spinner } from '@wordpress/components';

/**
 * RepeaterField component.
 *
 * @param {Object}   props           Component props.
 * @param {number}   props.postId    Post ID.
 * @param {string}   props.postType  Post type of the post (e.g. from block context).
 * @param {string}   props.fieldName Repeater field name.
 * @param {Function} props.renderRow Function to render each row.
 * @param {string}   props.className Additional CSS class.
 *
 * @return {Element} RepeaterField component.
 */
export default function RepeaterField({
	postId,
	postType = 'post',
	fieldName,
	renderRow,
	className = '',
}) {
	const { rows, isLoading } = useSelect(
		(select) => {
			if (!postId || !fieldName) {
				return { rows: [], isLoading: false };
			}

			const post = select('core').getEntityRecord(
				'postType',
				postType,
				postId
			);
			const fieldValue =
				post?.acf?.[fieldName] ?? post?.meta?.[fieldName] ?? null;

			return {
				rows: Array.isArray(fieldValue) ? fieldValue : [],
				isLoading: !post,
			};
		},
		[postId, postType, fieldName]
	);

	if (isLoading) {
		return <Spinner />;
	}

	if (rows.length === 0) {
		return null;
	}

	return (
		<div className={`{{namespace}}-repeater-field ${className}`}>
			{rows.map((row, index) =>
				renderRow ? (
					renderRow(row, index)
				) : (
					   <div
						   key={index}
						   className="{{namespace}}-repeater-field__row"
					   >
						{Object.entries(row).map(([key, value]) => (
							   <div
								   key={key}
								   className="{{namespace}}-repeater-field__field"
							   >
								<strong>{key}:</strong> {String(value)}
							</div>
						))}
					</div>
				)
			)}
		</div>
	);
}
