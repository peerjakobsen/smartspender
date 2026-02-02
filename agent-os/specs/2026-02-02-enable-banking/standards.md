# Phase 3e: Enable Banking Integration — Applicable Standards

## Standards by Category

### Command Standards
- `commands/command-format.md` — Required sections (Trigger, Arguments, Workflow, Output)
- `commands/command-design.md` — Design principles (one job, predictable args, clear feedback)

### Skill Standards
- `skills/skill-format.md` — Required sections (Purpose, Domain content, Examples)
- `skills/writing-skills.md` — How to write effective skills (specific, declarative, decision rules)

### Bank Adapter Standards
- `bank-adapters/adapter-structure.md` — Three-file adapter pattern (BANK.md, export-format.md, quirks.md)
- `bank-adapters/export-format.md` — Export format documentation standard

### Data Standards
- `data/transaction-format.md` — Common transaction schema and hash computation
- `data/sheets-schema.md` — CSV file structure for all data files

### Content Standards
- `content/danish-content.md` — Danish language, categories, currency, date formatting
- `content/markdown-style.md` — Markdown formatting conventions

## Key Standards per Task

| Task | Primary Standards |
|------|-------------------|
| Task 2: Helper Script | Python best practices, CLI conventions |
| Task 3: Bank Adapter | `bank-adapters/adapter-structure.md`, `bank-adapters/export-format.md` |
| Task 4: API Skill | `skills/skill-format.md`, `skills/writing-skills.md` |
| Task 5: Setup Command | `commands/command-format.md`, `commands/command-design.md` |
| Task 6: Add-Account Update | `commands/command-format.md`, `content/danish-content.md` |
| Task 7: Sync Update | `commands/command-format.md`, `data/transaction-format.md` |
| Task 8: Schema Updates | `data/transaction-format.md`, `data/sheets-schema.md` |
| Task 9: Supporting Files | `plugin/manifest.md`, `content/markdown-style.md` |
