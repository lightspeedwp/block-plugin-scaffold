# Data Model: Scaffold Toolchain Modernisation

**Feature**: [spec.md](./spec.md) | **Date**: 2026-10-19

This feature has no runtime data. The "entities" are the files and data structures that the generator and CI read and write.

---

## 1. Standard Toolchain Definition

**File**: `scripts/toolchain/standard-toolchain.json` (new)

**Schema**: `.github/schemas/standard-toolchain.schema.json` (new)

| Field                | Type                                                       | Description                                                                                                                               |
| -------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `version`            | string (SemVer)                                            | The version of the toolchain definition, raised whenever ranges change                                                                    |
| `engines`            | `{ node: string, npm: string }`                            | Minimum runtime versions ([research.md R8](./research.md#r8-node-engine-and-ci-matrix))                                                   |
| `dependencies`       | `Record<string, string>`                                   | Runtime packages and caret ranges ([R5](./research.md#r5-which-packages-a-generated-plugin-lists-directly))                               |
| `devDependencies`    | `Record<string, string>`                                   | Tooling packages and caret ranges                                                                                                         |
| `providedBy`         | `Record<string, string>`                                   | A tool name mapped to the package that supplies it, for example `"@wordpress/dependency-extraction-webpack-plugin": "@wordpress/scripts"` |
| `scripts.standard`   | `Record<string, string>`                                   | The 10 cross-scaffold aliases ([command-aliases.md](./contracts/command-aliases.md))                                                      |
| `scripts.generated`  | `Record<string, string>`                                   | `scripts.standard` plus the supporting aliases for generated plugins                                                                      |
| `scripts.deprecated` | `Record<string, { replacedBy: string, removeIn: string }>` | Old alias names and when each will be removed                                                                                             |
| `configFiles`        | `Array<{ tool, file, extends }>`                           | The one config file per tool ([R4](./research.md#r4-config-file-formats))                                                                 |
| `lintStaged`         | `Record<string, string[]>`                                 | The staged-file command map                                                                                                               |

**Validation rules**:

- Every range matches `^\^?\d+\.\d+\.\d+$`.
- Every `dependencies` and `devDependencies` key that also appears in the root `package.json` has the same range there (drift test).
- No key appears in both `devDependencies` and `providedBy`.
- `scripts.standard` has exactly the 10 aliases in the contract.

**Relationships**: Read by `generatePackageJson()` and `check-generation.js`. Checked against the root `package.json` by a unit test.

---

## 2. Generated Plugin Manifest

**File**: `<output-dir>/package.json`

**Contract**: [generated-package-manifest.md](./contracts/generated-package-manifest.md)

**Derived from**: Plugin Config (metadata) + Standard Toolchain Definition (everything else).

**Lifecycle**:

```text
(absent) ──generate──▶ written ──--in-place──▶ merged (standard keys updated, client keys kept)
```

---

## 3. Command Alias Map

**Held in**: `standard-toolchain.json → scripts`

**Contract**: [command-aliases.md](./contracts/command-aliases.md)

Shared by name with the theme scaffold. Only the commands behind an alias may differ between the two scaffolds.

---

## 4. Generation Fixture

**Folder**: `tests/fixtures/generation/` (new)

| File                   | Mode                          | Content                                                                                                                              |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `default.json`         | Blocks and post types         | Based on `scripts/fixtures/plugin-config.example.json`, with test-only metadata (`slug: "lsx-gen-check"`, `author: "LightSpeed CI"`) |
| `functional-only.json` | Spec 002 functional-only mode | The same metadata with `"content_model": "none"`                                                                                     |

**Validation rules**: Both files validate against `.github/schemas/plugin-config.schema.json`. Neither uses a scaffold example value, so the leftover scan in the generation check is meaningful.

---

## 5. Placeholder Map

**File**: `scripts/utils/placeholders.js` (fixed; it currently holds theme-scaffold keys)

| Field | Type                | Description                                                                                          |
| ----- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| key   | string (`{{name}}`) | A template tag, taken from `scripts/mustache-variables-registry.json`                                |
| value | string              | A test value matching the root manifest's example values (for example `{{slug}}` → `example-plugin`) |

**Validation rules**: Every key in `mustache-variables-registry.json` that appears in a lintable config file has an entry in the map. A unit test fails on a tag found in a config file that has no entry.
