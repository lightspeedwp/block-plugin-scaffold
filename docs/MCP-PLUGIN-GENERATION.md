---
title: Local MCP Plugin Generation Contract
description: The contract for generating plugins from the scaffold through a local MCP server in Claude Desktop and Claude Code
category: Development
type: Reference
audience: Developers
date: 2026-11-06
---

This document defines how an AI client generates a plugin from this scaffold through a local [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server (BPS-12). It is the contract the later phases implement and verify against.

**Status:** in progress. The generator can be called repeatedly from one process, and preview and approval are implemented in `scripts/mcp/` (`config.js`, `preview.js`, `errors.js`). Safe merging into the destination and the MCP server itself are not built yet. Until they ship, generate plugins with the CLI described in [GENERATE_PLUGIN.md](GENERATE_PLUGIN.md).

## Responsibilities

| Part                                            | Does                                                                                                               | Does not                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Consuming skill (`ls-wp-build-plugin`, LS-4781) | Gathers inputs, shows the preview, gets the person's approval, calls `generate` with that approval                 | Write files itself, or treat silence as approval |
| MCP adapter (this repository)                   | Validates requests, resolves and checks the destination, stages output, enforces the approval, merges files safely | Ask the person anything, or decide approval      |
| Generator engine (`scripts/generate-plugin.js`) | Produces the plugin files                                                                                          | Touch the final destination                      |

Approval always comes from the person using the client. The adapter checks that `generate` carries the approval for exactly what was previewed; it cannot check who gave it.

## Transport and packaging

- **Transport:** stdio. The client starts the server as a child process and talks over standard input and output.
- **Standard output is reserved for protocol messages.** The engine and adapter write diagnostics to standard error and to the per-request log file only. One stray `console.log` breaks the connection, so the engine must not print to standard output when called by the adapter.
- **SDK:** the official [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) (1.32.x at the time of writing).
- **Runtime:** Node `>=24.18.0`, the same as the scaffold.
- **Entry point:** a script in this repository, run from a checkout. There is no npm package or Claude Desktop extension (`.mcpb`) in this scope.
- **Platform:** macOS. Other platforms are not verified.

## Client setup

Both clients start the same server script. Use absolute paths: Claude Desktop does not read your shell profile, so it will not find a `node` installed by a version manager unless the path is absolute.

Find the values on your Mac:

```bash
which node
```

```bash
pwd   # run in your block-plugin-scaffold checkout
```

**Claude Code** (user scope, available in every project):

```bash
claude mcp add --scope user block-plugin-scaffold -- /absolute/path/to/node /absolute/path/to/block-plugin-scaffold/scripts/mcp/server.js
```

**Claude Desktop:** add an entry to `~/Library/Application Support/Claude/claude_desktop_config.json`, then quit and reopen Claude Desktop:

```json
{
	"mcpServers": {
		"block-plugin-scaffold": {
			"command": "/absolute/path/to/node",
			"args": [
				"/absolute/path/to/block-plugin-scaffold/scripts/mcp/server.js"
			]
		}
	}
}
```

Keep any other `mcpServers` entries already in the file. The server script path is provisional until phase 4.

## Destination

`destination` is the **final folder** the plugin's files go into. The adapter does not add the slug to it. (The CLI's `--output-dir` differs: it treats the folder as a parent and adds `<slug>/`.)

When `destination` is omitted, the default is `<scaffold>/generated-plugins/<slug>`, resolved from the scaffold's own location, never from the process's working folder.

The adapter resolves the destination to an absolute real path and refuses it (`UNSAFE_DESTINATION`) when it:

- is not an absolute path (a leading `~/` is expanded to your home folder first), or contains a `..` segment;
- is the filesystem root or your home folder itself;
- is in a system folder: `/System`, `/Library`, `/Applications`, `/usr`, `/bin`, `/sbin`, `/etc`, `/dev`, `/cores`, `/private/etc` or `/private/var/db` (your own `~/Library` is not one of these);
- is, or is inside, this scaffold checkout, other than a folder inside `generated-plugins/`;
- is itself a symbolic link;
- exists and is not a folder;
- does not exist and its parent folder does not exist either.

Symbolic links above the destination are resolved, so `/tmp/plugin` is checked as `/private/tmp/plugin`.

The destination may already exist and may be a Git repository. If it does not exist, `generate` creates it (and only it; its parent must exist).

## Operations

