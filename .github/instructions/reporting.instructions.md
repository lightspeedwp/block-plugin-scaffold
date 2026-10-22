---
name: Reporting Instructions
description: 'Rules and standards for report generation, storage, and management'
applyTo: '**'
references:
  - ../custom-instructions.md
---

# Reporting Instructions

You are a reporting workflow coordinator. Follow our repository reporting structure to create, store, and manage reports for the multi-block plugin scaffold. Avoid ad-hoc report locations, personal file names, or storing reports outside the `.github/reports/` hierarchy.

## Overview

Use this guide when drafting, updating, or filing reports (audits, analyses, migrations). It covers structure, storage, and metadata. It does not cover feature specs or release notes.

## General Rules

- Store reports only under `.github/reports/` in category subfolders.
- Include frontmatter with context (title, date, author, scope).
- Use descriptive, date-stamped filenames in `YYYY-MM-DD-topic.md`.
- Keep reports immutable after publication; create follow-up reports instead of rewriting history.
- Avoid embedding secrets or customer data.

## Detailed Guidance

These instructions define standards for creating, storing, and managing reports in the Multi-Block Plugin Scaffold. All AI agents, developers, and automation scripts must follow these guidelines to maintain organized reporting infrastructure.

## Core Principles

1. **Single Location**: All reports MUST be stored in `.github/reports/` directory
2. **Categorized Subdirectories**: Reports MUST be placed in a subdirectory within `.github/reports/` that matches their category (e.g., `analysis/`, `migration/`).
3. **No Root Reports**: Reports are NEVER stored directly in `.github/reports/` or the repository root.
4. **Proper Naming**: Follow consistent naming conventions with dates.
5. **Metadata**: All reports MUST include frontmatter with context.
6. **Point-in-Time**: Reports are historical records, not evolving documentation.

## Report Types

Common categories include analysis, migration, performance, audit, consolidation, implementation, and research. Research outputs belong in `.github/reports/research/` and should follow the expectations described in `.github/instructions/task-researcher.instructions.md`.

## Examples

- `.github/reports/analysis/2025-12-11-instruction-audit.md`
- `.github/reports/migration/2025-12-11-wp6-6-upgrade.md`
- `.github/reports/security/2025-12-11-nonce-review.md`

## Validation

- Confirm file lives under `.github/reports/<category>/`.
- Check frontmatter includes title, date, author, summary, scope.
- Run markdown lint (if configured) and verify links to related docs.

### Analysis Reports

**Purpose**: Code analysis, audit results, static analysis findings

**Examples**:
- Code quality audits
- Security analysis results
- Performance benchmarks
- Dependency analysis
- Migration feasibility studies

**Location**: `.github/reports/analysis/ANALYSIS-{name}-{date}.md`

**Structure**:
```markdown
---
title: Analysis Report Title
description: What was analyzed
category: Analysis
type: Report
audience: Developers
date: YYYY-MM-DD
context: Why this analysis was needed
---

## Executive Summary
High-level findings

## Methodology
How the analysis was conducted

## Findings
Detailed results organized by category

## Recommendations
Suggested actions

## Related Files
- logs/analysis-{timestamp}.log (supporting log)
- tmp/analysis/{analysis-date}/ (temporary artifacts)
```

### Migration Reports

**Purpose**: Document dependency upgrades, tool migrations, structural changes

**Examples**:
- Stylelint version migration (e.g., "13 → 16")
- ESLint configuration updates
- Webpack upgrade documentation
- WordPress version compatibility
- Node.js/PHP version updates

**Location**: `.github/reports/migration/{TOOL}-MIGRATION-{from}-{to}.md`

**Examples**:
- `.github/reports/migration/STYLELINT-MIGRATION-13-16.md`
- `.github/reports/migration/ESLINT-MIGRATION-8-9.md`
- `.github/reports/migration/WEBPACK-MIGRATION-5-6.md`

**Structure**:
```markdown
---
title: {Tool} Migration ({from} → {to})
description: Migration changes and impact
category: Migration
type: Report
audience: Developers
date: YYYY-MM-DD
tool: {tool-name}
from_version: {old-version}
to_version: {new-version}
---

## Migration Summary
What changed and why

## Configuration Changes
Updated config files and settings

## Breaking Changes
Incompatible changes requiring updates

## Code Changes
Updates needed in codebase

## Testing
How to verify migration success

## Related Files
- logs/migration-{tool}-{timestamp}.log
```

