---
description: Copilot refactor prompt for block plugin scaffolding implementation
---

# **Copilot Refactor Prompt – Block Plugin Scaffolding**

You are GitHub Copilot (or Copilot Chat) running inside the **`lightspeedwp/multi-block-plugin-scaffold`** repository.

Your task is to **implement the scaffolding described in `block-plugin.instructions.md`** so that a generated plugin has placeholders for:

- Plugin-registered **block templates**
- Plugin-registered **block bindings**
- Plugin-registered **block patterns** (already present, just documented)
- Plugin-level **block style variations / section styles**

---

## **How to proceed**

1. **Open the instructions**

   - Locate and open `block-plugin.instructions.md` at the root of the repository.
   - Treat that file as the **source of truth**.
   - Do **not** modify `block-plugin.instructions.md` or `block-plugin-refactor.prompt.md`.



2. **Respect scaffold placeholders**

   When editing or creating files:

   - Preserve the mustache-style placeholders:
     - `{{namespace}}`, `{{namespace|lowerCase}}`, `{{namespace|upper}}`
     - `{{slug}}`, `{{name}}`, `{{name_singular}}`, `{{name_plural_lower}}`, `{{textdomain}}`, etc.
   - Use the **same namespace and coding style** you see in `inc/class-patterns.php`:
     - Namespace: `{{namespace|lowerCase}}\classes`
     - Guard: `if ( ! defined( 'ABSPATH' ) ) { exit; }`
     - Methods hooked from `__construct()` via `add_action()`.



3. **Implement the classes and directories described**

   Following `block-plugin.instructions.md`, implement:

   - `inc/class-block-templates.php`

     - Registers at least one example plugin template via `register_block_template()` (WP 6.7+).
     - Reads block markup from `templates/example-archive.html`.
     - Uses `{{namespace|upper}}_DIR` for paths.
     - Includes a `function_exists( 'register_block_template' )` guard.



   - `inc/class-block-bindings.php`

     - Registers at least one bindings source via `register_block_bindings_source()`.
     - Example source: post meta binding that reads a given meta key from the current `postId`.
     - Implements a `get_post_meta_value()` callback that returns a scalar string or `null`.



   - `inc/class-block-styles.php`

     - Registers at least one block style variation via `register_block_style()`.
     - Example: a “section highlight” variation for `core/group` and `core/columns` using `style_data` with a theme.json-shaped array.
     - Uses the same coding style and guards as other classes.



   - Documentation & placeholder directories:

     - `templates/README.md` – explain that templates here are plugin-registered via `register_block_template()`.
     - `template-parts/README.md` – explain that template parts remain a theme concern and this folder is only a placeholder.
     - `styles/README.md` – explain how plugin authors can define theme.json-like fragments and optionally load them into `style_data` for `register_block_style()`.



   - Block patterns:

     - Leave `inc/class-patterns.php` logic intact.
     - Update `patterns/README.md` as needed so it clearly explains how plugin patterns are registered and where to add new ones.



4. **Wire classes from the main plugin file**

   - Find the main plugin bootstrap file (the one with the plugin header and the existing instantiation of `{{namespace|lowerCase}}\classes\Patterns`).

   - Instantiate the new classes there, e.g.:

```php
new \{{namespace|lowerCase}}\classes\Block_Templates();
new \{{namespace|lowerCase}}\classes\Block_Bindings();
new \{{namespace|lowerCase}}\classes\Block_Styles();
```

   - Ensure the `inc/*.php` files are included / autoloaded in the same way as `class-patterns.php`.



5. **Keep the scaffold lightweight and example-focused**

   - Add clear docblocks explaining that these are **example / placeholder** implementations.
   - Avoid adding real business logic or heavy dependencies.
   - Use WordPress Coding Standards (spacing, naming, escaping) consistent with the rest of the repo.



6. **Sanity-check the result**

   Once changes are in place (you can just reason about this, no need to actually run WordPress):

   - The repository should contain:
     - `inc/class-block-templates.php`
     - `inc/class-block-bindings.php`
     - `inc/class-block-styles.php`
     - `templates/` (with at least `example-archive.html` and a README)
     - `template-parts/README.md`
     - `styles/README.md`
   - The main plugin file instantiates:
     - `Patterns`
     - `Block_Templates`
     - `Block_Bindings`
     - `Block_Styles`

---

## **Output expectations**

When you’ve finished applying these changes, summarise:

- Which files you created or edited.
- What each new class does (1–2 sentences each).
- Any TODOs or extension points you’ve left in comments for future plugin authors.
