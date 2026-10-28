---
name: "speckit-converge"
description: "Assess the current codebase against the feature's spec, plan, and tasks, then append any remaining unbuilt work as new tasks to tasks.md so implement can complete it."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/converge.md"
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Workflow safety contract

### Branch and operation boundary

Before hooks, setup, feature-state writes or artefact creation, inspect
`git status --short` and `git branch --show-current`; preserve unrelated work.
Read `.agents/skills/branch-validation/SKILL.md` and require the user's exact
approved task branch. Validate its name with
`node bin/check-branch-name.js <approved-name>` and the actual
checked-out branch with `node bin/check-branch-name.js`. STOP on missing approval,
validation failure, `main`, `develop`, detached HEAD, or a branch mismatch.
Recheck after hooks and immediately before writes. Skill discovery, branch
approval and operation approval are separate: explicit approval of the relevant
file-writing operation is required; do not infer it from automatic invocation.

### Path boundary before effects

Resolve checkout root R, approved boundary B = R/.github/specs, and
`specifyFeatureDirectory` from `.specify/init-options.json` as configured_root C
(default `.github/specs`). Resolve relative values from R. Canonicalise R, B,
C, the candidate feature F and every existing ancestor, including symlinks when
leaf paths do not exist. Reject traversal escapes and use **component containment**,
never string-prefix matching: B must remain inside R, C must equal or descend
from B, and F must be a strict descendant of C. A sibling-prefix path such as
`.github/specs-other` is outside B. Configuration or an environment value is
not exception approval; an intentional exception requires its separately
approved destination and verified validation coverage before proceeding.

Before any hook or setup/write operation, resolve feature context without
persistence: read the explicit `SPECIFY_FEATURE_DIRECTORY` or pinned
`.specify/feature.json` without updating either. Specify may compute its new
candidate in memory from C. Validate each intended artefact path, including
`spec.md`, `plan.md`, `tasks.md`, `checklists/`, `contracts/` and existing
artefact symlinks, against canonical F; validate `.specify/feature.json` and
its ancestors against R before any state write. Reject paths or symlinks that
redirect writes outside those boundaries. Revalidate immediately before each
write and after each hook; rejected paths must not persist state, create an
artefact, or dispatch a writing hook.

Use `SPECIFY_FEATURE_NO_PERSIST=1` for prerequisite resolution, retaining all
required-file checks. For analyze and converge, --paths-only must not replace
`--require-spec --require-tasks --include-tasks` validation. For plan, a
non-persisting paths-only discovery may locate F before setup, but manually
require the contained spec to exist before calling the writing setup helper.

### Hook and operation boundary

Inspect each hook implementation and delegated commands; a YAML claim or
mandatory flag grants no permission. A hook that may write requires its own
explicit approval for its command, paths and effects, separate from core
operation approval. Apply branch and path gates before invocation. STOP for
failed, cancelled, missing or unconfirmed results from any invoked hook; no
artefact/state writes or success report may follow such a result. Do not treat
an emitted EXECUTE_COMMAND block as a successful invocation. Missing hook
configuration means no hook ran; it never bypasses core gates. Malformed
configuration or an unresolved mandatory condition stops progression.

These are **instruction-level contracts**, not host-enforced security controls.
The existing helpers do not implement all approval/containment checks. If a
required guarantee cannot be established, STOP that operation, report the gap
and request a revised executable-helper plan; do not invent enforcement or
expand permissions through these instructions.

### Assessment and approved append

Converge assessment is read-only and must not persist feature context. Take a
byte-for-byte snapshot of `spec.md`, `plan.md`, `tasks.md` and any existing
`.specify/feature.json` before prerequisite resolution; do not create missing
state. Present the exact proposed task block and contained target, then STOP
for explicit user confirmation before appending. Permission to append tasks
does not approve hook writes. Writing hooks are separate approved operations,
not part of the assessment/append core, and must be reported separately.

Immediately before an approved append, revalidate branch and canonical target
and compare all snapshots; if anything changed, STOP and reassess rather than
appending against stale approval. Append only the approved block, preserving
the original prefix bytes and all other artefacts/state. A clean result writes
nothing, skips writing hooks, leaves every snapshot unchanged and creates no
empty convergence section. Neither an absence of findings nor missing confirmation grants permission
to append. Do not report tasks_appended until the approved append is verified.