### Performance Reports

**Purpose**: Benchmark results, performance testing, optimization opportunities.

**Location**: `.github/reports/performance/PERFORMANCE-{focus}-{date}.md`

**Examples**:
- `.github/reports/performance/PERFORMANCE-BUILD-SIZE-2025-12-07.md`
- `.github/reports/performance/PERFORMANCE-TEST-SPEED-2025-12-07.md`
- `.github/reports/performance/PERFORMANCE-BUNDLE-ANALYSIS-2025-12-07.md`

### Consolidation & Audit Reports

**Purpose**: Documentation of major organizational changes, cleanup operations.

**Location**: `.github/reports/{audit|consolidation}/{OPERATION}-REPORT-{date}.md`

**Examples**:
- `reports/CONSOLIDATION-SUMMARY.md`
- `reports/LINK-VALIDATION-REPORT.md`
- `reports/AUDIT-DOCUMENTATION.md`

## Naming Conventions

### Format

```
{TYPE}-{SUBJECT}-{TIMESTAMP}.md
```

Or for specific types:

```
{TOOL}-{OPERATION}-{VERSION1}-{VERSION2}.md
{ANALYSIS}-{FOCUS}-{DATE}.md
{OPERATION}-SUMMARY.md
{PROJECT}-VALIDATION-REPORT.md
```

### Components

**TYPE** (Optional but recommended):
- `ANALYSIS` - Code/security analysis
- `MIGRATION` - Tool/version migration
- `PERFORMANCE` - Benchmark results
- `AUDIT` - Quality/security audit
- `CONSOLIDATION` - Organization changes
- `VALIDATION` - Testing/verification

**SUBJECT** (Required):
- Tool name: `STYLELINT`, `ESLINT`, `WEBPACK`
- Operation: `MIGRATION`, `AUDIT`, `CONSOLIDATION`
- Focus: `BUILD-SIZE`, `TEST-SPEED`, `DOCUMENTATION`

**TIMESTAMP** (When applicable):
- Format: `YYYY-MM-DD` or `YYYY-MM-DDTHH-MM-SS`
- Use full timestamp for same-day multiple reports

### Examples

✅ **Good naming**:
- `.github/reports/migration/STYLELINT-MIGRATION-13-16.md`
- `.github/reports/performance/PERFORMANCE-BUILD-SIZE-2025-12-07.md`
- `.github/reports/consolidation/CONSOLIDATION-SUMMARY.md`
- `.github/reports/validation/LINK-VALIDATION-REPORT.md`
- `.github/reports/audit/SECURITY-AUDIT-2025-12-07.md`

❌ **Bad naming**:
- `REPORT.md` (too generic)
- `root/REPORT.md` (wrong location)
- `.github/reports/report_stylelint_update` (wrong folder, should be in subfolder)
- `docs/MIGRATION-REPORT.md` (wrong folder)

## Frontmatter Requirements

All reports MUST include YAML frontmatter:

```yaml
---
title: Report Title (descriptive, human-readable)
description: One sentence summary
category: Analysis|Migration|Performance|Audit|Consolidation|Validation
type: Report
audience: Developers|DevOps|QA|All
date: YYYY-MM-DD
context: Why this report was created (optional)
tool: tool-name (if applicable)
from_version: x.y.z (if migration report)
to_version: x.y.z (if migration report)
---
```

## Content Structure

All reports should follow this structure:

### 1. Executive Summary (Required)

Brief overview for quick scanning:

```markdown
## Executive Summary

**Status**: ✅ Completed / ⚠️ Findings / ❌ Critical Issues

**Key Finding**: Main discovery or result

**Impact**: What this means for the project

**Action Required**: Yes/No - if yes, list items
```

### 2. Context/Methodology (Required)

Explain why the report was created:

```markdown
## Context

Why this report was needed, what triggered it, related issues/PRs

## Methodology

How the analysis/audit/test was conducted, tools used, scope
```

### 3. Findings/Results (Required)

Main content organized logically:

```markdown
## Findings

### Category 1
- Finding A
- Finding B

### Category 2
- Finding C
- Finding D
```

### 4. Recommendations (When applicable)

Suggested actions:

```markdown
## Recommendations

1. Recommended Action 1
2. Recommended Action 2
3. Recommended Action 3
```

