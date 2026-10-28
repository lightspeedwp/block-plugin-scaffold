# Role Inventory: {{name}}

Each role lives here as `<name>.md`. The adapters in `.claude/agents/`, `.codex/agents/` and `.gemini/agents/` only tell each tool to read it.

| Role | Domain | Purpose | Required skills | When asked | Edits files |
| --- | --- | --- | --- | --- | --- |
| [testing-agent](testing-agent.md) | Testing | Decide which tests a change needs, add or update them, run them and report the results. | `test` | — | Yes |
| [playwright-agent](playwright-agent.md) | Testing | Cover the plugin in the editor and on the front end with Playwright, using the WordPress end-to-end utilities. | `test` | — | Yes |
| [reviewer-agent](reviewer-agent.md) | Quality | Review a diff and report findings, most severe first, without changing the code. | `validate` | — | No |
| [document-reviewer-agent](document-reviewer-agent.md) | Documentation | Check that the documentation matches what the plugin does and reads clearly. | `validate` | — | No |
| [pr-agent](pr-agent.md) | Delivery | Get a branch ready for review and write its pull request description. | `branch-validation`, `validate` | `changelog` | Yes |
| [release-agent](release-agent.md) | Delivery | Prepare a release so that the tag-driven `release.yml` workflow can build and publish it. | `validate`, `test`, `changelog` | — | Yes |
| [changelog-agent](changelog-agent.md) | Delivery | Keep `CHANGELOG.md` accurate, so commits pass the pre-commit hook and pull requests pass the changelog workflow. | `changelog` | — | Yes |
| [branches-agent](branches-agent.md) | Repository | Make sure work happens on a correctly named branch from the right base. | `branch-validation` | — | Yes |
| [issue-agent](issue-agent.md) | Repository | Turn a bug report or request into a clear issue, and triage existing ones. | — | — | Yes |
| [labeling-agent](labeling-agent.md) | Repository | Apply the organisation's labels consistently. | — | — | Yes |

Roles left out of the ThisOneTimeOnAcidCom set, because they cover website work rather than a plugin: BugHerd, client website discovery, content strategy, website content, design partner, SEO metadata, metrics, PageSpeed, PRD and reporting.
