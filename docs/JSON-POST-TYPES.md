# JSON-Based Post Type Loading System

## Overview

This implementation adds a JSON-based loading system for WordPress post types, taxonomies, and custom fields to the Block Plugin Scaffold. The system is inspired by the [Tour Operator content models system](https://github.com/lightspeedwp/tour-operator/tree/develop/plugins/content-models) and provides a declarative way to define content structures.

## Features

- ✅ **JSON-driven Configuration**: Load post types, taxonomies, and SCF fields from JSON files
- ✅ **Mustache Template Support**: All configurations maintain `{{mustache}}` placeholders for generator compatibility
- ✅ **Backward Compatibility**: Falls back to hardcoded PHP if no JSON files exist
- ✅ **Validation**: JSON Schema validation ensures configuration correctness
- ✅ **Developer-Friendly**: Clear, maintainable structure

## Architecture

### File Structure

```
block-plugin-scaffold/
├── post-types/
│   ├── README.md           # Documentation for JSON configurations
│   ├── schema.json         # JSON Schema for validation
│   └── {{slug}}.json       # Example post type with mustache placeholders
├── inc/
│   ├── class-json-loader.php    # JSON loading and parsing
│   ├── class-post-types.php     # Post type registration (updated)
│   ├── class-taxonomies.php     # Taxonomy registration (updated)
│   └── class-fields.php         # Fields registration (updated)
└── scripts/
    └── validate-post-types.js   # JSON validation script
```

### Components

#### 1. JSON_Loader Class (`inc/class-json-loader.php`)

Core class responsible for:
- Loading JSON files from `/post-types/` directory
- Parsing and validating JSON configurations
- Providing helper methods for accessing configurations
- Generating labels for post types and taxonomies

**Key Methods:**
- `init()` - Initialize the loader (hooked to `init` at priority 5)
- `load_configurations()` - Load all JSON files
- `get_configuration($slug)` - Get config for a specific post type
- `get_fields($slug)` - Get fields for a post type
- `get_taxonomies($slug)` - Get taxonomies for a post type
- `get_post_type_labels($config)` - Generate post type labels
- `get_taxonomy_labels($config)` - Generate taxonomy labels

#### 2. Updated Classes

**Post_Types** (`inc/class-post-types.php`):
- `register_post_types()` - Checks for JSON config first
- `register_from_json($config)` - Register from JSON
- `register_hardcoded()` - Fallback to hardcoded registration

**Taxonomies** (`inc/class-taxonomies.php`):
- `register_taxonomies()` - Checks for JSON config
- `register_from_json($config)` - Register from JSON
- `register_hardcoded()` - Fallback registration

**Fields** (`inc/class-fields.php`):
- `register_fields()` - Checks for JSON config
- `register_from_json($fields_config)` - Register from JSON
- `register_hardcoded()` - Fallback registration

#### 3. Validation Script (`scripts/validate-post-types.js`)

Node.js script that:
- Validates all JSON files against schema.json
- Provides colored console output
- Returns exit code 1 on errors (for CI/CD)

## Usage

### Creating a New Post Type

1. **Create JSON Configuration** (`post-types/product.json`):

```json
{
  "slug": "product",
  "label": "Product",
  "pluralLabel": "Products",
  "icon": "products",
  "template": [
    [
      "my-plugin/product-single"
    ]
  ],
  "fields": [
    {
      "slug": "product_price",
      "type": "number",
      "label": "Price",
      "description": "Product price in USD",
      "required": true
    },
    {
      "slug": "product_sku",
      "type": "text",
      "label": "SKU",
      "description": "Stock Keeping Unit"
    }
  ],
  "taxonomies": [
    {
      "slug": "product-category",
      "label": "Product Category",
      "pluralLabel": "Product Categories",
      "hierarchical": true,
      "show_admin_column": true
    }
  ]
}
```

2. **Validate Configuration**:

```bash
npm run validate:post-types
```

3. **WordPress Registration**: The plugin automatically loads and registers the post type on the next page load.

### Supported Field Types

All Secure Custom Fields (ACF) field types are supported:

- **Text**: `text`, `textarea`, `number`, `email`, `url`, `password`
- **Content**: `wysiwyg`, `oembed`
- **Media**: `image`, `file`, `gallery`
- **Choice**: `select`, `checkbox`, `radio`, `true_false`
- **Relational**: `link`, `post_object`, `relationship`, `taxonomy`, `user`
- **Advanced**: `date_picker`, `color_picker`, `repeater`, `group`

### Field Configuration Options

```json
{
  "slug": "field_name",           // Required
  "type": "text",                 // Required
  "label": "Field Label",         // Required
  "description": "Helper text",   // Optional
  "required": false,              // Optional
  "default_value": "",            // Optional
  "placeholder": "Enter value",   // Optional
  "choices": {                    // Optional (for select/radio/checkbox)
    "key1": "Label 1",
    "key2": "Label 2"
  },
  "return_format": "array"        // Optional (field type specific)
}
```

## Backward Compatibility

The system maintains full backward compatibility:

1. **No JSON Files**: If no JSON files exist, classes use hardcoded registration
2. **Empty Configuration**: Empty/invalid JSON files trigger hardcoded fallback
3. **Existing Plugins**: No changes needed to existing scaffolds

## Validation

### Running Validation

```bash
# Validate post type JSON files
npm run validate:post-types

# Validate all configurations
npm run validate:all
```

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
- name: Validate configurations
  run: npm run validate:all
```

## Generator Integration

The system maintains full mustache template support for the generator:

```json
{
  "slug": "{{cpt_slug}}",
  "label": "{{name_singular}}",
  "pluralLabel": "{{name_plural}}",
  "icon": "{{cpt_icon_name}}",
  "fields": [
    {
      "slug": "{{namespace}}_field",
      "type": "text",
      "label": "Field Label"
    }
  ],
  "taxonomies": [
    {
      "slug": "{{taxonomy_slug}}",
      "label": "{{taxonomy_singular}}",
      "pluralLabel": "{{taxonomy_plural}}"
    }
  ]
}
```

## Benefits

### For Developers

- **Declarative Configuration**: Define content structure in JSON, not PHP
- **Version Control**: JSON files are easy to diff and track
- **Validation**: Catch errors before deployment
- **Documentation**: JSON is self-documenting

### For Teams

- **Collaboration**: Non-developers can modify content structures
- **Code Review**: Clear changes in pull requests
- **Consistency**: Schema validation ensures correctness

### For Projects

- **Maintainability**: Easier to understand and modify
- **Scalability**: Add new post types without PHP knowledge
- **Testing**: Validate configurations in CI/CD

## Implementation Details

### Load Order

1. `JSON_Loader::init()` hooks into `init` at priority 5
2. `JSON_Loader::load_configurations()` reads all JSON files
3. `Post_Types::register_post_types()` checks for JSON config
4. Falls back to hardcoded if no JSON found
5. Same pattern for taxonomies and fields

### Label Generation

The system automatically generates all WordPress labels from:
- `label` (singular)
- `pluralLabel` (plural)
- `slug`

Example for "Product":
- `name` → "Products"
- `singular_name` → "Product"
- `add_new_item` → "Add New Product"
- `search_items` → "Search Products"
- etc.

## Testing

### Manual Testing

1. Create a test JSON file in `post-types/`
2. Validate: `npm run validate:post-types`
3. Refresh WordPress admin
4. Verify post type appears in admin menu

### Automated Testing

Add to your test suite:

```javascript
// tests/integration/test-json-loader.php
test('JSON configurations load correctly', () => {
  $config = JSON_Loader::get_configuration('product');
  expect($config)->not()->toBeNull();
  expect($config['slug'])->toBe('product');
});
```

## Troubleshooting

### Configuration Not Loading

1. **Check file location**: Files must be in `/post-types/` directory
2. **Validate JSON**: Run `npm run validate:post-types`
3. **Check slug**: Ensure slug matches constant in PHP class
4. **Clear cache**: Try flushing WordPress rewrite rules

### Validation Errors

```bash
npm run validate:post-types
```

Common errors:
- Missing required fields (`slug`, `label`, `template`)
- Invalid field types
- Malformed JSON syntax

### Fields Not Appearing

1. **Check SCF/ACF active**: The plugin requires Secure Custom Fields
2. **Verify field format**: Check against schema.json
3. **Check field slugs**: Must be unique within post type

## Migration Guide

### From Hardcoded to JSON

1. **Extract current configuration**:
   - Copy labels from `class-post-types.php`
   - Copy taxonomy args from `class-taxonomies.php`
   - Copy field definitions from `class-fields.php`

2. **Create JSON file**:
   - Use `{{slug}}.json` as template
   - Fill in extracted values

3. **Validate**:
   ```bash
   npm run validate:post-types
   ```

4. **Test**:
   - Refresh WordPress admin
   - Verify post type, taxonomies, and fields

5. **Remove hardcoded values** (optional):
   - Classes will use JSON automatically
   - Keep hardcoded as fallback

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for multiple post types per JSON file
- [ ] Post type relationships configuration
- [ ] REST API custom endpoints
- [ ] GraphQL schema generation
- [ ] Import/export between plugins
- [ ] Visual JSON editor
- [ ] Hot reload in development

## Reference

- [WordPress Post Types](https://developer.wordpress.org/reference/functions/register_post_type/)
- [WordPress Taxonomies](https://developer.wordpress.org/reference/functions/register_taxonomy/)
- [Secure Custom Fields](https://wordpress.org/plugins/secure-custom-fields/)
- [JSON Schema](https://json-schema.org/)
- [Tour Operator Reference](https://github.com/lightspeedwp/tour-operator/tree/develop/plugins/content-models)

## Support

For issues, questions, or contributions:
- Check `/post-types/README.md` for usage examples
- Validate with `npm run validate:post-types`
- Review schema.json for available options
- Check Tour Operator implementation for advanced patterns
