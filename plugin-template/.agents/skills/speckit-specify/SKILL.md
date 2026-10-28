---
name: "speckit-specify"
description: "Create or update the feature specification from a natural language feature description."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/specify.md"
---


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Workflow safety contract

### Current branch and approved target

Inspect `git status --short` and `git branch --show-current`; preserve unrelated
work. Read `.agents/skills/branch-validation/SKILL.md`. Validate the safe current
branch with `node bin/check-branch-name.js`. STOP on `main`, `develop`, detached HEAD,
validation failure or missing approval of the exact target task branch. Validate
that approved target independently with
`node bin/check-branch-name.js <approved-name>`.

If the safe current branch differs from the approved target, the **only** hook
allowed before target checkout is an explicitly authorised **branch-only**
creation/switch hook. Inspect its implementation and delegated commands first:
it must preserve existing work and change Git branch state only, without
feature-state or artefact writes. Pass the exact target as `GIT_BRANCH_NAME`;
a combined branch-and-file-writing hook cannot use this exception and must STOP
for a separately scoped plan. No hook, missing hook or an unapproved hook is
permission to create a branch automatically.

After that hook, require its confirmed success and independently read the
actual checked-out branch; require it to equal the approved target and rerun
`node bin/check-branch-name.js`. Hook JSON alone is not checkout evidence. If
target checkout is still missing or the result is failed, cancelled, missing
or unconfirmed, STOP without dispatching any file-writing hook, updating
`.specify/feature.json` or entering Step 3. When no branch transition is needed,
the actual approved target must already be checked out and validated.
Before every writing hook and core write, repeat the actual-target and path
gates and require approval of the specific writing operation. Branch approval
alone is not operation approval. Feature numbering is not branch approval.

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

## Pre-Execution Checks

**Branch safety before every pre-hook**:
Apply the current-branch/approved-target distinction in the leading Workflow
safety contract. Only the separately authorised branch-only hook can run from
a different safe task branch; all writing hooks require actual target checkout.

