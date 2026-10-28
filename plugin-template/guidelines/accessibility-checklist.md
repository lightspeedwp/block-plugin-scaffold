# Accessibility Checklist

{{name}} targets [WCAG 2.2](https://www.w3.org/TR/WCAG22/) level AA, in the block editor and on the front end. `test/e2e/accessibility.spec.js` runs an axe-core scan at mobile, tablet and desktop widths, but automated checks find only part of the problems; go through this list for every block change.

## Markup

- [ ] Use the native element first: `button` for actions, `a` for navigation, lists for lists, headings in order.
- [ ] Every image has `alt` text, or `alt=""` when it is decorative.
- [ ] Icons that carry meaning have a text alternative; decorative SVGs have `aria-hidden="true"` and `focusable="false"`.
- [ ] ARIA only adds what HTML cannot say, and every `aria-*` reference points to an element that exists.

## Keyboard

- [ ] Everything that works with a mouse works with the keyboard, in a logical order.
- [ ] Focus is always visible, and never lost when content opens, closes or updates.
- [ ] Dialogs and menus trap focus while open, close with Escape and return focus to what opened them.
- [ ] Carousels and sliders can be paused and moved with the keyboard.

## Content and Colour

- [ ] Text contrast is at least 4.5:1 (3:1 for large text), and controls and focus indicators at least 3:1.
- [ ] Colour is never the only way information is shown.
- [ ] The layout works at 320 px wide and at 200% zoom, with no horizontal scrolling.
- [ ] Every user-facing string, including `aria-label` text, is translatable with the `{{textdomain}}` text domain.

## Motion and Updates

- [ ] Animations respect `prefers-reduced-motion`; nothing autoplays for more than five seconds without a pause control.
- [ ] Content that updates without a page load is announced (`@wordpress/a11y` `speak()` or a live region).

## In the Editor

- [ ] Block controls in the toolbar and sidebar have labels; use `@wordpress/components`, which handle most of this.
- [ ] Placeholders explain what to do, and errors say how to fix them.

## Checking

1. Run `npm run test:e2e -- test/e2e/accessibility.spec.js`.
2. Tab through the block in the editor and on the front end.
3. Check it with a screen reader (VoiceOver or NVDA) and at 200% zoom.