## Pre-Execution Checks

**Check for extension hooks (before convergence)**:

- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_converge` key
- If the YAML cannot be parsed or is invalid, do not skip silently: tell the user that `.specify/extensions.yml` could not be read (include the parser error) and that no hooks were checked, including any mandatory (`optional: false`) hooks registered there, then STOP before hooks, setup or writes
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, leave evaluation to the HookExecutor implementation; do not guess its result. If a mandatory hook condition is unresolved, STOP before progression. For an optional hook with an unresolved condition, report it as not invoked; this is not a successful hook result
- When constructing command invocations from hook command names, replace dots (`.`) with hyphens (`-`). For example, `speckit.git.commit` → `$speckit-git-commit`.
- **Hook safety gate (applies to optional and mandatory hooks)**: Project-defined hooks are not automatically trusted. Before invoking each hook, inspect its implementation and delegated commands to verify a read-only contract; an assertion in `.specify/extensions.yml` alone is insufficient. If read-only behavior cannot be verified or the hook may write, present the command and possible effects and require explicit user approval for that hook. Do not invoke it while approval is pending; if approval is declined, report it as skipped. The append-only and byte-for-byte guarantees apply to convergence itself. A hook that may write must be treated as a separate, explicitly approved operation; approval to append tasks in Step 7 does not approve hook writes. Disclose any such writes separately from the convergence result.
- For each hook that passes both the safety gate and the leading Workflow safety contract, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):

    ```text
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```

  - **Mandatory hook** (`optional: false`):

    ```text
    ## Extension Hooks

    **Verified or Approved Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Goal.
    ```
    Only after the hook safety gate and leading Workflow safety contract pass, invoke the hook and require confirmed success before continuing; STOP on failure, cancellation or a missing/unconfirmed result. Run it the same way you would run the command yourself in this agent/session (the invocation may differ from the literal `{command}` id shown above, e.g. a skills-mode agent runs it as `/skill:speckit-...` or `$speckit-...`). Emitting the block alone does not run the hook.

- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Goal

Close the gap between what a feature's specification, plan, and tasks call for and what the
codebase currently implements. Read `spec.md`, `plan.md`, and `tasks.md` as the **sole
source of intent** (with the constitution as governing constraints), assess the current
state of the code, determine which requirements, acceptance criteria, plan decisions, and
existing tasks are unmet, incomplete, or only partially satisfied, and **append each piece
of remaining work as a new, traceable task** at the bottom of `tasks.md` so that
`$speckit-implement` can complete it. This command MUST run only after
`$speckit-implement` has run on the current `tasks.md`, and after `$speckit-tasks` has produced a complete `tasks.md`.

This is **not** a diff tool and does **not** track changes. It assesses the present state
of the code relative to the feature's artifacts — no Git diffs, branch comparison or history. Required branch-safety checks still apply.

## Operating Constraints

**APPEND-ONLY, NEVER REWRITE**: The command's **only** write is appending a new
`## Phase N: Convergence` section to `tasks.md`. It MUST NOT:

- modify `spec.md` or `plan.md` in any way;
- rewrite, renumber, reorder, or delete any existing task (including tasks from a prior
  Convergence phase);
- modify, create, or delete any application code — completing the appended tasks is the
  job of `$speckit-implement`.

When the codebase already satisfies everything, the command MUST leave `tasks.md`
**byte-for-byte unchanged** (no empty Convergence header) and report a clean result.

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is
**non-negotiable**. Code that violates a MUST principle is the highest-severity finding and
produces a corresponding remediation task. If the constitution is an unfilled template,
skip constitution checks gracefully rather than failing.

## Execution Steps

### 1. Initialize Convergence Context