### 5. Related Files (Required)

Reference supporting files:

```markdown
## Related Files

- [logs/](../logs/) - Supporting logs
- [tmp/report-artifacts/](../tmp/report-artifacts/) - Temporary data
- [PR #123](https://github.com/owner/repo/pull/123) - Related PR
```

## Integration with Logs and Temp

### Logging from Reports

Reports often have supporting log files:

**Location**: `logs/{source}-{type}-{timestamp}.log`

**Log Level Usage**:
- **ERROR**: Critical findings that block progress
- **WARN**: Issues requiring attention but non-blocking
- **INFO**: General report progress and sections
- **DEBUG**: Detailed analysis data

**Example**:
```bash
# Report: STYLELINT-MIGRATION-13-16.md
# Supporting Log: logs/migration-stylelint-2025-12-07T10-30-00.log
```

### Temporary Artifacts

Reports may generate temporary files during analysis:

**Location**: `tmp/reports/{report-type}/{report-date}/`

**Subdirectories**:
- `tmp/reports/analysis/2025-12-07/` - Analysis artifacts
- `tmp/reports/migration/stylelint-13-16/` - Migration temp files
- `tmp/reports/validation/2025-12-07/` - Validation data

**Cleanup**: Scripts should remove temp files after report finalization

**Example**:
```javascript
const tmpDir = path.join(__dirname, '../tmp/reports/analysis/2025-12-07');
// Cleanup when done:
fs.rmSync(tmpDir, { recursive: true, force: true });
```

## Report Generation

### By Developers

1. **Create report** in `.github/reports/` with proper naming
2. **Determine category** (e.g., `analysis`, `migration`).
3. **Place in subdirectory**: Move the file to `.github/reports/{category}/`.
4. **Include frontmatter** with all required fields.
5. **Follow structure** outlined above.
6. **Reference logs** if applicable.
7. **Version control**: Commit to Git.

### By Scripts/Agents

1. **Verify location**: Always use `.github/reports/` directory
2. **Create subdirectory** if needed (e.g., `tmp/reports/analysis/`)
3. **Log execution** to `logs/` directory
4. **Generate report** file with timestamp
5. **Determine category** from report type.
6. **Save to correct subdirectory**: `.github/reports/{category}/{filename}`.
7. **Include metadata**: Frontmatter with context.
8. **Clean up temp files** after completion.

**Example Script**:
```javascript
const path = require('path');

// Create logs directory
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create timestamp
const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
const logFile = path.join(logsDir, `analysis-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Log function
function log(level, message) {
  const entry = `[${new Date().toISOString()}] [${level}] ${message}\n`;
  logStream.write(entry);
  console.log(entry.trim());
}

// Create report
const reportCategory = 'analysis';
const reportsDir = path.join(__dirname, '../.github/reports', reportCategory);
fs.mkdirSync(reportsDir, { recursive: true });

log('INFO', 'Report generation starting');

// Generate report content
const reportContent = `---
title: Analysis Report
description: Example report
category: Analysis
type: Report
audience: Developers
date: ${new Date().toISOString().split('T')[0]}
context: Generated by script
---

## Executive Summary

Report findings here...
`;

// Write report
const reportFile = path.join(reportsDir, `ANALYSIS-EXAMPLE-${new Date().toISOString().split('T')[0]}.md`);
fs.writeFileSync(reportFile, reportContent);
log('INFO', `Report saved: ${reportFile}`);
logStream.end();
```

### By AI Agents (Copilot)

Agents MUST:

1. **Always use `.github/reports/` location**: Never create reports in root
2. **Determine category**: Identify the report category (e.g., `analysis`).
3. **Save to subdirectory**: Save the report in `.github/reports/{category}/`.
4. **Follow naming**: Use proper naming convention.
5. **Include context**: Explain why report is being created in frontmatter.
6. **Reference sources**: Link to logs, PRs, related files.

**Agent Prompt Template**:

```
When generating reports:

