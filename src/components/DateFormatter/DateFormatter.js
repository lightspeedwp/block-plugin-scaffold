import { __ } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * {{name}} DateFormatter (Relative Time)
 * Formats a date as relative time (e.g., "5 minutes ago").
 * @param {Object}      root0        Component props.
 * @param {string|Date} root0.date
 * @param {string}      root0.locale
 */
export default function DateFormatter( { date, locale = 'en' } ) {
	const relTime = useMemo( () => {
		if ( ! date ) {
			return '';
		}
		const now = new Date();
		const then = new Date( date );
		const diff = ( now - then ) / 1000;
		if ( diff < 60 ) {
			return __( 'just now', '{{textdomain}}' );
		}
		if ( diff < 3600 ) {
			return `${ Math.floor( diff / 60 ) } ${ __( 'minutes ago', '{{textdomain}}' ) }`;
		}
		if ( diff < 86400 ) {
			return `${ Math.floor( diff / 3600 ) } ${ __( 'hours ago', '{{textdomain}}' ) }`;
		}
		if ( diff < 604800 ) {
			return `${ Math.floor( diff / 86400 ) } ${ __( 'days ago', '{{textdomain}}' ) }`;
		}
		return then.toLocaleDateString( locale );
	}, [ date, locale ] );
	return <time dateTime={ date }>{ relTime }</time>;
}