**Check for extension hooks (before specification)**:
- Check if `.specify/extensions.yml` exists in the project root.
- If it exists, read it and look for entries under the `hooks.before_specify` key
- If the YAML cannot be parsed or is invalid, do not skip silently: tell the user that `.specify/extensions.yml` could not be read (include the parser error) and that no hooks were checked, including any mandatory (`optional: false`) hooks registered there, then STOP before hooks, setup or writes
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, leave evaluation to the HookExecutor implementation; do not guess its result. If a mandatory hook condition is unresolved, STOP before progression. For an optional hook with an unresolved condition, report it as not invoked; this is not a successful hook result
- When constructing command invocations from hook command names, replace dots (`.`) with hyphens (`-`). For example, `speckit.git.commit` → `$speckit-git-commit`.
- For each executable hook that passes the leading Workflow safety contract (including its independent operation approval), output the following based on its `optional` flag:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Outline.
    ```
    Only after the leading Workflow safety contract passes, actually invoke the hook and require confirmed success before continuing; STOP on failure, cancellation or a missing/unconfirmed result. Run it the same way you would run the command yourself in this agent/session (the invocation may differ from the literal `{command}` id shown above, e.g. a skills-mode agent runs it as `/skill:speckit-...` or `$speckit-...`). Emitting the block alone does not run the hook.
- If no hooks are registered or `.specify/extensions.yml` does not exist, skip silently

## Outline

The text the user typed after `$speckit-specify` in the triggering message **is** the feature description. Assume you always have it available in this conversation even if `$ARGUMENTS` appears literally below. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

1. **Generate a concise short name** (2-4 words) for the feature:
   - Analyze the feature description and extract the most meaningful keywords
   - Create a 2-4 word short name that captures the essence of the feature
   - Use action-noun format when possible (e.g., "add-user-auth", "fix-payment-bug")
   - Preserve technical terms and acronyms (OAuth2, API, JWT, etc.)
   - Keep it concise but descriptive enough to understand the feature at a glance
   - Examples:
     - "I want to add user authentication" → "user-auth"
     - "Implement OAuth2 integration for the API" → "oauth2-api-integration"
     - "Create a dashboard for analytics" → "analytics-dashboard"
     - "Fix payment processing timeout bug" → "fix-payment-timeout"

2. **Branch validation and approval** (required before Step 3; branch creation via hook is optional):

   Inspect `git status --short` and `git branch --show-current` and run `node bin/check-branch-name.js` on the actual checked-out branch. Require that it is the exact task branch supplied or approved by the user. STOP on validation failure, `main`, `develop`, detached HEAD, or missing approval. This gate applies even when no hook exists or no hook ran; until it passes, do not write `.github/specs/` or `.specify/feature.json`. If a pre-hook ran, also require its confirmed success before proceeding to Step 3.

   If an authorised branch-only `before_specify` hook ran successfully, it may report `BRANCH_NAME` and `FEATURE_NUM`; verify actual checkout independently. Other pre-hooks do not imply a branch transition. The branch name does **not** dictate the spec directory name.

   If the user explicitly provided `GIT_BRANCH_NAME`, pass it through to the hook so the branch script uses the exact value as the branch name (bypassing all prefix/suffix generation).

3. **Create the spec feature directory**:

   Read `specifyFeatureDirectory` from `.specify/init-options.json` as the configured spec root (`.github/specs` in this repository). All feature artifacts, including an explicit `SPECIFY_FEATURE_DIRECTORY` override, must resolve beneath that root.

   Validate configured_root C against R and B using the leading Path boundary contract **before scanning, numbering or constructing a destination**. Use that same validated C throughout; do not accept a nested C and then fall back to a hardcoded root.

   **Resolution order for `SPECIFY_FEATURE_DIRECTORY`**:
   1. If the user explicitly provided `SPECIFY_FEATURE_DIRECTORY` (e.g., via environment variable, argument, or configuration), resolve it relative to the repository root when not absolute, then validate containment as described below; never use it as-is
   2. Otherwise, auto-generate it beneath the validated configured root C:
      - Check `.specify/init-options.json` for `feature_numbering` (preferred) or `branch_numbering` (deprecated, migration only — will be removed in a future release)
      - If `"timestamp"`: prefix is `YYYYMMDD-HHMMSS` (current timestamp)
      - If `"sequential"` or absent: prefix is `NNN` (next available 3-digit number after scanning existing directories in the validated configured root C)
      - Construct the directory name: `<prefix>-<short-name>` (e.g., `003-user-auth` or `20260319-143022-user-auth`)
      - Set `SPECIFY_FEATURE_DIRECTORY` to `<configured-root>/<directory-name>` (C joined with the generated name; `.github/specs/<directory-name>` only when C is the default)
      - If `branch_numbering` was used (and `feature_numbering` was absent), emit a one-line warning: "⚠️ `branch_numbering` in init-options.json is deprecated. Rename to `feature_numbering`."

   **Validate the resolved directory before any writes**:
   - First canonicalize the repository root, the approved repository `.github/specs` root, and the configured `specifyFeatureDirectory` root (resolve relative values from the repository root), resolving `..` segments and symlinks in every existing ancestor even when the final directory does not exist yet. Require the canonical approved root to remain within the canonical repository, and the canonical configured root to equal or be beneath that approved root. Reject an out-of-root configured value before validating the candidate or writing files unless the explicit exception requirements below are met; a configuration value alone is not approval.
   - Then canonicalize the candidate feature directory in the same way. Compare path components for every containment check, not a raw string prefix: `.github/specs-other` is outside `.github/specs`.
   - Require the resolved candidate to be a feature subdirectory beneath the configured `.github/specs/` root, not the root itself. Apply this check to explicit overrides and generated paths before `mkdir`, template copying, or persisting `.specify/feature.json`. Reject existing artifact symlinks that would redirect a write outside the validated feature directory.
   - Reject paths outside that root unless the user has explicitly approved an intentional exception and the exception's destination and validation coverage have been defined and verified. An environment variable or path argument alone is not an exception. STOP without writing if containment or exception validation fails.

   **Create the directory and spec file** (only after branch approval, successful branch validation, any invoked pre-hook's success, and path validation):
   - `mkdir -p SPECIFY_FEATURE_DIRECTORY`
   - Resolve the active `spec-template` through the Spec Kit preset/template resolution stack (equivalent to `specify preset resolve spec-template`)
   - Copy the resolved `spec-template` file to `SPECIFY_FEATURE_DIRECTORY/spec.md` as the starting point
   - Set `SPEC_FILE` to `SPECIFY_FEATURE_DIRECTORY/spec.md`
   - Persist the resolved path to `.specify/feature.json`:
     ```json
     {
       "feature_directory": "<resolved feature dir>"
     }
     ```
     Write the actual resolved directory path value (for example, `.github/specs/003-user-auth`), not the literal string `SPECIFY_FEATURE_DIRECTORY`.
     This allows downstream commands (`$speckit-plan`, `$speckit-tasks`, etc.) to locate the feature directory without relying on git branch name conventions.

   **IMPORTANT**:
   - You must only create one feature per `$speckit-specify` invocation
   - The spec directory name and the git branch name are independent — they may be the same but that is the user's choice
   - The spec directory and file are always created by this command, never by the hook

4. Load the resolved active `spec-template` file to understand required sections.

5. **IF EXISTS**: Load `.specify/memory/constitution.md` for project principles and governance constraints.

6. Follow this execution flow:
    1. Parse user description from arguments
       If empty: ERROR "No feature description provided"
    2. Extract key concepts from description
       Identify: actors, actions, data, constraints
    3. For unclear aspects:
       - Make informed guesses based on context and industry standards
       - Only mark with [NEEDS CLARIFICATION: specific question] if:
         - The choice significantly impacts feature scope or user experience
         - Multiple reasonable interpretations exist with different implications
         - No reasonable default exists
       - **LIMIT: Maximum 3 [NEEDS CLARIFICATION] markers total**
       - Prioritize clarifications by impact: scope > security/privacy > user experience > technical details
    4. Fill User Scenarios & Testing section
       If no clear user flow: ERROR "Cannot determine user scenarios"
    5. Generate Functional Requirements
       Each requirement must be testable
       Use reasonable defaults for unspecified details (document assumptions in Assumptions section)
    6. Define Success Criteria
       Create measurable, technology-agnostic outcomes
       Include both quantitative metrics (time, performance, volume) and qualitative measures (user satisfaction, task completion)
       Each criterion must be verifiable without implementation details
    7. Identify Key Entities (if data involved)
    8. Return: SUCCESS (spec ready for planning)

7. Write the specification to SPEC_FILE using the template structure, replacing placeholders with concrete details derived from the feature description (arguments) while preserving section order and headings.

8. **Specification Quality Validation**: After writing the initial spec, validate it against quality criteria:

   a. **Create Spec Quality Checklist**: Generate a checklist file at `SPECIFY_FEATURE_DIRECTORY/checklists/requirements.md` using the checklist template structure with these validation items:

      ```markdown
      # Specification Quality Checklist: [FEATURE NAME]

      **Purpose**: Validate specification completeness and quality before proceeding to planning
      **Created**: [DATE]
      **Feature**: [Link to spec.md]

      ## Content Quality

      - [ ] No implementation details (languages, frameworks, APIs)
      - [ ] Focused on user value and business needs
      - [ ] Written for non-technical stakeholders
      - [ ] All mandatory sections completed

      ## Requirement Completeness

      - [ ] No [NEEDS CLARIFICATION] markers remain
      - [ ] Requirements are testable and unambiguous
      - [ ] Success criteria are measurable
      - [ ] Success criteria are technology-agnostic (no implementation details)
      - [ ] All acceptance scenarios are defined
      - [ ] Edge cases are identified
      - [ ] Scope is clearly bounded
      - [ ] Dependencies and assumptions identified

      ## Feature Readiness

      - [ ] All functional requirements have clear acceptance criteria
      - [ ] User scenarios cover primary flows
      - [ ] Feature meets measurable outcomes defined in Success Criteria
      - [ ] No implementation details leak into specification

      ## Notes

      - Items marked incomplete require spec updates before `$speckit-clarify` or `$speckit-plan`
      ```

   b. **Run Validation Check**: Review the spec against each checklist item:
      - For each item, determine if it passes or fails
      - Document specific issues found (quote relevant spec sections)

   c. **Handle Validation Results**:

      - **If all items pass**: Mark checklist complete and proceed to the Mandatory Post-Execution Hooks section

      - **If items fail (excluding [NEEDS CLARIFICATION])**:
        1. List the failing items and specific issues
        2. Update the spec to address each issue
        3. Re-run validation until all items pass (max 3 iterations)
        4. If still failing after 3 iterations, document remaining issues in checklist notes and warn user

      - **If [NEEDS CLARIFICATION] markers remain**:
        1. Extract all [NEEDS CLARIFICATION: ...] markers from the spec
        2. **LIMIT CHECK**: If more than 3 markers exist, keep only the 3 most critical (by scope/security/UX impact) and make informed guesses for the rest
        3. For each clarification needed (max 3), present options to user in this format:

           ```markdown
           ## Question [N]: [Topic]

           **Context**: [Quote relevant spec section]

           **What we need to know**: [Specific question from NEEDS CLARIFICATION marker]

           **Suggested Answers**:

           | Option | Answer | Implications |
           |--------|--------|--------------|
           | A      | [First suggested answer] | [What this means for the feature] |
           | B      | [Second suggested answer] | [What this means for the feature] |
           | C      | [Third suggested answer] | [What this means for the feature] |
           | Custom | Provide your own answer | [Explain how to provide custom input] |

           **Your choice**: _[Wait for user response]_
           ```

        4. **CRITICAL - Table Formatting**: Ensure markdown tables are properly formatted:
           - Use consistent spacing with pipes aligned
           - Each cell should have spaces around content: `| Content |` not `|Content|`
           - Header separator must have at least 3 dashes: `|--------|`
           - Test that the table renders correctly in markdown preview
        5. Number questions sequentially (Q1, Q2, Q3 - max 3 total)
        6. Present all questions together before waiting for responses
        7. Wait for user to respond with their choices for all questions (e.g., "Q1: A, Q2: Custom - [details], Q3: B")
        8. Update the spec by replacing each [NEEDS CLARIFICATION] marker with the user's selected or provided answer
        9. Re-run validation after all clarifications are resolved

   d. **Update Checklist**: After each validation iteration, update the checklist file with current pass/fail status

## Mandatory Post-Execution Hooks

**You MUST complete this section before reporting completion to the user.**

Check if `.specify/extensions.yml` exists in the project root.
- If it does not exist, or no hooks are registered under `hooks.after_specify`, skip to the Completion Report.
- If it exists, read it and look for entries under the `hooks.after_specify` key.
- If the YAML cannot be parsed or is invalid, do not skip silently: tell the user that `.specify/extensions.yml` could not be read (include the parser error) and that no hooks were checked, including any mandatory (`optional: false`) hooks registered there, then STOP and report the hook configuration failure.
- Filter out hooks where `enabled` is explicitly `false`. Treat hooks without an `enabled` field as enabled by default.
- For each remaining hook, do **not** attempt to interpret or evaluate hook `condition` expressions:
  - If the hook has no `condition` field, or it is null/empty, treat the hook as executable
  - If the hook defines a non-empty `condition`, leave evaluation to the HookExecutor implementation; do not guess its result. If a mandatory hook condition is unresolved, STOP before progression. For an optional hook with an unresolved condition, report it as not invoked; this is not a successful hook result
- When constructing command invocations from hook command names, replace dots (`.`) with hyphens (`-`). For example, `speckit.git.commit` → `$speckit-git-commit`.
- For each executable hook that passes the leading Workflow safety contract (including its independent operation approval), output the following based on its `optional` flag:
  - **Mandatory hook** (`optional: false`) — **You MUST emit `EXECUTE_COMMAND:` for each mandatory hook**:
    ```
    ## Extension Hooks

    **Automatic Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
    Only after the leading Workflow safety contract passes, actually invoke the hook and require confirmed success before continuing; STOP on failure, cancellation or a missing/unconfirmed result. Run it the same way you would run the command yourself in this agent/session (the invocation may differ from the literal `{command}` id shown above, e.g. a skills-mode agent runs it as `/skill:speckit-...` or `$speckit-...`). Emitting the block alone does not run the hook.
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```

## Completion Report

Report completion to the user with:
- `SPECIFY_FEATURE_DIRECTORY` — the feature directory path
- `SPEC_FILE` — the spec file path
- Checklist results summary
- Readiness for the next phase (`$speckit-clarify` or `$speckit-plan`)

**NOTE:** Branch creation is handled by the `before_specify` hook (git extension). Spec directory and file creation are always handled by this core command.

## Quick Guidelines

- Focus on **WHAT** users need and **WHY**.
- Avoid HOW to implement (no tech stack, APIs, code structure).
- Written for business stakeholders, not developers.
- DO NOT create any checklists that are embedded in the spec. That will be a separate command.

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Make informed guesses**: Use context, industry standards, and common patterns to fill gaps
2. **Document assumptions**: Record reasonable defaults in the Assumptions section
3. **Limit clarifications**: Maximum 3 [NEEDS CLARIFICATION] markers - use only for critical decisions that:
   - Significantly impact feature scope or user experience
   - Have multiple reasonable interpretations with different implications
   - Lack any reasonable default
4. **Prioritize clarifications**: scope > security/privacy > user experience > technical details
5. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
6. **Common areas needing clarification** (only if no reasonable default exists):
   - Feature scope and boundaries (include/exclude specific use cases)
   - User types and permissions (if multiple conflicting interpretations possible)
   - Security/compliance requirements (when legally/financially significant)

**Examples of reasonable defaults** (don't ask about these):

- Data retention: Industry-standard practices for the domain
- Performance targets: Standard web/mobile app expectations unless specified
- Error handling: User-friendly messages with appropriate fallbacks
- Authentication method: Standard session-based or OAuth2 for web apps
- Integration patterns: Use project-appropriate patterns (REST/GraphQL for web services, function calls for libraries, CLI args for tools, etc.)

### Success Criteria Guidelines

Success criteria must be:

1. **Measurable**: Include specific metrics (time, percentage, count, rate)
2. **Technology-agnostic**: No mention of frameworks, languages, databases, or tools
3. **User-focused**: Describe outcomes from user/business perspective, not system internals
4. **Verifiable**: Can be tested/validated without knowing implementation details

**Good examples**:

- "Users can complete checkout in under 3 minutes"
- "System supports 10,000 concurrent users"
- "95% of searches return results in under 1 second"
- "Task completion rate improves by 40%"

**Bad examples** (implementation-focused):

- "API response time is under 200ms" (too technical, use "Users see results instantly")
- "Database can handle 1000 TPS" (implementation detail, use user-facing metric)
- "React components render efficiently" (framework-specific)
- "Redis cache hit rate above 80%" (technology-specific)

## Done When

- [ ] Specification written to `SPEC_FILE` and validated against quality checklist
- [ ] Extension hooks dispatched or skipped according to the rules in Mandatory Post-Execution Hooks above
- [ ] Completion reported to user with feature directory, spec file path, and checklist results
