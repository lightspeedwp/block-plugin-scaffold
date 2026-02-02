# SCF Local JSON Registration Changes

## Overview

The plugin scaffold has been updated to leverage **Secure Custom Fields (SCF) Local JSON** for registering post types and taxonomies, instead of manual PHP registration. This provides version control, automatic synchronization, and better maintainability.

## What Changed

### 1. JSON File Format & Naming

#### Post Types
- **Old Format**: `posttype_{slug}.json` with custom schema
- **New Format**: `post-type-{slug}.json` with SCF schema

**Example Structure**:
```json
{
	"key": "post_type_webinar",
	"title": "Webinar/Event",
	"post_type": "webinar",
	"menu_order": 0,
	"active": true,
	"public": true,
	"hierarchical": false,
	"supports": ["title", "editor", "thumbnail"],
	"taxonomies": ["brand", "speciality"],
	"has_archive": true,
	"rewrite": {
		"slug": "webinar",
		"with_front": true
	},
	"labels": {
		"name": "Webinars & Events",
		"singular_name": "Webinar/Event",
		// ... 15+ label properties
	}
}
```

#### Taxonomies
- **Old Format**: `taxonomy_{slug}.json` with minimal properties
- **New Format**: `taxonomy-{slug}.json` with SCF schema

**Example Structure**:
```json
{
	"key": "taxonomy_brand",
	"title": "Brand",
	"taxonomy": "brand",
	"menu_order": 0,
	"active": true,
	"object_type": ["webinar", "sfwd_course"],
	"public": true,
	"hierarchical": false,
	"show_ui": true,
	"show_in_rest": true,
	"labels": {
		"name": "Brands",
		"singular_name": "Brand",
		// ... 10+ label properties
	},
	"rewrite": {
		"slug": "brand",
		"with_front": true,
		"hierarchical": false
	}
}
```

### 2. SCF_JSON Class Updates

**File**: `inc/class-scf-json.php`

Added filters for post type and taxonomy registration:

```php
public function __construct() {
	$this->json_path = PLUGIN_DIR . 'scf-json';

	// Field groups (original).
	add_filter( 'acf/settings/save_json', array( $this, 'set_save_path' ) );
	add_filter( 'acf/settings/load_json', array( $this, 'add_load_path' ) );

	// Post types (new).
	add_filter( 'acf/settings/save_json/type=acf-post-type', array( $this, 'set_save_path' ) );
	add_filter( 'acf/json/load_paths', array( $this, 'add_post_type_load_paths' ) );

	// Taxonomies (new).
	add_filter( 'acf/settings/save_json/type=acf-taxonomy', array( $this, 'set_save_path' ) );
	add_filter( 'acf/json/load_paths', array( $this, 'add_taxonomy_load_paths' ) );

	$this->maybe_create_directory();
}

public function add_post_type_load_paths( $paths ) {
	$paths[] = $this->json_path;
	return $paths;
}

public function add_taxonomy_load_paths( $paths ) {
	$paths[] = $this->json_path;
	return $paths;
}
```

### 3. Content Model Manager Updates

**File**: `inc/class-content-model-manager.php`

Removed manual registration:

```php
/**
 * Initialize content model manager.
 * 
 * Post types and taxonomies are now registered via Secure Custom Fields (SCF)
 * Local JSON. See scf-json/ directory for post-type-*.json and taxonomy-*.json files.
 *
 * @since 1.0.0
 */
public static function init() {
	// Load JSON configurations for internal reference only.
	// SCF handles actual registration of post types and taxonomies.
	self::load_configurations();
	self::build_taxonomy_map();
}
```

### 4. Generator Script Updates

**File**: `scripts/generate-plugin.js`

#### generatePostTypeJSONFiles()
- Changed file naming: `posttype_` → `post-type-`
- Complete rewrite to output SCF schema format
- Includes all required SCF properties
- Generates complete labels object (15+ properties)
- Uses tab indentation to match SCF exports

#### generateTaxonomySCFGroups()
- Changed file naming: `taxonomy_` → `taxonomy-`
- Complete rewrite to output SCF schema format
- Includes all required SCF properties
- Generates complete labels object (10+ properties)
- Handles hierarchical vs non-hierarchical labels
- Uses tab indentation to match SCF exports

## How It Works

### Registration Flow

1. **Plugin activation** → SCF reads JSON files from `scf-json/` directory
2. **SCF loads**:
   - `post-type-*.json` → Registers custom post types
   - `taxonomy-*.json` → Registers taxonomies
   - `group_*.json` → Loads field groups
3. **WordPress registers** the post types/taxonomies automatically
4. **Flush permalinks** to update rewrite rules

### File Organization

```
plugin-name/
├── scf-json/
│   ├── post-type-webinar.json          # Post type registration
│   ├── post-type-digital_magazine.json # Post type registration
│   ├── taxonomy-brand.json             # Taxonomy registration
│   ├── taxonomy-speciality.json        # Taxonomy registration
│   ├── group_webinar_fields.json       # Field group
│   └── group_digital_magazine_fields.json # Field group
└── inc/
    ├── class-scf-json.php              # Configures SCF JSON paths
    └── class-content-model-manager.php # Loads configs (reference only)
```

