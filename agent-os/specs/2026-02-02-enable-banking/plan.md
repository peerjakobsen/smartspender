# Phase 3e: Enable Banking Integration — Implementation Plan

## Summary

Add Enable Banking (Open Banking API) as an alternative sync path alongside the existing Nykredit browser automation. A Python helper script (`tools/eb-api.py`) handles JWT signing and API calls. New bank adapter in `banks/enable-banking/`, new setup command, updated sync/add-account commands, and supporting skill + schema changes. Plugin version bump to 1.6.0.

**New files**: 1 helper script, 3 bank adapter files, 1 skill, 1 command, spec docs
**Updated files**: sync command, add-account command, transaction-schema skill, sheets-schema skill, plugin manifest, roadmap, .gitignore, CLAUDE.md

## Tasks

### Task 1: Save spec documentation
Create `agent-os/specs/2026-02-02-enable-banking/` with shape.md, plan.md, standards.md, references.md.

### Task 2: Create helper script `tools/eb-api.py`
Python script with CLI interface for all Enable Banking API communication.

### Task 3: Create Enable Banking bank adapter
`banks/enable-banking/` with BANK.md, export-format.md, quirks.md.

### Task 4: Create Enable Banking API skill
`skills/enable-banking-api/SKILL.md` — domain knowledge about the API.

### Task 5: Create setup command
`commands/setup-enable-banking.md` — one-time setup guide.

### Task 6: Update add-account command
Add `enable-banking` as valid bank argument with API-based flow.

### Task 7: Update sync command
Add `enable-banking` sync path using API instead of browser automation.

### Task 8: Update schemas
Transaction-schema and sheets-schema with Enable Banking fields and examples.

### Task 9: Update supporting files
Plugin manifest (1.6.0), roadmap, .gitignore, CLAUDE.md.

## Dependency Order

```
Task 1 (spec docs)              ─┐
Task 2 (eb-api.py script)       ─┤ start together
Task 4 (EB API skill)           ─┘
Task 3 (bank adapter)           ─── after Task 2
Task 5 (setup command)          ─── after Task 2
Task 6 (update add-account)     ─── after Tasks 2, 3
Task 7 (update sync)            ─── after Tasks 2, 3
Task 8 (update schemas)         ─── parallel with Tasks 6-7
Task 9 (supporting files)       ─── after all others
```

## Verification

1. `eb-api.py` runs standalone: `python3 tools/eb-api.py --help` prints usage
2. Bank adapter follows three-file pattern from `banks/_template.md`
3. New command follows section order from `agent-os/standards/commands/command-format.md`
4. Skill follows format from `agent-os/standards/skills/skill-format.md`
5. accounts.csv backward compatible (existing rows unaffected)
6. sync command works for both `nykredit` (browser) and `enable-banking` (API) paths
7. Package: `zip -r smartspender.zip .claude-plugin/ commands/ skills/ banks/ subscriptions/ invoice-knowledge/` (tools/ NOT included in zip)
