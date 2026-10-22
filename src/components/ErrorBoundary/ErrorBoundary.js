import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * {{name}} ErrorBoundary
 * Accessible error boundary for WordPress blocks and frontend.
 */
export class ErrorBoundary extends Component {
	constructor( props ) {
		super( props );
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch( error, info ) {
		if ( this.props.onError ) {
			this.props.onError( error, info );
		}
	}

	render() {
		if ( this.state.hasError ) {
			return (
				<div className="{{namespace}}-error-boundary" role="alert">
					{ __( 'Something went wrong.', '{{textdomain}}' ) }
				</div>
			);
		}
		return this.props.children;
	}
}
