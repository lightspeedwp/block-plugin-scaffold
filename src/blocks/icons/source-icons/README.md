# Icon Library

This directory contains SVG icons used throughout the plugin blocks.

## Structure

```
source-icons/
├── outline/    # 23 outline-style icons
└── solid/      # 26 solid-style icons
```

## Available Icons

### Outline & Solid Variants
- accommodation
- accommodation-type
- arrow-down
- arrow-right
- best-months-to-travel
- booking-validity
- calendar
- check-in-accommodation
- chevron-down
- chevron-up
- clock
- close
- departs-from-ends-in
- destination
- drinks-basis
- duration
- email
- group-size
- heart
- left-chevron
- list-arrow
- list-check
- minimum-child-age
- number-of-units
- phone
- price
- quotation
- rating
- right-chevron
- room-basis
- search
- single-supplement
- special-interests
- spoken-languages
- suggested-visitor-types
- travel-style
- user
- warning

## Usage

Icons are loaded via the `{{namespace|snakeCase}}_get_icon_svg()` helper function in `inc/helper-functions.php`.

### In PHP (render callbacks)

```php
if ( function_exists( '{{namespace|snakeCase}}_get_icon_svg' ) ) {
    $svg_content = {{namespace|snakeCase}}_get_icon_svg( 'solid', 'clockIcon' );
    if ( ! empty( $svg_content ) ) {
        echo '<span class="icon">' . $svg_content . '</span>';
    }
}
```

### In Block Editor (JavaScript)

Add icon controls to your block's `index.js`:

```javascript
import { SelectControl, RadioControl } from '@wordpress/components';

// In your Edit component
const iconTypes = ['outline', 'solid'];
const iconNames = [
    { label: __('None', '{{textdomain}}'), value: '' },
    { label: __('Clock', '{{textdomain}}'), value: 'clockIcon' },
    // ... more icons
];

// In Inspector Controls
<SelectControl
    label={__('Icon', '{{textdomain}}')}
    value={iconName}
    onChange={(value) => setAttributes({ iconName: value })}
    options={iconNames}
/>
<RadioControl
    label={__('Icon Type', '{{textdomain}}')}
    selected={iconType}
    onChange={(value) => setAttributes({ iconType: value })}
    options={iconTypes.map((type) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: type,
    }))}
/>
```

## File Naming Convention

- **Source files**: kebab-case with `-icon` suffix (e.g., `clock-icon.svg`)
- **JavaScript**: camelCase with `Icon` suffix (e.g., `clockIcon`)
- **Conversion**: Automatic via regex in helper function

The helper function converts `clockIcon` → `clock-icon.svg` automatically.

## Adding New Icons

1. Export SVG from design tool (Figma, Sketch, etc.)
2. Name file in kebab-case: `your-icon-name-icon.svg`
3. Place in appropriate directory (`outline/` or `solid/`)
4. Add to icon list in block `index.js` files using camelCase: `yourIconNameIcon`
5. Icon will be available in block editor immediately

## SVG Requirements

- Use `currentColor` for strokes/fills to support theme colors
- Include `xmlns="http://www.w3.org/2000/svg"`
- Recommended size: 20x20 or 24x24 viewBox
- Keep file size minimal (remove unnecessary attributes)

Example:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="..." stroke="currentColor" stroke-width="1.5"/>
</svg>
```