The server exposes four tools. Each returns structured JSON. Errors use the codes under [Errors](#errors).

### `discover`

Describes what the generator accepts: each supported configuration field, whether it is required, its pattern or allowed values, and the default the generator really applies. Also lists supported content-model combinations and known limits.

- **Input:** none.
- **Side effects:** none. Reads the schema and the generator's defaults only.
- **Defaults reported are the generator's,** not the schema's `default` values, where the two differ (see [Supported configuration](#supported-configuration)).

### `validate_config`

Checks a configuration without generating anything.

- **Input:** `config` (object).
- **Output:** `valid`; `errors` (each with a field path and message); `warnings`; `normalised` (the configuration after defaults, with each value marked `supplied`, `derived` or `default`).
- **Side effects:** none.
- **Rules applied:** the JSON schema (draft 2020-12) and the generator's own checks, including the `content_model: "none"` conflict. The standalone validator's checks that contradict the schema are not used (see [Supported configuration](#supported-configuration)).

### `preview`

Generates the plugin into a private staging folder and reports exactly what `generate` would do to the destination.

- **Input:** `config`; optional `destination`; optional `previousPreviewId` (to show what changed since an earlier preview).
- **Output:**
    - `previewId` and `approvalHash`;
    - `destination` (the resolved absolute path) and whether it exists;
    - `configuration`: the normalised configuration, and the differences from `previousPreviewId` when given;
    - `files`: every path the plugin contains, each marked `create`, `overwrite` (contents differ), `unchanged` (identical) or `conflict`;
    - `preserved`: a count of destination files the plugin does not contain, which `generate` leaves untouched, and whether a `.git` folder or file is present;
    - `processEffects`: the staging folder path and the processes run (Node, Prettier);
    - `expiresAt`.
- **Side effects (disclose these before calling):** writes the staging folder under the system temporary folder; runs Prettier as a Node child process inside it; reads, but never writes, the destination.
- **Lifetime:** the staging folder is deleted when `generate` succeeds, when a newer preview replaces it, or 30 minutes after creation.

### `generate`

Copies the staged files into the destination.

- **Input:** `previewId`, `approvalHash`, `approved: true`.
- **Before writing,** the adapter re-checks the destination. If anything the preview relied on has changed (the destination's real path, the type or contents of any planned path, or a new file at a planned path), it returns `STALE_PREVIEW` and writes nothing. Preview again and ask again.
- **Side effects:** writes only the paths listed in the preview's `files` (`create` and `overwrite`). Creates the destination folder if needed. Deletes the staging folder on success.
- **Output:** the files written, the files left unchanged, and the location of the log.

## Approval binding

`approvalHash` is the SHA-256 of a canonical JSON object containing:

- the normalised configuration;
- the destination's resolved real path;
- the file manifest: each planned path, its action, and the SHA-256 of its staged contents.

`generate` recomputes the hash from the stored preview and refuses a mismatch (`APPROVAL_MISMATCH`). A different configuration or destination needs a new preview and a new approval.

## Merge rules

These rules implement "overwrite matching files; preserve everything else":

1. **Never delete.** `generate` never removes a file or folder from the destination, and never removes the destination.
2. **Overwrite matching paths.** A planned file whose path already exists as a regular file is overwritten without stopping, because the person approved it in the preview.
3. **Leave everything else alone.** Files in the destination that the plugin does not contain are not read for formatting, rewritten or moved.
4. **Protect Git.** Any path with a `.git` segment, file or folder, is never written. If the plugin would write one, the preview marks it `conflict`.
5. **Do not write through links.** If any part of a planned path in the destination is a symbolic link, the path is a `conflict`. Writes never follow a link.
6. **Type clashes block.** A planned file where the destination has a folder, or a planned folder or link where it has a file, is a `conflict`: resolving it would need a delete.
7. **Write each file safely.** Each file is written to a temporary name beside its target and renamed into place, so no file is left half-written.

A preview with any `conflict` cannot be generated. The person resolves the conflict in the destination and previews again.

## Errors

| Code                 | Raised by                    | Meaning                                                                | What to do                                    |
| -------------------- | ---------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| `INVALID_CONFIG`     | `validate_config`, `preview` | The configuration breaks a rule                                        | Fix the listed fields                         |
| `UNSAFE_DESTINATION` | `preview`                    | The destination breaks a rule under [Destination](#destination)        | Choose another folder                         |
| `CONFLICT`           | `generate`                   | The preview contains conflicts                                         | Resolve them, then preview again              |
| `PREVIEW_NOT_FOUND`  | `generate`                   | Unknown or expired `previewId`                                         | Preview again                                 |
| `APPROVAL_MISMATCH`  | `generate`                   | `approvalHash` does not match the preview, or `approved` is not `true` | Show the preview and ask again                |
| `STALE_PREVIEW`      | `generate`                   | The destination changed after the preview                              | Preview again and ask again                   |
| `STAGING_FAILED`     | `preview`                    | The generator or Prettier failed in staging                            | Read the log; the destination was not touched |
| `PARTIAL_WRITE`      | `generate`                   | Writing stopped part-way                                               | See [Recovery](#recovery)                     |
| `INTERNAL`           | any                          | An unexpected fault                                                    | Read the log and report it                    |

## Recovery

- **Failures in `discover`, `validate_config` or `preview`** never change the destination.
- **`PARTIAL_WRITE`:** before overwriting a file, `generate` copies the original into a backup folder beside the log. The error lists the files written, the files not yet written and the backup folder. Restore an original by copying it back from the backup, or fix the cause (for example permissions) and preview and generate again. Files created new can be removed by hand; `generate` does not remove them.
- **The server stops during `generate`:** the same backup and log remain. Every file is either its old or its new version, never partial.
- **Logs:** one log file per preview in `<scaffold>/logs/`, named `mcp-<slug>-<timestamp>.log`.

## Supported configuration

The schema (`.github/schemas/plugin-config.schema.json`), the generator's defaults and the standalone validator (`scripts/validation/validate-plugin-config.js`) disagree in places. Checked at `2e2acfa`, `discover` and `validate_config` resolve them as follows:

| Field or rule                      | Schema                                                                                                        | Generator                                        | Standalone validator                                                                  | Contract                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `blocks` default                   | `["collection", "slider"]`, but the allowed values are only `collection`, so the default fails its own schema | `[]`                                             | Warns when empty                                                                      | Default `[]`; allowed value `collection`                                                            |
| `fields` entries                   | Field groups: `{ post_type, field_group: [ fields ] }`                                                        | Field groups                                     | Checks each entry as if it were a single field, so it rejects every valid field group | Schema rules; the validator's field check is not used                                               |
| Taxonomy slug length               | Up to 32 characters (the WordPress limit)                                                                     | —                                                | Up to 20                                                                              | Up to 32                                                                                            |
| `author`                           | Required, but also has a placeholder default                                                                  | Required                                         | —                                                                                     | Required; no default offered                                                                        |
| `author_uri`                       | Default `https://example.com`                                                                                 | Optional, empty when unset                       | —                                                                                     | Optional; no default                                                                                |
| `description`                      | Optional                                                                                                      | Default `A WordPress multi-block plugin.`        | —                                                                                     | Optional; generator default reported                                                                |
| `repository_url`                   | Optional                                                                                                      | Default `https://github.com/lightspeedwp/<slug>` | —                                                                                     | Optional; default reported, and flagged as a warning, because client plugins usually live elsewhere |
| `textdomain`, `namespace`          | Optional                                                                                                      | Derived from `slug`                              | —                                                                                     | Derived; reported as `derived`                                                                      |
| `requires_wp`, `requires_php`      | Defaults `6.5`, `8.0`                                                                                         | Same                                             | —                                                                                     | Same                                                                                                |
| Legacy `cpt_slug`, `name_singular` | Allowed (extra properties are allowed)                                                                        | Converted to a post type                         | Rejected with `content_model: "none"`                                                 | Accepted with a warning; not advertised by `discover`                                               |
| "No templates defined"             | No `templates` field                                                                                          | —                                                | Warns                                                                                 | Not reported                                                                                        |
| Schema dialect                     | Draft 2020-12                                                                                                 | Ajv 2020                                         | Ajv default with formats                                                              | Draft 2020-12, as the generator                                                                     |

Fixing the schema and the standalone validator is outside this contract; the issue proposes no schema change.

## WordPress and Figma skills

**WordPress.** Generated plugins already carry the official [WordPress agent skills](https://github.com/WordPress/agent-skills) at `eff3785` in `.agents/skills/` (see `scripts/agent-skills.json`). After generation, the consuming skill hands work inside the plugin to them; the generator does not duplicate their guidance. Applicable skills:

| Skill                                                     | Use in a generated plugin                                 |
| --------------------------------------------------------- | --------------------------------------------------------- |
| `wordpress-router`, `wp-project-triage`                   | Route a task to the right skill                           |
| `wp-plugin-development`                                   | Plugin structure, hooks, security                         |
| `wp-block-development`                                    | Blocks; the template's blocks already use `apiVersion: 3` |
| `wp-interactivity-api`, `wp-rest-api`, `wp-abilities-api` | When the plugin uses those APIs                           |
| `wp-phpstan`, `wp-env`, `wp-wpcli-and-ops`                | Checks, local environment and WP-CLI                      |
| `wp-plugin-directory-guidelines`                          | Only for plugins going to WordPress.org                   |

**Version gap:** the skills target WordPress 7.0+ and PHP 7.4+. Generated plugins default to `Requires at least: 6.5` and `Requires PHP: 8.0`. A plugin that follows guidance needing WordPress 7.0 should set `requires_wp` to `7.0` or later; otherwise the consuming skill must treat 7.0-only guidance as not applicable.

**Figma.** Optional, and only when the person supplies a design. The generator does not turn a design into code. A design can inform configuration (plugin name, post types, fields); building the design happens afterwards, inside the generated plugin, using the [Figma design-to-code skill](https://github.com/figma/mcp-server-guide/tree/main/skills).

## Out of scope

- Deployment, publishing, releases, or changes to any live site.
- Creating a repository or opening a pull request for the generated plugin; the workflow ends with local files.
- Template mode (`--in-place`) through MCP.
- Platforms other than macOS.

## Verification

Each phase is verified by generating plugins and checking the generated output, not by running the scaffold's own test suite:

- **Parity:** with a fixed clock, a plugin generated through MCP matches one generated by the CLI for the same configuration.
- **Preservation:** fixture destinations containing `.git` files and folders, unrelated JavaScript and PHP, links and read-only files are unchanged after `generate`, apart from the planned paths.
- **Generated plugin checks:** the generated plugin's own install, lint and test commands pass.
- **Clients:** discovery, validation, preview and generation are each run once from Claude Desktop and once from Claude Code on macOS, with the evidence recorded separately.
- **Optional:** a generated plugin is activated on a local WordPress site to confirm its blocks register.
