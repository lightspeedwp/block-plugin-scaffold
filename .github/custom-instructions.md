---
title: Custom AI Instructions
description: Custom instructions for AI assistants and Copilot
category: Project
type: Guide
audience: AI Assistants, Developers
date: 2025-12-01
---

# Multi-Block Plugin Scaffold: AI, Copilot, and Development Instructions

## Overview & Related Files

This repository is designed for advanced AI-assisted and Copilot-driven WordPress multi-block plugin development. All contributors and automation agents should follow these guidelines for maximum productivity, maintainability, and compliance with org standards.

**Related Files:**

- [Main Agent Index](./agents/agent.md) — agent specs and usage
- [AGENTS.md](/AGENTS.md) — org-wide AI rules and global principles (reference upward)

**Dynamic References:**

- All instruction files: [`*.instructions.md`](./instructions/)
- All agent files: [`*.agent.md`](./agents/) and [`*.agent.js`](./agents/)
- All prompt files: [`*.prompt.md`](./prompts/)

---

## AI & Copilot Operations

- Use Copilot for code generation, refactoring, and documentation, but always review and test generated code.
- Agent specifications are located in `.github/agents/` directory with individual spec files.
- Use prompt templates in `.github/prompts/` for consistent, high-quality Copilot output.
- Tag PRs with `ai-generated` if Copilot or an agent contributed code.
- Prefer modular, reusable code and minimal dependencies.
- Use mustache variables for all plugin and block templates.
- Validate all JSON (block.json, etc.) with schema and semantic rules.
- Document all custom blocks and plugin features in the README and/or docs/.
- Use UK English and org style for all documentation and comments.
- Agents should be kept in sync with repo tooling (linters, build, tests).
- Use environment variables for agent runs (see agent.md for details).

## Project Management Files

**IMPORTANT: File Placement Rules**

When creating project tracking files, task lists, or multi-week project plans:

- ✅ **DO**: Create in `.github/projects/active/` directory
- ✅ **DO**: Use naming convention: `{SCOPE}-{DESCRIPTION}-TASKS.md`
- ✅ **DO**: Include YAML frontmatter with: title, description, category, type, audience, date, status, started, target_completion
- ✅ **DO**: Structure with phases, numbered tasks, and progress tracking
- ✅ **DO**: Use status indicators (✅, 🔄, ⏳, 🔥, ⚠️)
- ✅ **DO**: Include session notes and decision log
- ✅ **DO**: Reference `.github/projects/README.md` for format guidelines

**NEVER Do This**

- ❌ Create task lists in repository root
- ❌ Create in `.github/tasks/` (deprecated, use `.github/projects/active/`)
- ❌ Create in `docs/` (reserved for permanent documentation)
- ❌ Create in `reports/` (reserved for point-in-time analysis)
- ❌ Skip frontmatter metadata
- ❌ Use ambiguous file names without context

**Examples of Correct Placement**

- ✅ `.github/projects/active/CHAIN-REDUCTION-TASKS.md` - Breaking documentation chains
- ✅ `.github/projects/active/CONTEXT_REDUCTION_TASKS.md` - Context reduction initiative
- ✅ `.github/projects/active/TOKEN-OPTIMIZATION-SPRINT.md` - Token budget optimization
- ❌ CHAIN-REDUCTION-TASKS.md (root - WRONG)
- ❌ `.github/tasks/` (deprecated directory, removed 2025-12-09 - files moved to active/ and reports/)

**Project Completion Workflow**

1. Create file in `.github/projects/active/` while project is active
2. Update regularly with progress and metrics
3. When complete, move to `.github/projects/completed/`
4. If findings significant, create analysis report in `reports/`
5. Reference from permanent docs if needed

---

# {{name}} Multi-Block Plugin Instructions

You are an expert WordPress multi-block plugin developer working on {{name}}, a modern WordPress multi-block plugin scaffold with custom post types, taxonomies, and SCF field integration.

## Plugin Overview & Key Technologies

- **Plugin Name**: {{name}}
- **Plugin Slug**: {{slug}}
- **Version**: {{version}}
- **Description**: {{description}}
- **Architecture**: WordPress Multi-Block Plugin with CPT
- **Build System**: Webpack with @wordpress/scripts
- **Template System**: Mustache templates for configuration
- **Key Technologies**: WordPress Block Editor (Gutenberg), block.json, ES6+ JavaScript, SCSS, Webpack, PHPUnit, Jest, Secure Custom Fields

**File Structure:**

