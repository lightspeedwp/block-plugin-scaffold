# Contract: Generated Plugin Package Manifest

**Producer**: `generatePackageJson()` in `scripts/generate-plugin.js`

**Inputs**: the plugin config (validated against `.github/schemas/plugin-config.schema.json`) and `scripts/toolchain/standard-toolchain.json`

**Output**: `<output-dir>/package.json`

## Field contract

Fields MUST appear in this order. The order matches `@wordpress/npm-package-json-lint-config`, so `lint:pkg` passes.

| Field             | Source                                                                                | Rule                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `name`            | `config.slug` (with `@{config.namespace}/` scope if the scope rule is kept)           | Must be a valid npm package name, otherwise generation stops before writing any files |
| `version`         | `config.version`                                                                      | SemVer; defaults to `0.1.0`                                                           |
| `description`     | `config.description`                                                                  | Required                                                                              |
| `author`          | `config.author`                                                                       | Required                                                                              |
| `license`         | `config.license`                                                                      | Defaults to `GPL-2.0-or-later`                                                        |
| `keywords`        | `["wordpress", "block-plugin", "gutenberg", …config.keywords]`                        | Must not contain scaffold example values                                              |
| `homepage`        | `config.homepage` / `config.plugin_uri`                                               | Left out when not set, never an empty string                                          |
| `repository`      | `{ type: "git", url: config.repository_url }`                                         | Left out when not set                                                                 |
| `bugs`            | `{ url: config.bugs_url }`, or `<repository>/issues` when the repository is on GitHub | Left out when it cannot be worked out                                                 |
| `engines`         | `standard-toolchain.json → engines`                                                   | For example `node >=22.22.0`, `npm >=10.0.0`                                          |
| `main`            | `"build/index.js"`                                                                    | Fixed                                                                                 |
| `scripts`         | `standard-toolchain.json → scripts.generated`                                         | Every alias in [command-aliases.md](./command-aliases.md)                             |
| `dependencies`    | `standard-toolchain.json → dependencies`                                              | Caret ranges; no template tags                                                        |
| `devDependencies` | `standard-toolchain.json → devDependencies`                                           | Caret ranges; no template tags                                                        |
| `lint-staged`     | `standard-toolchain.json → lintStaged`                                                | Same map as the scaffold, minus scaffold-only globs                                   |
| `wp-env`          | `{ plugins: ["."] }`                                                                  | Fixed                                                                                 |

## Invariants (checked by `check:generation` and unit tests)

1. No value anywhere in the file matches `/\{\{[^}]+\}\}/`.
2. No value contains `example-plugin`, `example_plugin`, `Example Plugin` or `Example Author`, unless the plugin config itself supplied that value (an intentional example fixture).
3. Every version range is a caret or exact SemVer range. None is `*`, `latest` or a tag.
4. Every range for a package that is also in the scaffold's root `package.json` matches the root range.
5. `npm run lint:pkg` exits with code 0 in the generated folder.

## `--in-place` regeneration

When a `package.json` already exists:

- Metadata fields are overwritten from the config.
- Standard `scripts`, `dependencies` and `devDependencies` entries are updated to the standard ranges and commands.
- Entries that are **not** in the standard (added by the client project) are kept unchanged.
- A summary of the changes is logged at `INFO` level.
