# Contributing to {{name}}

Thank you for helping to improve {{name}}. Setup, architecture and the full command list are in [DEVELOPMENT.md](DEVELOPMENT.md).

## Workflow

1. Start from a GitHub issue that describes the change.
2. Branch from `develop` with a type prefix, such as `feat/`, `fix/`, `chore/`, `docs/` or `test/`. The pre-commit hook rejects commits to `main`, `develop` and `release/*`.
3. Add an entry under `## [Unreleased]` in [CHANGELOG.md](CHANGELOG.md) for every code change. The pre-commit hook and the changelog workflow check for it.
4. Open a pull request into `develop` and link the issue.

## Before You Open a Pull Request

```bash
npm run lint          # JavaScript, CSS, package.json and block.json
npm run test:unit     # Vitest unit tests with coverage thresholds
composer run lint     # PHP_CodeSniffer with WordPress Coding Standards
composer run phpstan  # PHPStan
composer run test     # PHPUnit
npm run test:e2e      # Playwright, against wp-env
```

## Standards

- PHP follows the [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/).
- JavaScript follows the [Gutenberg coding guidelines](https://developer.wordpress.org/block-editor/contributors/code/coding-guidelines/).
- CSS class names follow [BEM](https://bem.info/en/methodology/): `.block__element--modifier`.
- User-facing text is translatable with the `{{textdomain}}` text domain.

## Reporting Security Issues

Report security issues privately, as described in [SECURITY.md](SECURITY.md).
