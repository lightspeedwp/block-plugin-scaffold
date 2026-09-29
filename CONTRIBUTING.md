---
title: "{{name}} - Contributing Guidelines"
version: "{{version}}"
last_updated: "2024-10-18"
author: "{{author}}"
description: "Guidelines for contributing to {{name}}"
type: "documentation"
---

# Contributing to {{name}}

Thank you for your interest in contributing to {{name}}! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Types of Contributions](#types-of-contributions)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)
- [Recognition](#recognition)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to {{author}}.

## Getting Started

### Prerequisites

- **Git** - Version control
- **Node.js** 18.0+ and npm 8.0+
- **PHP** 8.0+ with Composer
- **WordPress** 6.0+ (for testing)
- **Basic knowledge** of WordPress, React, and PHP

### First-time Contributors

If you're new to open source contribution:

1. **Read the documentation** - especially [DEVELOPMENT.md](DEVELOPMENT.md)
2. **Look for "good first issue"** labels on GitHub
3. **Join our community** - see [SUPPORT.md](SUPPORT.md) for communication channels
4. **Ask questions** - don't hesitate to ask for help

## Types of Contributions

We welcome various types of contributions:

### Code Contributions

- **Bug fixes** - Fix reported issues
- **Feature additions** - New functionality
- **Performance improvements** - Optimize existing code
- **Security enhancements** - Address security concerns
- **Accessibility improvements** - Better a11y support

### Non-Code Contributions

- **Documentation** - Improve docs, guides, examples
- **Translations** - Internationalization support
- **Testing** - Manual testing, test case creation
- **Design** - UI/UX improvements, mockups
- **Community support** - Help other users

### Issue Reporting

- **Bug reports** - Report issues with clear reproduction steps
- **Feature requests** - Suggest new functionality
- **Documentation issues** - Report unclear or missing docs
- **Performance issues** - Report slow or resource-heavy operations

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/{{plugin_slug}}.git
cd {{plugin_slug}}

# Add upstream remote
git remote add upstream https://github.com/{{author}}/{{plugin_slug}}.git
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install PHP dependencies
composer install

# Set up git hooks
npx husky install
```

### 3. Environment Setup

```bash
# Start WordPress environment
npm run env:start

# Start development build
npm run start
```

### 4. Verify Setup

```bash
# Run tests to ensure everything works
npm run test
composer run test

# Check linting
npm run lint
composer run lint
```

## Coding Standards

We maintain high code quality standards:

### PHP Standards

- **WordPress PHP Coding Standards**
- **PSR-4** autoloading
- **Type hints** where possible (PHP 8.0+)
- **DocBlock** comments for all public methods
- **Security** - proper sanitization and validation

Example:

```php
<?php
/**
 * Render the block on the frontend.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block content.
 * @param WP_Block $block      Block instance.
 * @return string Rendered block HTML.
 */
function {{namespace}}_{{slug|snakeCase}}_render_callback( array $attributes, string $content, WP_Block $block ): string {
    $content_text = wp_kses_post( $attributes['content'] ?? '' );

    if ( empty( $content_text ) ) {
        return '';
    }

    return sprintf(
        '<div %s><p>%s</p></div>',
        get_block_wrapper_attributes(),
        $content_text
    );
}
```

### JavaScript Standards

- **@wordpress/eslint-plugin** configuration
- **React** best practices and hooks
- **JSDoc** comments for functions
- **ES6+** modern JavaScript features
- **Accessibility** - proper ARIA attributes

Example:

```javascript
/**
 * Block edit component.
 *
 * @param {Object}   props               Component props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Attribute setter.
 * @return {Element} Component element.
 */
export default function Edit( { attributes, setAttributes } ) {
    const { content } = attributes;

    const blockProps = useBlockProps();

    return (
        <div { ...blockProps }>
            <RichText
                value={ content }
                onChange={ ( newContent ) => setAttributes( { content: newContent } ) }
                placeholder={ __( 'Enter content...', '{{textdomain}}' ) }
            />
        </div>
    );
}
```

### CSS/SCSS Standards

- **@wordpress/stylelint-config** rules
- **BEM methodology** for class naming
- **Mobile-first** responsive design
- **CSS custom properties** for theming
- **Accessibility** considerations

Example:

```scss
.wp-block-{{slug}}-my-block {
    &__content {
        padding: var(--wp--preset--spacing--medium);
        border: 1px solid var(--wp--preset--color--border);
        border-radius: var(--wp--preset--spacing--x-small);

        @media (max-width: 768px) {
            padding: var(--wp--preset--spacing--small);
        }
    }

    &.has-text-align-center {
        text-align: center;
    }
}
```

### Documentation Standards

- **Clear and concise** writing
- **Code examples** where appropriate
- **Proper markdown** formatting
- **Mustache placeholders** where applicable
- **Up-to-date** information

## Submitting Changes

### Workflow

1. **Create a branch** from `develop`:

   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following coding standards

3. **Write/update tests** for your changes

4. **Test thoroughly**:

   ```bash
   npm run test
   npm run lint
   composer run test
   composer run lint
   ```

5. **Commit with clear messages**:

   ```bash
   git add .
   git commit -m "Add: Brief description of changes"
   ```

6. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

### Commit Message Format

Use clear, descriptive commit messages:

```
Type: Brief description (50 chars max)

Longer description if needed, explaining what changes were made
and why. Wrap at 72 characters.

- Use bullet points for multiple changes
- Reference issues with #123
- Mention breaking changes

Closes #123
```

Types:

- **Add:** New features
- **Fix:** Bug fixes
- **Update:** Changes to existing features
- **Remove:** Deleted features
- **Docs:** Documentation changes
- **Style:** Code style/formatting
- **Test:** Test additions/changes
- **Refactor:** Code refactoring

### Pull Request Guidelines

#### Before Submitting

- [ ] **Tests pass** - All automated tests must pass
- [ ] **Linting passes** - Code follows style guidelines
- [ ] **Documentation updated** - If needed
- [ ] **Translation strings** - New strings have textdomain
- [ ] **Accessibility tested** - Screen reader and keyboard tested
- [ ] **Browser testing** - Works in supported browsers

#### PR Description Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Testing
Describe the tests you ran and how to reproduce them:
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing
- [ ] Accessibility testing

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## Review Process

### What to Expect

1. **Automated checks** - CI/CD pipeline runs tests and linting
2. **Code review** - Maintainers review your code
3. **Feedback** - You may receive requests for changes
4. **Approval** - Once approved, your PR will be merged

### Review Criteria

Reviewers will check for:

- **Functionality** - Does it work as intended?
- **Code quality** - Follows standards and best practices?
- **Performance** - No unnecessary performance impact?
- **Security** - No security vulnerabilities?
- **Accessibility** - Maintains accessibility standards?
- **Documentation** - Adequate documentation provided?
- **Testing** - Sufficient test coverage?

### Addressing Feedback

- **Be responsive** - Address feedback promptly
- **Ask questions** - If feedback is unclear, ask for clarification
- **Make requested changes** - Update your PR as needed
- **Test again** - Ensure changes don't break anything
- **Update documentation** - If behavior changes

## Recognition

We value all contributions and will recognize contributors:

### Ways We Recognize Contributors

- **Contributor listing** in README.md
- **Changelog mentions** for significant contributions
- **Social media recognition** for major features
- **Contributor badges** on GitHub
- **Annual contributor highlights**

### Hall of Fame

Outstanding contributors may be invited to become:

- **Regular contributors** - Trusted community members
- **Maintainers** - Help review and merge PRs
- **Core team members** - Help guide project direction

## Getting Help

### Questions About Contributing

- **General questions** - Use [GitHub Discussions](https://github.com/{{author}}/{{plugin_slug}}/discussions)
- **Specific issues** - Comment on relevant GitHub issues
- **Development help** - See [SUPPORT.md](SUPPORT.md) for channels
- **Urgent matters** - Contact maintainers directly

### Resources

- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- [WordPress Block Editor Handbook](https://developer.wordpress.org/block-editor/)
- [React Documentation](https://reactjs.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/)
- [Accessibility Guidelines](https://make.wordpress.org/accessibility/handbook/)

## License

By contributing to {{name}}, you agree that your contributions will be licensed under the same license as the project ({{license}}).

Thank you for contributing to {{name}}! 🎉
