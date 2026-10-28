# Interactivity API and DataViews

This plugin includes `@wordpress/interactivity`, `@wordpress/interactivity-router` and `@wordpress/dataviews`, and its build handles both packages with no extra setup. This page explains when to use each one.

| Use | When you need | Loaded on |
| --- | --- | --- |
| **Interactivity API** | Reactive front-end behaviour in a block, such as filters, galleries, tabs or a booking calculator | The front end, as a small script module that WordPress shares between blocks |
| **DataViews** | An admin screen that lists, filters, sorts and pages records, such as an import log or a booking list | Admin screens only, because it is bundled with your script (see [Size](#dataviews-size)) |

## Interactivity API

Use it instead of jQuery, a hand-built React mount or another front-end framework. The block's PHP renders the HTML with `data-wp-*` directives, and a small store adds the behaviour. WordPress loads `@wordpress/interactivity` once, as a shared module.

### 1. Declare a view module in `block.json`

```json
{
	"render": "file:./render.php",
	"viewScriptModule": "file:./view.js",
	"supports": { "interactivity": true }
}
```

`npm run build` and `npm run start` already pass `--experimental-modules`, which `@wordpress/scripts` needs to build `viewScriptModule` entries. The build writes `view.js` and a `view.asset.php` with `'type' => 'module'` and `@wordpress/interactivity` as an external dependency.

### 2. Add directives in `render.php`

```php
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="{{slug}}/slider"
	<?php echo wp_interactivity_data_wp_context( array( 'current' => 0 ) ); ?>
>
	<button type="button" data-wp-on--click="actions.next">
		<?php esc_html_e( 'Next slide', '{{textdomain}}' ); ?>
	</button>
	<span data-wp-text="context.current"></span>
</div>
```

### 3. Write the store in `view.js`

```js
import { store, getContext } from '@wordpress/interactivity';

store( '{{slug}}/slider', {
	actions: {
		next() {
			const context = getContext();
			context.current += 1;
		},
	},
} );
```

For navigation between pages without a full reload, add `@wordpress/interactivity-router`, which is already installed.

**Accessibility**: use real `<button>` and `<a>` elements for actions, and announce changes that are not visible to screen readers with `@wordpress/a11y`'s `speak()`.

## DataViews

Use it for admin screens that show records in a table, grid or list, with the same filters, sorting, paging and field visibility controls as the Site Editor.

```js
import { createRoot, useState } from '@wordpress/element';
import { DataViews } from '@wordpress/dataviews/wp';

const fields = [ { id: 'title', label: 'Title', enableGlobalSearch: true } ];

function ImportLog( { items } ) {
	const [ view, setView ] = useState( {
		type: 'table',
		fields: [ 'title' ],
		perPage: 20,
		page: 1,
	} );

	return (
		<DataViews
			data={ items }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
			paginationInfo={ { totalItems: items.length, totalPages: 1 } }
			defaultLayouts={ { table: {} } }
		/>
	);
}

createRoot( document.getElementById( '{{slug}}-import-log' ) ).render(
	<ImportLog items={ window.myPluginImportLog } />
);
```

Put the script in `src/js/admin/`, so it gets its own entry (`build/js/admin/…`), and enqueue it only on your admin page, reading dependencies and version from its `.asset.php` file.

### DataViews size

WordPress core does not ship DataViews as a shared script, so it is bundled into your entry: about **1.9 MiB** for a single screen (the build prints a webpack size warning). Keep it to the admin screens that need it, in its own entry, and never load it on the front end.

## Further reading

- [Interactivity API reference](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/)
- [`viewScriptModule` in block.json](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script-module)
- [Using Data Views to display and interact with data in plugins](https://developer.wordpress.org/news/2024/08/using-data-views-to-display-and-interact-with-data-in-plugins/)
- [`@wordpress/dataviews` package](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-dataviews/)
