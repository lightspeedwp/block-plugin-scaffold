# Field Display Pattern Generator Skill

## Purpose
Scans the `build/blocks` folder for all blocks with `field-display` in their name, then matches each to its corresponding post type and custom fields (from `scf-json`). For each field, generates a pattern PHP file (like those in the `patterns` folder) for the field display block, pre-filled with the correct attributes.

## How it Works
1. **Scan**: Find all block folders in `build/blocks` with `field-display` in the name.
2. **Match**: For each, determine the post type (e.g., `digital_magazine`, `webinar`).
3. **Fields**: Load the custom fields for that post type from `scf-json/group_{post_type}_fields.json`.
4. **Generate**: For each field, create a pattern PHP file in the `patterns` folder. The pattern contains a single block with attributes:
   - `fieldKey`: field name (e.g., `issue_number`)
   - `prefix`: empty by default
   - `prefixBold`: true if the field is required, false otherwise
   - `iconType`: `solid` (default)
   - `iconName`: chosen based on field type (see below)

## Icon Mapping
- `date`, `date_picker`, `date_time_picker`: `clockIcon`
- `number`: `hashtagIcon`
- `url`, `file`: `linkIcon`
- `text`, `select`, `repeater`: `documentIcon`
- fallback: `infoIcon`

## Example Output
```php
<!-- wp:ma-plugin/digital-magazine-field-display {"fieldKey":"issue_number","prefix":"","prefixBold":true,"iconType":"solid","iconName":"hashtagIcon"} /-->
```

## Output Location
- Each generated pattern is saved as `ma-plugin-{block}-{field}.php` in the `patterns` folder.

## Usage
- Run this skill to keep field display patterns in sync with custom fields.

---

**Author:** GitHub Copilot
**Last updated:** 2026-02-03