1. Always save to `.github/reports/` directory, NEVER to repository root
2. Use naming format: {TYPE}-{SUBJECT}-{TIMESTAMP}.md
3. Include YAML frontmatter with title, description, category, audience, date
4. Organize content with Executive Summary, Context, Findings, Recommendations
5. Reference supporting logs from `logs/` directory
6. Reference temporary artifacts from `tmp/reports/` if applicable
7. Use proper Markdown formatting with headings, tables, code blocks
8. Keep language clear and professional
9. Provide actionable recommendations for each finding
```

## Validation Rules

### Location Validation

✅ **MUST use a subdirectory inside `.github/reports/`**:

```bash
# ✅ ABSOLUTELY CORRECT locations (ONLY these are acceptable)
.github/reports/migration/STYLELINT-MIGRATION-13-16.md
.github/reports/consolidation/CONSOLIDATION-SUMMARY.md
.github/reports/validation/LINK-VALIDATION-REPORT.md

# ❌ INCORRECT locations
.github/reports/REPORT.md          # WRONG - Must be in a subdirectory
reports/REPORT.md                  # WRONG - Do NOT create a root reports/
CONSOLIDATION-SUMMARY.md           # WRONG - Must be in .github/reports/consolidation/
docs/REPORT.md                     # WRONG - Wrong folder
tmp/REPORT.md                      # WRONG - Wrong folder
```

**CRITICAL**: If you find reports in root `reports/` directory, move them to `.github/reports/` immediately.

### Frontmatter Validation

Required fields:
- ✅ `title` - Descriptive title
- ✅ `description` - One sentence summary
- ✅ `category` - One of allowed categories
- ✅ `type` - Must be "Report"
- ✅ `audience` - Who should read this
- ✅ `date` - ISO format (YYYY-MM-DD)

### Content Validation

- ✅ Markdown format (.md extension)
- ✅ Proper heading hierarchy (no skipped levels)
- ✅ Executive Summary section
- ✅ Related Files section
- ✅ Clear, professional language
- ✅ Actionable recommendations where applicable

## Workflow

### Creating a Report

```
1. Identify need (analysis result, migration, etc.)
   ↓
2. Determine type (Analysis, Migration, Performance, etc.)
   ↓
3. Choose name: {TYPE}-{SUBJECT}-{TIMESTAMP}.md
   ↓
4. Create in `.github/reports/` directory
   ↓
5. Add frontmatter with metadata
   ↓
6. Structure content (Summary, Context, Findings, Recommendations)
   ↓
7. Reference logs/ and tmp/reports/ files
   ↓
8. Commit to version control
   ↓
9. Update `.github/reports/README.md` with entry if major
```

### Report Lifecycle

```
Analysis Phase
  ├─ Logs → logs/{source}-{type}-{timestamp}.log
  ├─ Temp Data → tmp/reports/{type}/{date}/
  └─ Script/Agent Runs

Report Generation
  ├─ Create: `.github/reports/{TYPE}-{SUBJECT}-{TIMESTAMP}.md`
  ├─ Add Frontmatter: title, description, category, date
  └─ Structure: Summary, Context, Findings, Recommendations

Publication
  ├─ Version Control: git add, git commit
  ├─ Documentation: Reference in docs/ if needed
  └─ Update: `.github/reports/README.md` entry

Archive
  ├─ Location: `.github/reports/` (permanent)
  ├─ Retention: Indefinite (historical record)
  └─ Cleanup: tmp/reports/{type}/ can be cleaned
```

## AI Agent Instructions

### For Copilot/Claude/Gemini

**CRITICAL REQUIREMENT**: When asked to create or document reports:

**ABSOLUTELY ALWAYS (NON-NEGOTIABLE)**:
1. Save to **`.github/reports/`** directory ONLY - this is the ONLY acceptable location
2. **Determine the `category`** (e.g., `analysis`, `migration`).
3. **Save the report in the correct subdirectory**: `.github/reports/{category}/`.
4. NEVER create reports in a root `reports/` directory.
5. NEVER create reports in the repository root.
6. Use proper naming: `{TYPE}-{SUBJECT}-{TIMESTAMP}.md`.
7. Include complete YAML frontmatter with all required fields.

**NEVER (CRITICAL VIOLATIONS)**:
1. ❌ Save a report directly in `.github/reports/`. It MUST be in a subdirectory.
2. ❌ Create a `reports/` directory in the root of the repository.
3. ❌ Save to repository root (e.g., `REPORT.md`).
4. ❌ Save to other directories (`docs/`, `tmp/`, `logs/`).
5. ❌ Skip frontmatter metadata
6. ❌ Use generic names like "REPORT.md"
7. ❌ Forget date field in frontmatter
8. ❌ Use relative paths without `.github/` prefix

**Before Saving**: Verify the full path contains `.github/reports/` - if it doesn't, stop and correct immediately

### Confirmation Check

**CRITICAL**: Before saving ANY report, verify EVERY item:

```
✅ LOCATION PATH: Does the full path contain `.github/reports/`?
   → If NOT, STOP and correct immediately
   → Example correct: /path/to/.github/reports/REPORT.md
   → Example WRONG: /path/to/reports/REPORT.md
   ❌ NEVER create root reports/ directory

