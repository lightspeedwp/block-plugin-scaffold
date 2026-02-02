## SCF-Driven Content Model

- All post types, taxonomies, and field groups are now output as individual JSON files in `scf-json/` and registered by Secure Custom Fields (SCF).
- No PHP registration code is generated for post types or taxonomies.
---
title: Documentation Index
description: Index of all documentation files in the multi-block plugin scaffold
category: Documentation
type: Index
audience: All
date: 2025-12-12
---

This directory contains all documentation for the multi-block plugin scaffold. Use this index to find the information you need.

## Quick Start

- **[GENERATE_PLUGIN.md](GENERATE_PLUGIN.md)** - Complete guide to generating plugins from the scaffold
- **[../README.md](../README.md)** - Main project README with overview and setup
- **[../USAGE.md](../USAGE.md)** - Usage examples and common workflows

## Development Guides

### Plugin Generation

- **[GENERATE_PLUGIN.md](GENERATE_PLUGIN.md)** - Comprehensive plugin generation guide
- **[../.github/projects/plans/2025-12-11-wordpress-standards-compliance-comprehensive-review.md](../.github/projects/plans/2025-12-11-wordpress-standards-compliance-comprehensive-review.md)** - WordPress standards compliance plan
- **[../.github/projects/plans/PART-2-multi-cpt-wizard-schema-expansion.md](../.github/projects/plans/PART-2-multi-cpt-wizard-schema-expansion.md)** - Multi-CPT schema expansion plan

### Build & Development

