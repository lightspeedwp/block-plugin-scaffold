=== {{name}} ===
Contributors: {{contributors}}
Tags: blocks, block-editor
Requires at least: {{requires_wp}}
Tested up to: {{tested_up_to}}
Stable tag: {{version}}
Requires PHP: {{requires_php}}
License: {{license}}
License URI: {{license_uri}}

{{description}}

== Description ==

{{description}}

= Key Features =

* **Modern Block Editor Integration** - Built with the latest WordPress block editor standards
* **Multiple Blocks** - Provides a suite of related blocks for comprehensive functionality
* **Customisable Design** - Flexible styling options to match your theme
* **Performance Optimised** - Lightweight and fast-loading
* **Accessibility Ready** - Built to meet WCAG 2.2 Level AA
* **Translation Ready** - Fully internationalised and ready for translation
* **Developer Friendly** - Clean, well-documented code following WordPress coding standards

= Requirements =

* WordPress {{requires_wp}} or higher
* PHP {{requires_php}} or higher
* [Secure Custom Fields](https://wordpress.org/plugins/secure-custom-fields/)

== Installation ==

1. Upload the `{{slug}}` folder to the `/wp-content/plugins/` directory, or install the plugin ZIP via Plugins > Add New > Upload Plugin.
2. Activate the plugin through the Plugins screen in WordPress.
3. Add the plugin's blocks from the block inserter in the editor.

== Frequently Asked Questions ==

= Does this work with any theme? =

Yes. The plugin is designed to work with any properly coded WordPress theme that supports the block editor.

= Can I use this with the Classic Editor? =

No. This plugin requires the block editor.

= Is this plugin translation ready? =

Yes. The text domain is `{{textdomain}}`, and translation files can be added to the `/languages` directory.

= How do I customise the blocks' appearance? =

You can customise the blocks using:
1. The block settings panel in the editor sidebar
2. Theme.json settings in your theme
3. Custom CSS in your theme's stylesheet
4. Block styles and variations

= Does this plugin collect personal data? =

No. The plugin itself does not collect, process, or store any personal data.

== Changelog ==

= {{version}} =
* Initial release.

== Upgrade Notice ==

= {{version}} =
Initial release.

== Development ==

= Building from Source =

`
npm install
composer install
npm run build
`

= Developer Hooks =

**Filters:**

* `{{namespace}}_blocks_dir` - Change the directory blocks are auto-registered from (defaults to `build/blocks/`)

= Credits =

Developed and maintained by {{author}}.