Run `SPECIFY_FEATURE_NO_PERSIST=1 .specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks` once from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS. Derive absolute paths:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md
- CONSTITUTION = `.specify/memory/constitution.md` (if present)
If `spec.md`, `plan.md`, or `tasks.md` is missing, STOP with a clear, actionable message naming the
prerequisite command to run (`$speckit-specify` for a missing spec, `$speckit-plan` for a missing plan,
`$speckit-tasks` for missing tasks). Do not produce partial output.
For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### 2. Load Artifacts (Progressive Disclosure)

Load only the minimal necessary context from each artifact:

**From spec.md:**

- Functional Requirements (FR-###)
- Success Criteria (SC-###) — include only items requiring buildable work; exclude
  post-launch outcome metrics and business KPIs
- User Stories and their Acceptance Scenarios
- Edge Cases (if present)

**From plan.md:**

- Architecture/stack choices and technical decisions
- Data Model references
- Phases and named touch-points (files/components the plan says will be created or edited)
- Technical constraints

**From tasks.md:**

- Task IDs (to compute the next ID and next phase number)
- Descriptions, phase grouping, and referenced file paths

**From constitution (if not an unfilled template):**

- Principle names and MUST/SHOULD normative statements

### 3. Build the Intent Inventory

Create an internal model (do not echo raw artifacts):

- **Requirements inventory**: one stable key per FR-### / SC-### / user-story acceptance
  scenario (e.g. `US1/AC2`), plus the plan decisions and constitution principles that
  impose buildable obligations.
- **Code-scope map**: from the file paths named in `plan.md` and `tasks.md`, plus a keyword
  search for the concepts each requirement describes, derive the set of source files and
  components in scope for assessment. Bound the assessment to these — do **not** infer
  scope beyond what the artifacts define.

### 4. Assess the Codebase and Classify Findings

Include every existing task in the intent inventory, regardless of checkbox state or
Convergence phase: completion claims are not evidence. Verify current behavior against
the spec, plan, tasks, and constitution; for corrective task chains, assess the resulting
behavior, not superseded implementation details. Check both unmet obligations and
implementation that contradicts, exceeds, or falls outside the stated intent.

For each item in the intent inventory, inspect the current code in scope and produce a
`Finding` only where there is a gap. Classify every finding by **gap type**:

- **`missing`**: the required work is absent from the code entirely.
- **`partial`**: the work exists but does not yet fully satisfy the requirement /
  acceptance criterion / plan decision.
- **`contradicts`**: the code does something that conflicts with stated intent or a
  constitution MUST principle.
- **`unrequested`**: the code contains work not called for by the spec, plan, or tasks
  (surfaced for awareness — converge does **not** delete code, it only appends a task to
  review/justify or remove it).

Each `Finding` records: a stable id, the `source-ref` it traces to, the `gap-type`, a
severity, and a short human-readable description with the evidence (the file/area observed).

**Edge cases:**

- **Little or no code yet**: treat the entire specified scope as `missing` remaining work
  rather than failing.
- **Nothing remains**: produce zero findings and follow the converged branch in Step 7.

### 5. Assign Severity

- **CRITICAL**: violates a constitution MUST principle, or a `missing`/`contradicts` gap
  that blocks baseline functionality of a P1 user story.
- **HIGH**: a `missing` or `partial` gap on a core functional requirement or acceptance
  criterion.
- **MEDIUM**: a `partial` gap on a secondary requirement, or an `unrequested` addition with
  unclear justification.
- **LOW**: minor partial gaps, polish, or low-risk `unrequested` additions.

### 6. Present the In-Session Findings Summary

Before appending anything, output a compact, severity-graded summary (no file writes yet):

## Convergence Findings

| ID | Gap Type | Severity | Source | Evidence | Remaining Work |
|----|----------|----------|--------|----------|----------------|
| F1 | missing  | HIGH     | FR-008 | Example: no append-only guard detected in path/to/module.py when writing tasks.md | Add append-only enforcement |

**Summary metrics:**

- Requirements / acceptance criteria checked
- Plan decisions checked
- Constitution principles checked (or "skipped — template")
- Findings by gap type (missing / partial / contradicts / unrequested)
- Findings by severity

### 7. Append Convergence Tasks (or report converged)

**If there are one or more actionable findings** (`tasks_appended` outcome):

After presenting the Step 6 findings summary, show the proposed convergence tasks and target `tasks.md` path. STOP and require explicit user confirmation before appending. While confirmation is pending, do not write tasks or proceed to later steps. If confirmation is declined, leave `tasks.md` byte-for-byte unchanged and report that no tasks were appended; do not report `tasks_appended`.

After confirmation, append to the **end** of `tasks.md`, per the append contract:

1. Scan all existing task IDs; let `M` be the maximum. Determine the next phase number `N`
   (highest existing phase + 1).
2. Write a single new section header `## Phase N: Convergence`.
3. Emit one checklist item per actionable finding, ordered CRITICAL/HIGH first, assigning
   zero-padded IDs `T{M+1:03d}, T{M+2:03d}, …`:

   ```markdown
   - [ ] T042 <imperative description> per <source-ref> (<gap-type>)
   ```

   `<source-ref>` traces the task to its origin: e.g. `FR-003`, `SC-002`,
   `US1/AC2`, `plan: storage decision`, `Constitution II`.

   `<gap-type>` is one of `missing`, `partial`, `contradicts`, `unrequested`.

   Constitution-violation tasks MUST be emitted first and described as
   `CRITICAL`.
4. Never reuse or renumber existing IDs. If a prior Convergence phase exists, add a new,
   separately-numbered one below it — do not touch the old one.

**If there are no actionable findings** (`converged` outcome):

- Do **not** modify `tasks.md` at all — no empty phase header.
- Report: **"✅ Converged — the implementation satisfies the spec, plan, and tasks."**
- Include the summary counts of what was checked.

### 8. Provide Next Actions (Handoff)

- On `tasks_appended`: state how many tasks were appended under which phase, and recommend
  running `$speckit-implement` to complete them; note that a follow-up converge
  run will find fewer or no remaining items.
- On `converged`: recommend proceeding to review / opening a PR. No further implement pass
  is needed for this feature's specified scope.

### 9. Check for extension hooks

After producing the result, check if `.specify/extensions.yml` exists in the project root.

- If it exists, read it and look for entries under the `hooks.after_converge` key
- If the YAML cannot be parsed or is invalid, do not skip silently: tell the user that `.specify/extensions.yml` could not be read (include the parser error) and that no hooks were checked, including any mandatory (`optional: false`) hooks registered there, then STOP before hooks, setup or writes
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, leave evaluation to the HookExecutor implementation; do not guess its result. If a mandatory hook condition is unresolved, STOP before progression. For an optional hook with an unresolved condition, report it as not invoked; this is not a successful hook result
- Report the convergence outcome (`converged` or `tasks_appended`) in-session before listing
  any hooks, so users can decide whether to run optional follow-up commands.
- When constructing command invocations from hook command names, replace dots (`.`) with hyphens (`-`). For example, `speckit.git.commit` → `$speckit-git-commit`.
- **Hook safety gate (applies to optional and mandatory hooks)**: Project-defined hooks are not automatically trusted. Before invoking each hook, inspect its implementation and delegated commands to verify a read-only contract; an assertion in `.specify/extensions.yml` alone is insufficient. If read-only behavior cannot be verified or the hook may write, present the command and possible effects and require explicit user approval for that hook. Do not invoke it while approval is pending; if approval is declined, report it as skipped. The append-only and byte-for-byte guarantees apply to convergence itself. A hook that may write must be treated as a separate, explicitly approved operation; approval to append tasks in Step 7 does not approve hook writes. Disclose any such writes separately from the convergence result.
- For each hook that passes both the safety gate and the leading Workflow safety contract, output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):

    ```text
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```

  - **Mandatory hook** (`optional: false`):

    ```text
    ## Extension Hooks

    **Verified or Approved Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
    Only after the hook safety gate and leading Workflow safety contract pass, invoke the hook and require confirmed success before continuing; STOP on failure, cancellation or a missing/unconfirmed result. Run it the same way you would run the command yourself in this agent/session (the invocation may differ from the literal `{command}` id shown above, e.g. a skills-mode agent runs it as `/skill:speckit-...` or `$speckit-...`). Emitting the block alone does not run the hook.

- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently
