/**
 * Field Utilities
 *
 * Utility functions for processing ACF/SCF field values.
 *
 * @package
 */

/**
 * Get field value from post object.
 *
 * @param {Object} post      Post object.
 * @param {string} fieldName Field name.
 *
 * @return {*} Field value or null.
 */
export function getFieldValue( post, fieldName ) {
	if ( ! post || ! fieldName ) {
		return null;
	}

	// Check ACF object first.
	if ( post.acf && post.acf[ fieldName ] !== undefined ) {
		return post.acf[ fieldName ];
	}

	// Check meta object.
	if ( post.meta && post.meta[ fieldName ] !== undefined ) {
		return post.meta[ fieldName ];
	}

	return null;
}

/**
 * Format field value for display.
 *
 * @param {*}      value     Field value.
 * @param {string} fieldType Field type.
 *
 * @return {string} Formatted value.
 */
export function formatFieldValue( value, fieldType = 'text' ) {
	if ( value === null || value === undefined ) {
		return '';
	}

	switch ( fieldType ) {
		case 'boolean':
		case 'true_false':
			return value ? 'Yes' : 'No';

		case 'date':
			return new Date( value ).toLocaleDateString();

		case 'datetime':
			return new Date( value ).toLocaleString();

		case 'number':
			return Number( value ).toLocaleString();

		case 'array':
			return Array.isArray( value )
				? value.join( ', ' )
				: String( value );

		default:
			return String( value );
	}
}

/**
 * Check if a field value is empty.
 *
 * @param {*} value Field value.
 *
 * @return {boolean} True if empty.
 */
export function isFieldEmpty( value ) {
	if ( value === null || value === undefined || value === '' ) {
		return true;
	}

	if ( Array.isArray( value ) && value.length === 0 ) {
		return true;
	}

	if ( typeof value === 'object' && Object.keys( value ).length === 0 ) {
		return true;
	}

	return false;
}

/**
 * Extract image data from field value.
 *
 * @param {*}      value Field value.
 * @param {string} size  Image size.
 *
 * @return {Object|null} Image data or null.
 */
export function extractImageData( value, size = 'medium' ) {
	if ( ! value ) {
		return null;
	}

	// If value is just a URL string.
	if ( typeof value === 'string' ) {
		return { url: value, alt: '' };
	}

	// If value is an image object.
	if ( typeof value === 'object' ) {
		const url = value.sizes?.[ size ]?.url || value.url || null;
		const alt = value.alt || '';

		if ( url ) {
			return { ...value, url, alt };
		}
	}

	return null;
}

/**
 * Process repeater field data.
 *
 * @param {Array}    rows      Repeater rows.
 * @param {Function} transform Transform function for each row.
 *
 * @return {Array} Processed rows.
 */
export function processRepeaterRows( rows, transform ) {
	if ( ! Array.isArray( rows ) ) {
		return [];
	}

	if ( typeof transform !== 'function' ) {
		return rows;
	}

	return rows.map( ( row, index ) => transform( row, index ) );
}
