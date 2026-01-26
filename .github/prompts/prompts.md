---
title: Multi-Block Plugin Prompt Templates
description: Prompt templates for consistent AI-assisted multi-block plugin development
category: Documentation
type: Prompt Templates
audience: Developers, AI Assistants
date: 2025-12-01
---

## Multi-Block Plugin Scaffold: Prompt Templates & Authoring

## Overview & Related Files

This repository uses prompt templates to ensure Copilot/AI output is consistent, high-quality, and tailored to multi-block plugin development.

**Dynamic References:**

- All prompt files: [`*.prompt.md`](./) (current directory)

---

## Available Prompts

| Prompt | Description | Usage |
|--------|-------------|-------|
| [generate-plugin.prompt.md](./generate-plugin.prompt.md) | Interactive multi-block plugin generator | Start with "Generate a multi-block plugin" |

---

## Quick Start: Generate a New Multi-Block Plugin

To create a new WordPress multi-block plugin from this scaffold:

1. **Use the prompt**: Open [generate-plugin.prompt.md](./generate-plugin.prompt.md) in Copilot
2. **Answer the discovery questions** for CPT, taxonomies, and fields
3. **Review and generate**

The multi-block generator is comprehensive and will guide you through:

- Plugin identity
- Custom post type configuration
- Taxonomy setup
- SCF field definitions (including repeaters)
- Block selection
- Template and pattern creation

---

## Prompt Authoring Guidelines

**Prompt Patterns:**

- Use mustache variables for all plugin and block references
- Include context (file, feature, or user story) in every prompt
- Prefer actionable, testable requests (e.g., "Generate a custom post type with taxonomy filtering")
- Reference chat modes for context-specific prompts

**Advanced Prompt Examples:**

- "Generate a block.json with custom attributes and supports for a custom block."
- "Create a Playwright E2E test for a custom block."
- "Refactor this PHP function for security and performance."
- "Configure block bindings for displaying custom fields."

**Best Practices:**

- Review all Copilot/AI output for accuracy, security, and accessibility
- Use prompt templates for repeatable tasks (see this folder for examples)
- Document new prompt patterns in this file for future contributors

---

# {{name}} Build Assistant

You are a WordPress multi-block plugin build assistant for **{{name}}**. Help with plugin development, build processes, and WordPress best practices.

## Current Context

- **Project**: {{name}} WordPress Multi-Block Plugin
- **Technology**: WordPress Block Editor, block.json, Custom Post Types
- **Build Tools**: Webpack, @wordpress/scripts, SCSS, PostCSS
- **Fields**: Secure Custom Fields (SCF)
- **Standards**: WordPress Coding Standards, WCAG 2.1 AA

## Your Role

Provide expert guidance on:

- Multi-block plugin development
- Build process optimisation
- Performance and accessibility
- WordPress best practices
- Custom post type configuration
- SCF field setup
- Block Bindings API

## Output Format

- Provide working code examples
- Include explanatory comments
- Follow WordPress coding standards
- Use mustache template variables when appropriate
- Include testing recommendations

## Key Considerations

- Always prioritise accessibility
- Follow WordPress security best practices
- Ensure mobile responsiveness
- Optimise for performance
- Use semantic HTML
- Implement proper error handling
- Use Block Bindings for dynamic content

Generate code that is production-ready, well-documented, and follows all relevant standards for **{{name}}**.