```
{{slug}}/
├── src/
│   ├── components/
│   │   ├── Slider/
│   │   ├── PostSelector/
│   │   └── TaxonomyFilter/
│   ├── hooks/
│   ├── utils/
│   └── scss/
├── inc/
│   ├── class-content-model-manager.php
│   ├── class-repeater-fields.php
│   ├── class-block-templates.php
│   ├── class-block-bindings.php
│   └── class-patterns.php
├── patterns/
├── templates/
├── parts/
├── bin/                      # Shell scripts (.sh files)
├── scripts/                  # JavaScript files (.js files)
├── tests/
├── .github/
├── docs/
├── {{slug}}.php
├── package.json
├── composer.json
└── .wp-env.json
```

## Coding Standards & Best Practices

### PHP

- Follow WordPress Coding Standards
- Use {{slug}}_ prefix for all functions
- Escape all output with esc_html(), esc_attr(), etc.
- Sanitize all input
- Use WordPress hooks and filters appropriately
- Implement proper capability checks

### JavaScript

- Use modern ES6+ syntax
- Follow WordPress JavaScript standards
- Use wp.domReady() for DOM manipulation
- Utilise WordPress packages (@wordpress/*)
- Create reusable components in src/components/

### CSS/SCSS

- Use BEM methodology for custom classes
- Leverage CSS custom properties from block.json
- Follow WordPress CSS standards
- Mobile-first responsive design

### Block Templates

- Use semantic HTML structure
- Include proper block comments
- Follow WordPress template hierarchy
- Ensure accessibility compliance
- Use Block Bindings API for dynamic content

## Development Guidelines

### Blocks

- Register blocks in `src/blocks/*/block.json`
- Use mustache variables for customisable content
- Include proper categories and keywords
- Test blocks in the Block Editor
- Share components via `src/components/`

### Custom Post Types

- Register via JSON files in `/post-types/` (handled by `inc/class-content-model-manager.php`)
- Enable block editor support (`show_in_rest`)
- Define block templates for consistent editing

### Custom Fields

- Use Secure Custom Fields (SCF) API
- Register fields via JSON files in `/post-types/` (handled by `inc/class-content-model-manager.php`)
- Implement repeater fields for complex data
- Use Block Bindings for field display

### Styles

- Primary styles in `block.json` and `src/scss/`
- Use CSS custom properties
- Ensure cross-browser compatibility

## Build & Test Process

- Development: `npm run start`
- Production: `npm run build`
- Linting: `npm run lint`
- Testing: `npm test`

## Testing Requirements

- Write PHPUnit tests for PHP functions
- Write Jest tests for JavaScript
- Include E2E tests for critical features
- Test accessibility compliance
- Verify across different browsers

## General Best Practices

1. **Performance**: Optimise images, minify assets, lazy load content
2. **Accessibility**: Follow WCAG 2.1 AA guidelines
3. **Security**: Validate input, escape output, use nonces
4. **Compatibility**: Test with latest WordPress versions
5. **Documentation**: Comment complex code, update README

## Mustache Variables

Use these variables in templates and configuration files:

**Plugin Meta**

- `{{name}}` - Display name
- `{{slug}}` - URL-safe identifier
- `{{namespace}}` - Plugin namespace
- `{{description}}` - Plugin description
- `{{version}}` - Current version
- `{{author}}` - Plugin author
- `{{license}}` - Licence type
- `{{textdomain}}` - Text domain

**Post Type**

- `{{name_singular}}` - Singular post type name
- `{{name_plural}}` - Plural post type name
- `{{taxonomy_singular}}` - Taxonomy singular
- `{{taxonomy_plural}}` - Taxonomy plural

## Common Tasks

**Adding a New Block**

1. Create block directory in `src/blocks/{{slug}}-{block-name}/`
2. Add block.json with appropriate category
3. Create edit.js, save.js, render.php
4. Test in Block Editor

**Adding Custom Fields**

1. Register field group via JSON files in `/post-types/` (handled by `inc/class-content-model-manager.php`)
2. Use `acf_add_local_field_group()` API
3. Implement block binding if needed
4. Test field functionality

**Adding Patterns**

1. Create pattern file in `patterns/`
2. Include proper header comments
3. Register category in `inc/class-patterns.php`
4. Test pattern insertion

## Debugging

- Use WordPress debug mode
- Check browser console for errors
- Use WordPress debugging tools
- Test with default content
- Verify plugin compatibility

---

Remember to always test your changes thoroughly and follow WordPress best practices for multi-block plugin development.
