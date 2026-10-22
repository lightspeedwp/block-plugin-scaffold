import { __ } from '@wordpress/i18n';

/**
 * {{name}} SocialShare
 * Accessible social sharing buttons for frontend use.
 * @param {Object} root0       Component props.
 * @param {string} root0.url
 * @param {string} root0.title
 */
export default function SocialShare( { url, title } ) {
	const shareText = encodeURIComponent( title || document.title );
	const shareUrl = encodeURIComponent( url || window.location.href );
	return (
		<nav
			className="{{namespace}}-social-share"
			aria-label={ __( 'Share', '{{textdomain}}' ) }
		>
			<ul>
				<li>
					<a
						href={ `https://twitter.com/intent/tweet?url=${ shareUrl }&text=${ shareText }` }
						target="_blank"
						rel="noopener noreferrer"
						aria-label={ __(
							'Share on Twitter',
							'{{textdomain}}'
						) }
					>
						Twitter
					</a>
				</li>
				<li>
					<a
						href={ `https://www.facebook.com/sharer/sharer.php?u=${ shareUrl }` }
						target="_blank"
						rel="noopener noreferrer"
						aria-label={ __(
							'Share on Facebook',
							'{{textdomain}}'
						) }
					>
						Facebook
					</a>
				</li>
				<li>
					<a
						href={ `mailto:?subject=${ shareText }&body=${ shareUrl }` }
						aria-label={ __( 'Share by Email', '{{textdomain}}' ) }
					>
						Email
					</a>
				</li>
			</ul>
		</nav>
	);
}