- **[../DEVELOPMENT.md](../DEVELOPMENT.md)** - Development environment setup and workflows
- **[../BUILD-PROCESS.md](../BUILD-PROCESS.md)** - Detailed build process documentation
- **[../CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines

## Technical Reference

### WordPress Integration

- **[../.github/instructions/blocks-development.instructions.md](../.github/instructions/blocks-development.instructions.md)** - Block development patterns
- **[../.github/instructions/patterns-and-templates.instructions.md](../.github/instructions/patterns-and-templates.instructions.md)** - Block patterns and templates
- **[../.github/instructions/scf-fields.instructions.md](../.github/instructions/scf-fields.instructions.md)** - Secure Custom Fields reference
- **[SCF-EXAMPLES.md](SCF-EXAMPLES.md)** - SCF field group examples and usage

### Coding Standards

- **[../.github/instructions/coding-standards.instructions.md](../.github/instructions/coding-standards.instructions.md)** - Unified coding standards
- **[../.github/instructions/javascript-react-development.instructions.md](../.github/instructions/javascript-react-development.instructions.md)** - JavaScript/React standards
- **[../.github/instructions/wpcs-php.instructions.md](../.github/instructions/wpcs-php.instructions.md)** - PHP WordPress standards

### Scaffold Architecture

- **[../.github/instructions/generate-plugin.instructions.md](../.github/instructions/generate-plugin.instructions.md)** - Mustache template system
- **[../.github/instructions/folder-structure.instructions.md](../.github/instructions/folder-structure.instructions.md)** - File organization rules
- **[../.github/instructions/scaffold-extensions.instructions.md](../.github/instructions/scaffold-extensions.instructions.md)** - Extending the scaffold

## Quality Assurance

### Testing & Linting

- **[../.github/instructions/testing-e2e.instructions.md](../.github/instructions/testing-e2e.instructions.md)** - E2E testing with Playwright
- **[../.github/instructions/linting.instructions.md](../.github/instructions/linting.instructions.md)** - Linting standards and tools

### Accessibility

- **[../.github/instructions/a11y.instructions.md](../.github/instructions/a11y.instructions.md)** - Accessibility standards
- **[../.github/instructions/wpcs-accessibility.instructions.md](../.github/instructions/wpcs-accessibility.instructions.md)** - WCAG compliance

## Administration

### Project Management

- **[../CHANGELOG.md](../CHANGELOG.md)** - Version history and changes
- **[../SUPPORT.md](../SUPPORT.md)** - Support and help resources
- **[../SECURITY.md](../SECURITY.md)** - Security policy and reporting

### Release Process

- **[RELEASE_PROCESS.md](RELEASE_PROCESS.md)** - Complete release workflow
- **[../VERSION](../VERSION)** - Current version information

## API & Integration

- **[API-REFERENCE.md](../API-REFERENCE.md)** - PHP and JavaScript APIs
- **[../.github/instructions/schema-files.instructions.md](../.github/instructions/schema-files.instructions.md)** - JSON Schema standards

-## Agent & Automation
-
- **[../AGENTS.md](../AGENTS.md)** - AI agent specifications and workflows
- **[../.github/agents/](../.github/agents/)** - Agent implementation files
- **[../.github/prompts/](../.github/prompts/)** - Interactive prompts and templates
- **[../.github/prompts/block-plugin-refactor-alt.prompt.md](../.github/prompts/block-plugin-refactor-alt.prompt.md)** - Phase 6 review checklist for docs, instructions, SCF, inc/class-*, blocks/patterns, template parts and instruction audits
- **[../.github/reports/consolidation/SCAFFOLD-REVIEW-PHASED-EXECUTION-2025-12-12.md](../.github/reports/consolidation/SCAFFOLD-REVIEW-PHASED-EXECUTION-2025-12-12.md)** - Consolidated execution summary for the latest scaffold review sweep
- **[FRONTMATTER_SCHEMA.md](FRONTMATTER_SCHEMA.md)** - Agent metadata schema and validation guidance

## File Categories

### 📚 Guides & Tutorials

- `GENERATE_PLUGIN.md` - Plugin generation guide
- `RELEASE_PROCESS.md` - Release workflow
- `../USAGE.md` - Usage examples

### 🏗️ Architecture & Design

- `plans/` - Planning and design documents
- `../.github/instructions/` - Technical implementation guides
- `../API-REFERENCE.md` - API documentation

### ✅ Standards & Quality

- `../.github/instructions/` (accessibility, coding standards, testing)
- `../.github/instructions/linting.instructions.md` - Code quality rules

### 🤖 Automation & AI

- `../AGENTS.md` - Agent directory and rules
- `../.github/agents/` - Agent specifications
- `../.github/prompts/` - Interactive prompts

### 📋 Administration

- `../CHANGELOG.md` - Change history
- `../CONTRIBUTING.md` - Contribution process
- `../SUPPORT.md` - Help and support

## Finding What You Need

### I'm new to the scaffold

→ Start with [GENERATE_PLUGIN.md](GENERATE_PLUGIN.md) and [../README.md](../README.md)

### I want to contribute code

→ Read [../CONTRIBUTING.md](../CONTRIBUTING.md) and [../.github/instructions/coding-standards.instructions.md](../.github/instructions/coding-standards.instructions.md)

### I need to understand the architecture

→ Check [../.github/instructions/folder-structure.instructions.md](../.github/instructions/folder-structure.instructions.md) and [API-REFERENCE.md](../API-REFERENCE.md)

### I'm working with blocks

→ See [../.github/instructions/blocks-development.instructions.md](../.github/instructions/blocks-development.instructions.md)

### I need accessibility guidance

→ Review [../.github/instructions/a11y.instructions.md](../.github/instructions/a11y.instructions.md)

### I'm preparing a release

→ Follow [RELEASE_PROCESS.md](RELEASE_PROCESS.md)

## Directory Structure

```text
docs/
├── README.md                    # This index file
├── GENERATE_PLUGIN.md          # Plugin generation guide
├── RELEASE_PROCESS.md          # Release workflow
└── (planning documents now live under .github/projects/plans/)
```

## Related Resources

- **[Repository Root](../)** - Main project files
- **[.github/instructions/](../.github/instructions/)** - Technical implementation guides
- **[.github/agents/](../.github/agents/)** - AI agent specifications
- **[tests/](../tests/)** - Test files and examples
- **[scripts/](../scripts/)** - Build and utility scripts

---

This documentation index is automatically maintained. Last updated: 2025-12-12
