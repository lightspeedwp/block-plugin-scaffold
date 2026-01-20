# Post Types JSON Configuration

This directory contains JSON-based configurations for WordPress post types, taxonomies, and custom fields. This system allows you to define your content structure declaratively, making it easier to maintain and version control your custom post types.

## Overview

The JSON-based loading system provides:

- **Declarative Configuration**: Define post types, taxonomies, and fields in JSON format
- **Mustache Template Support**: All configurations maintain `{{mustache}}` placeholders for generator compatibility
- **Backward Compatibility**: The system falls back to hardcoded PHP if no JSON files are present
- **Validation**: JSON Schema validation ensures configuration correctness
- **Maintainability**: Easier to understand and modify content structure

## File Structure

```
post-types/
├── schema.json          # JSON Schema for validation
└── {{slug}}.json        # Example post type configuration (with mustache placeholders)
```

## Usage

### 1. Create a Post Type Configuration

Create a new JSON file in this directory with your post type slug as the filename (e.g., `product.json`):

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
      "required": true,
      "placeholder": "0.00"
    },
    {
      "slug": "product_featured",
      "type": "true_false",
      "label": "Featured Product",
      "description": "Mark this product as featured"
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

### 2. Field Types

Supported field types (from Secure Custom Fields / ACF):

- **Text Fields**: `text`, `textarea`, `number`, `email`, `url`, `password`
- **Content**: `wysiwyg`, `oembed`
- **Media**: `image`, `file`, `gallery`
- **Choice**: `select`, `checkbox`, `radio`, `true_false`
- **Relational**: `link`, `post_object`, `relationship`, `taxonomy`, `user`
- **Advanced**: `date_picker`, `color_picker`, `etc.`

### 3. Field Configuration Options

```json
{
  "slug": "field_name",           // Required: Field slug (will be prefixed in DB)
  "type": "text",                 // Required: Field type
  "label": "Field Label",         // Required: Display label
  "description": "Helper text",   // Optional: Instructions/description
  "required": false,              // Optional: Make field required
  "default_value": "",            // Optional: Default value
  "placeholder": "Enter value",   // Optional: Placeholder text
  "choices": {                    // Optional: For select/radio/checkbox
    "value1": "Label 1",
    "value2": "Label 2"
  },
  "return_format": "array"        // Optional: Return format for some fields
}
```

### 4. Taxonomy Configuration

```json
{
  "slug": "taxonomy-slug",
  "label": "Taxonomy Name",
  "pluralLabel": "Taxonomy Names",
  "hierarchical": true,           // true = like categories, false = like tags
  "show_admin_column": true       // Show in admin list table
}
```

### 5. Validation

Validate your JSON files before using them:

```bash
npm run validate:post-types
```

This will check all JSON files against the schema and report any errors.

### 6. Mustache Placeholders

For use with the generator system, maintain mustache placeholders:

```json
{
  "slug": "{{cpt_slug}}",
  "label": "{{name_singular}}",
  "pluralLabel": "{{name_plural}}",
  "icon": "{{cpt_icon_name}}"
}
```

These will be replaced during the generation process.

## How It Works

1. **JSON Loader** (`class-json-loader.php`): Loads and parses all JSON files from this directory
2. **Post Types** (`class-post-types.php`): Checks for JSON config, falls back to hardcoded if not found
3. **Taxonomies** (`class-taxonomies.php`): Registers taxonomies from JSON configuration
4. **Fields** (`class-fields.php`): Registers custom fields from JSON configuration

## Backward Compatibility

If no JSON files are present (or empty), the system automatically falls back to the hardcoded PHP registration in the class files. This ensures existing scaffolds continue to work without modification.

## Schema Reference

See [schema.json](./schema.json) for the complete JSON Schema definition.

## Example

The [{{slug}}.json](./{{slug}}.json) file provides a complete example with mustache placeholders that demonstrates all available options.

## Benefits

- ✅ **Version Control Friendly**: JSON files are easy to diff and track changes
- ✅ **Generator Compatible**: Maintains mustache template support
- ✅ **Validated**: JSON Schema ensures correctness
- ✅ **Flexible**: Easy to add new post types without PHP knowledge
- ✅ **Maintainable**: Clear structure, easy to understand
- ✅ **Backward Compatible**: Works alongside existing hardcoded registrations
