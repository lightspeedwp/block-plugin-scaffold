---
title: {{CPT1 Collection}} Block
category: Block
---

# {{CPT1 Collection}} Block

Displays a collection of {{cpt_slug}} items with extensible filtering, sorting, and event-driven extensibility. Supports custom collection registration and DOM event hooks for advanced integrations.

## Features

- Accessible, responsive grid layout
- Extensible via JS event hooks (see `view.js`)
- Custom collection registration (see `block.json`)
- Editor and frontend styles

## Extensibility

- Listen for DOM events (e.g., `collectionInit`, `collectionFilter`, `collectionSort`, `collectionPageChange`, `collectionRegister`)
- Register new collection types via JS API

## Accessibility

- Keyboard and screen reader friendly
- Focus states and ARIA attributes

## Files

- `block.json` – Block registration and attributes
- `edit.js` – Block editor logic
- `render.php` – Server-side rendering
- `editor.css` – Editor styles
- `style.css` – Frontend styles
- `view.js` – Frontend event and extensibility logic