## Benefits

### 1. Version Control
- JSON files tracked in Git
- Changes visible in diffs
- Easy rollback of schema changes

### 2. Automatic Synchronization
- SCF automatically syncs JSON ↔ WordPress
- Changes made in admin saved to JSON
- JSON changes loaded on next page load

### 3. No Manual Registration Code
- No PHP `register_post_type()` calls
- No PHP `register_taxonomy()` calls
- Cleaner codebase

### 4. Environment Consistency
- Same schema across dev/staging/production
- No database dependencies for schema
- Easier deployment

### 5. Better Maintainability
- Declarative schema definition
- Standard SCF format
- Easier to understand and modify

## Migration Guide

### For Existing Plugins

1. **Backup** current post type/taxonomy registration code
2. **Generate** SCF JSON files using the scaffold
3. **Update** `inc/class-scf-json.php` with new filters
4. **Update** `inc/class-content-model-manager.php` to remove registration
5. **Test** in development environment
6. **Deploy** to production
7. **Flush permalinks** in WordPress admin

### For New Plugins

Just run the generator with your config - everything is automatic!

```bash
node scripts/generate-plugin.js \
  --config your-plugin-config.json \
  --output ../your-plugin \
  --force
```

## Testing Checklist

After generation:

- [ ] Post types appear in WordPress admin menu
- [ ] Post types have correct icons
- [ ] Taxonomies appear in admin
- [ ] Taxonomies attached to correct post types
- [ ] Field groups load correctly
- [ ] Block bindings work with SCF fields
- [ ] Field picker dropdown shows fields
- [ ] Archive pages work
- [ ] Single post templates work
- [ ] Rewrite rules functional (flush permalinks)

## Troubleshooting

### Post Types Not Appearing

1. Check `scf-json/post-type-*.json` files exist
2. Verify file naming: `post-type-{slug}.json` (hyphenated)
3. Verify `key` property: `post_type_{slug}` (underscored)
4. Check SCF_JSON class filters are registered
5. Flush permalinks: Settings → Permalinks → Save

### Taxonomies Not Appearing

1. Check `scf-json/taxonomy-*.json` files exist
2. Verify file naming: `taxonomy-{slug}.json` (hyphenated)
3. Verify `key` property: `taxonomy_{slug}` (underscored)
4. Check `object_type` array includes correct post types
5. Flush permalinks

### Field Groups Not Loading

1. Check `scf-json/group_*.json` files exist
2. Verify location rules include correct post types
3. Check SCF_JSON class `add_load_path()` method
4. Verify `acf/settings/load_json` filter is registered

## References

- [SCF Local JSON Documentation](https://www.secure-custom-fields.com/docs/local-json/)
- [SCF Post Type Registration](https://www.secure-custom-fields.com/docs/post-types/)
- [SCF Taxonomy Registration](https://www.secure-custom-fields.com/docs/taxonomies/)
- [WordPress register_post_type()](https://developer.wordpress.org/reference/functions/register_post_type/)
- [WordPress register_taxonomy()](https://developer.wordpress.org/reference/functions/register_taxonomy/)

## Schema Examples

### Required Post Type Properties

```json
{
	"key": "post_type_{slug}",          // REQUIRED: "post_type_" prefix
	"title": "Display Name",            // REQUIRED: Admin display
	"post_type": "{slug}",              // REQUIRED: 20 chars max, lowercase
	"menu_order": 0,                    // Menu position
	"active": true,                     // Enable/disable
	"public": true,                     // Public visibility
	"hierarchical": false,              // Pages vs Posts style
	"supports": [],                     // Feature support
	"taxonomies": [],                   // Attached taxonomies (slugs only)
	"has_archive": true,                // Archive page
	"rewrite": {},                      // URL rewrite rules
	"labels": {}                        // All admin labels
}
```

### Required Taxonomy Properties

```json
{
	"key": "taxonomy_{slug}",           // REQUIRED: "taxonomy_" prefix
	"title": "Display Name",            // REQUIRED: Admin display
	"taxonomy": "{slug}",               // REQUIRED: 32 chars max, lowercase
	"menu_order": 0,                    // Menu position
	"active": true,                     // Enable/disable
	"object_type": [],                  // REQUIRED: Post types (slugs)
	"public": true,                     // Public visibility
	"hierarchical": false,              // Categories vs Tags style
	"show_ui": true,                    // Show in admin
	"show_in_rest": true,               // REST API support
	"rewrite": {},                      // URL rewrite rules
	"labels": {}                        // All admin labels
}
```

## Notes

- **File naming** uses hyphens: `post-type-`, `taxonomy-`
- **Key property** uses underscores: `post_type_`, `taxonomy_`
- **Tab indentation** matches SCF export format
- **Complete labels** improve admin UX
- **SCF validates** JSON on load (check logs for errors)
- **Flush permalinks** after any post type/taxonomy changes

---

**Last Updated**: 2026-02-02  
**Version**: 2.0.0  
**Scaffold**: block-plugin-scaffold
