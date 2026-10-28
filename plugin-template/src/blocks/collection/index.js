/**
 * {{title.cpt_singular}} Collection Block
 *
 * @package
 */

import { registerBlockType } from '@wordpress/blocks';
import Edit from './edit';
import metadata from './block.json';

// Import styles
import './editor.scss';
import './style.scss';
import './view.js';

// Register the block
registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
} );