✅ Filename: {TYPE}-{SUBJECT}-{TIMESTAMP}.md pattern
✅ Frontmatter: title, description, category, type, audience, date
✅ Content: Executive Summary, Context, Findings, Recommendations, Related Files
✅ Language: Professional, UK English, clear and concise
✅ Links: All references use relative paths (../logs/, ../tmp/)
✅ Report exists in `.github/reports/` before commit
```

**Path Validation**:
- **Must contain**: `.github/reports/`
- **Must NOT contain**: root `reports/` directory
- **Must NOT be**: Repository root
- **If path is wrong**: Delete report and recreate in correct location

## Examples

### Good Report

**File**: `.github/reports/migration/STYLELINT-MIGRATION-13-16.md`

```markdown
---
title: Stylelint Migration (13 → 16)
description: Documentation of stylelint major version upgrade
category: Migration
type: Report
audience: Developers
date: 2025-12-07
tool: stylelint
from_version: 13.x
to_version: 16.x
---

## Executive Summary

**Status**: ✅ Completed

Successfully migrated stylelint from v13 to v16. No breaking changes in existing codebase.

## Context

Stylelint 16 released with improved CSS parsing and new rule options. Upgrade improves security and maintainability.

## Changes Made

1. Updated .stylelintrc.json
2. Reviewed deprecated rules
3. Added new recommended rules
4. Updated CI/CD workflow

## Testing

All CSS/SCSS linting tests passing. No changes required in codebase.

## Recommendations

1. Enable new `selector-pseudo-element-no-unknown` rule
2. Document new rules in LINTING.md
3. Update development guide

## Related Files

- [logs/migration-stylelint-2025-12-07T10-30-00.log](../logs/) - Migration execution log
- [.stylelintrc.json](./.stylelintrc.json) - Updated configuration
```

### Bad Report

```markdown
# REPORT

Some analysis findings...
```

Problems:
- ❌ Location: Root instead of `.github/reports/`
- ❌ Naming: Generic "REPORT" instead of specific type
- ❌ No frontmatter
- ❌ No structure
- ❌ No related files
- ❌ Missing date
- ❌ CRITICAL: NOT in `.github/reports/` directory

## Related Documentation

- [folder-structure.instructions.md](./folder-structure.instructions.md) - Directory organization rules
- [logs/README.md](../../logs/README.md) - Logging infrastructure
- [tmp/README.md](../../tmp/README.md) - Temporary files management
- [REPORTING.md](../../docs/REPORTING.md) - User documentation for reporting system
- [reporting.agent.md](../agents/reporting.agent.md) - AI agent for report generation

## Validation Checklist

Before committing any report:

- ✅ File is in a subdirectory of `.github/reports/` (e.g., `.github/reports/analysis/`)
- ✅ Filename follows `{TYPE}-{SUBJECT}-{TIMESTAMP}.md` pattern
- ✅ YAML frontmatter present with all required fields
- ✅ Content organized with required sections
- ✅ All relative paths are correct
- ✅ Professional tone and UK English
- ✅ Actionable recommendations provided
- ✅ Related files referenced (logs, tmp, etc.)
- ✅ No placeholder text or TODO comments

## Summary

✅ **Single Location** - All reports stored in categorized subdirectories within `.github/reports/`

✅ **Proper Naming** - Consistent format with type, subject, timestamp

✅ **Complete Metadata** - YAML frontmatter with context

✅ **Clear Structure** - Executive Summary, Context, Findings, Recommendations

✅ **Integrated** - Links to logs/ and tmp/ supporting data

✅ **Enforced** - Rules apply to all developers and agents

Reports are historical records of analysis, migrations, and organizational work. Follow these guidelines to maintain clear, organized, and discoverable reporting infrastructure.
