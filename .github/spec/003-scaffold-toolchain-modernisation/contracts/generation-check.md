# Contract: Generation Check Command

**Command**: `npm run check:generation [-- --fixture <name>] [-- --keep]`

**Implementation**: `scripts/toolchain/check-generation.js`

**Used by**: the `generation-check` job in `.github/workflows/ci-cd.yml` (a required check on `develop` and `main`), and maintainers running it locally.

## Inputs

| Input              | Default                                        | Notes                                                                             |
| ------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Fixtures           | every `*.json` in `tests/fixtures/generation/` | `default.json` (blocks and post types) and `functional-only.json` (spec 002 mode) |
| `--fixture <name>` | all                                            | Runs only the named fixture                                                       |
| `--keep`           | off                                            | Keeps the temporary folder and prints its path                                    |
| `--skip-install`   | off                                            | For local runs against an already installed folder; never used in CI              |

## Steps for each fixture

| #   | Step                                      | Fails when                                                                                                                                                        |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Generate into `fs.mkdtemp(os.tmpdir()/…)` | The generator exits with a non-zero code                                                                                                                          |
| 2   | Scan for leftover placeholders            | Any `{{…}}` tag or scaffold example value appears in `package.json`, the main plugin PHP file header or `readme.txt` (the check reports the file, line and value) |
| 3   | `npm install --no-audit --no-fund`        | A non-zero exit code, or `ERESOLVE` / peer-dependency errors in the output                                                                                        |
| 4   | `npm run build`                           | A non-zero exit code, or any `build/blocks/*/index.js` without a matching `index.asset.php`                                                                       |
| 5   | `npm run lint:js`                         | A non-zero exit code                                                                                                                                              |
| 6   | `npm run lint:css`                        | A non-zero exit code                                                                                                                                              |
| 7   | `npm run lint:pkg`                        | A non-zero exit code                                                                                                                                              |
| 8   | `npm run test:unit -- --passWithNoTests`  | A non-zero exit code                                                                                                                                              |

## Output

- One line for each step: `✔` or `✖`, the fixture, the step and the duration.
- The full output of the failing step, printed after the table.
- Exit code `0` when every fixture passes every step, otherwise `1`.
- The temporary folder is deleted unless `--keep` is passed or a step failed in a local run (not in CI).

## Must not

- Write anything inside the repository working tree.
- Use the network for anything other than the npm registry.
- Read real credentials or tokens. The fixtures contain only example metadata.
