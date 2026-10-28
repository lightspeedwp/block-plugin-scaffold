# CSS Architecture

How {{name}} organises and names its styles. Stylelint (`npm run lint:css`, `.stylelintrc.js`) enforces the WordPress SCSS rules and BEM class names.

## Where Styles Live

| File | Loaded | Use for |
| --- | --- | --- |
| `src/blocks/<block>/style.scss` | Editor and front end | How the block looks |
| `src/blocks/<block>/editor.scss` | Editor only | Editor-only affordances: placeholders, outlines |
| `src/scss/style.scss`, `src/scss/editor.scss` | Through `src/index.js` | Shared styles and custom properties |
| `src/components/<Component>/style.scss` | With the component | Styles a shared component owns |

`block.json` names each block's `style` and `editorStyle`, and `@wordpress/scripts` builds them, with RTL versions, into `build/`. Never edit `build/`.

## BEM Class Names

```text
.block                      a standalone component
.block__element             a part of the block
.block--modifier            a variant of the block
.block__element--modifier   a variant of an element
```

- Blocks start from the class WordPress gives them: `.wp-block-{{slug}}-slider`, then `.wp-block-{{slug}}-slider__track` and `.wp-block-{{slug}}-slider--autoplay`.
- Shared styles prefix their classes with the `$namespace` SCSS variable from `src/scss/template.scss` (`{{namespace}}`): `.#{$namespace}-slider-common__dot` compiles to `.{{namespace}}-slider-common__dot`.
- Lowercase and hyphens only; `__` for elements and `--` for modifiers; never more than `block__element--modifier`.
- A modifier always sits beside its block class: `class="wp-block-{{slug}}-slider wp-block-{{slug}}-slider--autoplay"`.
- Block styles registered with `register_block_style()` keep WordPress's `is-style-<name>` class.

## Values

- Use theme.json presets through their custom properties (`var(--wp--preset--color--primary)`, `var(--wp--preset--spacing--40)`) and the block supports in `block.json` (colour, spacing, typography) rather than fixed values, so the block follows the active theme.
- Put the plugin's own values in custom properties, defined once in `src/scss/style.scss` with the same prefix: `--#{$namespace}-transition` compiles to `--{{namespace}}-transition`.
- Prefer `gap` to margins between siblings, and logical properties (`margin-inline`, `padding-block`) so RTL works.

## Avoid

- IDs, `!important`, and selectors that reach into other blocks or the theme.
- Deep nesting: two levels of SCSS nesting at most.
- Styling `.editor-styles-wrapper` from front-end files.
- Animations without a `prefers-reduced-motion` alternative.
